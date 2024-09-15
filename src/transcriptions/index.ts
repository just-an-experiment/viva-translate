import I18n from '../common/utils/language';
import { IInterim, ISummary } from '../common/types';
import { Icons, Languages, WorkerEvents } from '../common/constants';
import { debugLog } from '../common/utils/logger';
import { copyToClipboard, msToHMS } from '../common/utils/helpers';
import { translateTexts } from '../common/api';

let interims: IInterim[] = [];
let summaries: ISummary[] = [];

let transcriptionsText = '';
let summariesText = '';

let languageSwitcher: HTMLSelectElement | undefined;
let targetLang: string = Languages.EN;
let startTime: number = 0;

/**
 * Preare the summaries text to show
 * @returns
 */
const getSummariesText = (): string[] => summaries.map((summary: ISummary) => summary.translations[targetLang]);

/**
 * Show summaries
 * @param parent
 */
const showSummaries = (
  parent: HTMLElement
) => {
  /* Remove all children */
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }

  const summaryLines = getSummariesText();
  summaryLines.forEach((text: string) => {
    const summaryEl = document.createElement('li')!;
    summaryEl.classList.add('my-1em');
    summaryEl.innerText = text;
    parent.appendChild(summaryEl);
  });

  summariesText = summaryLines.map((line: string) => `- ${line}`).join('\n');
};

/**
 * Preare the interims text to show
 * @param startTime
 * @returns
 */
const getInterimsText = (): string[] => interims.map((interim: IInterim) => {
  const timestamp = interim.createdAt - startTime;
  return `${msToHMS(timestamp)}\n${interim.translations[targetLang]}`;
});

/**
 * Show transcriptions
 * @param parent
 * @param startTime
 */
const showTranscriptions = (
  parent: HTMLElement
) => {
  /* Remove all children */
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }

  const interimLines = getInterimsText();
  interimLines.forEach((text: string) => {
    const transcriptionEl = document.createElement('p')!;
    transcriptionEl.innerText = text;
    parent.appendChild(transcriptionEl);
  });

  transcriptionsText = interimLines.join('\n\n');
};

/**
 * Call to copy text
 * @param button
 * @param text
 */
const triggerCopy = (button: HTMLElement, text: string) => {
  copyToClipboard(text).then(() => {
    button.innerHTML = Icons.CHECKMARK;
    button.classList.add('copy-btn--success');
    setTimeout(() => {
      button.innerHTML = Icons.COPY;
      button.classList.remove('copy-btn--success');
    }, 2000);
  });
};

/**
 * Show the transcriptions and summaries in the DOM
 */
const showTextContent = () => {
  /* Show the transcriptions */
  showTranscriptions(document.getElementById('transcriptions-list')!);

  /* Show the summaries */
  showSummaries(document.getElementById('summary-bullet-list')!);
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender.id === chrome.runtime.id && message.query === WorkerEvents.SHOW_TRANSCRIPTION_RESULTS) {
    const data = message.data;

    /* Update the language selector */
    targetLang = data.lang;
    if (languageSwitcher) {
      languageSwitcher.value = data.lang;
    }

    /* Set the received data */
    startTime = new Date(data.startTime).getTime();
    interims = data.interims;
    summaries = data.summaries;

    /* Set the base metadata */
    document.getElementById('title-data')!.innerText = data.title;
    document.getElementById('type-data')!.innerText = data.meetType;
    document.getElementById('url-data')!.innerText = data.url;
    document.getElementById('startTime-data')!.innerText = data.startTime;

    showTextContent();

    /* Add event listener to download the transcriptions */
    const ctaButton = document.getElementById('cta-download-button')!;
    ctaButton.onclick = () => {
      const exportContent: string = `Title: ${data.title}
Type: ${data.meetType}
URL: ${data.url}
Start Time: ${data.startTime}\n
# Summary:\n
${summariesText}\n
# Transcriptions:\n
${transcriptionsText}`;
      const url = URL.createObjectURL(new Blob([exportContent], { type: 'text/plain' }));
      chrome.downloads.download({
        url,
        filename: `Transcriptions-${startTime}-${targetLang}.txt`,
        saveAs: true,
      }, (downloadId) => {
        debugLog('Transcriptions saved with download ID:', downloadId);
      });
    };
    ctaButton.classList.remove('hidden');

    /* Show copy icons */
    if (transcriptionsText.length > 0) {
      const copyTranscriptionsBtn = document.getElementById('copy-transcriptions-cta')!;
      copyTranscriptionsBtn.innerHTML = Icons.COPY;
      copyTranscriptionsBtn.onclick = () => triggerCopy(copyTranscriptionsBtn, transcriptionsText);
    }
    if (summariesText.length > 0) {
      const copySummaryBtn = document.getElementById('copy-summary-cta')!;
      copySummaryBtn.innerHTML = Icons.COPY;
      copySummaryBtn.onclick = () => triggerCopy(copySummaryBtn, summariesText);
    }

    sendResponse({});
  }
  return true;
});

