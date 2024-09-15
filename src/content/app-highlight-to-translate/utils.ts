import { SelectOption } from '../../common/types';
import { Icons, SupportedLocales } from '../../common/constants';
import I18n from '../../common/utils/language';
import Select from '../../common/components/Select';

/**
 * Check if HTML element is a textbox or editable section. Check up to until eight (8) layers.
 *
 * @param elem HTML Element to check.
 * @return boolean
 * */
export const checkLevelsEditableOrTextBox = (elem: HTMLElement) => {
  let isTextBoxOrEditableContent = false;
  let elemParent = elem as HTMLElement;

  for (let i = 0; i < 8; i += 1) {
    if (!elemParent) break;
    isTextBoxOrEditableContent =
      elemParent?.getAttribute('role') === 'textbox' ||
      elemParent?.classList?.contains('viva-icon-field-input') ||
      !!elemParent?.isContentEditable;

    if (isTextBoxOrEditableContent) break;

    elemParent = elemParent?.parentElement as HTMLElement;
  }

  return isTextBoxOrEditableContent;
};

/**
 * Gets the text of a selected node on the page.
 * @param selection Selected node on the page.
 * @returns Selected text.
 */
export const getSelectionText = (selection: Selection): string => {
  let text = '';
  if (selection) text = selection?.toString()?.trim();
  return text;
};

export const getSelectionPopup = (
  onTargetLangUpdate: (value: string) => void,
  target: string,
  filterValue: string = ''
): HTMLDivElement => {
  const wrapper = document.createElement('div');
  wrapper.classList.add('select-translate-popup');
  wrapper.innerHTML = `
    <div class="select-translate-popup__header">
      ${Icons.VIVA_ICON}
      <h1 data-viva-i18n="highlight_box.title" class="select-translate-popup__title select-translation">
        ${I18n.t('highlight_box.title')}
      </h1>
    </div>
    <div class="select-translate-popup__content">
      ${Icons.LOADING_SPINNER}
    </div>
  `;

  const options: SelectOption[] = I18n.supportedLangs
    .filter((locale: string) => locale !== filterValue)
    .map((locale: string) => ({
      text: SupportedLocales[locale as keyof typeof SupportedLocales],
      value: I18n.getTargetLang(locale),
    }));

  const defaultOption: SelectOption | undefined = options.find((option) => option.value === target);
  const langSelector = new Select(onTargetLangUpdate, options, defaultOption, ['viva-select--title']);
  const header = wrapper.querySelector('.select-translate-popup__header');
  header?.insertBefore(langSelector.element, header.lastChild);
  return wrapper;
};
