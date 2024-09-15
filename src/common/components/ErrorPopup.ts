import { Icons } from '../constants';
import I18n from '../utils/language';

export interface ErrorPopupElements {
  wrapper: HTMLDivElement;
  container: HTMLDivElement;
  closeBtn: HTMLButtonElement;
  cta?: HTMLButtonElement;
}

export enum ErrorClasses {
  CONTAINER = 'vi-error-popup',
  NO_CLOSE = 'vi-error-popup--no-close',
  RELATIVE = 'vi-error-popup--relative',
  BODY = 'vi-error-popup__body',
  CLOSE = 'vi-error-popup__close',
  CTA = 'vi-error-popup__cta'
}

class ErrorPopup {
  components: ErrorPopupElements = {
    wrapper: document.createElement('div'),
    container: document.createElement('div'),
    closeBtn: document.createElement('button')
  };

  cb?: any;

  customClasses: string[] = [];

  constructor(
    errorMessage: string,
    cb?: any,
    btnText?: string,
    customClasses?: string[],
  ) {
    if (cb) this.cb = cb;
    if (customClasses?.length) this.customClasses = customClasses;
    if (errorMessage) this.createElement(errorMessage, btnText);
  }

  /**
   * Creates the error popup element.
   * @param textKey Text to be rendered inside of the error message.
   * @param btnText Text to be rendered inside of the CTA rendered in the popup.
   */
  private createElement(errorMessage: string, btnText = ''): void {
    if (!errorMessage.length) return;
    this.components.wrapper.classList.add('viva_styles_content', 'notranslate');
    this.components.container.classList.add(ErrorClasses.CONTAINER, ...this.customClasses);

    /* Message text */
    const messageText = document.createElement('p');
    messageText.classList.add(ErrorClasses.BODY);
    messageText.textContent = `${I18n.t(errorMessage, messageText)}`;
    this.components.container.appendChild(messageText);

    /* CTA button displayed underneath text. */
    if (this.cb && btnText?.length) {
      this.components.cta = document.createElement('button');
      this.components.cta.classList.add(ErrorClasses.CTA);
      this.components.cta.textContent = `${I18n.t(btnText, this.components.cta)}`;
      this.components.container.appendChild(this.components.cta);
    }

    /* Close button */
    this.components.closeBtn.classList.add(ErrorClasses.CLOSE);
    this.components.closeBtn.innerHTML = `${Icons.CLOSE}`;
    this.components.container.appendChild(this.components.closeBtn);

    this.components.wrapper.appendChild(this.components.container);

    this.setListeners();
  }

  /** Set listeners for the close and cta buttons. */
  private setListeners(): void {
    if (this.cb) this.components?.cta?.addEventListener('click', this.cb);
    this.components.closeBtn.addEventListener('click', () => this.components.container.remove());
  }

  public get element(): HTMLDivElement {
    return this.components.wrapper;
  }
}

export default ErrorPopup;
