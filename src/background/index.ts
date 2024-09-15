import StorageCtrl from './Storage';
import { errorLog } from '../common/utils/logger';
import {
  Languages, StorageEvents, Store, WorkerEvents, AIFeatures
} from '../common/constants';
import I18n from '../common/utils/language';
import { injectScript, injectHighlightScript } from './injections';
import {
  initLiveCC, injectLiveCCScript, isLiveCCEnabled, stopLiveCC
} from './live-cc';
import translateText from './deepl';
import generateAIFeature from './openai';

type RequestType = {
  query: string;
} & any;

const handleExtensionMessage = (request: RequestType, sender: any, sendResponse: Function): boolean => {
  if (!request.query) return false;
  switch (request.query) {
    case WorkerEvents.SAVE_STORAGE_ITEM:
      if (request.key) {
        StorageCtrl.setItem(request.key, request.value).then(() => {
          sendResponse({});
        }).catch(() => {
          sendResponse({ error: 'item-not-saved' });
        });
      } else {
        sendResponse({ error: 'invalid-key' });
      }
      break;

    case WorkerEvents.SAVE_STORAGE_ITEMS:
      if (request.items) {
        StorageCtrl.setItems(request.items).then(() => {
          sendResponse({});
        }).catch(() => {
          sendResponse({ error: 'items-not-saved' });
        });
      } else {
        sendResponse({ error: 'invalid-items' });
      }
      break;

    case WorkerEvents.DELETE_STORAGE_ITEM:
      if (request.key) {
        StorageCtrl.removeItem(request.key).then(() => {
          sendResponse({});
        }).catch(() => {
          sendResponse({ error: 'item-not-removed' });
        });
      } else {
        sendResponse({ error: 'invalid-key' });
      }
      break;

    case WorkerEvents.GET_ALL_STORAGE_ITEMS:
      sendResponse({ items: StorageCtrl.items });
      break;

    case WorkerEvents.RELOAD_STORAGE_ITEM:
      if (request.key) {
        StorageCtrl.reloadItem(request.key).then((value) => {
          sendResponse({ value });
        }).catch(() => {
          sendResponse({ error: 'item-not-reloaded' });
        });
      } else {
        sendResponse({ error: 'invalid-key' });
      }
      break;

    case WorkerEvents.TRANSLATE: {
      translateText(request.texts, request.targetLang).then((translations) => {
        sendResponse({ translations });
      }).catch(() => {
        sendResponse({ error: 'translation-failed' });
      });
      break;
    }

    case WorkerEvents.GENERATE_AI_FEATURE: {
      generateAIFeature(AIFeatures.Sumamry, request.transcriptions).then(async (summaries) => {
        try {
          let items = summaries;
          /* Check if summaries must be translated */
          const results: Record<string, string[]> = {};
          results[Languages.EN] = summaries;
          if (request.lang !== Languages.EN) {
            const translations = await translateText(summaries, request.lang, Languages.EN);
            items = translations.map((translation) => translation.text);
            results[request.lang] = items;
          }
          sendResponse(results);
        } catch (error) {
          errorLog(error, { description: 'Error translating AI Feature', request });
          sendResponse({ error: 'ai-feature-failed' });
        }
      }).catch(() => {
        sendResponse({ error: 'ai-feature-failed' });
      });
      break;
    }

    case WorkerEvents.START_LIVE_CC:
      /* Initialize the live CC capture */
      initLiveCC(request.tabId).then((response: any) => sendResponse(response));
      break;

    case WorkerEvents.STOP_LIVE_CC:
      /* Stop the live CC capture */
      stopLiveCC(request.tabId).then(() => sendResponse({}));
      break;

    case WorkerEvents.OFFSCREEN_AUDIO_PACKET:
      /* Send audio packet to the content script */
      {
        const tabId = request.tabId;
        chrome.tabs.sendMessage(request.tabId, { message: 'audio-packet', packet: request.packet }).catch(() => {
          stopLiveCC(tabId);
        });
        sendResponse({});
      }
      break;

    case WorkerEvents.OFFSCREEN_ERROR_CAPTURING_AUDIO:
      /* Send error capturing audio to the content script */
      chrome.tabs.sendMessage(request.tabId, { message: 'error-capturing-audio' }).catch((error) => {
        errorLog(error, { description: 'Error sending error capturing audio', tabId: request.tabId });
      });
      sendResponse({});
      break;

    case WorkerEvents.INJECT_LIVE_CC:
      /* Inject live CC script */
      injectLiveCCScript(request.tabId)
        .then((injected) => sendResponse(injected ? undefined : { error: 'no-live-cc' }));
      break;

    case WorkerEvents.CHECK_LIVE_CC:
      /* Check if live CC is enabled */
      isLiveCCEnabled(request.tabId).then((result) => sendResponse(result));
      break;

    case WorkerEvents.SHOW_TRANSCRIPTION_RESULTS:
      chrome.tabs.create({ url: 'transcriptions.html' }, (tab) => {
        const updateListener = (tabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
          if (tabId === tab.id && changeInfo.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(updateListener);
            chrome.tabs.sendMessage(tabId, {
              query: WorkerEvents.SHOW_TRANSCRIPTION_RESULTS,
              data: request
            });
          }
        };
        chrome.tabs.onUpdated.addListener(updateListener);
      });
      sendResponse({});
      break;

    default: {
      const error = Error('Background index.ts: handleExtensionMessage - Unrecognized message from extension client');
      errorLog(error, { description: 'Unrecognized message from extension client', request });
      throw error;
    }
  }

  /* https://developer.chrome.com/docs/extensions/mv3/messaging/#simple */
  return true;
};

