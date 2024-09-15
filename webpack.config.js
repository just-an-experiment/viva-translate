const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const { DefinePlugin } = require('webpack');
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const {
  transformManifest,
  getBuildEnv,
  generateTSCompilerOptionsOverride,
  getDefineVariables,
} = require('./build-tools');

const rootDirectory = __dirname;

const buildEnv = getBuildEnv(rootDirectory);

const options = {
  mode: buildEnv.NODE_ENV,
  entry: {
    'app-extension-reload': './src/content/app-extension-reload/index.ts',
    'app-google-meet': './src/content/app-google-meet/index.ts',
    'app-highlight-to-translate': './src/content/app-highlight-to-translate/index.ts',
    'app-live-cc': './src/content/app-live-cc/index.ts',
    background: './src/background/index.ts',
    popup: './src/popup/index.ts',
    offscreen: './src/offscreen/index.ts',
    'common-styles': './src/styles/common/app.scss',
    'popup-styles': './src/styles/popup/app.scss',
    'transcriptions-styles': './src/styles/transcriptions/index.scss',
    'app-extension-reload-styles': './src/styles/app-extension-reload/app.scss',
    'app-highlight-to-translate-styles': './src/styles/app-highlight-to-translate/app.scss',
    'app-meet-live-cc-styles': './src/styles/app-meet-live-cc/app.scss',
    'audio-processor': './src/audio/processor.ts',
    'audio-interceptor': './src/audio/interceptors/audio.ts',
    'transcriptions': './src/transcriptions/index.ts',
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              instance: 'MAIN',
              configFile: path.resolve(__dirname, 'tsconfig.json'),
              context: path.resolve(__dirname),
              compilerOptions: generateTSCompilerOptionsOverride(buildEnv),
            },
          },
        ],
        exclude: /node_modules/,
      },
      {
        test: /\.(js|jsx)$/,
        use: [
          {
            loader: 'source-map-loader',
          },
          {
            loader: 'babel-loader',
          },
        ],
        exclude: /node_modules/,
      },
      {
        test: /\.(c|sc|sa)ss$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
      },
    ], // do not forget to change/install your own TS loader
  },
  resolve: {
    extensions: ['.js', '.ts', '.json'],
    alias: {
      // use the @config alias to reference the current config file
      '@config': path.resolve(__dirname, 'src', 'config', 'index.ts'),
      // slighly hacky way to inject config modules at build-time. DO NOT USE outside of config/index.ts.
      '~inject-config-js': buildEnv.CONFIG_MODULE_PATH,
    },
    symlinks: false,
  },
  plugins: [
    // Note: these variables are re-exported in consants.js
    new DefinePlugin({
      DEFINE_VARIABLES: JSON.stringify(getDefineVariables(buildEnv)),
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/manifest.json',
          to: buildEnv.BUILD_OUTPUT_PATH,
          force: true,
          transform: function (contentBuffer) {
            return transformManifest(buildEnv, contentBuffer);
          },
        },
        { from: './src/popup/popup.html' },
        { from: './src/offscreen/offscreen.html' },
        { from: './src/images', to: 'images' },
        { from: './src/fonts', to: 'fonts' },
        { from: './src/locales', to: 'locales' },
        { from: './src/_locales', to: '_locales' },
        { from: './src/transcriptions/index.html', to: 'transcriptions.html' },
      ],
    }),
    new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: '[id].[contenthash].css',
    }),
  ],
  output: {
    filename: '[name].bundle.js',
    path: `${buildEnv.BUILD_OUTPUT_PATH}`,
    clean: true,
  },
};

if (process.env.NODE_ENV === 'development') {
  options.devtool = 'cheap-module-source-map';
  options.optimization = {
    minimize: false,
  };
} else {
  /* PRODUCTION */
  options.optimization = {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
      }),
    ],
  };
}

module.exports = options;
