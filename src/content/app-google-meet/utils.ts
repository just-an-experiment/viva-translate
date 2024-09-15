import { isIframe } from '../../common/utils/helpers';

/**
 * Valida Google Meet URL components.
 *
 * @param hostname
 * @param pathname
 * @returns
 */
function checkGoogleMeet(hostname: string, pathname: string): boolean {
  const meetRegex = /^\/((new)|((_meet\/)?([a-zA-Z-0-9]{3,3}-[a-zA-Z-0-9]{4,4}-[a-zA-Z-0-9]{3,3}).*))$/;
  return hostname.includes('meet.google.com') && meetRegex.test(pathname);
}

/**
* Check if the user is in a Google Meet from URL.
* @returns
*/
export function isGoogleMeetingUrl(url: string): boolean {
  const components = url.split('/');
  if (!components || components.length < 4) return false;
  const hostname = components[2];
  const pathname = `/${components[3]}`;
  return checkGoogleMeet(hostname, pathname);
}

/**
* Check if the user is in a Google Meet.
* @returns
*/
export function isGoogleMeeting(): boolean {
  return checkGoogleMeet(window.location.hostname, window.location.pathname) && !isIframe();
}
