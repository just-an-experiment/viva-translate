import StorageCtrl from './Storage';
import { Store } from '../common/constants';
import { errorLog } from '../common/utils/logger';
import { isGoogleMeetingUrl } from '../content/app-google-meet/utils';

const HIGHLIGHT_SCRIPT: any = {
  id: 'highlight-to-translate',
  allFrames: false,
  css: ['common-styles.css', 'app-highlight-to-translate-styles.css'],
  excludeMatches: [
    'https://meet.google.com/new*',
    'https://meet.google.com/*-*-*',
    'https://meet.google.com/*-*-*?*',
    'https://chromewebstore.google.com/*',
  ],
  js: ['app-highlight-to-translate.bundle.js'],
  matches: ['<all_urls>'],
  runAt: 'document_end',
};

/**
 * Inject the script in each Chrome tab
 * @returns
 */
export const injectScript = (preventGoogleMeet = false) => {
  const jsInjectable: string[] = [];
  const cssInjectable: string[] = [];

  /* Set highlight component if its enabled */
  const isHighlighEnabled = StorageCtrl.getItem(Store.HIGHLIGHT_ACTIVE) || false;
  if (isHighlighEnabled) {
    jsInjectable.push('app-highlight-to-translate.bundle.js');
    cssInjectable.push('common-styles.css');
    cssInjectable.push('app-highlight-to-translate-styles.css');
  }

  chrome.tabs.query({}, (tabs: chrome.tabs.Tab[]) => {
    let lastError;
    tabs.forEach(async (tab) => {
      /* Prevent injecting script in non valid tab */
      if (!tab.url ||
        !(tab.url.startsWith('https://') || tab.url.startsWith('http://')) ||
        tab.url.startsWith('https://chromewebstore.google.com')) return;
      /* Prevent injecting scripts in Google Meet tabs */
      const isGoogleMeet = isGoogleMeetingUrl(tab.url?.split('?')[0] || '');
      if (preventGoogleMeet && isGoogleMeet) return;
      /* Prevent calling without scripts */
      if (!isGoogleMeet && jsInjectable.length === 0) return;

      try {
        await chrome.scripting.insertCSS({
          target: {
            tabId: tab.id || -1,
          },
          files: isGoogleMeet ? ['app-extension-reload-styles.css'] : cssInjectable,
        });
        lastError = chrome.runtime.lastError;
        if (lastError) {
          errorLog(lastError, {
            description: 'Error registering CSS file',
            url: tab.url
          });
          return;
        }
        await chrome.scripting.executeScript({
          target: {
            tabId: tab.id || -1,
          },
          files: isGoogleMeet ? ['app-extension-reload.bundle.js'] : jsInjectable,
        });
        lastError = chrome.runtime.lastError;
        if (lastError) {
          errorLog(lastError, {
            description: 'Error registering script file',
            url: tab.url
          });
        }
      } catch (error) {
        errorLog(error, {
          description: 'Error injecting CSS/Scripts after extension install',
          url: tab.url
        });
      }
    });
  });
};

/**
 * Inject the Highlight to translate script
 * @param status
 * @returns
 */
export const injectHighlightScript = async (status: boolean) => {
  const scripts = await chrome.scripting.getRegisteredContentScripts();
  const obj = scripts.find((script) => script.id === HIGHLIGHT_SCRIPT.id);
  if (status && !obj) {
    /* Register the script to be injected in new pages */
    await chrome.scripting.registerContentScripts([HIGHLIGHT_SCRIPT]);
  } else if (!status && obj) {
    /* Prevent the script to be injected in new pages */
    await chrome.scripting.unregisterContentScripts({ ids: [HIGHLIGHT_SCRIPT.id] });
  }
};
