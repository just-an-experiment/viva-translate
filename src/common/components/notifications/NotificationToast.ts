import I18n from '../../utils/language';

export enum NotificationClasses {
  CONTAINER = 'notification-toast',
  EXPANDABLE = 'notification-toast--can-expand',
  ICON_DIV = 'notification-toast__icon',
  MESSAGE = 'notification-toast__message',
  PAY_BTN = 'notification-toast__button',
  SECONDARY_CONTENT = 'notification-toast__secondary-content'
}

export interface NotificationToastComponents {
  container: HTMLDivElement;
  payBtn?: HTMLButtonElement;
  message?: HTMLParagraphElement;
  secondaryContent?: HTMLElement;
}

const timeout = (ms: number) => new Promise((res) => { setTimeout(res, ms); });

class NotificationToast {
  public components: NotificationToastComponents;

  private visible = false;

  private container: HTMLElement;

  private delayedRemoveLock: boolean = false;

  private timestamp: number = Date.now();

  constructor(container: HTMLElement) {
    this.container = container;
    this.components = {
      container: document.createElement('div'),
    };
  }

  public get isVisible() {
    return this.visible;
  }

  public removeToast() {
    if (this.container.contains(this.components.container)) {
      this.container.removeChild(this.components.container);
    }
    if (this.components.container) this.components.container.remove();

    /* Update padding separation */
    const notifications = this.container.getElementsByClassName(NotificationClasses.CONTAINER);
    this.container.style.paddingTop = `${60 * notifications.length}px`;

    /* Update position for remain notifications */
    for (let i = 0; i < notifications.length; i += 1) {
      (notifications[i] as HTMLElement).style.top = `${40 + i * 60}px`;
    }
    this.visible = false;
  }

  public async showToast(
    message: string,
    messageData?: any,
    btnText?: string,
    btnCallback?: Function,
    secondaryContent?: HTMLElement
  ) {
    if (!this.visible) {
      this.components.container = document.createElement('div');
      this.components.container.classList.add(NotificationClasses.CONTAINER);

      this.components.message = document.createElement('p');
      this.components.message.classList.add(NotificationClasses.MESSAGE);
    }
    if (btnText && !this.components.payBtn) {
      this.components.payBtn = document.createElement('button');
      this.components.payBtn.classList.add(NotificationClasses.PAY_BTN);
    }

    this.components.message!.innerText = I18n.t(message, this.components.message, messageData);

    if (btnText) {
      this.components.payBtn!.innerText = I18n.t(btnText, this.components.payBtn);
      this.components.payBtn!.addEventListener('click', () => {
        if (btnCallback) btnCallback();
      });
    }

    if (!this.visible) {
      const numNotifications = this.container.getElementsByClassName(NotificationClasses.CONTAINER).length;
      this.components.container.append(this.components.message!);
      if (btnText && this.components.payBtn) this.components.container.append(this.components.payBtn);
      if (secondaryContent) {
        this.components.secondaryContent = secondaryContent;
        this.components.secondaryContent.classList.add(NotificationClasses.SECONDARY_CONTENT);
        this.components.secondaryContent.hidden = true;
        this.components.container.append(secondaryContent);
      }

      /* Update padding separation */
      this.container.style.paddingTop = `${60 * (numNotifications + 1)}px`;

      /* Set the last position for this notification */
      this.components.container.style.top = `${40 + (numNotifications) * 60}px`;
      this.container.insertBefore(this.components.container, this.container.firstChild);
    }
    this.visible = true;
  }

  public async timedToast(
    message: string,
    duration: number = 5000,
    messageData?: any,
    btnText?: string,
    btnCallback?: Function,
  ) {
    this.showToast(message, messageData, btnText, btnCallback);
    this.timestamp = Date.now();
    if (!this.delayedRemoveLock) {
      this.delayedRemoveToast(duration);
    }
  }

  public async delayedRemoveToast(duration: number = 5000) {
    this.delayedRemoveLock = true;
    let delay: number = this.timestamp + duration - Date.now();
    /* eslint-disable no-await-in-loop */
    while (delay > 0) {
      await timeout(delay);
      delay = this.timestamp + duration - Date.now();
    }
    /* eslint-enable no-await-in-loop */
    this.removeToast();
    this.delayedRemoveLock = false;
  }

  public setBtnText(text: string) {
    if (this.components.payBtn) this.components.payBtn.innerText = I18n.t(text, this.components.payBtn);
  }

  public setBtnDisabled(disabled = true) {
    if (this.components.payBtn) this.components.payBtn.disabled = disabled;
  }
}

export default NotificationToast;
