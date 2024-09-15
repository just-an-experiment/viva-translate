import { MessageTarget, WorkerEvents } from '../common/constants';
import { errorLog } from '../common/utils/logger';

const EXTENSION_ID = chrome.runtime.id;
declare const serviceWorker: ServiceWorkerGlobalScope;

async function hasOffscreenDocument() {
  if ('getContexts' in chrome.runtime) {
    const existingContexts = await chrome.runtime.getContexts({});
    const offscreenDocument = existingContexts.find(
      (context: any) => context.contextType === 'OFFSCREEN_DOCUMENT'
    );
    return !!offscreenDocument;
  }

  const matchedClients = await serviceWorker.clients.matchAll();
  // eslint-disable-next-line no-restricted-syntax
  for (const client of matchedClients) {
    if (client.url.includes(EXTENSION_ID) && client.url.endsWith('/offscreen.html')) {
      return true;
    }
  }
  return false;
}

/**
 * Get the offscreen document
 * @returns
 */
async function setupOffscreenDocument() {
  const hasOffscreen = await hasOffscreenDocument();

  /* If an offscreen document is not already open, create one. */
  if (!hasOffscreen) {
    /* Create an offscreen document. */
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: [chrome.offscreen.Reason.USER_MEDIA],
      justification: 'Recording from chrome.tabCapture API'
    });
  }
}

/**
 * Inject the LiveCC script
 * @returns
 */
export const injectLiveCCScript = async (tabId: number) => {
  const scripts = ['app-live-cc.bundle.js'];
  const css = ['common-styles.css', 'app-meet-live-cc-styles.css'];

  try {
    /* Inject CSS styles */
    await chrome.scripting.insertCSS({
      target: {
        tabId,
      },
      files: css,
    });
    let lastError = chrome.runtime.lastError;
    if (lastError) {
      errorLog(lastError, {
        description: 'Error registering CSS livecc file in current tab',
        tabId
      });
      return false;
    }

    /* Inject JS script */
    await chrome.scripting.executeScript({
      target: {
        tabId,
      },
      files: scripts,
    });
    lastError = chrome.runtime.lastError;
    if (lastError) {
      errorLog(lastError, {
        description: 'Error registering script livecc file in current tab',
        tabId
      });
      return false;
    }
  } catch (error) {
    errorLog(error, {
      description: 'Error injecting LiveCC scripts',
      tabId
    });
    return false;
  }

  return true;
};

/**
 * Stop live cc audio capture
 * @param tabId
 */
export const stopLiveCC = async (tabId: number) => {
  await setupOffscreenDocument();
  await chrome.runtime.sendMessage({
    type: WorkerEvents.STOP_RECORDING,
    target: MessageTarget.OFFSCREEN_RECORDER,
    tabId
  });
  return true;
};

/**
 * Start live cc audio capture
 * @param tab
 * @returns
 */
// eslint-disable-next-line no-async-promise-executor
export const initLiveCC = async (tabId: number, retry = true): Promise<any> => new Promise(async (resolve) => {
  await setupOffscreenDocument();

  /* Get a MediaStream for the active tab */
  chrome.tabCapture.getMediaStreamId({
    targetTabId: tabId
  }, async (streamId: string) => {
    const lastError = chrome.runtime.lastError;
    if (lastError || !streamId || streamId.length === 0) {
      await stopLiveCC(tabId);
      if (retry) {
        initLiveCC(tabId, false).then(resolve);
        return;
      }
      errorLog(lastError, { description: 'Error initializing live CC capture', tabId });
      resolve({ error: 'no-stream' });
      return;
    }

    /* Send the stream ID to the offscreen document to start recording. */
    await chrome.runtime.sendMessage({
      type: WorkerEvents.START_RECORDING,
      target: MessageTarget.OFFSCREEN_RECORDER,
      data: streamId,
      tabId
    });
    resolve({ id: streamId });
  });
});

/**
 * Check if live cc is enabled in current tab
 * @returns
 */
export const isLiveCCEnabled = async (tabId: number) => {
  await setupOffscreenDocument();
  const result = await chrome.runtime.sendMessage({
    type: WorkerEvents.RECORDING_STATUS,
    target: MessageTarget.OFFSCREEN_RECORDER,
    tabId
  });
  return result;
};
