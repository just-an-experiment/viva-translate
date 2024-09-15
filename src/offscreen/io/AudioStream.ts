import EventEmitter from '../../common/utils/EventEmitter';
import {
  AUDIO_PROCESSOR,
  InterimEmitter,
  SAMPLE_RATE,
} from '../../common/constants';
import { toBase64 } from '../../common/utils/helpers';

const sampleRate = 16000;

export interface IAudioPacket {
  emitter: number;
  id: string;
  raw: boolean;
  payload: string;
  processMeta: any;
  timestamp: number;
}

class AudioStream extends EventEmitter {
  private stream?: MediaStream;

  private audioContext?: AudioContext;

  private pcmWorker?: AudioWorkletNode;

  private source?: MediaStreamAudioSourceNode;

  constructor(stream?: MediaStream) {
    super();
    this.stream = stream;
    this.initProcessor();
  }

  private initProcessor() {
    if (!this.stream) return;
    this.audioContext = new window.AudioContext({ sampleRate });
    this.source = this.audioContext.createMediaStreamSource(this.stream);

    this.audioContext.audioWorklet.addModule(chrome.runtime.getURL('audio-processor.bundle.js')).then(() => {
      if (!this.audioContext || !this.source) return;
      this.pcmWorker = new AudioWorkletNode(this.audioContext, AUDIO_PROCESSOR, {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [1],
        processorOptions: {
          inSampleRate: this.audioContext.sampleRate,
          outSampleRate: SAMPLE_RATE,
          frameSize: Math.round(this.audioContext.sampleRate * 0.16), // 160ms
        },
      });
      this.source.connect(this.pcmWorker);

      this.pcmWorker.port.onmessage = (event) => {
        this.emit('audio-packet', {
          detail: {
            id: 'default',
            emitter: InterimEmitter.SPEAKER,
            raw: true,
            payload: toBase64(event.data.int16),
            processMeta: event.data.processMeta,
            timestamp: event.data.timestamp,
          }
        });
      };
      this.pcmWorker.port.start();
    });
  }

  /**
   * Clear the stream
   */
  public disconnect() {
    /* Clear the microphone stream if its defined */
    if (this.stream) {
      /* Destroy the PCM worker */
      if (this.pcmWorker) {
        this.pcmWorker!.port.close();
        this.pcmWorker!.disconnect();
        this.pcmWorker.port.onmessage = () => { };
      }

      /* Disconnect the aucio context */
      this.source?.disconnect();
      this.audioContext?.close();

      /* Stop all audio tracks */
      const tracks = this.stream.getTracks();
      tracks.forEach((track) => {
        track.stop();
      });

      /* Remove all event listeners */
      this.offAll();

      /* Clear all references */
      this.source = undefined;
      this.audioContext = undefined;
      this.stream = undefined;
      this.pcmWorker = undefined;
    }
  }
}

export default AudioStream;
