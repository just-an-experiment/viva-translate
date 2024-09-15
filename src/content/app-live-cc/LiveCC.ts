import { debugLog, errorLog } from '../../common/utils/logger';
import { showTranscriptionResults, stopLiveCC as stopLiveCCApi } from '../../common/api';
import {
  GeneralClasses, Identifiers, MeetType, RunMode,
  WorkerEvents
} from '../../common/constants';
import Gladia from '../../common/gladia';
import TranscriptionsCtrl from '../../common/transcriptions/TranscriptionsController';
import SummaryHandler from '../../common/transcriptions/SummaryHandler';
import Settings from '../../common/utils/Settings';
import CCBox from '../../common/views/CCBox';
import TBox from '../../common/views/TBox';
import Tooltip, { TooltipPosition, TooltipType } from '../../common/components/Tooltip';
import I18n from '../../common/utils/language';
import Notifications, { NOTIFICATION } from '../../common/components/notifications/Notifications';
import TranscriptionsData from '../../common/transcriptions/TranscriptionsData';

enum LiveCCStatus {
  IDLE = 0,
  LIVE_CC_CAPTURING = 1,
}

/**
 * Live CC transcriptor interface
 */
class LiveCC {
  private static instance: LiveCC;

  private tabId: number = -1;

  public vivaActivator: HTMLElement;

  private wrapperActivador: HTMLElement;

  private toolTipMinizing: any;

  private status: LiveCCStatus = LiveCCStatus.IDLE;

  private isActive = false;

  public meetType = MeetType.LIVE_CC;

  private constructor() {
    this.vivaActivator = document.createElement('div');
    this.wrapperActivador = document.createElement('div');
    this.toolTipMinizing = null;
    /* Initialize the subtitle frame */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const frame = CCBox.shared;

    this.initListeners();
  }

  /**
   * Register message listener for
   */
  // eslint-disable-next-line class-methods-use-this
  private initListeners() {
    chrome.runtime.onMessage.addListener(async (request, sender: any, sendResponse: any) => {
      if (sender.id === chrome.runtime.id) {
        switch (request.message) {
          case WorkerEvents.START_LIVE_CC:
            this.tabId = request.tabId;

            // eslint-disable-next-line no-case-declarations
            const connected = await this.connectStream();
            this.status = connected ? LiveCCStatus.LIVE_CC_CAPTURING : LiveCCStatus.IDLE;
            if (connected) {
              this.addVivaBtnActivator();
              this.toggleActivatorGradient(true);
            }
            break;
          case WorkerEvents.STOP_LIVE_CC:
            this.removeVivaBtnActivator();
            await this.onClose();
            break;
          case WorkerEvents.AUDIO_PACKET:
            /* Send received audio packet to Gladia */
            Gladia.sendAudioPacket(request.packet.detail.payload);
            break;
          case WorkerEvents.ERROR_CAPTURING_AUDIO:
            Notifications.shared.showNotification(NOTIFICATION.FAILED_LIVE_CC);
            await this.onClose();
            break;
        }
        sendResponse({ status: this.status });
      }
      return true;
    });
  }

  /**
   * Get singleton class instance
   */
  public static get shared(): LiveCC {
    if (!LiveCC.instance) {
      LiveCC.instance = new LiveCC();
    }
    return LiveCC.instance;
  }

  private toggleActivatorGradient(active: boolean) {
    if (active) {
      this.vivaActivator.classList.add(GeneralClasses.VIVA_ACTIVATOR_LISTENING);
      this.vivaActivator.title = I18n.t('meetings.tooltips.active');
    } else {
      this.vivaActivator.classList.remove(GeneralClasses.VIVA_ACTIVATOR_LISTENING);
      this.vivaActivator.title = I18n.t('meetings.tooltips.not_active');
    }
  }

  private addVivaBtnActivator() {
    if (document?.body?.contains(this.wrapperActivador)) return;
    document?.body?.appendChild(this.wrapperActivador);
  }

  private removeVivaBtnActivator() {
    if (!document?.body?.contains(this.wrapperActivador)) return;
    document?.body?.removeChild(this.wrapperActivador);
  }

  /** Minimizes the transcription box and shows the viva icon. */
  private minimizePopup = async () => {
    TBox.shared.togglePopupVisiblility(false);
    setTimeout(() => {
      this.toolTipMinizing.element.hidden = true;
    }, 20000);
    this.toolTipMinizing.element.hidden = await TBox.shared.isPausedNoCCRecording();
    this.toggleActivatorGradient(Gladia.isEnabled);
  };

