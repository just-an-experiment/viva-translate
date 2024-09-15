import { AIFeatures, Languages, WorkerEvents } from './constants';
import TranscriptionsData from './transcriptions/TranscriptionsData';
import { IInterim, Translation } from './types';
import { sendChromeMessageAsync } from './utils/helpers';

/**
 * Translates a list of texts to the language that's specified.
 */
export const translateTexts = async (
  texts: string[],
  targetLang: string,
): Promise<Translation[]> => {
  if (texts === undefined || !targetLang) {
    throw Error(
      `getTranslation: Missing required arguments: text:${texts}, targetLang:${targetLang}`
    );
  }

  if (texts.length === 0) {
    return Promise.resolve([]);
  }

  const response = await sendChromeMessageAsync({
    query: WorkerEvents.TRANSLATE,
    texts,
    targetLang,
  });

  if (response.error) throw response;

  return response.translations;
};

/**
 * Translates inputted text to the language that's specified.
 */
export const translateText = async (
  text: string,
  targetLang: string,
): Promise<Translation> => {
  if (text === '') {
    return Promise.resolve({ text: '', sourceLang: Languages.EN });
  }

  const response = await translateTexts([text], targetLang);
  return response[0];
};

/**
 * Generate a AI Feature
 * @returns
 */
export const generateAIFeature = async (
  feature: AIFeatures,
  lang: string,
  messages: IInterim[],
): Promise<any> =>
  sendChromeMessageAsync({
    query: WorkerEvents.GENERATE_AI_FEATURE,
    feature,
    transcriptions: messages.map((message) => message.translations[Languages.EN]).join('\n'),
    lang
  });

/**
 * Start live cc call to inject live cc scripts
 */
export const injectLiveCC = async (tabId: number): Promise<any> => {
  const response = await sendChromeMessageAsync({
    query: WorkerEvents.INJECT_LIVE_CC,
    tabId
  });
  return response;
};

/**
 * Check live cc status
 */
export const isLiveCCEnabled = async (tabId: number): Promise<any> => {
  const response = await sendChromeMessageAsync({
    query: WorkerEvents.CHECK_LIVE_CC,
    tabId
  });
  return response;
};

/**
 * Start tab capture for Live CC
 * @returns
 */
export const startLiveCC = async (tabId: number): Promise<any> => {
  const response = await sendChromeMessageAsync({
    query: WorkerEvents.START_LIVE_CC,
    tabId
  });
  return response;
};

/**
 * Stop tab capture for Live CC
 * @returns
 */
export const stopLiveCC = async (tabId: number): Promise<any> => {
  const response = await sendChromeMessageAsync({
    query: WorkerEvents.STOP_LIVE_CC,
    tabId
  });
  return response;
};

/**
 * Save storage item value
 * @param key
 * @param value
 * @returns
 */
export const saveStorageItem = async (key: string, value: any): Promise<void> => {
  const response = await sendChromeMessageAsync({
    query: WorkerEvents.SAVE_STORAGE_ITEM,
    key,
    value
  });
  if (response && response.error) throw response.error;
};

/**
 * Save storage batch item value
 * @param key
 * @param value
 * @returns
 */
export const saveStorageItems = async (items: { [key: string]: any }): Promise<void> => {
  const response = await sendChromeMessageAsync({
    query: WorkerEvents.SAVE_STORAGE_ITEMS,
    items
  });
  if (response && response.error) throw response.error;
};

/**
 * Delete item value from storage
 * @param key
 * @returns
 */
export const deleteStorageItem = async (key: string): Promise<void> => {
  const response = await sendChromeMessageAsync({
    query: WorkerEvents.DELETE_STORAGE_ITEM,
    key
  });
  if (response.error) throw response.error;
};

/**
 * Get all storage items
 * @returns
 */
export const getAllStorageItems = async (): Promise<any> => {
  const response = await sendChromeMessageAsync({
    query: WorkerEvents.GET_ALL_STORAGE_ITEMS,
  });
  if (response.error) throw response.error;
  return response.items || {};
};

/**
 * Force reload item value from storage
 * @param key
 * @returns
 */
export const reloadStorageItem = async (key: string): Promise<any> => {
  const response = await sendChromeMessageAsync({
    query: WorkerEvents.RELOAD_STORAGE_ITEM,
    key
  });
  if (!response) return null;
  if (response.error) throw response.error;
  return response.value;
};

/**
 * Show new tab with transcription results
 * @param title
 * @param meetType
 * @param url
 * @param startTime
 * @param transcriptions
 * @param summaries
 */
export const showTranscriptionResults = async (targetLang: string) => {
  if (TranscriptionsData.interims.length === 0) return;
  await sendChromeMessageAsync({
    query: WorkerEvents.SHOW_TRANSCRIPTION_RESULTS,
    title: TranscriptionsData.title,
    meetType: TranscriptionsData.meetType,
    url: TranscriptionsData.url,
    startTime: TranscriptionsData.startTime,
    interims: TranscriptionsData.interims,
    summaries: TranscriptionsData.summaries,
    lang: targetLang
  });
};
