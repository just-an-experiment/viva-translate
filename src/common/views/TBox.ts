import {
  InternalEvents, ResizePoints, Store, RunMode, MeetType
} from '../constants';
import InterimHandler from '../transcriptions/InterimHandler';
import Gladia from '../gladia';
import I18n from '../utils/language';
import Settings from '../utils/Settings';
import { debounce, pxToNumber } from '../utils/helpers';
import ButtonsSection from '../components/sections/ButtonsSection';
import CloseCaptionSection from '../components/sections/CloseCaptionSection';
import RecordingSection from '../components/sections/RecordingSection';
import SettingsSection from '../components/sections/SettingsSection';
import SettingsWebSection from '../components/sections/SettingsWebSection';
import SummarySection from '../components/sections/SummarySection';
import SwitchSidePanelSection from '../components/sections/SwithPanelSection';
import LearningMode from '../components/sections/LearningMode';
import {
  DragConfig, IInterim, ResizeConfig
} from '../types';
import NotificationToast from '../components/notifications/NotificationToast';
import ReconnectionHandler from '../transcriptions/ReconnectionHandler';
import StorageCtrl from '../Storage';

const $ = document;
const headerHeight = 40;
const MIN_SHOW_LEARNIG_MODE = 450; // limit to hide the "learning mode"

interface IPopupOptions {
  position: {
    right: string;
    top: string;
  };
  draggable: boolean;
  dimensions: {
    width: string;
    maxWidth: string;
    minWidth: string;
    height: string;
    maxHeight: string;
    minHeight: string;
    largeMinWidth: string;
  };
}

const defaultPopupConfig = {
  position: {
    right: '16px',
    top: '16px',
  },
  draggable: true,
  dimensions: {
    width: '362px',
    minWidth: '362px',
    maxWidth: '90vw',
    height: '500px',
    maxHeight: '90vh',
    minHeight: '300px',
    largeMinWidth: '600px',
  },
};

interface TBoxElements {
  wrapper: HTMLDivElement;
  popup: HTMLDivElement;
  header: HTMLDivElement;
  popupTitle?: HTMLHeadingElement;
  popupBody: HTMLDivElement;
  firstContainer: HTMLDivElement;
  secondContainer: HTMLDivElement;
  closeBtn?: HTMLButtonElement;
  transcriptionBtn?: HTMLButtonElement;
  feedbackBtn?: HTMLButtonElement;
  newMessageButton?: HTMLButtonElement;
  resizeHandlerX?: HTMLDivElement;
  resizeHandlerXLeft?: HTMLDivElement;
  resizeHandlerY?: HTMLDivElement;
  resizeHandlerYTop?: HTMLDivElement;
  resizeHandlerDL?: HTMLDivElement;
  resizeHandlerDR?: HTMLDivElement;
  resizeHandlerDLT?: HTMLDivElement;
  resizeHandlerDRT?: HTMLDivElement;
  streamErrorNotification?: HTMLDivElement;
  networkNotification?: NotificationToast;
}

class TBox {
  private static instance: TBox;

  private options: IPopupOptions;

  public components: TBoxElements;

  public isLiveCC: boolean = false;

  public msgsContainer?: HTMLDivElement;

  private onMinimize: () => void;

  private onSwitchSidePanel?: (state: boolean) => void;

  private lastScrollTop: number = 0;

  public preventScroll: boolean = false;

  private isAutoScroll: boolean = false;

  private isMouseEnter: boolean = false;

  public scrolledToBottom: boolean = false;

  private settings: SettingsSection | SettingsWebSection;

  private summary: SummarySection;

  private switchSidePanel?: SwitchSidePanelSection;

  public isActive: boolean = false;

  public vivaSidePanel: boolean;

  private event: Event = new Event('ontboxvisible');

  private learningMode: any;

  private sidebarContainer?: HTMLElement;

  private dragConfig: DragConfig = {
    canDrag: false,
    cursorOffsetX: null,
    cursorOffsetY: null,
    isDragging: false,
  };

  private resizeConfig: ResizeConfig = {
    isResizingX: false,
    isResizingXLeft: false,
    isResizingY: false,
    isResizingYTop: false,
    lastDownX: null,
    finalX: 0,
    finalY: 0,
    oldX: 0,
  };

  private constructor(
    onMinimize: () => void,
    onClose: (reset: boolean) => void,
    onSwitchSidePanel?: (state: boolean) => void,
  ) {
    this.options = defaultPopupConfig;
    this.components = {
      wrapper: $.createElement('div'),
      popup: $.createElement('div'),
      header: $.createElement('div'),
      popupBody: $.createElement('div'),
      firstContainer: $.createElement('div'),
      secondContainer: $.createElement('div')
    };
    this.vivaSidePanel = Settings.shared.mode === RunMode.MEETING;
    this.onMinimize = onMinimize;
    this.onSwitchSidePanel = onSwitchSidePanel;
    this.settings = Settings.shared.mode === RunMode.MEETING ? SettingsSection.shared : SettingsWebSection.shared;
    this.summary = SummarySection.shared;
    if (Settings.shared.mode === RunMode.MEETING) {
      this.switchSidePanel = SwitchSidePanelSection.shared;
      this.switchSidePanel.hide();
      this.switchSidePanel.toggleSwithPanelSection = this.toggleSwithPanelSection.bind(this);
    }
    CloseCaptionSection.shared.parent = this;
    RecordingSection.shared.onClose = onClose;
    RecordingSection.shared.notifyCb = this.sendInfoMessage.bind(this);
    this.settings.toggleSettingsSection = this.toggleSettingsSection.bind(this);
    this.summary.toggleSummarySection = this.toggleSummarySection.bind(this);
    this.initPopup();
    this.learningMode = null;
    Settings.shared.on(InternalEvents.SPEAKER_OUT, () => {
      this.languageSwitchMessage();
    });
  }

