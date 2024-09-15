import StorageCtrl from '../Storage';
import I18n from './language';

/**
 * Check if the script was previously injected
 * @param appName
 * @returns
 */
function checkAppInjected(appName: string) {
  const attr = document.body.attributes.getNamedItem(appName);
  if (attr) {
    return true;
  }

  /* Add the attribute guard */
  document.body.attributes.setNamedItem(document.createAttribute(appName));
  return false;
}

const docReadyForInputDetect = (appName: string, fns: Function[]) => {
  const acceptedStates = ['complete', 'interactive'];
  if (acceptedStates.includes(document.readyState)) {
    setTimeout(() => {
      if (document.contentType !== 'text/html') return;
      const injected = checkAppInjected(appName);
      if (injected) return;
      fns.forEach((fn: Function) => fn());
    }, 1);
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      if (document.contentType !== 'text/html') return;
      const injected = checkAppInjected(appName);
      if (injected) return;
      fns.forEach((fn: Function) => fn());
    });
  }
};

const initExtension = async (appName: string, fns: Function[]) => {
  await I18n.init();
  await StorageCtrl.init();
  docReadyForInputDetect(appName, fns);
};

export default initExtension;
