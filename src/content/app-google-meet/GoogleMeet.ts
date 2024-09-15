import {
  Icons, MeetStatus, Identifiers, GeneralClasses, MeetType, Store, RunMode
} from '../../common/constants';
import Gladia from '../../common/gladia';
import TranscriptionsCtrl from '../../common/transcriptions/TranscriptionsController';
import TBox from '../../common/views/TBox';
import { debugLog } from '../../common/utils/logger';
import I18n from '../../common/utils/language';
import CCBox from '../../common/views/CCBox';
import ReconnectionHandler from '../../common/transcriptions/ReconnectionHandler';
import SummaryHandler from '../../common/transcriptions/SummaryHandler';
import Settings from '../../common/utils/Settings';
import Tooltip, { TooltipPosition, TooltipType } from '../../common/components/Tooltip';
import RecordingSection from '../../common/components/sections/RecordingSection';
import Notifications, { NOTIFICATION } from '../../common/components/notifications/Notifications';
import MicrophoneCapture from './io/MicrophoneCapture';
import StorageCtrl from '../../common/Storage';
import SpeakerCapture from './io/SpeakerCapture';
import { showTranscriptionResults } from '../../common/api';
import TranscriptionsData from '../../common/transcriptions/TranscriptionsData';
import CloseCaptionSection from '../../common/components/sections/CloseCaptionSection';

const GOOGLE_MATERIAL_ICONS = 'google-material-icons';
const GOOGLE_SYMBOLS = 'google-symbols';
const BUTTON_MAX_DEEP = 10;

class GoogleMeet {
  private static instance: GoogleMeet;

  private status: MeetStatus;

  public vivaActivator: HTMLElement;

  private wrapperActivador: HTMLElement;

  private toolTipVivaMove: any;

  private resetPopup?: HTMLElement;

  private wrapperReset?: HTMLElement;

  private isVivaPanelVisible: boolean;

  private vivaSidePanel: boolean;

  private collapseClick?: any;

  private actionBar?: HTMLElement | null;

  private mutationObserver?: MutationObserver;

  private sidebarContainer?: HTMLElement | null;

  private ignoreInfoAction: boolean = false;

  private preventMultipleClicks: boolean = false;

  private audioObserver?: MutationObserver;

  private moreOptionsObserver?: MutationObserver;

  private forceMuteCheck: boolean = false;

  public meetType = MeetType.GOOGLE_MEET;

  private constructor() {
    this.status = MeetStatus.NOT_INITIALIZED;
    this.vivaActivator = document.createElement('div');
    this.wrapperActivador = document.createElement('div');
    this.wrapperActivador.setAttribute('id', 'viva-activator');
    this.toolTipVivaMove = null;
    this.isVivaPanelVisible = false;
    this.vivaSidePanel = true;
  }

  private resetState() {
    this.toolTipVivaMove = null;
    this.isVivaPanelVisible = false;
    this.vivaSidePanel = true;
    this.ignoreInfoAction = false;
    this.preventMultipleClicks = false;
    TranscriptionsCtrl.setMeet(this);
    TBox.initialize(
      this.minimizePopup,
      this.onClose,
      this.onSwitchSidePanel,
      true
    );
    Notifications.shared.removeAllFromPage();
    TBox.shared.setSidebarMode(true);
    RecordingSection.shared.resetTimer();
  }

  public static get shared(): GoogleMeet {
    if (!GoogleMeet.instance) {
      GoogleMeet.instance = new GoogleMeet();
    }
    return GoogleMeet.instance;
  }

  public async initialize() {
    /* Initialize the subtitle frame */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const frame = CCBox.shared;
    TranscriptionsCtrl.setMeet(this);
    this.initStoreListener();
    Settings.shared.mode = RunMode.MEETING;
    TBox.initialize(
      this.minimizePopup,
      this.onClose,
      this.onSwitchSidePanel
    );

    await this.initializeVivaActivator();
  }

  /**
   * Inject script to handle audio streams
   */
  // eslint-disable-next-line class-methods-use-this
  public injectScript(): void {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('audio-interceptor.bundle.js');
    // eslint-disable-next-line func-names
    script.onload = function () {
      script.remove();
    };
    (document.head || document.documentElement).appendChild(script);
  }

