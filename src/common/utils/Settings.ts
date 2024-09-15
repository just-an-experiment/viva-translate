import I18n from './language';
import { InternalEvents, Store, RunMode } from '../constants';
import StorageCtrl from '../Storage';
import EventEmitter from './EventEmitter';

class Settings extends EventEmitter {
  private static instance: Settings;

  private ownTranscription: boolean;

  private learningModeActive: boolean;

  private speakerOut: string;

  public mode: RunMode = RunMode.MEETING;

  private constructor() {
    super();
    this.ownTranscription = StorageCtrl.getItemIfExists(Store.SHOW_OWN_TRANSCRIPTION, true);
    this.learningModeActive = StorageCtrl.getItemIfExists(Store.LEARNING_MODE, true);
    this.speakerOut = I18n.outputLang;
  }

  public static get shared(): Settings {
    if (!Settings.instance) {
      Settings.instance = new Settings();
    }
    return Settings.instance;
  }

  private storeSpeakerLang() {
    I18n.setOutputLang(this.speakerOut);
  }

  public set seeOwnTranscriptions(value: boolean) {
    if (value === this.ownTranscription) return;
    const oldValue = this.ownTranscription;
    this.ownTranscription = value;
    StorageCtrl.setItem(Store.SHOW_OWN_TRANSCRIPTION, value);
    this.emit(InternalEvents.OWN_SPEECH, value, oldValue);
  }

  public get seeOwnTranscriptions() {
    return this.ownTranscription;
  }

  public set learningMode(value: boolean) {
    if (value === this.learningModeActive) return;
    const oldValue = this.learningModeActive;
    this.learningModeActive = value;
    StorageCtrl.setItem(Store.LEARNING_MODE, value);
    this.emit(InternalEvents.LEARNING_MODE, value, oldValue);
    const tMessages = Array.from(document.querySelectorAll('.original-transcript')) as HTMLElement[];
    if (tMessages.length) {
      tMessages.forEach((message: HTMLElement) => {
        message.hidden = !value;
      });
    }
  }

  public get learningMode() {
    return this.learningModeActive;
  }

  public set speakerOutLang(value: string) {
    if (value === this.speakerOut) return;
    const oldValue = this.speakerOut;
    this.speakerOut = value;
    this.storeSpeakerLang();
    this.emit(InternalEvents.SPEAKER_OUT, value, oldValue);
  }

  public get speakerOutLang() {
    return this.speakerOut;
  }
}

export default Settings;
