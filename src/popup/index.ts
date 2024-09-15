/* eslint-disable eqeqeq */
import config from '@config';
import { SelectOption } from '../common/types';
import {
  Languages,
  Icons,
  VERSION,
  Store,
  SupportedLocales,
  WorkerEvents,
  MessageTarget
} from '../common/constants';
import { copyToClipboard, debounce, sendChromeMessageAsync } from '../common/utils/helpers';
import { isGoogleMeetingUrl } from '../content/app-google-meet/utils';
import {
  translateText, injectLiveCC, isLiveCCEnabled, startLiveCC, stopLiveCC
} from '../common/api';
import { errorLog } from '../common/utils/logger';
import I18n from '../common/utils/language';
import Select from '../common/components/Select';
import { Identifiers, Classes } from './constants';
import { PopupElementTypes } from './types';
import StorageCtrl from '../common/Storage';

/** Definition of option page elements. */
let popupElements: PopupElementTypes;

/** Current default language used for translating. */
let currentLang: string = Languages.EN;
let targetLang: string = Languages.ES;
let lastTranslationValue = '';

/** Gets version from package.json and patches it into the desired span element. */
const patchVersion = (): void => {
  popupElements.version.innerHTML = `${VERSION}`;
};

/** Gets all Viva extension popup elements from the DOM. */
const getElements = () => {
  popupElements = {
    translationError: document.getElementById(Identifiers.TRANSLATION_ERROR)!,
    translationErrorText: document.getElementById(Identifiers.TRANSLATION_ERROR_TEXT)!,
    growWrapper: document.getElementById(Identifiers.GROW_WRAP)!,
    inputField: document.getElementById(Identifiers.INPUT_FIELD)! as HTMLInputElement,
    clearInput: document.getElementById(Identifiers.INPUT_FIELD_CLEAR)! as HTMLButtonElement,
    outputBox: document.getElementById(Identifiers.OUTPUT_BOX)!,
    outputField: document.getElementById(Identifiers.OUTPUT_FIELD)!,
    charCount: document.getElementById(Identifiers.CHAR_COUNT)!,
    titleToTranslate: document.getElementById(Identifiers.TRANSLATE_TITLE)!,
    titleTranslated: document.getElementById(Identifiers.TRANSLATED_TITLE)!,
    switchLangButton: document.getElementById(Identifiers.SWITCH_LANG_BTN)!,
    copyButton: document.getElementById(Identifiers.COPY_BTN)!,
    liveCCButton: document.getElementById(Identifiers.ANY_WEB_BUTTON) as HTMLButtonElement,
    translationPopup: document.getElementById(Identifiers.TRANSLATION_POPUP)!,
    loadingIcon: document.getElementById(Identifiers.LOADING_ICON)!,
    highlightToggle: document.getElementById(Identifiers.HIGHLIGHT_TOGGLE) as HTMLInputElement,
    highlightToolboxTitle: document.getElementById(Identifiers.HIGHLIGHT_TOOLBOX_TITLE)!,
    videoCallToggle: document.getElementById(Identifiers.VIDEO_CALL_TOGGLE) as HTMLInputElement,
    videoCallTitle: document.getElementById(Identifiers.VIDEO_CALL_TOGGLE_TITLE)!,
    settingsWrapper: document.querySelector(`.${Identifiers.SETTINGS_WRAPPER}`)!,
    translationButtonBar: document.querySelector(`.${Identifiers.TRANSLATION_BTN_BAR}`) as HTMLDivElement,
    version: document.getElementById(Identifiers.VERSION) as HTMLSpanElement,
    translateSection: document.getElementById(Identifiers.TRANSLATE_SECTION) as HTMLDivElement,
  };

  patchVersion();
};

let liveCCStatus = false;

/**
 * Toggles visibility for the reset button.
 */
const toggleResetBtn = (visible: boolean) => {
  popupElements.clearInput.style.visibility = visible ? 'visible' : 'hidden';
};

/**
 * Toggles visibility for the copy button.
 */
const toggleCopyBtn = (visible: boolean) => {
  popupElements.copyButton.style.display = visible ? 'flex' : 'none';
};

/**
 * Toggles visibility for the copy button.
 */
const toggleButtonBar = (visible: boolean) => {
  popupElements.translationButtonBar.style.display = visible ? 'flex' : 'none';
  toggleCopyBtn(visible);
};

/**
 * Handler for update to target language.
 * @param event Change event for select element.
 */
const onTargetLangUpdate = async (newValue: string) => {
  if (newValue) {
    await StorageCtrl.setItem(Store.POPUP_TARGET_LANG, newValue);
    targetLang = newValue;
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    translateInput();
  }
};

