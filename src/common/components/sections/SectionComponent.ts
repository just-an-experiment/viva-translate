import { toggleBtnActiveState } from '../../utils/helpers';

const $ = document;

abstract class SectionComponent {
  protected container: HTMLDivElement;

  protected activator?: HTMLButtonElement;

  protected activatorIcon?: string;

  public notifyCb?: (message: string) => void;

  public onClose?: (reset: boolean) => void;

  constructor(hasActivator = false, activatorIcon?: string) {
    this.activatorIcon = activatorIcon;
    this.container = $.createElement('div');
    if (hasActivator) this.activator = $.createElement('button');
  }

  public get component(): HTMLDivElement {
    return this.container;
  }

  public get activatorComponent(): HTMLButtonElement | undefined {
    return this.activator;
  }

  public hasActivator(): boolean {
    return !!this.activator;
  }

  public show() {
    this.container.hidden = false;
    if (this.activatorComponent) {
      toggleBtnActiveState(this.activatorComponent, this.activatorIcon || '', true);
    }
  }

  public hide(hiddeActivator = false) {
    this.container.hidden = true;
    if (this.activatorComponent) {
      toggleBtnActiveState(this.activatorComponent, this.activatorIcon || '', false, hiddeActivator);
    }
  }

  public toggle() {
    const newState = !this.container.hidden;
    if (!newState) this.show();
    else this.hide();
    return newState;
  }

  protected sendNotification(message: string) {
    if (this.notifyCb) this.notifyCb(message);
  }

  public destroy() {
    this.container.remove();
  }
}

export default SectionComponent;
