// enable strict typescript checking on jsdocs for this file
// @ts-check
require('dotenv/config');
const fs = require('fs');

const path = require('path');
/** special require with support for esm modules (e.g. production.config.js) */

// @ts-ignore: module keyword is OK
const requireESM = require('esm')(module);

/**
 * Return a dictionary with build environment variables.
 * Prefer ths over process.env.
 * @param {string} baseDirectory root project path (e.g. __dirname from webpack.config.js)
 * @return {import('./build-tools.types').BuildEnv}
 */
function getBuildEnv(baseDirectory) {
  const CONFIG_MODULE_PATH = path.resolve(baseDirectory, 'src', 'config', 'build.config.js');

  const CONFIG_MODULE = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    ENVIRONMENT: process.env.ENVIRONMENT || 'development',
    DEEPL_KEY: process.env.DEEPL_KEY ?? '',
    GLADIA_KEY: process.env.GLADIA_KEY ?? '',
    OPENAI_KEY: process.env.OPENAI_KEY ?? '',
    MAX_TEXT_LENGTH: parseInt(process.env.MAX_TEXT_LENGTH ?? '7500',10),
  };

  /** @type import('./build-tools.types').BuildEnv */
  const envs = {
    CONFIG_MODULE_PATH,
    CONFIG_MODULE,
    BUILD_OUTPUT_PATH: path.join(baseDirectory, 'dist'),
    PACKAGE_VERSION: process.env.npm_package_version || 'no-version',
    TSCONFIG_JSON_PATH: path.join(baseDirectory, 'tsconfig.json'),
  };

  fs.writeFileSync(
    CONFIG_MODULE_PATH,
    `/** @type import(".").ConfigObject*/\nconst config = ${JSON.stringify(CONFIG_MODULE)};\n export default config;`
  );

  console.log('Build environment variables: ', envs);
  return envs;
}

/**
 * Populate DEFINE_VARIABLES for injection with define plugin.
 *
 * @param {import('./build-tools.types').BuildEnv} buildEnv
 * @returns {import('../src/define_variables').DefineVariables}
 */
function getDefineVariables(buildEnv) {
  /** @type import('../src/define_variables').DefineVariables */
  const defineVariables = {
    VERSION: buildEnv.PACKAGE_VERSION,
  };

  return defineVariables;
}

/**
 * Wrapper to load an esm module and return the default export.
 *
 * @param {string} requirePath
 * @returns {any} module default export
 */
function requireDefaultESM(requirePath) {
  const exported = requireESM(requirePath);
  return exported.default;
}

/**
 * Make manifest substitutions, and check for the characters '%%%'
 * @param {string} source
 * @param {Record<string, any>} dict
 */
function makeTemplateSubstitutions(source, dict) {
  let returnString = source;
  for (const [template, substution] of Object.entries(dict)) {
    // @ts-ignore
    returnString = returnString.replaceAll(template, substution);
  }
  if (returnString.includes('%%%')) {
    throw Error(`It looks like the manifest still contains template variables after making substutions (look for %%%).
    Make sure all template variables are replaced in manifest before continuing in transformManifest(...).
    Manifest: ${returnString}.`);
  }
  return returnString;
}

/**
 * Generate compilerOptions to override existing tsconfig.json compiler options.
 *
 * This allows for build-specific options, e.g. changing path aliases at build-time for
 *    production/devopment.
 *
 * @param buildEnv {import('./build-tools.types').BuildEnv} env variable from webpack config
 * @returns {Record<string, any>} tsconfig.
 */
function generateTSCompilerOptionsOverride(buildEnv) {
  const tsconfig = require(buildEnv.TSCONFIG_JSON_PATH);
  const { compilerOptions } = tsconfig;
  const newCompilerOptions = {
    ...compilerOptions,
    paths: {
      ...compilerOptions.paths,
      '~inject-config-js': [buildEnv.CONFIG_MODULE_PATH],
    },
  };
  return newCompilerOptions;
}

/**
 *
 * Takes in the original extension manifest.json and modifies for builds
 * @param buildEnv {import('./build-tools.types').BuildEnv} env variable from webpack config
 * @param manifestBuffer {Buffer} buffer (e.g. from CopyWebpackPlugin transform function)
 *
 * @returns {Buffer} modified manifest.json as buffer
 */
function transformManifest(buildEnv, manifestBuffer) {
  /** @type {import('../src/config/index').ConfigObject} */
  const config = requireDefaultESM(buildEnv.CONFIG_MODULE_PATH);
  console.log('Config object: ', config);
  const manifestStringOriginal = manifestBuffer.toString();

  /** @type {import('./mv3.types').Manifest} */
  const manifestObject = JSON.parse(manifestStringOriginal);

  /* MODIFY MANIFEST PROPERTIES AS A JS OBJECT */
  manifestObject.version = buildEnv.PACKAGE_VERSION;

  /* Add the sign key if it was set in the environment */
  if (process.env.SIGN_KEY) {
    manifestObject.key = process.env.SIGN_KEY;
  }

  let newManifestString = null;
  if (process.env.NODE_ENV === 'development') {
    manifestObject.name += ' (Dev)';
    newManifestString = JSON.stringify(manifestObject, null, 2);
  } else {
    newManifestString = JSON.stringify(manifestObject);
  }

  return Buffer.from(newManifestString);
}

module.exports = {
  transformManifest,
  getBuildEnv,
  generateTSCompilerOptionsOverride,
  getDefineVariables,
};
