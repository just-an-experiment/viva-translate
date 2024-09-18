# Viva Translate - Real-time translation copilot for your browser
[Join Discord for support](https://discord.gg/TRDrTESsK4)

Receive real-time translated subtitles of your browser audio for Google Meets, YouTube, and more.

**Things you can do with Viva Translate:**
- Talk to your international coworkers 🧑‍💻
- Talk to your grandmother abroad 💜
- Talk to your lover abroad ❤️
- Translate snippets of the web 🌐
- Translate YouTube videos ▶️
- Translate live streams 🦦
- Translate obscure movies in other languages 🎥

**Note: This open-source Chrome extension prioritizes translation accuracy over cost**. Luckily,  the model providers we use have generous free tiers! 

## Requirements
- Basic understanding of using the terminal and Node.js
- Chrome-based browser
- API Keys (see step 3 for details)
	- DeepL API Key for translations ([500,000 characters free / month, as of Sep 18, 2024](https://www.deepl.com/en/pro/change-plan#developer))
	- Gladia API Key for transcriptions ([10 hours free / month, as of Sep 18, 2024](https://www.gladia.io/pricing))
	- OpenAI API Key for AI summaries ([$100 free / month, as of Sep 18, 2024](https://platform.openai.com/docs/guides/rate-limits/usage-tiers?context=tier-free))

For language translation, we found that DeepL + Gladia performed the best for accuracy and speed. OpenAI is used for AI summaries. You may feel free to switch these out with other API providers! 
## Features
- Supported languages: English, Spanish, Portuguese, German, French, Italian, Japanese, and Chinese
- Translate audio on any website such as YouTube, Twitch, and others.
- Translate your Google Meets meetings
- Highlight text on any page to translate
- Save your transcripts and summaries

# Easy Set Up (~10 min)

10 minutes of setup for a lifetime of translations :) 

## Step 1: Download the Project

Clone this repository using `git clone git@github.com:just-an-experiment/viva-translate.git`

Alternatively, you can download the [latest zip package](https://github.com/just-an-experiment/viva-translate/releases/tag/1.0.0) and unzip it. 

## Step 2: Download Node Dependencies

To install project dependencies, you can use `pnpm` (recommended) or `npm`:

```
pnpm install
# or
npm install
```

## Step 3: Add API Keys and Environment Variables
This project uses DeepL for translations, OpenAI for transcription summaries, and Gladia for speech-to-text transcriptions. 

Here is how to get your API Keys from each provider in order to run the project:
- DeepL
	- [Create a developer account](https://www.deepl.com/en/pro/change-plan#developer) - it'll ask for a credit card but it won't charge you upfront
 	- Get API Key from [https://www.deepl.com/en/your-account/keys](https://www.deepl.com/en/your-account/keys)
- OpenAI
	- [Create a developer account](https://platform.openai.com/)
 	- Get API Key from [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- Gladia
	- [Create a developer account](https://app.gladia.io/)
 	- Get API Key from [https://app.gladia.io/account](https://app.gladia.io/account)


Before compiling the project, you should configure the environment variables. Copy the `.env.example` file, rename it to `.env`, and replace the placeholder values with your own:

```
ENVIRONMENT="development" or "production"
DEEPL_API_KEY=DEEPL API Key for translations
OPENAI_KEY=OpenAI API Key for AI Summaries using gpt-4o-mini
GLADIA_KEY=Gladia.ai API Key for transcriptions
MAX_TEXT_LENGTH=Maximum text length for translations in popup and highlight to translate (Recommended value is 7500)
```

## Step 4: Build the Extension

To generate the `dist` folder with the extension files and a distribution zip file, run:

```
pnpm run build
# or
npm run build
```

## Step 5: Load the Extension in Chrome

![Screenshot 2024-09-18 at 12 11 54 PM](https://github.com/user-attachments/assets/4315fd8b-d929-4c98-bb69-59a88c700e79)

1. Open the [Chrome Extensions](chrome://extensions/) page.
2. On the top right, enable `Developer Mode` by toggling the switch.
3. On the upper left, click `Load unpacked` and select the `dist` folder. Alternatively, you can drag and drop the `dist` folder onto the extensions page.

## Step 6: Pin your extension

Click the extensions icon in the upper right corner of your Chrome browser. Click the pin icon near the Viva Translate logo.

## Step 7: Try it out

1. For any audio like a [YouTube video]([url](https://www.youtube.com/watch?v=1waHlpKiNyY&list=PLkDaE6sCZn6Hn0vK8co82zjQtt3T2Nkqc)): click your pinned extension and press 'Captions'.
2. For Google Meets: go to [any Google Meets meeting](https://meet.new) and Viva should automatically start up. You can toggle this on/off in the pinned extension.

# Contribute

Submit a pull request in this repository if you'd like to contribute! 

[Join Discord for support](https://discord.gg/TRDrTESsK4)