  public static get shared(): TBox {
    if (!TBox.instance) throw new Error('Instance not initialized');
    return TBox.instance;
  }

  public static initialize(
    onMinimize: () => void,
    onClose: (reset: boolean) => void,
    onSwitchSidePanel?: (state: boolean) => void,
    forceRestart: boolean = false
  ) {
    if (TBox.instance && !forceRestart) return;
    TBox.instance = new TBox(
      onMinimize,
      onClose,
      onSwitchSidePanel,
    );
  }

  /** Shows the transcription box and hides the lets go button & options container. */
  private activateChatTranscription(): void {
    if (this.msgsContainer) this.msgsContainer.hidden = false;
    this.autoScrollTo();
    Gladia.setEnabled(true);
  }

  /** Prevents the transcription window from going out of bounds when resizing the window. */
  private onResize = (): void => {
    const outOfBoundsX =
      pxToNumber(this.components.popup.style.left) + pxToNumber(this.components.popup.style.width) >= window.innerWidth;
    const outOfBoundsY = pxToNumber(this.components.popup.style.top) + headerHeight >= window.innerHeight;
    if (outOfBoundsX) this.components.popup.style.left = 'unset';
    if (outOfBoundsY) this.components.popup.style.top = `calc(100vh - ${headerHeight}px)`;
  };

  private hideLearningMode = (newWidth: number) => {
    this.learningMode = LearningMode.shared.component;
    this.learningMode.style.display = newWidth <= MIN_SHOW_LEARNIG_MODE || this.vivaSidePanel ? 'none' : 'flex';
  };

  /**
   * Determines if the width of the transcription window can be resized or not.
   * @param newWidth The new width to be assigned to the transcription box.
   * @param event MouseEvent to determine the current cursor position.
   */
  protected canResizeWidth = (newWidth: number, event: MouseEvent): boolean =>
    newWidth > pxToNumber(this.options.dimensions.minWidth) &&
    newWidth < window.innerWidth - 32 &&
    event.pageX < $.body.clientWidth &&
    event.pageX > 0;

  /**
   * Updates the coordinates and width of the transcription box if user resizes horizontally.
   * @param event Used to obtain mouse position.
   */
  protected updateResizeX = (event: MouseEvent) => {
    if (!this.components.popup) return;
    const popupRect = this.components.popup.getBoundingClientRect();
    let newWidth = event.clientX - popupRect.left;
    if (this.resizeConfig.isResizingXLeft) {
      newWidth = this.resizeConfig.finalX - event.clientX;
    }
    if (this.canResizeWidth(newWidth, event)) {
      const minWidth = pxToNumber(this.components.popup.style.minWidth);
      if (!this.resizeConfig.isResizingXLeft) {
        this.components.popup.style.width = `${newWidth <= minWidth ? minWidth : newWidth}px`;
      } else if (this.resizeConfig.isResizingXLeft && newWidth !== popupRect.width) {
        if (newWidth >= minWidth) {
          this.components.popup.style.left = `${event.pageX}px`;
          this.components.popup.style.width = `${newWidth <= minWidth ? minWidth : newWidth}px`;
        }
      }

      this.hideLearningMode(newWidth <= minWidth ? minWidth : newWidth);

      this.onPopupResize();
    }
  };

  /**
   * Updates the coordinates of the transcription popup based on user resizing.
   * @param event Used to get mouse coordinates.
   */
  protected updateResizeCoordinates = (event: MouseEvent): void => {
    const popupRect = this.components.popup.getBoundingClientRect();
    if (this.resizeConfig.isResizingY && this.components.popup.clientHeight <= window.innerHeight) {
      const newHeight = event.clientY - popupRect.top;
      if (newHeight > pxToNumber(this.options.dimensions.minHeight)) {
        this.components.popup.style.height = `${newHeight}px`;
      }
    }
    if (this.resizeConfig.isResizingYTop && this.components.popup.clientHeight <= window.innerHeight) {
      const clientY = Math.max(event.clientY, 0);
      const newHeight = this.resizeConfig.finalY - clientY;
      if (newHeight > pxToNumber(this.options.dimensions.minHeight)) {
        this.components.popup.style.top = `${clientY}px`;
        this.components.popup.style.height = `${newHeight}px`;
      }
    }
    if (this.resizeConfig.isResizingX || this.resizeConfig.isResizingXLeft) this.updateResizeX(event);
  };