/** Sets input title to loading state */
const loadingTitles = (): void => {
  popupElements.titleToTranslate.innerText = I18n.t('general.detecting', popupElements.titleToTranslate);
};

/** Sets input title to loading state */
const notFoundTitle = (): void => {
  popupElements.titleToTranslate.innerText = I18n.t('errors.lang_not_found', popupElements.titleToTranslate);
};

const setInputTitles = (activeLang: string, target: string) => {
  if (I18n.isSupportedLang(activeLang)) {
    popupElements.titleToTranslate.innerText = I18n.t(`languages.${activeLang}`, popupElements.titleToTranslate);

    const options: SelectOption[] = Object.keys(Languages)
      .map((code: string) => ({
        text: SupportedLocales[code as keyof typeof SupportedLocales],
        value: I18n.getTargetLang(code),
      }));
    const defaultOption: SelectOption | undefined = options.find((option) => option.value === target);

    const dropdown = new Select(onTargetLangUpdate, options, defaultOption, ['viva-select--title']);
    popupElements.titleTranslated.replaceChildren(dropdown.element);
  }
};

/** Resets the input and output translation fields. */
const resetFields = async () => {
  toggleButtonBar(false);
  toggleResetBtn(false);
  popupElements.translationPopup.classList.add(Identifiers.TRANSLATION_POPUP_NO_RESULT);
  popupElements.inputField.value = '';
  popupElements.outputField.innerText = '';
  loadingTitles();
  const items: any = {};
  items[Store.TEXT_TO_TRANSLATE] = '';
  items[Store.TRANSLATED_TEXT] = '';
  await StorageCtrl.setItems(items);
  popupElements.charCount.innerText = `0/${config.MAX_TEXT_LENGTH}`;
  popupElements.growWrapper.dataset.replicatedValue = popupElements.inputField.value;
};

const toggleOutputContainer = (active: boolean): void => {
  const outputContainer = document.querySelector(`.${Classes.OUTPUT_CONTAINER}`) as HTMLElement;
  if (outputContainer) outputContainer.hidden = !active;
};

/**
 * Sets an error message when translation goes wrong.
 * @param errorCode Error code provided by API.
 */
const setErrorMessage = (errorCode: string = '') => {
  const i18ncode = errorCode === 'invalid-language' ? 'errors.invalid_lang' : 'errors.try_again';
  popupElements.translationErrorText.innerText = I18n.t(i18ncode, popupElements.translationErrorText);
  popupElements.translationError.classList.remove('error-disable');
  popupElements.inputField.blur();
  if (errorCode === 'invalid-language') {
    const switchBtn = document.querySelector(`.${Classes.SWITCH_CONTAINER}`) as HTMLElement;
    if (switchBtn) switchBtn.hidden = true;
    toggleOutputContainer(false);
    notFoundTitle();
  }
};

/**
 * Sets store values + target language and translates the current input.
 * @param languageDetected Input language.
 */
const translateInput = async () => {
  const input = popupElements.inputField.value;
  popupElements.translationError.classList.add('error-disable');
  if (input.length <= 0) return;

  popupElements.loadingIcon.innerHTML = Icons.LOADING_SPINNER;

  try {
    const translation = await translateText(input, targetLang);
    currentLang = translation.sourceLang;

    lastTranslationValue = input;
    popupElements.loadingIcon.innerHTML = '';

    const newCount = Number(StorageCtrl.getItem(Store.CHAR_COUNT)) + input.length;
    const items: any = {};
    items[Store.TEXT_TO_TRANSLATE] = input;
    items[Store.CHAR_COUNT] = newCount;
    items[Store.TRANSLATED_TEXT] = translation.text;
    items[Store.CURRENT_LANG] = currentLang;
    await StorageCtrl.setItems(items);

    toggleOutputContainer(true);
    popupElements.outputField.innerText = translation.text;
    toggleButtonBar(true);

    setInputTitles(currentLang, targetLang);
  } catch (error) {
    setErrorMessage();
  }
};

const setLiveCCButtonText = async () => {
  popupElements.liveCCButton.innerText = I18n.t(
    liveCCStatus ? 'general.stop_live_cc' : 'general.live_cc',
    popupElements.liveCCButton
  );

  /* Hide the any web button if the current tab is a chrome tab or a google meeting tab. */
  const tabs = await chrome.tabs.query({ currentWindow: true, active: true });
  if (tabs.length == 0) return;
  const activeTab = tabs[0];
  if (!activeTab.url ||
    (!activeTab.url.startsWith('https://') && !activeTab.url.startsWith('http://')) ||
    isGoogleMeetingUrl(activeTab.url) || activeTab.url.startsWith('https://chromewebstore.google.com')) {
    popupElements.liveCCButton.style.display = 'none';
  }
};

/**
 * Sets the interface text for the title of the input and output fields.
 */
