import { errorLog } from './logger';

/**
 * Wrapper to convert chrome.runtime.sendMessage to promises for async/await compatiblity
 * Add options to retry the message if it fails
 *
 * @param messageContent
 * @param attempt
 * @returns
 */
export const sendChromeMessageAsync = (messageContent: any, attempt = 0): Promise<any> =>
  new Promise((resolve) => {
    if (attempt > 5) {
      resolve({ error: 'Failed to send message' });
      return;
    }
    chrome.runtime.sendMessage(messageContent).then((response: any) => {
      if (!response) {
        setTimeout(() => {
          sendChromeMessageAsync(messageContent, attempt + 1).then(resolve);
        }, 10);
        return;
      }
      resolve(response);
    }, (error) => {
      errorLog('Error sending message to background worker', error);
    });
  });

/**
 * Function will be run `ms` milliseconds after most recent call.
 *
 * Note: func should NOT reference `this`.
 * Returns a promise which resolves when the debounced function is run.
 * Value of the function is discarded (due to pecularities with function unwrapping).
 *
 * @param ms debounce timer in milliseconds
 * @param func function to be debounced. Return value will be ignored
 * @param ignoreDebounceFirstCall if true, ignore debounce on the first call
 * @returns debounced function. Retunrns a void promise which resolves when function is called
 * (after debounces).
 */
export function debounce<Params extends any[], U>(
  func: (...args: Params) => U,
  ms: number = 300,
  ignoreDebounceFirstCall: boolean = false
): (...args: Params) => Promise<void> {
  let timer: ReturnType<typeof setTimeout>;
  let firstCall = ignoreDebounceFirstCall;

  return async (...args) => {
    if (firstCall) {
      firstCall = false;
      func(...args);
      return;
    }

    clearTimeout(timer);
    timer = setTimeout(() => {
      func(...args);
    }, ms);
  };
}

/**
 * Copies text to clipboard.
 * @param str text to be copied to clipboard.
 * @returns resolved once the clipboard's contents have been updated.
 * The promise is rejected if the caller does not have permission to write to
 * the clipboard
 */
export const copyToClipboard = (str: string): Promise<void> => {
  if (str.length > 0) {
    return navigator.clipboard.writeText(str);
  }
  return Promise.reject(Error('No text to copy'));
};

/**
 * Converts the inputted css px value to a number.
 * @param px the px value to convert.
 */
export const pxToNumber = (px: string) => Number(px.replace('px', '')) ?? 0;

export const isIframe = (): boolean => window.self !== window.top;

export function padWithZero(value: number): string {
  return `${value < 10 ? '0' : ''}${value}`;
}

export function msToHMS(ms: number): string {
  let seconds = ms / 1000;
  let hours = seconds / 3600;
  seconds %= 3600;
  let minutes = seconds / 60;
  seconds %= 60;
  if (seconds === 60) seconds = 0;
  if (minutes === 60) minutes = 0;
  hours = Math.floor(hours);
  return `${hours > 0 ? `${hours}:` : ''}${padWithZero(Math.floor(minutes))}:${padWithZero(Math.floor(seconds))}`;
}

export function objIsEmpty(obj: any): boolean {
  return Object.entries(obj)?.length === 0;
}

export function toggleBtnActiveState(btn: HTMLButtonElement, icon: string, active?: boolean, hidden = false) {
  if (!btn) return false;
  const newState = active === undefined ? !btn?.classList.contains('btn-active') : active;
  if (!newState) {
    btn.classList.remove('btn-active');
  } else {
    btn.classList.add('btn-active');
  }
  btn.hidden = hidden;
  return newState;
}

export function toBase64(payload: Int16Array) {
  return btoa(String.fromCharCode(...new Uint8Array(payload.buffer)));
}

/**
* Returns the index of the last element in the array where predicate is true, and -1
* otherwise.
* @param array The source array to search in
* @param predicate find calls predicate once for each element of the array, in descending
* order, until it finds one where predicate returns true. If such an element is found,
* findLastIndex immediately returns that element index. Otherwise, findLastIndex returns -1.
*/
export function findLastIndex<T>(array: Array<T>, predicate: (value: T, index: number, obj: T[]) => boolean): number {
  let l = array.length;
  /* eslint-disable-next-line no-plusplus */
  while (l--) {
    if (predicate(array[l], l, array)) return l;
  }
  return -1;
}