  /**
   * Mouse move event action. Updates the highlight box position.
   * @param event Mouse event used to update the position of the highlight box.
   */
  protected onMouseMove = (event: MouseEvent): void => {
    if (!this.components.popup || this.vivaSidePanel) return;
    if (this.dragConfig.isDragging) {
      document.body.style.cursor = 'move';
      this.components.popup.style.cursor = 'move';
      this.updatePosition(event);
      return;
    }
    this.updateResizeCoordinates(event);
    this.resizeConfig.oldX = event.pageX;
  };

  /**
   * Mouse down event action. Updates the cursor offset and highlight box position.
   * @param event Mouse event to activate the drag and drop action.
   */
  protected onMouseDown = (event: MouseEvent): void => {
    if ((event?.target as HTMLElement)?.nodeName === 'BUTTON' || !this.components.popup || event?.button === 2) return;
    if (event.preventDefault) event.preventDefault();
    const learningModeRect = $.querySelector('.learning-mode')?.getBoundingClientRect();
    this.dragConfig.isDragging = true;
    this.dragConfig.cursorOffsetX = event.offsetX + 152.5 + Number(learningModeRect?.width);
    this.dragConfig.cursorOffsetY = event.offsetY + 5;
  };

  /** Resets the cursor style to initial. */
  protected resetCursor = (): void => {
    document.body.style.cursor = 'initial';
    if (this.components.popup) this.components.popup.style.cursor = 'initial';
  };

  /**
   * Resize event action for transcription-box. Inject a new class acordding to transcription-box width
   */
  protected onPopupResize = () => {
    this.autoScrollTo();
    this.preventScroll = false;
  };

  /** Saves coordinates in the storage sync API and sends updated position to Mixpanel */
  protected updateStoreCoordinates = () => {
    const popupRect = this.components.popup.getBoundingClientRect();
    const resizeHeight = popupRect.height;
    const resizeWidth = popupRect.width;
    const dragDropX = popupRect.x;
    const dragDropY = popupRect.y;
    const updates: Record<string, any> = {};
    let updatesCnt = 0;
    if (resizeHeight !== StorageCtrl.getItem(Store.TBOX_RESIZE_HEIGHT)) {
      updates[Store.TBOX_RESIZE_HEIGHT] = resizeHeight;
      updatesCnt += 1;
    }
    if (resizeWidth !== StorageCtrl.getItem(Store.TBOX_RESIZE_WIDTH)) {
      updates[Store.TBOX_RESIZE_WIDTH] = resizeWidth;
      updatesCnt += 1;
    }

    const updatingDragX = dragDropX !== StorageCtrl.getItem(Store.TBOX_DRAG_X);
    const updatingDragY = dragDropY !== StorageCtrl.getItem(Store.TBOX_DRAG_Y);
    if (updatingDragX) {
      updates[Store.TBOX_DRAG_X] = dragDropX;
      updatesCnt += 1;
    }
    if (updatingDragY) {
      updates[Store.TBOX_DRAG_Y] = dragDropY;
      updatesCnt += 1;
    }

    if (updatesCnt > 0) {
      StorageCtrl.setItems(updates);
    }
  };

  /** Mouse up event action. Deactivates dragging and inserts pin button. */
  protected onMouseUp = (): void => {
    if (
      this.dragConfig.isDragging ||
      this.resizeConfig.isResizingX ||
      this.resizeConfig.isResizingXLeft ||
      this.resizeConfig.isResizingY ||
      this.resizeConfig.isResizingYTop
    ) {
      this.updateStoreCoordinates();
    }
    this.dragConfig.isDragging = false;
    this.resizeConfig.isResizingX = false;
    this.resizeConfig.isResizingXLeft = false;
    this.resizeConfig.isResizingY = false;
    this.resizeConfig.isResizingYTop = false;

    this.resetCursor();
  };

  protected activateResize = (event: MouseEvent, resizePoint: ResizePoints): void => {
    event?.preventDefault();
    if (event?.button === 2) return;
    const popupRect = this.components.popup.getBoundingClientRect();
    switch (resizePoint) {
      case ResizePoints.TOP:
        this.resizeConfig.isResizingYTop = true;
        this.resizeConfig.finalY = popupRect.top + popupRect.height;
        break;
      case ResizePoints.BOTTOM:
        this.resizeConfig.isResizingY = true;
        break;
      case ResizePoints.LEFT:
        this.resizeConfig.isResizingXLeft = true;
        this.resizeConfig.finalX = popupRect.left + popupRect.width;
        break;
      case ResizePoints.RIGHT:
        this.resizeConfig.isResizingX = true;
        break;
      case ResizePoints.DIAGONAL_LEFT:
        this.resizeConfig.isResizingXLeft = true;
        this.resizeConfig.finalX = popupRect.left + popupRect.width;
        this.resizeConfig.isResizingY = true;
        break;
      case ResizePoints.DIAGONAL_LEFT_TOP:
        this.resizeConfig.isResizingXLeft = true;
        this.resizeConfig.isResizingYTop = true;
        this.resizeConfig.finalX = popupRect.left + popupRect.width;
        this.resizeConfig.finalY = popupRect.top + popupRect.height;
        break;
      case ResizePoints.DIAGONAL_RIGHT:
        this.resizeConfig.isResizingX = true;
        this.resizeConfig.isResizingY = true;
        break;
      case ResizePoints.DIAGONAL_RIGHT_TOP:
        this.resizeConfig.isResizingX = true;
        this.resizeConfig.isResizingYTop = true;
        this.resizeConfig.finalY = popupRect.top + popupRect.height;
        break;
      default:
        break;
    }
    this.resizeConfig.lastDownX = event.clientY;
  };

