/* eslint-disable class-methods-use-this */
import config from '@config';
import {
  DragConfig,
  Translation
} from '../../common/types';
import { translateText } from '../../common/api';
import {
  Icons, Languages, Store, TargetLanguage
} from '../../common/constants';
import { copyToClipboard, debounce } from '../../common/utils/helpers';
import { errorLog } from '../../common/utils/logger';
import I18n from '../../common/utils/language';
import { checkLevelsEditableOrTextBox, getSelectionText, getSelectionPopup } from './utils';
import StorageCtrl from '../../common/Storage';
import { HighlightTranslateComponents } from './types';
import Classes from './constants';

export default class HighlightTranslation {
  components: HighlightTranslateComponents = {};

  dragConfig: DragConfig = {
    canDrag: false,
    cursorOffsetX: null,
    cursorOffsetY: null,
    isDragging: false,
  };

  popupWidth = 350;

  popupHeight = 140;

  currentSelection?: Selection | null;

  targetLang: string = Languages.ES;

  selectedText = '';

  intersectionObserver = new IntersectionObserver(() => { });

  constructor() {
    this.initSelectionListeners();
    this.initStoreListener();
  }

  /** Listens to changed store values to disable/activate the toolbox features. */
  protected initStoreListener(): void {
    StorageCtrl.on(Store.HIGHLIGHT_ACTIVE, (value: boolean) => {
      if (!value) {
        this.removePopup();
      }
    });
  }

  /** Inits the necessary event listeners so we can pick up when a user selects a text. */
  protected initSelectionListeners = (): void => {
    document.addEventListener(
      'selectionchange',
      debounce(() => {
        this.currentSelection = window?.getSelection();
        const canShow = this.canShowHighlightBox();
        if (this.currentSelection?.isCollapsed && !this.isClickingInsideBox()) this.removePopup();
        if (this.currentSelection && canShow) {
          this.setPopupAndTranslate();
        }
      }, 500)
    );

    document.addEventListener('click', this.detectOutsideElClick);
    window.addEventListener('resize', this.removePopup);
  };

  /** Removes all highlight boxes (popups) from the page. */
  protected removePopup = (): void => {
    this.resetCursor();
    this.components.popup?.remove();
    this.dragConfig.isDragging = false;
    this.components.popup?.classList.remove(Classes.IS_DRAGGING);
    this.components.copyButton = undefined;
    this.components.wrapper?.remove();
  };

  /**
   * Updates the position of the highlight box.
   * @param event Mouse event that is used to update the highlight box's position.
   */
  protected updatePosition = (event: MouseEvent): void => {
    if (event.clientX <= 0 || event.clientY <= 0 || !this.components.popup) return;
    const headerHeight = 40;
    this.components.popup.style.position = 'fixed';
    const xPosition = Math.max(Number(event.clientX) - Number(this.dragConfig.cursorOffsetX), 0);
    const yPosition = Math.max(Number(event.clientY) - Number(this.dragConfig.cursorOffsetY), 0);
    if (window.innerWidth > xPosition + this.popupWidth) this.components.popup.style.left = `${xPosition}px`;
    if (window.innerHeight > yPosition + headerHeight) this.components.popup.style.top = `${yPosition}px`;
  };

  /**
   * Mouse move event action. Updates the highlight box position.
   * @param event Mouse event used to update the position of the highlight box.
   */
  protected onMouseMove = (event: MouseEvent): void => {
    if (this.dragConfig.isDragging && this.components.popup) {
      document.body.style.cursor = 'move';
      this.components.popup.style.cursor = 'move';
      this.updatePosition(event);
    }
  };

  /**
   * Mouse down event action. Updates the cursor offset and highlight box position.
   * @param event Mouse event to activate the drag and drop action.
   */
  protected onMouseDown = (event: MouseEvent): void => {
    if (
      (event?.target as HTMLElement)?.nodeName === 'BUTTON' ||
      !this.components.popup ||
      event?.button === 2 ||
      (event?.target as HTMLElement)?.nodeName === 'SELECT'
    ) {
      return;
    }
    if (event.preventDefault) event.preventDefault();
    this.dragConfig.isDragging = true;
    this.components.popup.classList.add(Classes.IS_DRAGGING);
    this.dragConfig.cursorOffsetX = event.offsetX;
    this.dragConfig.cursorOffsetY = event.offsetY;
  };

