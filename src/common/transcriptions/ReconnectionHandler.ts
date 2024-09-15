import NotificationToast from '../components/notifications/NotificationToast';

class ReconnectionHandler {
  private static instance: ReconnectionHandler;

  public subscription?: string;

  public notification?: NotificationToast;

  private initialized = false;

  private constructor() {
    /* Do nothing */
  }

  public static get shared(): ReconnectionHandler {
    if (!ReconnectionHandler.instance) {
      ReconnectionHandler.instance = new ReconnectionHandler();
    }
    return ReconnectionHandler.instance;
  }

  public initialize() {
    if (this.initialized) return;
    this.initialized = true;
    this.setReconnectionToast();
  }

  /**
   * Renders a toast in the transcription box that displays a connection error message.
   */
  protected async setReconnectionToast(): Promise<any> {
    this.notification?.showToast('meetings.connection_error.message');
  }

  /** Resets subscription handler values and removes the payment toast from the UI. */
  public close(): void {
    this.notification?.removeToast();
    this.initialized = false;
  }
}

export default ReconnectionHandler;