  /**
   * Updates the position of the highlight box.
   * @param event Mouse event that is used to update the highlight box's position.
   */
  protected updatePosition = (event: MouseEvent): void => {
    if (event.clientX <= 0 || event.clientY <= 0 || !this.components.popup) return;
    const leftIconOffset = -48;
    this.components.popup.style.position = 'fixed';
    const xPosition = Math.max(Number(event.clientX) - leftIconOffset - Number(this.dragConfig.cursorOffsetX), 0);
    const yPosition = Math.max(Number(event.clientY) - Number(this.dragConfig.cursorOffsetY), 0);
    if (window.innerWidth > xPosition + this.components.popup.clientWidth) {
      this.components.popup.style.left = `${xPosition}px`;
    }
    if (window.innerHeight > yPosition + headerHeight) this.components.popup.style.top = `${yPosition}px`;
  };

  /** Sets popup dimensions and adds the correct classes. */
  private setPanelPopupStyles() {
    this.components.popup.classList.add('translate-pill-popup', 'transcription-box');

    this.components.popup.style.width = '362px'; // GMeet's side panel is exactly 360px
    this.components.popup.style.maxHeight = '100%';
    this.components.popup.style.left = 'unset';
    this.components.popup.style.right = '15px';
    this.components.popup.style.height = 'unset';
    this.components.popup.style.minHeight = 'unset';
    this.components.popup.style.top = '15px'; // is the way GMeet gets its height for the side panel
    this.components.popup.style.bottom = '80px'; // is the way GMeet gets its height for the side panel

    LearningMode.shared.component.style.display = 'none';

    /* Prepare the popup body */
    this.components.popupBody.classList.add('transcription-box__content');
    this.components.popupBody.classList.add('translate-pill-panel');
    this.components.popup.style.position = 'fixed';
  }

  private setPopupStyles() {
    this.components.popup.classList.add('translate-pill-popup', 'transcription-box');

    /* Set the width of the popup */
    this.components.popup.style.width = StorageCtrl.getItem(Store.TBOX_RESIZE_WIDTH)
      ? `${StorageCtrl.getItem(Store.TBOX_RESIZE_WIDTH)}px`
      : this.options.dimensions.width;

    this.components.popup.style.maxWidth = this.options.dimensions.maxWidth;
    this.updateMinWidth();

    /* Set the height of the popup */
    this.components.popup.style.height = StorageCtrl.getItem(Store.TBOX_RESIZE_HEIGHT)
      ? `${StorageCtrl.getItem(Store.TBOX_RESIZE_HEIGHT)}px`
      : this.options.dimensions.height;
    this.components.popup.style.maxHeight = this.options.dimensions.maxHeight;
    this.components.popup.style.minHeight = this.options.dimensions.minHeight;

    /* Set initial position of popup */
    const x =
      StorageCtrl.getItem(Store.TBOX_DRAG_X) ||
      $.body.clientWidth - pxToNumber(this.options.dimensions.width) - pxToNumber(this.options.position.right);
    const outOfBoundsX = x + pxToNumber(this.components.popup.style.width) >= window.innerWidth;
    this.components.popup.style.left = outOfBoundsX ? 'unset' : `${x}px`;
    this.components.popup.style.right = this.options.position.right;
    this.components.popup.style.top = StorageCtrl.getItem(Store.TBOX_DRAG_Y)
      ? `${StorageCtrl.getItem(Store.TBOX_DRAG_Y)}px`
      : this.options.position.top;

    /* Prepare the popup body */
    this.components.popupBody.classList.add('transcription-box__content');
    this.components.popup.style.position = 'fixed';
  }

  /** Creates and appends the header of the transcription box. */
  private setPopupHeader() {
    this.components.header.classList.add('popup-header');

    ButtonsSection.initialize(this.onMinimize);

    const draggableArea = $.createElement('div');
    draggableArea.classList.add('draggable-area');
    $.addEventListener('mousemove', this.onMouseMove);
    draggableArea.addEventListener('mousedown', this.onMouseDown);

    this.components.header.append(
      RecordingSection.shared.component,
      LearningMode.shared.component,
      draggableArea,
      ButtonsSection.shared.component
    );
    this.hideLearningMode(StorageCtrl.getItem(Store.TBOX_RESIZE_WIDTH));
    RecordingSection.shared.show();
    this.components.popup.appendChild(this.components.header);
  }