  protected resetCursor = (): void => {
    document.body.style.cursor = 'auto';
    if (this.components.popup) this.components.popup.style.cursor = 'auto';
  };

  /** Mouse up event action. Deactivates dragging and inserts pin button. */
  protected onMouseUp = (event: MouseEvent): void => {
    if (
      !this.components.popup ||
      (event?.target as HTMLElement)?.nodeName === 'SELECT' ||
      (event?.target as HTMLElement)?.nodeName === 'BUTTON'
    ) {
      return;
    }
    this.dragConfig.isDragging = false;
    this.components.popup.classList.remove(Classes.IS_DRAGGING);
    if (this.components.popup) this.resetCursor();
  };

  /**
   * Constructs the drag and drop button and adds the appropriate listeners.
   * @param popupHeader The popup header which should be selectable for drag and drop.
   */
  protected setDragAndDrop = (popupHeader: HTMLDivElement): void => {
    document.removeEventListener('mousemove', this.onMouseMove);

    if (popupHeader) {
      popupHeader.removeEventListener('mouseup', this.onMouseUp);
      popupHeader.removeEventListener('mousedown', this.onMouseDown);
      document.addEventListener('mousemove', this.onMouseMove);
      popupHeader.addEventListener('mouseup', this.onMouseUp);
      popupHeader.addEventListener('mousedown', this.onMouseDown);
    }
  };

  /**
   * Gets the correct popup height based on the content height.
   * @param popup Popup to get the height from
   * @returns New popup height taking the content into account.
   */
  protected getPopupHeight = (popup: HTMLElement): number => {
    const content = popup.querySelector(`.${Classes.SELECT_POPUP_CONTENT}`) as HTMLElement;
    return content.scrollHeight + 60;
  };

  /**
   * Updates the height of the highlight box according to its content.
   * @param btnRect The bounding client rect of the Viva button.
   */
  protected updatePopupHeight = (): void => {
    if (!this.currentSelection || !this.components.popup || this.currentSelection.rangeCount <= 0) return;
    const rangeRect = this.currentSelection.getRangeAt(0)?.getBoundingClientRect();
    let newHeight = this.getPopupHeight(this.components.popup);
    const outOfBounds = newHeight > window.innerHeight;
    newHeight = outOfBounds ? window.innerHeight : newHeight;
    const contentBox = this.components.popup.querySelector(`.${Classes.SELECT_POPUP_CONTENT}`) as HTMLElement;
    if (outOfBounds && contentBox) {
      contentBox.style.overflowY = 'auto';
      contentBox.style.height = '100%';
    }
    this.components.popup.style.height = `${newHeight}px`;
    const topOffset = window.scrollY + Number(rangeRect?.top) - newHeight;
    this.components.popup.style.top = `${Math.max(topOffset, 0)}px`;
    this.components.popup.style.position = 'absolute';

    if (this.components.popup) {
      this.components.popup.style.visibility = 'visible';
    }
  };

  protected popupInView = (entries: IntersectionObserverEntry[]): void => {
    const entry = entries[0];
    const outOfBoundsTop = entry.boundingClientRect.top < 0;
    if (!entry.isIntersecting && this.components.popup && outOfBoundsTop) {
      this.components.popup.classList.add('no-top-transition');
      this.components.popup.style.top = '0';
      this.components.popup.style.position = 'fixed';
      setTimeout(() => {
        if (!this.components.popup) return;
        this.components.popup.classList.remove('no-top-transition');
      }, 500);
    }
  };

  protected updateTargetLang = async (newValue: string) => {
    const newLang = newValue;
    if (!!this.currentSelection && this.components.popup) {
      await StorageCtrl.setItem(Store.HIGHLIGHT_TARGET_LANG, newLang);
      this.targetLang = newLang;
      this.translateInput();
    }
  };