  /**
   * Start new trnascription from screen share
   * @returns
   */
  private async startLiveCC() {
    if (!this.isActive) {
      await this.initialize();
      if (!this.isActive) return;
    }

    /* Set transcription metadata */
    TranscriptionsData.reset();
    TranscriptionsData.meetType = MeetType.LIVE_CC;
    TranscriptionsData.title = document.title;
    TranscriptionsData.url = document.URL;
    TranscriptionsData.startTime = new Date().toLocaleString();

    /* Connect to Gladia server */
    try {
      await Gladia.connect();
    } catch {
      Gladia.disconnect();
      Notifications.shared.showNotification(NOTIFICATION.UNKNOWN_ERROR);
      return;
    }

    TBox.shared.reset();
    TBox.shared.addToPage(true, null, true);
    SummaryHandler.shared.initialize();
    SummaryHandler.shared.reset();

    /* Register interims handlers */
    TranscriptionsCtrl.handleTranscriptions(TBox.shared);
  }

  /**
   * Stop the transcription from screen share
   */
  private async stopLiveCC() {
    /* Capture required data before reseting it */
    Gladia.disconnect();
    await stopLiveCCApi(this.tabId);

    TBox.shared.removeFromPage();
    await SummaryHandler.shared.close();
    this.status = LiveCCStatus.IDLE;

    /* Redirect to the transcription */
    showTranscriptionResults(Settings.shared.speakerOutLang);
    TranscriptionsData.reset();
  }

  private connectStream(): Promise<boolean> {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise<boolean>(async (resolve) => {
      /* Initialize Speech to Text transcription from speakers */
      try {
        await this.startLiveCC();
        this.status = LiveCCStatus.LIVE_CC_CAPTURING;
        resolve(true);
      } catch (error) {
        errorLog('Error starting Live CC:', error);
        Notifications.shared.showNotification(NOTIFICATION.FAILED_LIVE_CC);
        resolve(false);
      }
    });
  }

  /** Stops the mic and speaker streams and disconnects from the socket. */
  protected async disconnect() {
    debugLog('Stop Live CC');

    this.wrapperActivador.remove();
    await this.stopLiveCC();
  }

  public async initialize() {
    /* Get user info to force refresh access token if its required */
    this.initVivaBtnActivator();

    /* Create the transcription popup */
    Settings.shared.mode = RunMode.WEB;
    TBox.initialize(this.minimizePopup, this.onClose);
    this.isActive = true;
  }

  /**
   * Add the Viva logo activator
   */
  protected initVivaBtnActivator(): void {
    this.wrapperActivador.classList.add('viva_styles_content', 'notranslate');
    this.vivaActivator.classList.add(
      'viva-minimized',
      'viva-minimized--is-any-web',
      Identifiers.TOOLBOX,
    );
    this.vivaActivator.innerHTML = `
    <img class="viva-toolbox__toggle" src="${chrome.runtime.getURL('images/logo/circular-logo-gradient.svg')}" 
      alt="Viva Translate" />
    `;

    this.toolTipMinizing = new Tooltip(this.vivaActivator, 'meetings.tooltips.pause_suggestion', {
      position: TooltipPosition.BOTTOM,
      type: TooltipType.STATIC
    }, ['viva-tooltip--static']);
    this.vivaActivator.append(this.toolTipMinizing.element);

    /** Listen to Viva icon click and check if clicked on logo. */
    this.vivaActivator.addEventListener('click', (event: MouseEvent) => {
      if ((event?.target as HTMLElement).nodeName === 'IMG' && Gladia.isEnabled) {
        /* Toggle the transcription popup */
        const isVisible = !TBox.shared.components.popup.hidden;
        TBox.shared.togglePopupVisiblility(!isVisible);
        this.toggleActivatorGradient(Gladia.isEnabled);
      }
    });
    this.wrapperActivador.appendChild(this.vivaActivator);
  }

  /**
   * Closes the viva session in a current call or forever.
   * @param reset Resets the store value of video call translate active.
   */
  private onClose = async () => {
    this.status = LiveCCStatus.IDLE;
    this.toggleActivatorGradient(false);
    await this.disconnect();
  };
}

export default LiveCC;
