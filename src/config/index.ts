// @ts-ignore
import dynamicConfig from '~inject-config-js';

export type ConfigObject = {
  NODE_ENV: string;
  ENVIRONMENT: string;
  DEEPL_KEY: string;
  GLADIA_KEY: string;
  OPENAI_KEY: string;
  MAX_TEXT_LENGTH: number;
};

const config = dynamicConfig as ConfigObject;

/**
 * will import dynamically from dev/production config.js files at build-time
 * import this package directly via alias: import config from '@config';
 * do NOT use '~inject-config-js'
*/
export default config;