  /**
     * Handle changes for the audio button to Start/Stop the streaming
     */
  private handleAudioButton(button: Element) {
    const newValue = button.getAttribute('data-is-muted') === 'true';
    if (newValue === Gladia.muted && !this.forceMuteCheck) return;
    this.forceMuteCheck = false;
    Gladia.muted = newValue;
  }

  /**
   * Add Google Meet audio button handler
   * @returns
   */
  public initAudioButtonHandler(): void {
    if (this.status !== MeetStatus.INITIALIZED) return;
    const button = document.querySelectorAll('button[data-is-muted]').item(0);
    if (!button) {
      debugLog('Google Meet audio button not found');
      return;
    }

    if (this.audioObserver) {
      this.audioObserver.disconnect();
      this.audioObserver = undefined;
    }

    this.audioObserver = new MutationObserver((mutations: MutationRecord[]) => {
      mutations.forEach((mutation: MutationRecord) => {
        if (mutation.type === 'attributes' && mutation.target === button) {
          this.handleAudioButton(mutation.target as Element);
        }
      });
    });
    this.audioObserver.observe(button, { attributes: true, attributeFilter: ['data-is-muted'], subtree: false });

    debugLog('Registered Google Meet audio button handler');
  }

  /**
     * Add Google Meet more options button handler
     * @returns
     */
  public initMoreOptionsButtonHandler(): void {
    if (!this.actionBar) return;
    const button = this.getButton('more_vert', this.actionBar!);
    if (!button) {
      debugLog('Google Meet more options button not found');
      return;
    }

    if (this.moreOptionsObserver) {
      this.moreOptionsObserver.disconnect();
      this.moreOptionsObserver = undefined;
    }

    this.moreOptionsObserver = new MutationObserver((mutations: MutationRecord[]) => {
      mutations.forEach((mutation: MutationRecord) => {
        if (mutation.type === 'attributes' && mutation.target === button) {
          this.checkMoreOptionsBtnsMeet();
        }
      });
    });
    this.moreOptionsObserver.observe(button, { attributes: true, attributeFilter: ['aria-expanded'], subtree: false });

    debugLog('Registered Google Meet more options button handler');
  }

  /**
   * Get the current meet id
   * @returns
   */
  // eslint-disable-next-line class-methods-use-this
  public get meetId(): string {
    const routePaths = window.location.pathname.split('/');
    return routePaths[1] || 'unknow';
  }

  /**
   * Manual check if the microphone is muted or not
   * @returns
   */
  public checkAudioStreamMute(): void {
    if (this.status !== MeetStatus.INITIALIZED) return;
    const button = document.querySelectorAll('button[data-is-muted]').item(0);
    if (!button) {
      debugLog('Google Meet audio button not found');
      return;
    }

    this.forceMuteCheck = true;
    this.handleAudioButton(button);
  }