  /** Creates the resize handle and injects it into the bottom of the transcription box. */
  private setResizeHandles(): void {
    this.components.resizeHandlerX = $.createElement('div');
    this.components.resizeHandlerX.classList.add('transcription-box__resize', 'transcription-box__resize--horizontal');
    this.components.resizeHandlerX.addEventListener('mousedown', (event: MouseEvent) => {
      this.activateResize(event, ResizePoints.RIGHT);
    });
    this.components.popup.appendChild(this.components.resizeHandlerX);

    this.components.resizeHandlerXLeft = $.createElement('div');
    this.components.resizeHandlerXLeft.classList.add('transcription-box__resize', 'transcription-box__resize--left');
    this.components.resizeHandlerXLeft.addEventListener('mousedown', (event: MouseEvent) => {
      this.activateResize(event, ResizePoints.LEFT);
    });
    this.components.popup.appendChild(this.components.resizeHandlerXLeft);

    this.components.resizeHandlerY = $.createElement('div');
    this.components.resizeHandlerY.classList.add('transcription-box__resize');
    this.components.resizeHandlerY.addEventListener('mousedown', (event: MouseEvent) => {
      this.activateResize(event, ResizePoints.BOTTOM);
    });
    this.components.popup.appendChild(this.components.resizeHandlerY);

    this.components.resizeHandlerYTop = $.createElement('div');
    this.components.resizeHandlerYTop.classList.add('transcription-box__resize', 'transcription-box__resize--top');
    this.components.resizeHandlerYTop.addEventListener('mousedown', (event: MouseEvent) => {
      this.activateResize(event, ResizePoints.TOP);
    });
    this.components.popup.appendChild(this.components.resizeHandlerYTop);

    this.components.resizeHandlerDL = $.createElement('div');
    this.components.resizeHandlerDL.classList.add(
      'transcription-box__resize',
      'transcription-box__resize--diagonal-left'
    );
    this.components.resizeHandlerDL.addEventListener('mousedown', (event: MouseEvent) => {
      this.activateResize(event, ResizePoints.DIAGONAL_LEFT);
    });
    this.components.popup.appendChild(this.components.resizeHandlerDL);

    this.components.resizeHandlerDLT = $.createElement('div');
    this.components.resizeHandlerDLT.classList.add(
      'transcription-box__resize',
      'transcription-box__resize--diagonal-left-top'
    );
    this.components.resizeHandlerDLT.addEventListener('mousedown', (event: MouseEvent) => {
      this.activateResize(event, ResizePoints.DIAGONAL_LEFT_TOP);
    });
    this.components.popup.appendChild(this.components.resizeHandlerDLT);

    this.components.resizeHandlerDR = $.createElement('div');
    this.components.resizeHandlerDR.classList.add(
      'transcription-box__resize',
      'transcription-box__resize--diagonal-right'
    );
    this.components.resizeHandlerDR.addEventListener('mousedown', (event: MouseEvent) => {
      this.activateResize(event, ResizePoints.DIAGONAL_RIGHT);
    });
    this.components.popup.appendChild(this.components.resizeHandlerDR);

    this.components.resizeHandlerDRT = $.createElement('div');
    this.components.resizeHandlerDRT.classList.add(
      'transcription-box__resize',
      'transcription-box__resize--diagonal-right-top'
    );
    this.components.resizeHandlerDRT.addEventListener('mousedown', (event: MouseEvent) => {
      this.activateResize(event, ResizePoints.DIAGONAL_RIGHT_TOP);
    });
    this.components.popup.appendChild(this.components.resizeHandlerDRT);
  }

  private removeResizeHandles(): void {
    this.components.resizeHandlerX?.remove();
    this.components.resizeHandlerX = undefined;
    this.components.resizeHandlerXLeft?.remove();
    this.components.resizeHandlerXLeft = undefined;
    this.components.resizeHandlerY?.remove();
    this.components.resizeHandlerY = undefined;
    this.components.resizeHandlerYTop?.remove();
    this.components.resizeHandlerYTop = undefined;
    this.components.resizeHandlerDL?.remove();
    this.components.resizeHandlerDL = undefined;
    this.components.resizeHandlerDLT?.remove();
    this.components.resizeHandlerDLT = undefined;
    this.components.resizeHandlerDR?.remove();
    this.components.resizeHandlerDR = undefined;
    this.components.resizeHandlerDRT?.remove();
    this.components.resizeHandlerDRT = undefined;
  }

  /** Increases min width of TBox when there's more than one section active. */
  private updateMinWidth(): void {
    const settingsSection = $.querySelector('.settings-section') as HTMLDivElement;
    const summarySection = $.querySelector('.meeting-summary') as HTMLDivElement;
    const twoSectionsActive = this.components.popupBody.classList.contains('second-active');
    const largeMinWidth = this.options.dimensions.largeMinWidth;
    if ((settingsSection?.hidden && summarySection?.hidden) || !twoSectionsActive) {
      this.components.popup.style.minWidth = this.options.dimensions.minWidth;
    } else {
      this.components.popup.style.minWidth = largeMinWidth;
      if (pxToNumber(this.components.popup.style.width) <= pxToNumber(largeMinWidth)) {
        this.components.popup.style.width = largeMinWidth;
      }
      const rect = this.components.popup.getBoundingClientRect();
      if (rect?.right > window.innerWidth) {
        this.components.popup.style.left = `${window.innerWidth - pxToNumber(largeMinWidth)}px`;
      }
    }
  }

