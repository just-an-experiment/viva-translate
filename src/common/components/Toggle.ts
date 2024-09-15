import I18n from '../utils/language';

const $ = document;

class Toggle {
  protected containerEl: HTMLDivElement;

  protected toggleEl: HTMLInputElement;

  protected defaultChecked: boolean;

  protected description?: string;

  constructor(defaultChecked: boolean, description?: string) {
    this.defaultChecked = defaultChecked;
    this.description = description;
    this.containerEl = $.createElement('div');
    this.toggleEl = $.createElement('input');
    this.initComponent();
  }

  /** Create the wrapper component and its children */
  private initComponent = (): void => {
    this.containerEl.classList.add('option-container');

    if (this.description) {
      const descriptionContainer = $.createElement('span');
      descriptionContainer.classList.add('description');
      descriptionContainer.innerHTML = I18n.t(this.description, descriptionContainer);
      this.containerEl.append(descriptionContainer);
    }

    const toggleContainer = $.createElement('div');
    toggleContainer.classList.add('toggle-container');
    toggleContainer.appendChild(this.getToggle());
    this.containerEl.append(toggleContainer);
  };

  /** Return the toggle wrapper (label) */
  private getToggle = (): HTMLLabelElement => {
    const toggleContainer = $.createElement('label');
    toggleContainer.classList.add('template-switch');

    this.toggleEl.classList.add('share-toggle');
    this.toggleEl.setAttribute('type', 'checkbox');
    this.toggleEl.checked = this.defaultChecked;

    const sliderEl = $.createElement('span');
    sliderEl.classList.add('template-slider', 'template-switch-round');

    toggleContainer.append(this.toggleEl, sliderEl);
    return toggleContainer;
  };

  public onChangeListener(fn: any): void {
    this.toggleEl.addEventListener('change', fn);
  }

  public get container(): HTMLDivElement {
    return this.containerEl;
  }

  public get toggle(): HTMLInputElement {
    return this.toggleEl;
  }
}

export default Toggle;