/**
 * Retranslate transcriptions interims to the target language when its required
 */
const onDemandTranscriptionsTranslation = async () => {
  /* Get the list of interims that require translation */
  const idxs: number[] = [];
  const texts: string[] = [];
  interims.forEach((interim: IInterim, index: number) => {
    if (interim.isFinal && !interim.translations[targetLang]) {
      idxs.push(index);
      texts.push(interim.translations[Languages.EN]);
    }
  });

  /* Call to translate missing translations */
  const translations = await translateTexts(texts, targetLang);

  /* Update the interim with the translation */
  idxs.forEach((idx: number, index: number) => {
    interims[idx].translations[targetLang] = translations[index].text;
  });
};

/**
 * Retranslate summeries bullet to the target language when its required
 */
const onDemandSummariesTranslation = async () => {
  /* Get the list of summaries that require translation */
  const idxs: number[] = [];
  const texts: string[] = [];
  summaries.forEach((summary: ISummary, index: number) => {
    if (!summary.translations[targetLang] && summary.translations[Languages.EN]) {
      idxs.push(index);
      texts.push(summary.translations[Languages.EN]);
    }
  });

  /* Call to translate missing translations */
  const translations = await translateTexts(texts, targetLang);

  /* Update the summary with the translation */
  idxs.forEach((idx: number, index: number) => {
    summaries[idx].translations[targetLang] = translations[index].text;
  });
};

/**
 * Handle the language selector change
 * @param ev
 */
const languageSelectorOnChange = async (ev: Event) => {
  const selectEl = ev.target as HTMLSelectElement;
  targetLang = selectEl.value;

  /* Translate the transcriptions and summaries if its required */
  await onDemandTranscriptionsTranslation();
  await onDemandSummariesTranslation();

  showTextContent();
};

/** Inits screen components */
const initComponents = async () => {
  await I18n.init();

  const titleTitle = document.getElementById('title-title')!;
  const titleType = document.getElementById('title-type')!;
  const titleUrl = document.getElementById('title-url')!;
  const titleStartTime = document.getElementById('title-startTime')!;
  const downloadCta = document.getElementById('cta-download-button')!;
  const titleTranscriptions = document.getElementById('title-transcriptions')!;
  const titleSummary = document.getElementById('title-summary')!;

  /* Add the language selector */
  const transcriptionHeader = document.querySelector('.cta-section') as HTMLElement;
  languageSwitcher = await I18n.getLanguageSwitcher(['language-picker'], targetLang, languageSelectorOnChange);
  transcriptionHeader.append(languageSwitcher);

  titleTitle.innerText = I18n.t('transcriptions_result.title', titleTitle);
  titleType.innerText = I18n.t('transcriptions_result.type', titleType);
  titleUrl.innerText = I18n.t('transcriptions_result.url', titleUrl);
  titleStartTime.innerText = I18n.t('transcriptions_result.startTime', titleStartTime);
  downloadCta.innerText = I18n.t('transcriptions_result.download', downloadCta);
  titleTranscriptions.innerText = I18n.t('transcriptions_result.transcriptions', titleTranscriptions);
  titleSummary.innerText = I18n.t('transcriptions_result.summary', titleSummary);
};
initComponents();