  private setSecondSectionClasses(active: boolean) {
    if (active) {
      this.components.popup.classList.add('second-active');
      if (this.vivaSidePanel) this.components.popupBody.classList.add('second-active-side-panel');
    } else {
      this.components.popup?.classList.remove('second-active');
      if (this.vivaSidePanel) this.components.popupBody.classList.remove('second-active-side-panel');
    }
  }

  /** Toggles the Settings section to hidden or visible. */
  public toggleSettingsSection(forceOff = false): void {
    let isHidden = forceOff;
    if (isHidden) {
      this.settings.hide();
    } else {
      if (this.summary.component && !this.summary.component?.hidden) {
        this.toggleSummarySection();
      }
      isHidden = this.settings.toggle();
    }
    if (isHidden) {
      this.setSecondSectionClasses(false);
      this.autoScrollTo();
      Gladia.showNewMessageBtn = false;
    } else {
      this.setSecondSectionClasses(true);
    }
    this.updateMinWidth();
    this.onResize();
  }

  public setSidebarMode(value: boolean) {
    if (Settings.shared.mode === RunMode.MEETING && value) {
      /* Remove from page and add it to the sidebar */
      if ($.body.contains(this.components.wrapper)) {
        $.body.removeChild(this.components.wrapper);
      }
      this.vivaSidePanel = true;
      this.components.firstContainer.classList.add('transcription-box__content--first-panel');
      this.components.secondContainer.classList.add('transcription-box__content--second-panel');
      if (!this.settings.component.hidden || !this.summary.component.hidden) {
        this.components.popupBody.classList.add('second-active-side-planel');
      }
      if (this.sidebarContainer) this.addToPage(false, this.sidebarContainer);
      this.switchSidePanel?.hide();
      this.setPanelPopupStyles();
      this.removeResizeHandles();
    } else {
      /* Remove from sidebar and add it to the page */
      if (this.sidebarContainer?.contains(this.components.wrapper)) {
        this.sidebarContainer?.removeChild(this.components.wrapper);
      }
      this.vivaSidePanel = false;
      this.components.firstContainer.classList.remove('transcription-box__content--first-panel');
      this.components.secondContainer.classList.remove('transcription-box__content--second-panel');
      this.components.popupBody.classList.remove('second-active-side-planel');
      this.addToPage();
      this.switchSidePanel?.show();
      this.setPopupStyles();
      this.components.popupBody.classList.remove('translate-pill-panel');
      window.addEventListener('resize', debounce(this.onResize, 25));
      $.addEventListener('mouseup', this.onMouseUp);
      /** Resize handle */
      this.setResizeHandles();
    }
  }

  public toggleSwithPanelSection(): void {
    this.setSidebarMode(!this.vivaSidePanel);
    if (this.onSwitchSidePanel) this.onSwitchSidePanel(this.vivaSidePanel);
  }

  /** Toggles the Summary section to hidden or visible. */
  public toggleSummarySection(forceOn = false): void {
    const summarySection = $.querySelector('.meeting-summary') as HTMLDivElement;
    if (!summarySection) return;
    if (forceOn || summarySection?.hidden) {
      if (!this.settings.component.hidden) {
        this.toggleSettingsSection();
      }
      this.components.secondContainer.classList.add('summary-active');
      this.setSecondSectionClasses(true);
      this.summary.show();
      summarySection.hidden = false;
    } else {
      this.setSecondSectionClasses(false);
      this.components.secondContainer.classList.remove('summary-active');
      this.summary.hide();
      summarySection.hidden = true;
    }
    if (this.msgsContainer && !summarySection.hidden !== undefined) {
      if (this.msgsContainer.hidden) {
        Gladia.showNewMessageBtn = false;
        if (this.components.newMessageButton) {
          this.components.newMessageButton.hidden = true;
        }
      } else {
        this.autoScrollTo();
      }
    }
    this.updateMinWidth();
  }

  private hideNewMessageButton = () => {
    if (this.components.newMessageButton) this.components.newMessageButton.hidden = true;
    this.preventScroll = false;
    this.autoScrollTo();
    Gladia.showNewMessageBtn = false;
  };

  private setNewMessageNotification(): void {
    const btnWrapper = $.createElement('div');
    btnWrapper.classList.add('new-msg-btn');
    this.components.newMessageButton = $.createElement('button');
    this.components.newMessageButton.classList.add('viva-gradient-btn');
    this.components.newMessageButton.hidden = true;

    this.components.newMessageButton.addEventListener('click', this.hideNewMessageButton);
    this.components.newMessageButton.addEventListener('mouseover', () => {
      this.preventScroll = true;
    });
    this.components.newMessageButton.addEventListener('mouseout', () => {
      this.preventScroll = false;
      setTimeout(() => {
        if (this.preventScroll === false) {
          this.autoScrollTo();
        }
      }, 5);
    });

    btnWrapper.appendChild(this.components.newMessageButton);
    this.components.popup?.append(btnWrapper);
  }

