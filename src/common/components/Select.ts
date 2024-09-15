import StorageCtrl from '../Storage';
import { SelectOption } from '../types';
import { Store } from '../constants';
import I18n from '../utils/language';

class Select {
  onSelectChange: (value: string, oldValue?: string) => void;

  options: SelectOption[];

  defaultOption: SelectOption | undefined;

  selectEl: HTMLSelectElement;

  placeholderOption?: HTMLOptionElement;

  previousValue?: string;

  constructor(
    onSelectChange: (value: string, oldValue?: string) => void,
    options: SelectOption[],
    defaultOption: SelectOption | undefined,
    customClasses?: string[],
  ) {
    this.onSelectChange = onSelectChange;
    this.options = options;
    this.defaultOption = defaultOption;
    this.previousValue = this.defaultOption?.value;
    this.selectEl = document.createElement('select');

    this.createElement(customClasses);
  }

  /**
   * Creates a select element and fills it with the options provided in the constructor.
   * @param customClasses Classes to be added to the select element.
   */
  private createElement(customClasses: string[] = []): void {
    this.selectEl.classList.add('viva-select', ...customClasses);

    for (let i = 0; i < this.options.length; i += 1) {
      const option = document.createElement('option');
      option.value = this.options[i].value;
      if (this.options[i].i18nKey) {
        option.innerHTML = I18n.t(this.options[i].i18nKey!, option);
      } else {
        option.innerHTML = this.options[i].text ?? this.options[i].value;
      }
      this.selectEl.appendChild(option);
      if (this.defaultOption && this.options[i].value === this.defaultOption.value) {
        this.selectEl.value = this.defaultOption.value;
      }
    }

    if (this.defaultOption === undefined) {
      this.placeholderOption = document.createElement('option');
      this.placeholderOption.value = '';
      this.placeholderOption.disabled = true;
      this.placeholderOption.selected = true;
      this.placeholderOption.innerHTML = `${I18n.t('general.select', this.placeholderOption)}`;
      this.selectEl.appendChild(this.placeholderOption);
    }

    this.setListeners();

    /** Rendering timeout */
    setTimeout(() => {
      this.resizeSelect();
    }, 450);
  }

  private getTextWidth(text: string): number {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    context.font = getComputedStyle(this.selectEl).font;
    const width = context.measureText(text).width;
    canvas.remove();
    return width ?? 0;
  }

  /** Resize the select element to fit the selected item. */
  public resizeSelect() {
    const text = this.selectEl.options[this.selectEl.selectedIndex].text;
    const isUppercase = window.getComputedStyle(this.selectEl).textTransform === 'uppercase';
    const width = this.getTextWidth(text);
    this.selectEl.style.width = width > 0 ? `${width + (isUppercase ? 35 : 30)}px` : 'fit-content';
  }

  /** Set listener to emit change event value. */
  private setListeners(): void {
    if (this.selectEl) {
      this.selectEl.addEventListener('change', () => {
        const isValidOption = !!this.options.find((opt: SelectOption) => opt.value === this.element.value);
        if (isValidOption && this.placeholderOption) this.placeholderOption.remove();
        this.onSelectChange(this.element.value);
        this.previousValue = this.element.value;
        setTimeout(() => {
          this.resizeSelect();
        }, 1);
      });
    }

    document.addEventListener('ontboxvisible', () => setTimeout(() => {
      this.resizeSelect();
    }, 300), false);

    StorageCtrl.on(Store.LANGUAGE, () => {
      this.resizeSelect();
    });
  }

  public get element(): HTMLSelectElement {
    return this.selectEl;
  }
}

export default Select;