  /**
   * Listen for page mutations to add the Viva activator to the DOM
   * @param mutationsList
   */
  // eslint-disable-next-line class-methods-use-this
  public handleDOMMutation(mutationsList: any) {
    mutationsList.forEach((mutation: any) => {
      if (mutation.type === 'childList') {
        /* Check only on added nodes */
        if (mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node: any) => {
            /* Check if information button is added to the grafical interface */
            if (node.textContent === 'info' && node.parentElement?.parentElement) {
              this.registerOnActionBar(node.parentElement.parentElement as HTMLButtonElement);
            } else if (node.textContent === 'expand_less') {
              /* Prevent matching more options on mic/camera buttons */
              const btnInfo = this.getButton('info') as HTMLButtonElement | null;
              if (btnInfo) return;

              /* Check for small screen when buttons get collapsed */
              let parentNode: any;
              if (node instanceof HTMLButtonElement) {
                parentNode = node;
              } else if (node instanceof HTMLSpanElement) {
                parentNode = node.parentElement;
              } else {
                parentNode = node.parentElement.parentElement;
              }
              if (parentNode) {
                this.registerCollapseClick(parentNode as HTMLButtonElement);
              }
            }
          });
        }
      }
    });
  }

  /**
   * We consider that Google Meet is ready when the end call button is reachable
   * @returns
   */
  // eslint-disable-next-line class-methods-use-this
  public waitForButton(btnIcon: string, loadActionBar = false): Promise<HTMLButtonElement | null> {
    return new Promise<HTMLButtonElement | null>((resolve) => {
      const interval = setInterval(() => {
        debugLog(`Waiting for button ${btnIcon}`);
        const targetButton = this.getButton(btnIcon);
        if (targetButton) {
          if (loadActionBar) {
            // eslint-disable-next-line max-len
            this.actionBar = targetButton.parentElement?.parentElement?.parentElement?.parentElement?.parentElement?.parentElement;
            this.sidebarContainer =
              document.querySelector(
                'div[jsaction*="mousedown"][jsaction*="touchstart"][jsaction*="keydown"]:not([jsmodel])'
              ) as HTMLElement | null;
            this.vivaSidePanel = this.sidebarContainer !== null;

            /* Use mutation observer to check changes on the action bar */
            if (this.mutationObserver) this.mutationObserver.disconnect();
            const observerConfig = {
              childList: true,
              subtree: true,
            };
            this.mutationObserver = new MutationObserver(this.handleDOMMutation.bind(this));
            this.mutationObserver.observe(this.actionBar ?? document.body, observerConfig);

            this.initMoreOptionsButtonHandler();
          }

          debugLog(`Button ${btnIcon} is ready`);
          clearInterval(interval);
          resolve(targetButton as HTMLButtonElement);
        }
      }, 100);
    });
  }

  /** Listens to changed store values to disable/activate the video call feature. */
  private initStoreListener() {
    StorageCtrl.on(Store.VIDEO_CALL_ACTIVE, async (value: boolean) => {
      if (value && !Gladia.isEnabled) {
        this.status = MeetStatus.NOT_INITIALIZED;
        this.resetState();
        this.initHandler(true, true);
      } else if (!value && this.status !== MeetStatus.NOT_INITIALIZED) {
        this.status = MeetStatus.NOT_INITIALIZED;

        /* Show the transcription results */
        await showTranscriptionResults(Settings.shared.speakerOutLang);
        TranscriptionsData.reset();
        CloseCaptionSection.shared.toggleSubtitles(true, false);
        this.onClose(true, false);
      }
    });
  }

  /**
   * Closes the viva session in a current call or forever.
   * @param reset Resets the store value of video call translate active.
   */
  private onClose = async (reset = true, showTip = true) => {
    this.status = MeetStatus.NOT_INITIALIZED;

    /* Remove the mutation observer */
    if (this.mutationObserver) this.mutationObserver.disconnect();

    /* Hide the Viva transcription box */
    if (this.vivaSidePanel && this.isVivaPanelVisible) {
      this.showSidePanel(false);
    }

    /* Disconnect from transcriptions */
    await this.disconnect();

    /* Remove the transcription popup */
    TBox.shared.removeFromPage();

    /* Update storage and emit events */
    const items: Record<string, any> = {};
    items[Store.VIDEO_CALL_ACTIVE] = false;
    items[Store.SHOULD_RESET_VIDEO_CALL] = reset;
    await StorageCtrl.setItems(items);

    if (showTip) this.showResetPopup();
  };

  private showToolTipVivaMove = async () => {
    if (!StorageCtrl.getItem(Store.SHOWN_TOOLTIP_MOVE_VIVA)) {
      await StorageCtrl.setItem(Store.SHOWN_TOOLTIP_MOVE_VIVA, true);
      if (this.toolTipVivaMove?.element) this.toolTipVivaMove.element.hidden = false;
    }
  };

  /**
   * Take action when transcription box is moved from/to sidebar panel
   * @param state
   */
  private onSwitchSidePanel = (state: boolean) => {
    if (state) {
      this.vivaSidePanel = state;
      TBox.shared.togglePopupVisiblility(true);
      this.showSidePanel(true);
    } else if (this.isVivaPanelVisible) {
      this.showSidePanel(false);
      this.vivaSidePanel = state;
    }
  };

  private showSidePanel = (show: boolean) => {
    if (!this.vivaSidePanel) return;
    const btnInfo = this.getButton('info') as HTMLButtonElement | null;
    if (!btnInfo) return;
    if (show) {
      /* Check if the target panel is already visible */
      const panelId = btnInfo.getAttribute('data-panel-id') ?? '5';
      const panel = document.querySelector(`div[data-panel-id="${panelId}"]`) as HTMLDivElement | null;
      let displayStyle = 'none';
      if (panel) {
        const styles = window.getComputedStyle(panel!);
        displayStyle = styles.display ?? 'none';
      }
      const isInfoPanelVisible = panel && displayStyle !== 'none';

      if (isInfoPanelVisible) {
        /* If panel is already visible only reset the icon */
        btnInfo.setAttribute('aria-pressed', 'false');
      } else {
        /* If panel is not visible then click the button to show it and reset the icon */
        this.ignoreInfoAction = true;
        btnInfo.click();
        btnInfo.setAttribute('aria-pressed', 'false');
      }
      this.isVivaPanelVisible = true;
    } else {
      /* Panel should be hidden */
      this.ignoreInfoAction = true;
      btnInfo.click();
      this.isVivaPanelVisible = false;
    }
  };

  /**
   * Hide Viva box on sidebar panel
   */
  private minimizepBtnMeet = () => {
    TBox.shared.togglePopupVisiblility(false);
    this.isVivaPanelVisible = false;
  };

  /**
   * Get action buttons from GMeets
   * @returns
   */
  // eslint-disable-next-line class-methods-use-this
  private getGMeetsButtons(parent: HTMLDivElement | null): any[] {
    const buttons: any[] = [];
    if (parent) {
      const btns = parent.querySelectorAll('button[data-panel-id]');
      btns.forEach((btn: any) => {
        buttons.push(btn);
      });
    }
    return buttons ?? [];
  }

  /**
     * Get action buttons from GMeets more options
     * @returns
     */
  // eslint-disable-next-line class-methods-use-this
  private getGMeetsActions(icons: string[]): any[] {
    const buttons: any[] = [];
    /* Look for the chat button */
    const items = document.getElementsByClassName('google-material-icons');
    let itr = 0;
    while (itr < items.length) {
      const item = items.item(itr);
      if (item?.textContent && icons.includes(item?.textContent)
        && item.parentElement?.parentElement?.tagName === 'LI') {
        buttons.push(item.parentElement?.parentElement);
      }
      itr += 1;
    }

    return buttons;
  }

  /**
   * Register actions to close Viva panel on GMeets action buttons
   */
  private checkBtnsMeet(parent: HTMLDivElement | null): void {
    const buttons = this.getGMeetsButtons(parent);
    buttons?.forEach((btn: HTMLElement, idx: number) => {
      if (btn) this.interceptGButtonClick(btn, idx);
    });
  }

  /**
   * Register actions to close Viva panel on GMeets more action buttons
   */
  private checkMoreOptionsBtnsMeet(): void {
    /* Find the more options button. */
    if (!this.actionBar) return;
    const moreOptionsBtn = this.getButton('more_vert', this.actionBar!);
    /* Query the menu after it has been opened. */
    if (moreOptionsBtn && moreOptionsBtn?.getAttribute('aria-expanded') === 'true') {
      const relevantMenuItems = this.getGMeetsActions(['whiteboard', 'radio_button_checked', 'auto_awesome']);
      relevantMenuItems?.forEach((btn: any, idx: number) => {
        if (btn) this.interceptGButtonClick(btn, idx + 4);
      });
    }
  }

  /**
   * Intercepts the Google button clicks and shows/hides viva in sidebar based on this
   * @param btn Google Button that's clicked.
   * @param idx Button's ID
   */
  private interceptGButtonClick = (btn: HTMLElement, idx: number): void => {
    const closeVivaPanel = () => {
      if (this.vivaSidePanel) this.minimizepBtnMeet();
    };

    if (idx === 0) {
      if (!btn) return;
      btn.onclick = (ev) => {
        if (this.vivaSidePanel && !this.ignoreInfoAction) {
          if (this.isVivaPanelVisible) {
            ev.preventDefault();
            ev.stopPropagation();
            this.minimizepBtnMeet();
            btn.setAttribute('aria-pressed', 'true');
          }
        }
        this.ignoreInfoAction = false;
      };
    } else {
      btn?.addEventListener('click', closeVivaPanel);
    }
  };

  /** Minimizes the transcription box and shows the viva icon. */
  private minimizePopup = () => {
    if (!TBox.shared.isActive) return;
    if (Gladia.isEnabled) this.vivaActivator.classList.add('viva-minimized--is-minimized');

    if (this.vivaSidePanel) {
      this.showSidePanel(false);
      setTimeout(() => {
        TBox.shared.togglePopupVisiblility(false);
      }, 200);
    } else {
      TBox.shared.togglePopupVisiblility(false);
      this.isVivaPanelVisible = false;
    }

    this.showToolTipVivaMove();
  };

  protected showInSidebar(timeout = 0) {
    if (!this.isVivaPanelVisible) {
      setTimeout(() => {
        this.showSidePanel(true);
      }, timeout);
    }
  }

  private async startConnection() {
    TBox.shared.reset();
    TBox.shared.addToPage(false, this.sidebarContainer, true);

    ReconnectionHandler.shared.close();
    SummaryHandler.shared.initialize();
    SummaryHandler.shared.reset();
    if (this.wrapperReset && document.body.contains(this.wrapperReset)) this.wrapperReset.remove();

    /* Register interims handlers */
    TranscriptionsCtrl.handleTranscriptions(TBox.shared);
    this.status = MeetStatus.INITIALIZED;

    /* Register meet buttons interceptors */
    this.initAudioButtonHandler();

    /* Set the microphone initial state */
    this.checkAudioStreamMute();

    this.showInSidebar(750);

    debugLog('Meeting handler initialized');
  }

  /* Revert the Viva tool to the initial state */
  private async resetTranscriptionLayout() {
    debugLog('Restart Viva Translate tool');

    /* Remove the popup */
    await SummaryHandler.shared.close();

    /* Stop all audio streams */
    MicrophoneCapture.disconnect();
    SpeakerCapture.disconnect();

    /* Reset the meeting handler */
    this.status = MeetStatus.NOT_INITIALIZED;
    await this.initHandler(true);
  }

  private async renderMeetLayout() {
    /* Initialize Speech to Text transcription from microphone */
    const micStreamLoaded = MicrophoneCapture.fromDevice();

    /* Ensure that user has enabled the microphone */
    if (!micStreamLoaded) {
      this.resetTranscriptionLayout();
      return;
    }

    /* Initialize Speech to Text transcription from speakers */
    SpeakerCapture.fromMediaStream('audio');

    /* Set transcription metadata */
    const title = document?.querySelectorAll('[data-meeting-title]')[0]?.getAttribute('data-meeting-title')
      ?? document.title;
    TranscriptionsData.reset();
    TranscriptionsData.meetType = MeetType.GOOGLE_MEET;
    TranscriptionsData.title = title;
    TranscriptionsData.url = document.URL;
    TranscriptionsData.startTime = new Date().toLocaleString();

    /* Intialize the connection to Gladia websocket */
    try {
      await Gladia.connect();
    } catch {
      Gladia.disconnect();
      Notifications.shared.showNotification(NOTIFICATION.UNKNOWN_ERROR);
      return;
    }

    this.startConnection();
  }

  /** Stops the mic and speaker streams and disconnects from the socket. */
  protected async disconnect() {
    /* Send tracking info before closing session. */
    debugLog('Stop Viva Translate tool');
    this.status = MeetStatus.NOT_INITIALIZED;

    /* Disconnect */
    Gladia.disconnect();

    /* Remove the popup */
    TBox.shared.removeFromPage();
    Notifications.shared.removeAllFromPage();
    ReconnectionHandler.shared.close();

    /* Stop all audio streams */
    MicrophoneCapture.disconnect();
    SpeakerCapture.disconnect();

    /* Call to summaryRequest for last summarize */
    await SummaryHandler.shared.close();
  }

  public async initHandler(wasReseted = false, force = false) {
    /* Wait until the meeting is initialized */
    const leaveCall = await this.waitForButton('call_end', true);

    /* Add listener for Google Meet call leave */
    if (leaveCall) {
      leaveCall.addEventListener('click', async () => {
        /* Show the transcription results */
        await showTranscriptionResults(Settings.shared.speakerOutLang);
        TranscriptionsData.reset();
        this.disconnect();
      });
    }

    if (this.status !== MeetStatus.NOT_INITIALIZED) return;
    this.status = MeetStatus.INITIALIZING;

    /* Remove the popup if its valid element */
    Notifications.shared.removeAllFromPage();

    /* Add Viva logo button to be injected in the meet */
    this.showVivaActivator();

    /* Ensure that video call is never undefined */
    if (StorageCtrl.getItem(Store.VIDEO_CALL_ACTIVE) === undefined) {
      await StorageCtrl.setItem(Store.VIDEO_CALL_ACTIVE, true);
    }

    const vidCallActive = StorageCtrl.getItem(Store.VIDEO_CALL_ACTIVE);
    const shouldReset = StorageCtrl.getItem(Store.SHOULD_RESET_VIDEO_CALL) ?? false;
    if (!vidCallActive && !shouldReset && !force) {
      this.status = MeetStatus.NOT_INITIALIZED;
      return;
    }

    if (shouldReset || force) {
      const items: Record<string, any> = {};
      items[Store.VIDEO_CALL_ACTIVE] = true;
      items[Store.SHOULD_RESET_VIDEO_CALL] = false;
      await StorageCtrl.setItems(items);
    }

    if (wasReseted) {
      this.status = MeetStatus.NOT_INITIALIZED;

      /* Add reconection notification */
      ReconnectionHandler.shared.initialize();
      TBox.shared.pauseTranscripts();
    }

    this.status = MeetStatus.READY_TO_START;
    this.renderMeetLayout();
  }

  /**
   * Shows the popup with an instructional gif that teaches the user how to turn
   * the video translation feature back on.
   */
  // eslint-disable-next-line class-methods-use-this
  private showResetPopup(): void {
    if (this.wrapperReset && document.body.contains(this.wrapperReset)) return;

    this.resetPopup = document.createElement('div');
    this.resetPopup.classList.add('meeting-reset-popup');
    this.wrapperReset = document.createElement('div');
    this.wrapperReset.classList.add('viva_styles_content', 'notranslate');
    const imgPath = `images/gifs/${I18n.currentLocale}/enable-meet-instruction.gif`;
    this.resetPopup.innerHTML = `
      <p data-viva-i18n="meetings.deactivate_popup_text">${I18n.t('meetings.deactivate_popup_text')}</p>
      <img src="${chrome.runtime.getURL(imgPath)}" alt="Meeting toggle instruction" />
    `;
    const closeBtn = document.createElement('button');
    closeBtn.classList.add('meeting-reset-popup__close');
    closeBtn.innerHTML = `${Icons.CLOSE}`;
    closeBtn.addEventListener('click', () => this.resetPopup?.remove());
    this.resetPopup.append(closeBtn);
    this.wrapperReset.appendChild(this.resetPopup);
    document.body.appendChild(this.wrapperReset);
  }

  /**
   * Get a button inside Google Meet web page using the content of material icon
   * @param content
   * @returns
   */
  // eslint-disable-next-line class-methods-use-this
  protected getButtonByClass(
    content: string,
    className: string,
    parent: any = document
  ): HTMLElement | null {
    // eslint-disable-next-line no-param-reassign
    if (!className) className = 'google-material-icons';
    /* Look for the chat button */
    const items = parent.getElementsByClassName(className);
    let itr = 0;
    let deep = 0;
    let tmpParent: HTMLElement | null | undefined = null;
    while (itr < items.length) {
      const item = items.item(itr);
      if (item?.textContent === content) {
        deep = 1;
        tmpParent = item.parentElement;
        while (tmpParent?.tagName !== 'BUTTON' && deep < BUTTON_MAX_DEEP) {
          tmpParent = tmpParent?.parentElement;
          deep += 1;
        }
        if (deep < BUTTON_MAX_DEEP) {
          break;
        }
      }
      itr += 1;
    }

    if (itr < items.length && tmpParent) {
      return tmpParent;
    }

    return null;
  }

  protected getButton(
    content: string,
    parent: any = document
  ): HTMLElement | null {
    let btn = this.getButtonByClass(content, GOOGLE_MATERIAL_ICONS, parent);
    if (!btn) {
      btn = this.getButtonByClass(content, GOOGLE_SYMBOLS, parent);
    }
    return btn;
  }

  /**
   * Register the viva activator directly on action bar
   * @param btn
   */
  private registerOnActionBar(btn: HTMLButtonElement) {
    // eslint-disable-next-line max-len
    const parentElement: HTMLElement | null = btn.parentElement?.parentElement?.parentElement?.parentElement ?? null;
    /* Only add the activator if its not present in the DOM */
    if (parentElement && !parentElement.contains(this.wrapperActivador)) {
      this.wrapperActivador.appendChild(this.vivaActivator);
      parentElement.insertBefore(this.wrapperActivador, parentElement.firstChild);
      this.checkBtnsMeet(parentElement as HTMLDivElement);
    }
  }

  /**
   * Register action to handle viva activator on collapse button
   * @param btn
   */
  private registerCollapseClick(btn: HTMLButtonElement) {
    this.collapseClick = btn.onclick;
    btn.onclick = (ev: any) => {
      if (this.collapseClick) this.collapseClick(btn, ev);
      setTimeout(async () => {
        const btnInfo = this.getButton('info');
        // eslint-disable-next-line max-len
        const parentElement = btnInfo ? btnInfo.parentElement?.parentElement?.parentElement?.parentElement : null;
        /* Only add the activator if its not present in the DOM */
        if (parentElement && !parentElement.contains(this.wrapperActivador)) {
          this.wrapperActivador.appendChild(this.vivaActivator);
          parentElement.insertBefore(this.wrapperActivador, parentElement.firstChild);
          this.checkBtnsMeet(parentElement as HTMLDivElement);
        }
      }, 1);
    };
  }

  /**
   * Initialize the Viva activator button only once
   */
  protected async initializeVivaActivator(): Promise<void> {
    this.wrapperActivador.classList.add('viva_styles_content', 'notranslate');
    this.vivaActivator.classList.add(
      'viva-minimized',
      Identifiers.TOOLBOX,
      Identifiers.TOOLBOX_TOP_LEFT,
      'viva-activator-btn'
    );
    this.vivaActivator.innerHTML = `
    <img class="viva-toolbox__toggle" src="${chrome.runtime.getURL('images/logo/circular-logo-gradient.svg')}"
      alt="Viva Translate">
    `;

    this.toolTipVivaMove = new Tooltip(this.vivaActivator, 'meetings.tooltips.pause_suggestion', {
      position: TooltipPosition.BOTTOM,
      type: TooltipType.STATIC
    }, ['viva-tooltip--static', 'viva-tooltip--lg']);

    this.vivaActivator.append(this.toolTipVivaMove.element);
    this.vivaActivator.title = I18n.t('meetings.tooltips.active');
    this.vivaActivator.classList.add(GeneralClasses.VIVA_ACTIVATOR_LISTENING);

    /** Listen to Viva icon click and check if clicked on logo. */
    this.vivaActivator.addEventListener('click', (event: MouseEvent) => {
      if (this.preventMultipleClicks) return;
      this.preventMultipleClicks = true;
      if ((event?.target as HTMLElement).nodeName === 'IMG') {
        if (!Gladia.isEnabled) {
          this.status = MeetStatus.NOT_INITIALIZED;
          this.resetState();
          this.initHandler(true, true);
          return;
        }

        if (this.isVivaPanelVisible) {
          this.showSidePanel(false);
          setTimeout(() => {
            TBox.shared.togglePopupVisiblility(false);
            if (Gladia.isEnabled) this.vivaActivator.classList.add(GeneralClasses.VIVA_ACTIVATOR_LISTENING);
          }, 10);
        } else {
          TBox.shared.togglePopupVisiblility(true);
          setTimeout(() => {
            this.showSidePanel(true);
            this.vivaActivator.classList.remove(GeneralClasses.VIVA_ACTIVATOR_LISTENING);
          }, 10);
        }
        setTimeout(() => {
          this.preventMultipleClicks = false;
        }, 500);
      } else {
        this.preventMultipleClicks = false;
      }
    });
  }

  /**
   * Shw the Viva activator button on the web page
   */
  protected async showVivaActivator(): Promise<void> {
    /* Add activator to parent item if it exists */
    const btnInfo = await this.waitForButton('info');
    if (btnInfo) {
      this.registerOnActionBar(btnInfo as HTMLButtonElement);
    } else {
      const btnExpandLess = this.getButton('expand_less');
      if (btnExpandLess) {
        this.registerCollapseClick(btnExpandLess as HTMLButtonElement);
      }
    }
  }
}

export default GoogleMeet.shared;
