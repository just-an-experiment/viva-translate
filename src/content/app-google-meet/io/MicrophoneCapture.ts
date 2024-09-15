import { debugLog, errorLog } from '../../../common/utils/logger';
import { InterimEmitter } from '../../../common/constants';
import AudioStream from './AudioStream';

class MicrophoneCapture {
  private static instance: MicrophoneCapture;

  public stream?: AudioStream;

  private audioConstraints: any = {
    deviceId: 'default',
    echoCancellation: { ideal: true },
    latency: { ideal: 0 },
    autoGainControl: { ideal: true },
    noiseSuppression: { ideal: true },
  };

  private constructor() {
    this.setListeners();
  }

  private initStream(stream?: MediaStream) {
    this.stream = new AudioStream(
      InterimEmitter.MICROPHONE,
      stream,
      'mic-stream'
    );
  }

  private setListeners() {
    document.addEventListener('viva-mic-selected', (e: any) => this.handleMicChange(e.detail));
  }

  public static get shared(): MicrophoneCapture {
    if (!MicrophoneCapture.instance) {
      MicrophoneCapture.instance = new MicrophoneCapture();
    }
    return MicrophoneCapture.instance;
  }

  public handleMicChange(newConstraints: string) {
    debugLog('Microphone changed', newConstraints);
    this.audioConstraints = newConstraints;
    this.audioConstraints.echoCancellation = true;
    this.audioConstraints.noiseSuppression = true;
    this.audioConstraints.voiceIsolation = true;
    this.audioConstraints.autoGainControl = true;

    /* Connect new stream */
    this.fromDevice();
  }

  public async fromDevice() {
    /* Clear previous instances */
    this.disconnect();

    try {
      const stream: MediaStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: this.audioConstraints,
      });

      if (!stream) throw new Error("Microphone can't be initialized");

      this.initStream(stream);
      return true;
    } catch (error) {
      errorLog(error, {
        description: 'Error getting microphone streaming',
        audioConstraints: this.audioConstraints,
      });
      this.disconnect();
      return false;
    }
  }

  /**
   * Clear the microphone stream
   */
  public disconnect() {
    /* Clear the microphone stream if its defined */
    if (this.stream) {
      this.stream.closeAllTracks();
      this.stream.disconnect();
    }
    this.stream = undefined;
  }
}

const MicrophoneCaptureObj = MicrophoneCapture.shared;
export default MicrophoneCaptureObj;
