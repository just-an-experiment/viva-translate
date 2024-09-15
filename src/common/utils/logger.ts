import config from '@config';

/**
 * If the environment is development, log the messages to the console
 * @param messages - This is a rest parameter. It's an array of all the arguments passed to the
 * function.
 */
export const debugLog = (...messages: any) => {
  if (config.ENVIRONMENT !== 'production') {
    // eslint-disable-next-line no-console
    console.log(...messages);
  }
};

export const errorLog = (error: any, extra?: any) => {
  // eslint-disable-next-line no-console
  console.error(error);
  if (extra) debugLog(extra);
};
