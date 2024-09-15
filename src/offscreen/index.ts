import AudioStream from './io/AudioStream';
import { debugLog, errorLog } from '../common/utils/logger';
import { MessageTarget, WorkerEvents } from '../common/constants';

const activeRecorders: Record<number, { streamId: string, stream?: AudioStream }> = {};

/**
 * Start audio recording from the given stream ID.
 * @param streamId
 */
async function startRecording(tabId: number, streamId: string) {
  activeRecorders[tabId] = { streamId, stream: undefined };
  try {
    /* Load the media stream from the captured ID */
    const media = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: 'tab',
          chromeMediaSourceId: streamId
        }
      } as any,
      video: false
    });

    /* Continue to play the captured audio to the user */
    const output = new AudioContext();
    const source = output.createMediaStreamSource(media);
    source.connect(output.destination);

    /* Create new stream with audio tracks and send all audio packets to the background script */
    activeRecorders[tabId].stream = new AudioStream(media);
    activeRecorders[tabId].stream.on('audio-packet', (packet: any) => {
      chrome.runtime.sendMessage({ query: WorkerEvents.OFFSCREEN_AUDIO_PACKET, tabId, packet });
    });
  } catch (error) {
    delete activeRecorders[tabId];
    errorLog(error, { description: 'Error stating capturing audio stream', tabId, streamId });
    chrome.runtime.sendMessage({ query: 'offscreen-error-capturing-audio', tabId });
  }
}

/**
 * Stop audio recording.
 */
async function stopRecording(tabId: number) {
  if (activeRecorders[tabId]) {
    if (activeRecorders[tabId].stream) {
      activeRecorders[tabId].stream.disconnect();
    }
    delete activeRecorders[tabId];
    debugLog('Recording stopped', { tabId, recorders: activeRecorders });
  }
}

/**
 * Handle messages from background script
 */
chrome.runtime.onMessage.addListener(async (message: any, sender: any, sendResponse: Function) => {
  if (message.target === MessageTarget.OFFSCREEN_RECORDER) {
    debugLog('Received message', message);
    switch (message.type) {
      case WorkerEvents.START_RECORDING:
        if (!activeRecorders[message.tabId]) {
          debugLog('Starting recording', { streamId: message.data, tabId: message.tabId });
          startRecording(message.tabId, message.data);
        }
        sendResponse({});
        break;
      case WorkerEvents.STOP_RECORDING:
        debugLog('Stopping recording', { tabId: message.tabId });
        stopRecording(message.tabId);
        sendResponse({});
        break;
      case WorkerEvents.RECORDING_STATUS:
        sendResponse({ running: !!activeRecorders[message.tabId] });
        break;
      default:
        errorLog(new Error('Unrecognized message'), { description: 'Unrecognized message', ...message });
        throw new Error(`Unrecognized message: ${message.type}`);
    }
  }

  return true;
});

debugLog('Viva offscreen recorder ready');