const setInterfaceText = async () => {
  await setLiveCCButtonText();

  popupElements.translationErrorText.innerText = I18n.t(
    'options_popup.translation_error',
    popupElements.translationErrorText
  );
  popupElements.highlightToolboxTitle.innerHTML = I18n.t(
    'options_popup.toggle_highlight',
    popupElements.highlightToolboxTitle
  );
  popupElements.videoCallTitle.innerHTML = I18n.t('options_popup.toggle_vid_translation', popupElements.videoCallTitle);
  popupElements.inputField.placeholder = I18n.t('options_popup.input_placeholder', popupElements.inputField);
  setInputTitles(currentLang, targetLang);

  const popupHeader = document.querySelector('.header-actions') as HTMLElement;
  const langSelector = await I18n.getLanguageSwitcher(['language-picker']);
  popupHeader?.insertBefore(langSelector, popupHeader.firstChild);
};

/**
 * Sets the currently set language obtained from local storage. */
const setDefaultLanguage = () => {
  const langFromStore = StorageCtrl.getItem(Store.LANGUAGE) ?? Languages.ES;
  if (!I18n.isSupportedLang(langFromStore)) {
    errorLog(new Error('Invalid lang'), { description: 'Language code does not exist', langFromStore });
    return;
  }
  currentLang = langFromStore;
  targetLang = StorageCtrl.getItem(Store.POPUP_TARGET_LANG) ?? I18n.getTargetLang(currentLang);
  setInterfaceText();
};

/**
 * Copies translated text to the clipboard if string is longer than 0.
 * Triggers an animation on succesful copy action.
 */
const copyText = () => {
  const textToCopy = popupElements.outputField.innerText;
  copyToClipboard(textToCopy)
    .then(() => {
      popupElements.copyButton.classList.add(Identifiers.COPY_BTN_SUCCESS);
      setTimeout(() => {
        popupElements.copyButton.classList.remove(Identifiers.COPY_BTN_SUCCESS);
      }, 2000);
    })
    .catch((error) => {
      errorLog(error, { description: 'Error copying to clipboard', textToCopy });
    });
};

/**
 * Calls the translate function with the input field value and sets the result
 * in the output textbox.
 */
const translate = () => {
  popupElements.translationError.classList.add('error-disable');
  loadingTitles();
  const input = popupElements.inputField.value;
  if (lastTranslationValue === input || input.length <= 0) {
    setInputTitles(currentLang, targetLang);
    return;
  }
  popupElements.loadingIcon.innerHTML = Icons.LOADING_SPINNER;
  translateInput();
};

/** Toggles between input and output language. */
const toggleLanguage = async () => {
  const newTargetLang = I18n.getTargetLang(currentLang);
  currentLang = I18n.getCodeFromTargetLang(targetLang);
  const items: Record<string, any> = {};
  targetLang = newTargetLang;
  items[Store.CURRENT_LANG] = currentLang;
  items[Store.POPUP_TARGET_LANG] = targetLang;
  await StorageCtrl.setItems(items);
  popupElements.inputField.value = popupElements.outputField.innerText;
  translateInput();
};

/** Toggles enable/disable Video call translation feature. */
const toggleVideoCallTranslation = async () => {
  const toggleValue = popupElements.videoCallToggle.checked || false;
  await StorageCtrl.setItem(Store.VIDEO_CALL_ACTIVE, toggleValue);
  /* After switching the value close the popup */
  window.close();
};

/** Toggles enable/disable Viva's highlight feature. */
const toggleHighlight = async () => {
  const newValue = popupElements.highlightToggle.checked;
  await StorageCtrl.setItem(Store.HIGHLIGHT_ACTIVE, newValue || false);
  /* After switching the value close the popup */
  window.close();
};

/** Sets the current character count of the input field. */
const updateCharCount = () => {
  const charCount = popupElements.inputField.value.length;
  popupElements.charCount.innerText = `${charCount}/${config.MAX_TEXT_LENGTH}`;
  if (charCount === 0) resetFields();
  if (charCount > 1) popupElements.translationPopup.classList.remove(Identifiers.TRANSLATION_POPUP_NO_RESULT);
};

/**
 * Handles the input event on the textarea by updating character count and
 * height of the textbox.
 */
const onTextInput = () => {
  updateCharCount();
  toggleResetBtn(true);
  popupElements.growWrapper.dataset.replicatedValue = popupElements.inputField.value;
};

/**
 * Sets the currently set translations obtained from local storage in order to
 * persist state when extension popup is closed and reopened.
 */
