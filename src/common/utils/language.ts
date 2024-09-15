import i18next from 'i18next';
import { errorLog } from './logger';
import DE from '../../locales/de.json';
import EN from '../../locales/en.json';
import ES from '../../locales/es.json';
import FR from '../../locales/fr.json';
import IT from '../../locales/it.json';
import JA from '../../locales/ja.json';
import PT from '../../locales/pt.json';
import ZH from '../../locales/zh.json';
import {
  Languages, TargetLanguage, Store, SupportedLocales
} from '../constants';
import StorageCtrl from '../Storage';

export const defaultLang = Languages.EN;

function replaceElementContent(element: Element, newContent: string) {
  if (element.nodeName === 'TEXTAREA' || element.nodeName === 'INPUT') {
    (element as HTMLTextAreaElement).placeholder = newContent;
  } else {
    element.innerHTML = newContent;
  }
}

class I18n {
  private static instance: I18n;

  public supportedLangs: string[];

  private constructor() {
    this.supportedLangs = Object.keys(Languages);
  }

  public static get shared(): I18n {
    if (!I18n.instance) {
      I18n.instance = new I18n();
    }
    return I18n.instance;
  }

  /**
   * Initiailze the language
   * @param listenChanges
   */
  public async init(listenChanges = true): Promise<any> {
    const lng = await this.getCurrentLocaleFromStorage();
    await i18next.init(
      {
        lng,
        fallbackLng: defaultLang,
        resources: {
          EN, ES, PT, DE, FR, IT, JA, ZH
        },
      },
      (error: Error) => {
        if (error === null && listenChanges) this.initLocaleChangeListener();
        if (error !== null) errorLog(error, { description: 'Could not initialize i18n' });
      }
    );
  }

  /**
   * Extract the language code from the target language
   * @param target
   * @returns
   */
  // eslint-disable-next-line class-methods-use-this
  public getCodeFromTargetLang(target: string): string {
    const langCode = (Object.keys(TargetLanguage) as (keyof typeof TargetLanguage)[]).find(
      (key) => TargetLanguage[key as keyof typeof TargetLanguage] === target
    );
    return langCode ?? target;
  }

  /**
   * Get the target language for translation
   * @param code
   * @returns
   */
  // eslint-disable-next-line class-methods-use-this
  public getTargetLang(code: string): string {
    return TargetLanguage[code as keyof typeof TargetLanguage] ?? code;
  }

  /**
   * CHeck if the language is supported
   * @param code
   * @returns
   */
  public isSupportedLang(code: string): boolean {
    return this.supportedLangs.includes(code);
  }

  /**
   * Get supported languages by the interface
   * @returns
   */
  // eslint-disable-next-line class-methods-use-this
  public get supportedLocales(): string[] {
    return Object.keys(SupportedLocales);
  }

  /**
   * Translation function for UI component
   * @param key
   * @param element
   * @param options
   * @returns
   */
  // eslint-disable-next-line class-methods-use-this
  public t(key: string, element?: Element, options?: Object | undefined): string {
    if (element) element.setAttribute('data-viva-i18n', key);
    return i18next.t(key, options as any) as any;
  }

  /**
   * Get current interface language
   */
  // eslint-disable-next-line class-methods-use-this
  public get currentLocale(): string {
    return i18next.language;
  }

  /**
   * Get current locale from storage
   * @returns
   */
  private async getCurrentLocaleFromStorage(): Promise<string> {
    let lang = await StorageCtrl.reloadItem(Store.LANGUAGE);
    lang = this.isSupportedLocale(lang) ? lang : defaultLang;
    return lang;
  }

  /**
   * Return the name of the language
   * @param localeCode
   * @returns
   */
  // eslint-disable-next-line class-methods-use-this
  public getLocaleName(localeCode: string): string | undefined {
    return SupportedLocales[localeCode as keyof typeof SupportedLocales] ?? undefined;
  }

  /**
   * Check if locale is supported
   * @param localeCode
   * @returns
   */
  // eslint-disable-next-line class-methods-use-this
  public isSupportedLocale(localeCode: string): boolean {
    return !!SupportedLocales[localeCode as keyof typeof SupportedLocales];
  }

  /**
   * Callback triggered when locale is changed
   * @param ev
   */
  // eslint-disable-next-line class-methods-use-this
  private async switchLocaleCb(ev: Event) {
    const selectEl = ev?.target as HTMLSelectElement;
    await StorageCtrl.setItem(Store.LANGUAGE, selectEl.value ?? defaultLang);
  }

  /**
   * Initialize the locale change listener
   */
  // eslint-disable-next-line class-methods-use-this
  private initLocaleChangeListener(): void {
    StorageCtrl.on(Store.LANGUAGE, (value: string) => {
      i18next.changeLanguage(value);
    });

    i18next.on('languageChanged', () => {
      if (typeof window === 'undefined') return;
      const foundElements = Array.from(document.querySelectorAll('[data-viva-i18n]'));
      if (foundElements.length > 0) {
        foundElements.forEach((element: Element) => {
          const key = element.getAttribute('data-viva-i18n');
          if (key) replaceElementContent(element, i18next.t(key));
        });
      }
    });
  }

  /**
   * Get the locale language switcher
   * @param classes
   * @returns
   */
  public async getLanguageSwitcher(
    classes: string[],
    selectedLang?: string,
    onChange?: (ev: Event) => void
  ): Promise<HTMLSelectElement> {
    const languageSwitcher = document?.createElement('select');
    languageSwitcher.classList.add(...classes);
    this.supportedLocales.forEach((langCode: string) => {
      const option = document?.createElement('option');
      option.value = langCode;
      option.innerHTML = `${this.getLocaleName(langCode)}`;
      languageSwitcher.append(option);
    });
    languageSwitcher.value = selectedLang ?? await this.getCurrentLocaleFromStorage();
    languageSwitcher.addEventListener('change', onChange ?? this.switchLocaleCb.bind(this));
    return languageSwitcher;
  }

  /**
   * Set the output language
   * @param outLang
   */
  // eslint-disable-next-line class-methods-use-this
  public async setOutputLang(outLang: string) {
    await StorageCtrl.setItem(Store.SPEAKER_OUT, outLang);
  }

  /**
   * Get the output language
   */
  public get outputLang(): string {
    let outLang = StorageCtrl.getItem(Store.SPEAKER_OUT) || Languages.ES;
    if (!this.isSupportedLang(outLang)) outLang = Languages.ES;
    return outLang;
  }
}

export default I18n.shared;
