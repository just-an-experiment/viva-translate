import config from '@config';
import { IInterim } from './types';
import { debugLog, errorLog } from './utils/logger';
import Settings from './utils/Settings';
import { translateText } from './api';
import { Languages, VADEvents } from './constants';
import EventEmitter from './utils/EventEmitter';

const GLADIA_WSS = 'wss://api.gladia.io/audio/text/audio-transcription';

class Gladia extends EventEmitter {
  private static instance: Gladia;

  private wss?: WebSocket;

  private connected: boolean;

  private queue: string[];

  public enabled: boolean;

  public meetingStartTime: number;

  public customTimeInMs: number;

  public showNewMessageBtn: boolean;

  private interimListener?: (interim: IInterim) => void;

  public muted: boolean;

  public paused: boolean;

  public index: number;

  private constructor() {
    super();
    this.connected = false;
    this.queue = [];
    this.enabled = false;
    this.meetingStartTime = 0;
    this.customTimeInMs = 0;
    this.showNewMessageBtn = false;
    this.muted = false;
    this.index = 1;
    this.paused = false;
  }

  public static get shared(): Gladia {
    if (!Gladia.instance) {
      Gladia.instance = new Gladia();
    }
    return Gladia.instance;
  }

  /**
   * Check if transcriptions are enabled or not
   */
  public get isEnabled() {
    return this.enabled;
  }

  /**
   * Enable or disable transcriptions
   *
   * @param enabled
   */
  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  /**
   * Register new listener to be called on interim event for speaker
   * @param cb
   */
  public setInterimListener(cb: any) {
    this.interimListener = cb;
  }

  /**
   * Handle the WebSocket connection open event
   * @returns
   */
  private onOpen() {
    if (!this.wss) return;
    /* After opening the connection, send the configuration packet */
    this.wss.send(JSON.stringify({
      x_gladia_key: config.GLADIA_KEY,
      encoding: 'WAV/PCM',
      bit_depth: 16,
      sample_rate: 16000,
      language_behaviour: 'automatic multiple languages',
      model_type: 'accurate', // Available values: accurate, fast
      frames_format: 'base64', // Available values: base64, bytes
      maximum_audio_duration: 9
    }));
    debugLog('Websocket connection opened to Gladia');
  }

  /**
   * Handle incoming messages
   * @param event
   */
  private async onMessage(event: MessageEvent) {
    const msg = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
    switch (msg.event) {
      case 'connected':
        this.connected = true;
        debugLog('Connected to Gladia for audio streaming');
        this.queue.forEach((audioData) => {
          this.sendAudioPacket(audioData);
        });
        break;
      case 'transcript': {
        const translations: Record<string, string> = {};
        const targetLang = Settings.shared.speakerOutLang;
        translations[(msg.language ?? Languages.EN).toUpperCase()] = (msg.transcription ?? '').trim();
        const interim: IInterim = {
          id: this.index,
          index: msg.time_end,
          originalLang: (msg.language ?? Languages.EN).toUpperCase(),
          originalText: (msg.transcription ?? '').trim(),
          translations,
          isFinal: msg.type === 'final',
          createdAt: Date.now(),
          isSystem: false
        };

        if (interim.isFinal) {
          this.index += 1;
        }

        /* Check for the target language translation */
        if (interim.originalLang !== targetLang) {
          /* Call Deepl to translate the transciptions */
          try {
            const translation = await translateText(interim.originalText, targetLang);
            interim.translations[targetLang] = (translation.text ?? '').trim();
          } catch (error) {
            errorLog('Error translating the text:', error);
            interim.translations[targetLang] = interim.originalText;
          }
        }

        /* On final interim check for the English translation */
        if (interim.isFinal && interim.originalLang !== Languages.EN && targetLang !== Languages.EN) {
          const translation = await translateText(interim.originalText, Languages.EN);
          interim.translations[Languages.EN] = (translation.text ?? '').trim();
        }

        if (this.interimListener && interim.translations[targetLang].length > 0) {
          this.interimListener(interim);
        }
      }
        break;
      case 'error':
        errorLog('Error from Gladia:', msg);
        break;
    }
  }

  /**
   * Connect to the Gladia WebSocket server
   */
  public async connect() {
    return new Promise((resolve) => {
      if (this.wss) {
        this.wss.close();
        this.queue = [];
      }
      this.connected = false;
      this.wss = new WebSocket(GLADIA_WSS);
      this.wss.onopen = this.onOpen.bind(this);
      this.wss.onmessage = this.onMessage.bind(this);
      this.wss.onerror = (event: Event) => {
        errorLog('Error connecting to Gladia:', event);
      };

      /* Wait until the connection is established */
      const interval = setInterval(() => {
        if (this.connected) {
          clearInterval(interval);
          resolve(true);
        }
      }, 150);
    });
  }

  /**
   * Send audio packet to Gladia
   * @param audioData Base64 encoded audio data
   */
  public sendAudioPacket(audioData: string) {
    if (this.paused) return;

    if (!this.wss || this.wss.readyState !== WebSocket.OPEN) {
      this.queue.push(audioData);
      return;
    }
    this.wss.send(JSON.stringify({
      frames: audioData
    }));
  }

  /**
   * Disconnect from the Gladia server
   * @returns
   */
  public disconnect() {
    if (!this.wss) return;
    this.enabled = false;
    try {
      this.wss.close();
      this.wss = undefined;
      this.queue = [];
      this.customTimeInMs = 0;
    } catch (error) {
      errorLog(error, {
        description: 'Error closing the connection to Gladia server',
      });
    }
  }

  public userVadEvent(event: VADEvents) {
    this.emit(event);
  }
}

const GladiaInstance = Gladia.shared;
export default GladiaInstance;