const setStoreTranslation = () => {
  const storedText = StorageCtrl.getItem(Store.TEXT_TO_TRANSLATE);
  const storedTranslation = StorageCtrl.getItem(Store.TRANSLATED_TEXT);
  if (storedText) {
    lastTranslationValue = storedText;
    popupElements.inputField.value = storedText;
    popupElements.translationPopup.classList.remove(Identifiers.TRANSLATION_POPUP_NO_RESULT);
    onTextInput();
  }
  if (storedTranslation) {
    toggleButtonBar(true);
    popupElements.outputField.innerText = storedTranslation;
  }
};

/** Inits the anywhere on web feature, opening the share tab popup from Chrome. */
const initAnywhereOnWeb = async () => {
  const tabs = await chrome.tabs.query({ currentWindow: true, active: true });
  if (tabs.length == 0) return;

  const activeTab = tabs[0];
  await injectLiveCC(activeTab.id ?? -1);

  if (liveCCStatus) {
    await stopLiveCC(activeTab.id ?? -1);
  } else {
    await startLiveCC(activeTab.id ?? -1);
  }

  setTimeout(() => {
    chrome.tabs.sendMessage(
      activeTab.id as any,
      { message: liveCCStatus ? WorkerEvents.STOP_LIVE_CC : WorkerEvents.START_LIVE_CC, tabId: activeTab.id },
      () => {
        if (window) window.close();
        if (chrome.runtime.lastError) {
          /* Ignore error, script is not injected in the web page */
        }
      }
    );
  }, 250);
};

/** Sets all Viva extension popup listeners. */
const setListeners = () => {
  popupElements.inputField.addEventListener('input', onTextInput);
  popupElements.inputField.addEventListener('input', debounce(translate, 400));
  popupElements.clearInput.addEventListener('click', resetFields);
  popupElements.switchLangButton.addEventListener('click', toggleLanguage);
  popupElements.copyButton.addEventListener('click', copyText);
  popupElements.liveCCButton.addEventListener('click', initAnywhereOnWeb);
  popupElements.highlightToggle.addEventListener('click', toggleHighlight);
  popupElements.videoCallToggle.addEventListener('click', toggleVideoCallTranslation);
};

/* Listen for messages from the content background script. */
chrome.runtime.onMessage.addListener(async (request: any, sender: any, sendResponse: any): Promise<any> => {
  if (request.target === MessageTarget.OFFSCREEN_RECORDER) return;
  if (sender.id === chrome.runtime.id) {
    /* Check if the request is a query not a response.
     * The request var can be a query when content script send a message and the
     * popup its open. In this case messages are redirected to background script
     * and responses to content script.
     */
    if (request.query) {
      /* By-pass message communication */
      const response = await sendChromeMessageAsync(request);
      sendResponse(response);
    }
    // eslint-disable-next-line consistent-return
    return true;
  }
});

/** Inits the Chrome Storage Sync. */
const updateStateOnStorage = async () => {
  const updates: Record<string, any> = {};
  let updatesCnt = 0;
  if (StorageCtrl.getItem(Store.TOOLBOX_ACTIVE) === undefined) {
    updates[Store.TOOLBOX_ACTIVE] = true;
    updatesCnt += 1;
  }
  if (StorageCtrl.getItem(Store.HIGHLIGHT_ACTIVE) === undefined) {
    updates[Store.HIGHLIGHT_ACTIVE] = true;
    updatesCnt += 1;
  }
  if (StorageCtrl.getItem(Store.INPUT_TRANSLATE_ACTIVE) === undefined) {
    updates[Store.INPUT_TRANSLATE_ACTIVE] = true;
    updatesCnt += 1;
  }
  if (StorageCtrl.getItem(Store.VIDEO_CALL_ACTIVE) === undefined) {
    updates[Store.VIDEO_CALL_ACTIVE] = true;
    updatesCnt += 1;
  }
  if (updatesCnt > 0) {
    await StorageCtrl.setItems(updates);
  }

  popupElements.highlightToggle.checked = StorageCtrl.getItem(Store.HIGHLIGHT_ACTIVE);
  popupElements.videoCallToggle.checked = StorageCtrl.getItem(Store.VIDEO_CALL_ACTIVE);
  popupElements.translationPopup.style.visibility = 'visible';
};

const checkLiveCCStatus = async () => {
  const tabs = await chrome.tabs.query({ currentWindow: true, active: true });
  if (tabs.length === 0) return;
  const activeTab = tabs[0];
  const result = await isLiveCCEnabled(activeTab.id ?? -1);
  liveCCStatus = result?.running;
};

/** Inits Viva extension popup listeners and sets default language. */
const initExtensionPopup = async () => {
  await I18n.init();
  await StorageCtrl.init();
  getElements();
  await updateStateOnStorage();
  await checkLiveCCStatus();
  setDefaultLanguage();
  setStoreTranslation();
  setTimeout(() => {
    setListeners();
  }, 1);
};

initExtensionPopup();

export default initExtensionPopup;
