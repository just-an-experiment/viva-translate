import {
  AUDIO_PROCESSOR,
  InterimEmitter,
  SAMPLE_RATE,
  VADEvents,
  VAD_FREQUENCY_THRESHOLD,
  VAD_PRE_STOP_THRESHOLD,
  VAD_START_THRESHOLD,
  VAD_STOP_THRESHOLD,
} from '../../../common/constants';
import { debugLog } from '../../../common/utils/logger';
import Gladia from '../../../common/gladia';
import { toBase64 } from '../../../common/utils/helpers';
import EventEmitter from '../../../common/utils/EventEmitter';

const sampleRate = 16000;

export enum StreamStatus {
  IDLE = 0,
  PRE_START = 1,
  STARTED = 2,
  PRE_STOP = 3,
}

export enum QueueStatus {
  NORMAL = 0,
  FORCE_QUEUE = 1,
  IGNORE_STREAM = 2,
}

class AudioStream extends EventEmitter {
  private emitter: number;

  private speaking: boolean = false;

  private thresholdOn: number = 0;

  private thresholdOff: number = 0;

  private queue: string[] = [];

  private id: string;

  private stream?: MediaStream;

  private audioContext?: AudioContext;

  private pcmWorker?: AudioWorkletNode;

  private analyser?: AnalyserNode;

  private source?: MediaStreamAudioSourceNode;

  private status: StreamStatus = StreamStatus.IDLE;

  private queueStatus: QueueStatus = QueueStatus.NORMAL;

  constructor(emitter: number, stream?: MediaStream, id = 'default-stream') {
    super();
    this.stream = stream;
    this.emitter = emitter;
    this.id = id;

    this.initProcessor();
  }