chrome.runtime.onMessage.addListener(handleExtensionMessage);

/** Checks if a value is empty. */
const isEmptyValue = (value: any) => value === null || value === undefined;

/** Sets the highlight and call translation feature to active by default. */
const setDefaultValues = async () => {
  const browserLanguage = chrome.i18n.getUILanguage().substring(0, 2)?.toUpperCase();
  try {
    const defaultStorage: any = {};

    /** Sets the user language fetched from the browser if it isn't set yet. */
    if (!StorageCtrl.getItem(Store.LANGUAGE)) defaultStorage[Store.LANGUAGE] = browserLanguage;
    if (!StorageCtrl.getItem(Store.POPUP_TARGET_LANG)) {
      defaultStorage[Store.POPUP_TARGET_LANG] = I18n.getTargetLang(browserLanguage);
    }

    if (!StorageCtrl.getItem(Store.HIGHLIGHT_TARGET_LANG)) {
      defaultStorage[Store.HIGHLIGHT_TARGET_LANG] = I18n.getTargetLang(browserLanguage);
    }

    /** Sets default toggle values if not set already. */
    if (isEmptyValue(StorageCtrl.getItem(Store.HIGHLIGHT_ACTIVE))) defaultStorage[Store.HIGHLIGHT_ACTIVE] = false;
    if (isEmptyValue(StorageCtrl.getItem(Store.VIDEO_CALL_ACTIVE))) defaultStorage[Store.VIDEO_CALL_ACTIVE] = true;
    if (isEmptyValue(StorageCtrl.getItem(Store.SHOW_OWN_TRANSCRIPTION))) {
      defaultStorage[Store.SHOW_OWN_TRANSCRIPTION] = true;
    }

    if (isEmptyValue(StorageCtrl.getItem(Store.LEARNING_MODE))) defaultStorage[Store.LEARNING_MODE] = false;

    await StorageCtrl.setItems(defaultStorage);
  } catch (error) {
    errorLog(error, { description: 'Fetching store error' });
  }
};

/* On Extension install or update */
chrome.runtime.onInstalled.addListener(async (details) => {
  await I18n.init(false);
  if (details.reason === 'install') {
    await StorageCtrl.setItem(Store.CHAR_COUNT, 0);
    await setDefaultValues();
  }

  /* Inject extension content script */
  injectScript();
});

/** Updates the Storage Sync API data with the Auth API data. */
const initStorageInfo = async () => {
  await StorageCtrl.init();

  /* Handle storage single update */
  const notifySingleUpdate = (key: string, value: any) => {
    /* Listen for highlight active changes */
    if (key === Store.HIGHLIGHT_ACTIVE) {
      injectHighlightScript(value);

      /* If highlight is enabled, inject the script in all tabs */
      if (value) injectScript(true);
    }
    chrome.runtime.sendMessage({ action: StorageEvents.STORAGE_SINGLE_UPDATE, key, value }, () => {
      if (chrome.runtime.lastError) {
        /* Do nothing, errors are throwed by tabs that were loaded before installing the extension */
      }
    });

    /* Send the notification to all tabs */
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id ?? 0, { action: StorageEvents.STORAGE_SINGLE_UPDATE, key, value });
      });
    });
  };
  StorageCtrl.on(StorageEvents.STORAGE_SINGLE_UPDATE, notifySingleUpdate.bind(this));

  /* Inject the highlight script if its enabled */
  injectHighlightScript(StorageCtrl.getItem(Store.HIGHLIGHT_ACTIVE) || false);
};

initStorageInfo();