  private initMsgScrollListener(): void {
    if (!this.msgsContainer) return;

    this.lastScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    this.msgsContainer.addEventListener('scroll', () => {
      if (!this.msgsContainer) return;
      const st = this.msgsContainer.scrollTop;
      if (st > this.lastScrollTop) {
        const height = this.msgsContainer.scrollHeight - this.msgsContainer.scrollTop;
        if (this.isAutoScroll || height - 1 <= this.msgsContainer.clientHeight) {
          this.hideNewMessageButton();
          this.scrolledToBottom = true;
        }
      } else {
        this.scrolledToBottom = false;
        if (!this.isAutoScroll && this.isMouseEnter) {
          this.preventScroll = true;
        }
      }
      this.isAutoScroll = false;
      this.lastScrollTop = st <= 0 ? 0 : st;
    });
  }

  public autoScrollTo(): void {
    this.isAutoScroll = true;
    this.msgsContainer?.scrollTo(0, this.msgsContainer?.scrollHeight);
    this.msgsContainer?.querySelectorAll('[aria-shown=false]').forEach((node) => {
      node.setAttribute('aria-shown', 'true');
    });
  }

  private setMessageContainer(): void {
    this.msgsContainer = $.createElement('div');
    this.msgsContainer.classList.add('msgs-container');
    this.msgsContainer.addEventListener('mouseenter', () => {
      this.isMouseEnter = true;
      const hasScroll = this.components.popupBody.offsetHeight - this.components.popup.offsetHeight > -90;
      if (!this.scrolledToBottom && hasScroll) this.preventScroll = true;
    });
    this.msgsContainer.addEventListener('mouseleave', () => {
      this.preventScroll = false;
      this.isMouseEnter = false;
      setTimeout(() => {
        if (this.preventScroll === false) {
          this.autoScrollTo();
        }
      }, 5);
    });

    this.initMsgScrollListener();
    this.components.firstContainer.append(this.msgsContainer);
  }

  private async initPopup() {
    if (this.vivaSidePanel) {
      this.setPanelPopupStyles();
    } else {
      this.setPopupStyles();
      window.addEventListener('resize', debounce(this.onResize, 25));
      $.addEventListener('mouseup', this.onMouseUp);
      /** Resize handle */
      this.setResizeHandles();
    }

    /* Prepare the popup header */
    this.setPopupHeader();

    /* Container to show the messages. */
    this.setMessageContainer();
    this.setNewMessageNotification();

    this.components.firstContainer.classList.add('transcription-box__content--first');
    if (this.vivaSidePanel) this.components.firstContainer.classList.add('transcription-box__content--first-panel');
    this.components.secondContainer.classList.add('transcription-box__content--second');
    if (this.vivaSidePanel) this.components.secondContainer.classList.add('transcription-box__content--second-panel');

    this.components.secondContainer.append(this.settings.component);
    this.components.popupBody.append(
      this.components.firstContainer,
      this.components.secondContainer
    );
    this.components.popup.appendChild(this.components.popupBody);

    this.components.networkNotification = new NotificationToast(this.components.firstContainer);
    ReconnectionHandler.shared.notification = this.components.networkNotification;
  }

  public sendInfoMessage(
    message: string,
    hasGradient = false,
    btnText?: string,
    btnCallback?: any
  ): void {
    /* Prevent duplicate info messages. */
    const lastMsg = this.msgsContainer?.children[Number(this.msgsContainer?.children.length) - 1];
    const lastMsgContent = lastMsg?.querySelector('.viva-message-content__text');
    const i18nKey = lastMsgContent?.getAttribute('data-viva-i18n');
    if (lastMsgContent && i18nKey?.length && i18nKey === message) return;

    const id = Date.now();
    const interim = new InterimHandler(id, this.isLiveCC ? MeetType.LIVE_CC : MeetType.GOOGLE_MEET);
    const translations: Record<string, string> = {
      EN: I18n.t(message, interim.paragraph),
    };
    const infoMessage: IInterim = {
      id,
      originalText: I18n.t(message, interim.paragraph),
      originalLang: 'EN',
      translations,
      index: id,
      isSystem: true,
      isFinal: true,
      createdAt: id
    };
    interim.addInterim(infoMessage);
    interim?.msg?.classList.add();

    if (hasGradient) interim.msg.classList.add('interim--gradient-bg');

    if (btnText && Number(btnText?.length) > 0 && btnCallback) {
      interim.msg.classList.add('interim--has-btn');
      const btn = $.createElement('button');
      btn.classList.add('viva-gradient-btn');
      btn.innerText = `${I18n.t(btnText, btn)}`;
      btn.addEventListener('click', btnCallback);
      interim.content.append(btn);
    }

    this.msgsContainer?.appendChild(interim.msg);
    this.autoScrollTo();
    Gladia.showNewMessageBtn = false;
  }