  private initProcessor() {
    if (!this.stream) return;
    this.audioContext = new window.AudioContext({ sampleRate });
    this.source = this.audioContext.createMediaStreamSource(this.stream);

    let isVad = false;
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.smoothingTimeConstant = 0;
    this.analyser.fftSize = 2048;

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
      this.source.connect(this.analyser!);

      this.pcmWorker.port.onmessage = (event) => {
        /* Calculate the frequency mean to try to guess if the user is speaking or not */
        const buffLength = this.analyser!.frequencyBinCount;
        const arrayFreqDomain = new Uint8Array(buffLength);
        this.analyser!.getByteFrequencyData(arrayFreqDomain);
        const meanFreq = arrayFreqDomain.reduce((prev: number, current: number) => prev + current, 0) / buffLength;

        /**
         * Check for valid state to emit audio to server
         *  - Check for proxy api enabled
         *  - Check if the stream is for microphone and its listening
         *  - Check if the stream is for the speaker and user is emitting and no remote user is talking
         */
        if (
          !Gladia.isEnabled ||
          (this.emitter === InterimEmitter.MICROPHONE && Gladia.muted)
        ) {
          if (this.emitter === InterimEmitter.MICROPHONE && isVad) {
            isVad = false;
            this.status = StreamStatus.IDLE;
            this.queue = [];
            this.queueStatus = QueueStatus.NORMAL;
            Gladia.userVadEvent(VADEvents.VAD_STOP);
          }
          return;
        }

        /* Use the mean frequency to check for speaking */
        if (meanFreq >= VAD_FREQUENCY_THRESHOLD) {
          this.thresholdOn += 1;
          /* Handle pre-vad-start event */
          if (this.status === StreamStatus.IDLE) {
            debugLog('PRE-START speaking', { emitter: this.emitter, idx: this.id });
            this.status = StreamStatus.PRE_START;
            if (this.emitter === InterimEmitter.MICROPHONE) {
              Gladia.userVadEvent(VADEvents.PRE_VAD_START);
            } else {
              this.emit(VADEvents.PRE_VAD_START, this.id);
            }
          } else if (this.thresholdOn >= VAD_START_THRESHOLD) {
            /* Speaking detected */
            this.thresholdOff = 0;
            if (this.status === StreamStatus.PRE_START || this.status === StreamStatus.PRE_STOP) {
              debugLog('START speaking', { emitter: this.emitter, idx: this.id });
              this.status = StreamStatus.STARTED;
              if (this.emitter === InterimEmitter.MICROPHONE) {
                isVad = true;
                Gladia.userVadEvent(VADEvents.VAD_START);
              } else {
                this.emit(VADEvents.VAD_START, this.id);
              }
            }
            this.speaking = true;
          } else if (this.queueStatus !== QueueStatus.IGNORE_STREAM) this.queue.push(toBase64(event.data.int16));
        } else {
          this.thresholdOff += 1;
          if (this.thresholdOff >= VAD_PRE_STOP_THRESHOLD) {
            if (this.status === StreamStatus.PRE_START) {
              debugLog('STOP not speaking', { emitter: this.emitter, idx: this.id });
              this.clearQueue();
              if (this.emitter === InterimEmitter.MICROPHONE) {
                isVad = false;
                Gladia.userVadEvent(VADEvents.VAD_STOP);
              } else {
                this.queueStatus = QueueStatus.FORCE_QUEUE;
                this.emit(VADEvents.VAD_STOP, this.id);
              }
            } else if (this.status === StreamStatus.STARTED) {
              debugLog('PRE STOP speaking', { emitter: this.emitter, idx: this.id });
              this.status = StreamStatus.PRE_STOP;
              if (this.emitter === InterimEmitter.MICROPHONE) {
                Gladia.userVadEvent(VADEvents.PRE_VAD_STOP);
              } else {
                this.queueStatus = QueueStatus.FORCE_QUEUE;
                this.emit(VADEvents.PRE_VAD_STOP, this.id);
              }
            } else if (this.thresholdOff >= VAD_STOP_THRESHOLD && this.status === StreamStatus.PRE_STOP) {
              debugLog('STOP speaking', { emitter: this.emitter, idx: this.id });
              this.clearQueue();
              if (this.emitter === InterimEmitter.MICROPHONE) {
                isVad = false;
                Gladia.userVadEvent(VADEvents.VAD_STOP);
              } else {
                this.queueStatus = QueueStatus.FORCE_QUEUE;
                this.emit(VADEvents.VAD_STOP, this.id);
              }
            }

            this.thresholdOn = 0;
            this.speaking = false;
          }
        }

        /* Apply VAD filter to prevent sending empty packages */
        if (this.emitter === InterimEmitter.SPEAKER && meanFreq < 5) {
          return;
        }

        /* Check if the stream has speak or must be ignored */
        if (this.queueStatus === QueueStatus.IGNORE_STREAM) {
          this.clearQueue();
          return;
        }

        if (!this.speaking) return;

        /* Check if the stream must be send to the queue only */
        if (
          this.queueStatus === QueueStatus.FORCE_QUEUE ||
          this.status === StreamStatus.PRE_START ||
          this.status === StreamStatus.PRE_STOP
        ) {
          this.queue.push(toBase64(event.data.int16));
          return;
        }

        /* Flush the queue stream and send the new packet */
        this.flushQueue();

        /* Emit the audio to the server */
        Gladia.sendAudioPacket(toBase64(event.data.int16));
      };
      this.pcmWorker.port.start();
    });
  }

  /**
   * Send all pending items in the queue
   */
  public flushQueue() {
    const tmpQueue = this.queue;
    this.queue = [];
    if (tmpQueue.length > 0) {
      tmpQueue.forEach((packet: string) => {
        Gladia.sendAudioPacket(packet);
      });
    }
  }

  /**
   * Remove all items from the queue
   */
  public clearQueue() {
    this.queue = [];
    this.thresholdOn = 0;
    this.thresholdOff = 0;
    this.speaking = false;
    this.status = StreamStatus.IDLE;
  }

  /**
   * Update the current queue status
   * @param status
   */
  public setQueueStatus(status: QueueStatus) {
    this.queueStatus = status;
  }

  /**
   * Check if the queue is active or no
   */
  public get isQueueActive() {
    return this.queueStatus !== QueueStatus.IGNORE_STREAM;
  }

  public get streamStatus(): StreamStatus {
    return this.status;
  }

  public closeAllTracks() {
    if (this.stream) {
      const tracks = this.stream.getTracks();
      tracks.forEach((track) => {
        track.stop();
      });
    }
  }

  /**
   * Clear the stream
   */
  public disconnect() {
    /* Clear the microphone stream if its defined */
    if (this.emitter === InterimEmitter.MICROPHONE) {
      Gladia.emit(VADEvents.VAD_STOP);
    }
    if (this.stream) {
      if (this.pcmWorker) {
        this.pcmWorker!.port.close();
        this.pcmWorker!.disconnect();
        this.pcmWorker.port.onmessage = () => { };
      }
      this.analyser?.disconnect();
      this.source?.disconnect();
      this.audioContext?.close();
      this.offAll();
      this.source = undefined;
      this.audioContext = undefined;
      this.stream = undefined;
      this.pcmWorker = undefined;
      this.analyser = undefined;
    }
  }
}

export default AudioStream;