  protected setPopupPosition = () => {
    if (!this.currentSelection || !this.components.popup || this.currentSelection.rangeCount <= 0) return;
    const rangeRect = this.currentSelection.getRangeAt(0)?.getBoundingClientRect();
    const leftOffset = rangeRect.left + rangeRect.width / 2 - this.popupWidth / 2;
    const topOffset = window.scrollY + Number(rangeRect?.top) - this.popupHeight + 10;
    const leftMax = Math.max(leftOffset, 0);

    const highlightX = StorageCtrl.getItem(Store.HIGHLIGHT_X);
    let leftPos = highlightX !== null && highlightX >= 0 ? Math.max(highlightX, 0) : leftMax;

    /* Check if overflowing horizontally */
    if (leftPos > window.innerWidth - this.popupWidth) leftPos = window.innerWidth - this.popupWidth;

    this.components.popup.style.left = `${leftPos}px`;

    const highlightY = StorageCtrl.getItem(Store.HIGHLIGHT_Y);
    this.components.popup.style.top = highlightY !== null && highlightY >= 0
      ? `${Math.max(highlightY, 0)}px`
      : `${Math.max(topOffset, 0)}px`;
  };

  /**
   * Constructs the highlight box. Sets the correct sizings and positions.
   */
  protected setPopup = () => {
    if (!this.currentSelection) return;
    this.components.popup = document.createElement('div');
    this.components.popup.classList.add(Classes.TRANSLATE_POPUP, Classes.HIGHLIGHT_BOX);
    this.components.popup.style.height = 'fit-content';
    this.components.popup.style.width = `${this.popupWidth}px`;
    this.setPopupPosition();

    this.targetLang = StorageCtrl.getItem(Store.HIGHLIGHT_TARGET_LANG);
    if (!this.targetLang) {
      this.targetLang = TargetLanguage.EN;
      StorageCtrl.setItem(Store.HIGHLIGHT_TARGET_LANG, this.targetLang);
    }
    this.components.popup.appendChild(
      getSelectionPopup(this.updateTargetLang, this.targetLang)
    );

    this.components.popupHeader = this.components.popup.querySelector(
      `.${Classes.SELECT_POPUP_HEADER}`
    ) as HTMLDivElement;
    this.setDragAndDrop(this.components.popupHeader);

    this.components.wrapper = document.createElement('div');
    this.components.wrapper.classList.add('viva_styles_content', 'notranslate');
    this.components.wrapper.appendChild(this.components.popup);

    document?.body?.appendChild(this.components.wrapper);
    this.components.popup.style.visibility = 'hidden';

    this.intersectionObserver?.disconnect();
    this.intersectionObserver = new IntersectionObserver(this.popupInView, {
      threshold: 0.95,
    });
    this.intersectionObserver.observe(this.components.popup);

    /* Update the height of the popup after text is rendered. */
    this.updatePopupHeight();
  };

  /**
   * Copies translated text to the clipboard if string is longer than 0.
   * Triggers an animation on succesful copy action.
   */
  protected copyText = (textToCopy: string) => {
    copyToClipboard(textToCopy)
      .then(() => {
        if (!this.components.copyButton) return;
        this.components.copyButton.innerHTML = Icons.CHECKMARK;
        this.components.copyButton.classList.add(Classes.COPY_BTN_SUCCESS);
        setTimeout(() => {
          if (!this.components.copyButton) return;
          this.components.copyButton.innerHTML = Icons.COPY;
          this.components.copyButton?.classList.remove(Classes.COPY_BTN_SUCCESS);
        }, 2000);
      })
      .catch((error) => errorLog(error, { description: 'Error copying to clipboard', textToCopy }));
  };

  /**
   * Sets the translation inside of the highlight popup.
   * @param translation Translated phrase.
   */
  protected setPopupTranslation = (translation: string): void => {
    if (this.components.popup && translation.length > 0) {
      const contentEl = this.components.popup.querySelector(`.${Classes.SELECT_POPUP_CONTENT}`);
      if (contentEl) {
        contentEl.innerHTML = '';
        contentEl.querySelector(`.${Classes.SELECTION_TRANSLATION}`)?.remove();
        const definitionEl = document.createElement('span');
        definitionEl.classList.add(Classes.SELECTION_TRANSLATION);
        definitionEl.innerText = translation;
        contentEl?.querySelector(`.${Classes.LOADING_SPINNER}`)?.remove();
        contentEl?.prepend(definitionEl);

        if (!this.components.copyButton) {
          this.components.copyButton = document.createElement('button');
          this.components.copyButton.classList.add(Classes.COPY_BTN);
          this.components.copyButton.innerHTML = Icons.COPY;
        }
        this.components.copyButton.removeEventListener('click', () => this.copyText(translation));
        this.components.copyButton.addEventListener('click', () => this.copyText(translation));

        this.components.popupHeader?.append(this.components.copyButton);

        /* Update popup height again to adjust to the translated text height. */
        setTimeout(() => this.updatePopupHeight(), 10);
      }
    }
  };

