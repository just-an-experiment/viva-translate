# Viva Translate Chrome Extension

## Getting the Project

Clone the repository using:

```
git clone git@github.com:JustAnExperiment/VivaTranslate.git
```

Alternatively, you can download the [latest zip package](https://github.com/JustAnExperiment/VivaTranslate/archive/refs/heads/main.zip).

## Install Dependencies

To install project dependencies, you can use `pnpm` (recommended) or `npm`:

```
pnpm install
# or
npm install
```

## Configure Environment Variables

Before compiling the project, you should configure the environment variables. Copy the `.env.example` file, rename it to `.env`, and replace the placeholder values with your own:

```
ENVIRONMENT=development or production
DEEPL_KEY=Deepl API Key for translations
OPENAI_KEY=OpenAI API Key for AI Summaries using gpt-4o-mini
GLADIA_KEY=Gladia.ai API Key for transcriptions
MAX_TEXT_LENGTH=Maximum text length for translations in popup and highlight to translate (Recomended 7500)
```

## Build the Extension

To generate the `dist` folder with the extension files and a distribution zip file, run:

`pnpm run build`

## Load the Extension in Chrome

1. Open the [Chrome Extensions](chrome://extensions/) page.
2. In the top right, enable `Developer Mode` by toggling the switch.
3. In the upper left, click `Load unpacked` and select the `dist` folder.
 
Alternatively, you can drag and drop the `dist` folder or the zip file into the extensions page.
