import { SelectOption } from '../../types';
import { Store } from '../../constants';
import I18n from '../../utils/language';
import Select from '../Select';
import StorageCtrl from '../../Storage';

const $ = document;

type Subset<T, U extends T> = U;
type SizeCode = 'SM' | 'MD' | 'LG';
type InterfaceSize = Subset<SizeCode, 'SM' | 'MD' | 'LG'>;

const SUPPORTED: { [Key in InterfaceSize as string]: string } = {
  SM: '10',
  MD: '14',
  LG: '18',
};

const SELECT_OPTIONS: SelectOption[] = Object.keys(SUPPORTED).map((fontSize: string) => ({
  i18nKey: `styles.size.${fontSize}`,
  value: fontSize,
}));

class SubtitleFontPicker {
  private containerEl: HTMLDivElement;

  constructor() {
    this.containerEl = $.createElement('div');
    this.containerEl.classList.add('option-container', 'select-box');
    this.containerEl.id = 'subtitle-font-container';
    const containerLabel = $.createElement('span');
    containerLabel.innerHTML = `${I18n.t('styles.subtitle_font', containerLabel)}`;
    const sizeValue = StorageCtrl.getItem(Store.SUBTITLE_FONT_SIZE) || 'LG';
    const defaultValue: SelectOption | undefined = SELECT_OPTIONS.find((option) => option.value === sizeValue);
    const selectEl = new Select(this.onSelectChange, SELECT_OPTIONS, defaultValue, undefined).element;
    this.containerEl.append(containerLabel, selectEl);

    StorageCtrl.on(Store.SUBTITLE_FONT_SIZE, (value: any) => {
      selectEl.value = value;
    });
  }

  private async onSelectChange(value: string) { /* eslint-disable-line class-methods-use-this */
    await StorageCtrl.setItem(Store.SUBTITLE_FONT_SIZE, value);
  }

  public get container(): HTMLDivElement {
    return this.containerEl;
  }
}

export default SubtitleFontPicker;