  /** Adds transcription wi ndow to the current page. */
  public addToPage(
    isLiveCC: boolean = false,
    sidebarContainer?: HTMLElement | null,
    firstTime: boolean = false
  ) {
    /* If sidebar container is not present, hide the switch panel button and toggle the view */
    if (this.vivaSidePanel && !sidebarContainer) {
      ButtonsSection.shared.hideSwitchSidePanel();
      this.toggleSwithPanelSection();
      return;
    }

    this.isLiveCC = isLiveCC;
    this.components.wrapper.classList.add('viva_styles_content', 'notranslate');
    if (!this.components.wrapper.contains(this.components.popup)) {
      this.components.wrapper.appendChild(this.components.popup);
    }
    if (this.vivaSidePanel && sidebarContainer && !sidebarContainer?.contains(this.components.wrapper)) {
      this.sidebarContainer = sidebarContainer;
      /* Add the transcription box to the sidebar container */
      sidebarContainer.appendChild(this.components.wrapper);
    } else if (!$?.body?.contains(this.components.wrapper)) {
      /* Add the transcription box to the page */
      $?.body?.appendChild(this.components.wrapper);
    }

    /* Ensure sidebar styles */
    if (this.vivaSidePanel) {
      this.components.popup.classList.add('transcription-box-sidebar');
      this.components.firstContainer.classList.add('viva-no-animation');
      this.components.header.classList.add('viva-no-animation');
      this.settings.component.classList.add('viva-no-animation');
    } else {
      this.components.popup.classList.remove('transcription-box-sidebar');
      this.components.firstContainer.classList.remove('viva-no-animation');
      this.components.header.classList.remove('viva-no-animation');
      this.settings.component.classList.remove('viva-no-animation');
    }

    this.settings.toggleSettingsSection();
    this.togglePopupVisiblility(true);
    this.activateChatTranscription();
    if (!this.vivaSidePanel) this.components.popup.addEventListener('animationend', this.onPopupResize);
    this.isActive = true;
    if (firstTime) {
      RecordingSection.shared.continueTranscripts();
      /** Close caption enabled by default */
      CloseCaptionSection.shared.toggleSubtitles(false, this.vivaSidePanel);
    }
    document.dispatchEvent(this.event);
    this.hideLearningMode(StorageCtrl.getItem(Store.TBOX_RESIZE_WIDTH));
  }

  /** Toggles visibility of the transcription box. */
  public togglePopupVisiblility(visible = true): void {
    if (this.components.popup) this.components.popup.hidden = !visible;
  }

  public async isPausedNoCCRecording(): Promise<boolean> {
    let pausedAndCC = true;
    if (this.components.popup && !CloseCaptionSection.shared.isActive()
      && !(StorageCtrl.getItem(Store.SHOWN_TOOLTIP))) {
      pausedAndCC = RecordingSection.shared.isPaused();
      await StorageCtrl.setItem(Store.SHOWN_TOOLTIP, !RecordingSection.shared.isPaused());
    }
    return pausedAndCC;
  }

  public pauseTranscripts(): void {
    if (this.components.popup) RecordingSection.shared.pauseTranscripts();
  }

  public getIsActive() {
    return this.isActive;
  }

  /** Removes the transcription box from the page. */
  public removeFromPage() {
    CloseCaptionSection.shared.toggleSubtitles(true, this.vivaSidePanel);
    if (this.vivaSidePanel && this.sidebarContainer?.contains(this.components.wrapper)) {
      this.sidebarContainer?.removeChild(this.components.wrapper);
    } else if ($?.body?.contains(this.components.wrapper)) {
      $?.body?.removeChild(this.components.wrapper);
    }
    this.isActive = false;
    RecordingSection.shared.pauseTranscripts();
  }

  /**
   * Add a notification on the transcription popup when the microphone audio
   * settings is changed
   */
  public languageSwitchMessage() {
    const audioNotification = document.createElement('div');
    audioNotification.classList.add('interim', 'interim--viva-msg');
    const targetMsg = `languages.${Settings.shared.speakerOutLang}`;
    const id = Date.now();
    const interim = new InterimHandler(id, 'meet');
    const translations: Record<string, string> = {
      EN: I18n.t('meetings.viva_messages.speaker_target', interim.paragraph),
    };
    const infoMessage: IInterim = {
      id,
      originalText: I18n.t('meetings.viva_messages.speaker_target', interim.paragraph),
      originalLang: 'EN',
      translations,
      index: id,
      isSystem: true,
      isFinal: true,
      createdAt: id,
      additionalText: I18n.t(targetMsg)
    };
    interim.addInterim(infoMessage);

    this.msgsContainer?.appendChild(interim.msg);
    this.autoScrollTo();
  }

  /**
   * Reset the transcription popup to an empty popup
   */
  public reset() {
    this.lastScrollTop = 0;
    this.preventScroll = false;
    this.scrolledToBottom = false;
    if (this.msgsContainer) this.msgsContainer.innerHTML = '';
    RecordingSection.shared.resetTimer();
    CloseCaptionSection.shared.toggleSubtitles(true, this.vivaSidePanel);
    this.toggleSettingsSection(true);
  }
}

export default TBox;
