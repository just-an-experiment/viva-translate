import { IInterim, ISummary } from '../types';
import { generateAIFeature, translateTexts } from '../api';
import TBox from '../views/TBox';
import I18n from '../utils/language';
import SummarySection from '../components/sections/SummarySection';
import Settings from '../utils/Settings';
import { AIFeatures, InternalEvents, Languages } from '../constants';
import TranscriptionsData from './TranscriptionsData';

export enum SummaryClasses {
  CONTAINER = 'meeting-summary',
  SECTION = 'meeting-summary__section',
  PLACEHOLDER = 'meeting-summary__placeholder',
  lIST = 'meeting-summary__list',
  ITEM = 'meeting-summary__item',
}

export interface SummaryComponents {
  container: HTMLDivElement;
  section?: HTMLDivElement;
  title?: HTMLHeadingElement;
  placeholder?: HTMLSpanElement;
  bulletList?: HTMLUListElement;
  bulletItems?: HTMLLIElement[];
}

/* Every 5 minutes we request the summaries. */
export const MINUTE_INTERVAL = 2;
export const PETITION_INTERVAL = MINUTE_INTERVAL * 60000;

class SummaryHandler {
  private static instance: SummaryHandler;

  public components: SummaryComponents;

  public canRequestSummary = true;

  private lastSummaryDate: number = Date.now();

  private petitionInterval?: ReturnType<typeof setInterval>;

  private initialized = false;

  private constructor() {
    this.components = {
      container: document.createElement('div'),
    };
    Settings.shared.on(InternalEvents.SPEAKER_OUT, () => {
      this.onDemandTranslation();
    });
  }

  public static get shared(): SummaryHandler {
    if (!SummaryHandler.instance) {
      SummaryHandler.instance = new SummaryHandler();
    }
    return SummaryHandler.instance;
  }

  public initialize() {
    if (!this.initialized) {
      this.initialized = true;
      this.reset();
    }
  }

  /** Creates and inserts all elements needed for the summary section. */
  public async reset() {
    this.components.container.innerHTML = '';
    this.components.container.classList.add(SummaryClasses.CONTAINER);
    this.components.container.hidden = false;
    this.components.section = document.createElement('div');
    this.components.section.classList.add(SummaryClasses.SECTION);
    this.components.title = document.createElement('h2');
    this.components.title.innerText = `${I18n.t('meetings.tooltips.summary')}`;
    this.components.bulletList = document.createElement('ul');
    this.components.bulletList.classList.add(SummaryClasses.lIST);
    this.components.placeholder = document.createElement('span');
    this.components.placeholder.classList.add(SummaryClasses.PLACEHOLDER);
    this.components.placeholder.innerText = `${I18n.t('meetings.summaries.placeholder')}`;

    this.components.section.append(this.components.bulletList, this.components.placeholder);
    this.components.container.append(this.components.title, this.components.section);
    TBox.shared.components?.secondContainer?.appendChild(this.components.container);
    this.initSummaryRequests();
    this.toggleSummarySection(false);
    this.components.bulletItems = [];
  }

  /** Requests summaries based on the interval time. */
  private initSummaryRequests = (): void => {
    if (this.petitionInterval) clearInterval(this.petitionInterval);
    this.petitionInterval = setInterval(async () => {
      await this.summaryRequest();
    }, PETITION_INTERVAL);
  };

  public summaryRequest = async () => {
    const maxTime = Date.now();
    const minTime = Math.max(maxTime - PETITION_INTERVAL, this.lastSummaryDate);

    const messages: IInterim[] | undefined = TranscriptionsData.interims.filter((interim: IInterim) => {
      const msgTime = interim.createdAt;
      return interim.isFinal && msgTime >= minTime && msgTime <= maxTime
        && (interim.translations[Languages.EN] || '').length > 0;
    });

    if (messages.length > 0) {
      const response = await generateAIFeature(
        AIFeatures.Sumamry,
        Settings.shared.speakerOutLang ?? 'EN',
        messages
      );

      /* Check if transcripts share was enabled */
      if (!response || response?.error) {
        return;
      }

      const bullets: Record<string, string>[] = [];

      Object.keys(response).forEach((lang: string) => {
        response[lang].forEach((item: string, idx: number) => {
          if (idx >= bullets.length) {
            bullets.push({});
          }
          bullets[idx][lang] = item;
        });
      });
      this.addBulletToList(bullets);

      if (this.components.placeholder
        && this.components.bulletList && this.components.bulletList.children?.length > 0) {
        this.components.placeholder.remove();
      }
    }
    this.lastSummaryDate = maxTime;
  };

  /** Adds a summary bullet to the list */
  private addBulletToList = (bullets: Record<string, string>[]): void => {
    if (!bullets || bullets.length === 0) return;

    const targetLanguage = Settings.shared.speakerOutLang;

    bullets.forEach((bullet: Record<string, string>) => {
      /* Register the summary entry */
      const idx = TranscriptionsData.summaries.length;
      const summary: ISummary = {
        id: idx,
        translations: bullet,
      };
      TranscriptionsData.summaries.push(summary);

      /* Create the bullet element */
      const bulletEl = document.createElement('li');
      bulletEl.setAttribute('id', `summary-${idx}`);
      bulletEl.classList.add(SummaryClasses.ITEM);
      bulletEl.innerHTML = `${bullet[targetLanguage]}`;
      if (this.components.bulletList) {
        this.components.bulletList.appendChild(bulletEl);
      }
      this.components.bulletItems?.push(bulletEl);
    });
  };

  /** Toggles the visibility of the summary section within the transcription box. */
  public toggleSummarySection = (active: boolean): void => {
    this.components.container.hidden = !active;
    if (active) SummarySection.shared.show();
    else SummarySection.shared.hide();
  };

  /** Starts the interval to retrieve summaries. */
  public start(): void {
    this.canRequestSummary = true;
  }

  /** Pauses the summary retrieval process. */
  public pause(): void {
    this.canRequestSummary = false;
  }

  /** Resets summary handler values and stops interval. */
  public async close() {
    await this.summaryRequest();
    clearInterval(this.petitionInterval);
  }

  /**
   * Retranslate summaries to the target language when its required
   */
  private onDemandTranslation() {
    /* Get the target language */
    const targetLang = Settings.shared.speakerOutLang;

    /* Get the list of summaries that require translation */
    const idxs: number[] = [];
    const texts: string[] = [];
    TranscriptionsData.summaries.forEach((summary: ISummary, index: number) => {
      if (!summary.translations[targetLang] && summary.translations[Languages.EN]) {
        idxs.push(index);
        texts.push(summary.translations[Languages.EN]);
      }
    });

    /* Call to translate missing translations */
    translateTexts(texts, targetLang).then((translations) => {
      /* Update the summary with the translation */
      idxs.forEach((idx: number, index: number) => {
        TranscriptionsData.summaries[idx].translations[targetLang] = translations[index].text;
      });

      /* Update all summaries in the DOM */
      TranscriptionsData.summaries.forEach((summary: ISummary, index: number) => {
        if (this.components.bulletItems && index < this.components.bulletItems.length) {
          this.components.bulletItems[index].innerHTML = summary.translations[targetLang];
        }
      });
    });
  }
}

export default SummaryHandler;
