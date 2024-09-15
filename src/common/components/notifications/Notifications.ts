import I18n from '../../utils/language';
import { Icons } from '../../constants';

export const NotificationClasses = {
  TOP_CENTER: 'top-center-popup'
};

export enum NOTIFICATION {
  RELOAD_NOTIFICATION = 'reload-notification',
  FAILED_LIVE_CC = 'failed-live-cc',
  UNKNOWN_ERROR = 'unknown-error',
}

export interface NotificationComponents {
  reloadPopup: HTMLDivElement;
}

const $ = document;

class Notifications {
  private static instance: Notifications;

  public components: NotificationComponents;

  private notificationType?: NOTIFICATION;

  private constructor() {
    this.components = {
      reloadPopup: document.createElement('div'),
    };
  }

  public static get shared(): Notifications {
    if (!Notifications.instance) {
      Notifications.instance = new Notifications();
    }
    return Notifications.instance;
  }

  public showNotification(notificationType: NOTIFICATION) {
    if (notificationType) this.notificationType = notificationType;
    this.reset();
  }

  /** Inits the notification showed to the user */
  private initNotification(bodyDescription: string, ctaText: string, action: any): void {
    this.components.reloadPopup = document.createElement('div');
    this.components.reloadPopup.classList.add('viva_styles_content', 'notranslate');
    this.components.reloadPopup.id = 'viva_popup_notification_container';

    const popup = document.createElement('div');
    popup.classList.add(NotificationClasses.TOP_CENTER, NOTIFICATION.RELOAD_NOTIFICATION);

    const closeBtn = $?.createElement('button');
    closeBtn.classList.add(`${NotificationClasses.TOP_CENTER}__close`);
    closeBtn.innerHTML = Icons.CLOSE;
    closeBtn.addEventListener('click', () => this.removeFromPage(this.components.reloadPopup));

    const logo = $?.createElement('div');
    logo.innerHTML =
      `<img src="${chrome.runtime.getURL('images/logo/circular-logo-gradient.svg')}" alt="Viva Translate">`;
    logo.classList.add(`${NotificationClasses.TOP_CENTER}__logo`);

    const body = $?.createElement('div');
    body.classList.add(`${NotificationClasses.TOP_CENTER}__body`);

    const description = $?.createElement('p');
    description.classList.add(`${NotificationClasses.TOP_CENTER}__desc`);
    description.innerText = I18n.t(bodyDescription, description);
    body.append(description);

    const reloadPageBtn = $?.createElement('button');
    reloadPageBtn.classList.add(`${NotificationClasses.TOP_CENTER}__cta`);
    reloadPageBtn.innerText = I18n.t(ctaText, reloadPageBtn);
    reloadPageBtn.addEventListener('click', action);

    popup.append(closeBtn, logo, body, reloadPageBtn);
    popup.hidden = false;
    this.components.reloadPopup.append(popup);
    $?.body?.append(this.components.reloadPopup);
  }

  /**
   * Removes the specified element from the page.
   * @param element Element to remove from page.
   */
  // eslint-disable-next-line class-methods-use-this
  public removeFromPage(element: HTMLElement): void {
    if (element && $?.body?.contains(element)) {
      element.remove();
      element.innerHTML = '';
      element.hidden = true;
    }
  }

  /** Removes all notification elements from the page. */
  public removeAllFromPage(): void {
    if ($?.body?.contains(this.components.reloadPopup)) {
      this.removeFromPage(this.components.reloadPopup);
    }

    /* Remove all elements when extension gets updated. */
    if (this.components.reloadPopup) this.components.reloadPopup.remove();
  }

  /** Creates and inserts all elements related to marketing campaigns. */
  public reset(): void {
    this.removeAllFromPage();

    const reloadTab = () => window.location.reload();

    switch (this.notificationType) {
      case NOTIFICATION.RELOAD_NOTIFICATION:
        this.initNotification(
          'notifications.reload_popup.description',
          'notifications.reload_popup.button',
          reloadTab
        );
        break;
      case NOTIFICATION.FAILED_LIVE_CC:
        this.initNotification(
          'notifications.failed_live_cc.description',
          'notifications.failed_live_cc.button',
          reloadTab
        );
        break;
      case NOTIFICATION.UNKNOWN_ERROR:
        this.initNotification(
          'notifications.unknown_error.description',
          'notifications.unknown_error.button',
          reloadTab
        );
        break;
      default:
        break;
    }
  }

  public get isVisible(): boolean {
    return $?.body?.contains(this.components.reloadPopup);
  }

  public get type(): NOTIFICATION | undefined {
    return this.notificationType;
  }
}

export default Notifications;