  /**
   * Displays an error message inside of the highlight box.
   * @param message Error to be displayed.
   */
  protected setHighlightError = (i18nKey: string): void => {
    const contentPopup = this.components.popup?.querySelector(`.${Classes.SELECT_POPUP_CONTENT}`);
    if (contentPopup) contentPopup.innerHTML = `${I18n.t(i18nKey, contentPopup)}`;
  };

  /**
   * Checks if highlight translation should happen based on text length etc.
   * @param text Text to be translated.
   */
  protected canTranslate = (text: string): boolean => {
    const length = text?.length;
    return !!text && length > 1 && length < config.MAX_TEXT_LENGTH / 2;
  };

  protected translateInput = () => {
    if (!this.currentSelection) return;
    const text = getSelectionText(this.currentSelection);
    if (!this.canTranslate(text)) return;
    this.selectedText = text;
    this.targetLang = StorageCtrl.getItem(Store.HIGHLIGHT_TARGET_LANG);
    if (!this.targetLang) {
      this.targetLang = TargetLanguage.EN;
      StorageCtrl.setItem(Store.HIGHLIGHT_TARGET_LANG, this.targetLang);
    }
    translateText(text, this.targetLang)
      .then(async (translation: Translation) => {
        const translatedText = translation.text ?? undefined;
        if (translatedText) this.setPopupTranslation(translatedText);
      })
      .catch((error) => {
        errorLog(error, {
          description: 'There was an error translating',
          targetLang: this.targetLang,
          text,
          url: window.location.href
        });
        const i18nKey = 'errors.selection_error';
        this.setHighlightError(i18nKey);
      });
  };

  /**
   * Click action for the Viva button displayed above the selected text. Gets the
   * translation of the selected text and inits the highlight box.
   * @param button The clicked element.
   */
  protected setPopupAndTranslate = (): void => {
    if (!this.currentSelection) return;
    this.removePopup();
    const text = getSelectionText(this.currentSelection);
    if (!this.canTranslate(text)) return;
    this.selectedText = text;
    this.setPopup();
    this.translateInput();
  };

  /**
   * Detects if the user clicks outside of the highlight box and closes it if the user does.
   * @param event Mouse click event to obtain click target.
   */
  protected detectOutsideElClick = (event: MouseEvent): void => {
    const target = event.target as Node;
    const containsTarget = this.components.popup?.contains(target);
    const isSelecting = event?.target === this.currentSelection?.focusNode?.parentElement;
    if (event.target && this.components.popup && !containsTarget && !isSelecting) {
      this.removePopup();
    }
  };

  /** Returns true if user is selecting inside of the highlight box. */
  protected isClickingInsideBox = (): boolean => {
    const parentEl = this.currentSelection?.anchorNode?.parentElement as HTMLElement;
    const isSelectingInsideBox = parentEl?.classList.contains(Classes.SELECTION_TRANSLATION);
    return isSelectingInsideBox;
  };

  /**
   * Checks if there is a correct selection to translate.
   * @param selection The current selected node.
   */
  protected canShowHighlightBox = (): boolean => {
    const parentEl = this.currentSelection?.anchorNode?.parentElement as HTMLElement;
    const isTextBoxOrEditableContent = checkLevelsEditableOrTextBox(parentEl);
    let text = 'viva';
    if (this.currentSelection) text = getSelectionText(this.currentSelection);

    const highlightActive = StorageCtrl.getItem(Store.HIGHLIGHT_ACTIVE);

    return (
      !!this.currentSelection &&
      !!text.match('[a-zA-Z]') &&
      !this.isClickingInsideBox() &&
      !isTextBoxOrEditableContent &&
      !this.currentSelection?.isCollapsed &&
      highlightActive
    );
  };
}
