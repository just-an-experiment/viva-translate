type ConfigObject = {
  NODE_ENV: string;
  ENVIRONMENT: string;
  DEEPL_KEY: string;
  GLADIA_KEY: string;
  OPENAI_KEY: string;
  MAX_TEXT_LENGTH: number;
};

export type BuildEnv = {
  /** path to config js file (dynamic) e.g. Users/.../src/config/build.config.js */
  CONFIG_MODULE_PATH: string;
  CONFIG_MODULE: ConfigObject;
  /** path to the build output folder e.g. Users/.../dist */
  BUILD_OUTPUT_PATH: string;
  /** version number e.g. 1.0.4  */
  PACKAGE_VERSION: string;
  TSCONFIG_JSON_PATH: string;
};
