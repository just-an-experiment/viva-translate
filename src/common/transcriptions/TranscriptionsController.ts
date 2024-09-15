import Gladia from '../gladia';
import CCBox from '../views/CCBox';
import TBox from '../views/TBox';
import {
  Icons, InternalEvents, Languages, MeetType
} from '../constants';
import InterimHandler from './InterimHandler';
import I18n from '../utils/language';
import { IInterim } from '../types';
import TranscriptionsData from './TranscriptionsData';
import Settings from '../utils/Settings';
import { translateTexts } from '../api';

class TranscriptionsController {
  public usersList: any;

  private static instance: TranscriptionsController;

  private meet: any;

  private lastIndex: number;

  private interimHandler: Record<number, InterimHandler>;

  private popup: TBox | undefined;

  private constructor() {
    this.lastIndex = 0;
    this.interimHandler = {};

    Settings.shared.on(InternalEvents.SPEAKER_OUT, () => {
      this.onDemandTranslation();
    });
  }

  /**
   * Get the singleton class instance
   */
  public static get shared(): TranscriptionsController {
    if (!TranscriptionsController.instance) {
      TranscriptionsController.instance = new TranscriptionsController();
    }
    return TranscriptionsController.instance;
  }

  public setMeet(meet: any) {
    this.meet = meet;
  }

  /**
   * Update the number of messages not seen by the user in the transcription-box
   */
  // eslint-disable-next-line class-methods-use-this
  private updateMessageCounter() {
    if (this.popup?.components.newMessageButton) {
      const newMessageCounter = TranscriptionsData.interims.filter((interim) => {
        const handler: InterimHandler = this.interimHandler[interim.id];
        return handler.msg.getAttribute('aria-shown') === 'false';
      }).length;

      if (newMessageCounter === 0) return;

      const newMessagesTitle = newMessageCounter === 1 ? 'meetings.new_message' : 'meetings.new_messages';
      this.popup.components.newMessageButton.innerHTML = `
        ${Icons.ARROW_DOWN}
        ${newMessageCounter}&nbsp;
        ${I18n.t(newMessagesTitle, this.popup.components.newMessageButton)}
      `;

      this.popup.components.newMessageButton.hidden = false;
    }
  }

  private observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.intersectionRatio > 0 && entry.target.getAttribute('aria-shown') === 'false') {
          entry.target.setAttribute('aria-shown', 'true');
          this.updateMessageCounter();
        }
      });
    },
    { rootMargin: '0px', threshold: 1.0 }
  );

  /**
   * Handle transcriptions from speaker
   */
  public handleTranscriptions(popup?: TBox) {
    /* Listen for interim message event */
    this.popup = popup;

    Gladia.setInterimListener((interim: IInterim) => {
      if (!Gladia.isEnabled || !popup) return;

      const targetLang = Settings.shared.speakerOutLang;

      /* If the interim is final then store them for language switch */
      if (interim.isFinal) {
        /* Store the final interim for language switch or export */
        const obj: IInterim[] = TranscriptionsData.interims.filter((value: any) => value.id === interim.id);
        if (!obj || obj.length === 0) {
          TranscriptionsData.interims.push(interim);
        } else {
          obj[0].originalLang = interim.originalLang;
          obj[0].originalText = interim.originalText;
          obj[0].translations[interim.originalLang] = interim.originalText;
          obj[0].translations[targetLang] = interim.translations[targetLang];
          obj[0].translations[Languages.EN] = interim.translations[Languages.EN];
          obj[0].index = interim.index;
        }
      }

      /* Ignore invalid interims */
      if (interim.translations[targetLang]?.length <= 0) return;

      if (!this.interimHandler[interim.id]) {
        const obj = new InterimHandler(
          interim.id,
          popup.isLiveCC ? MeetType.LIVE_CC : this.meet?.type,
        );
        this.interimHandler[interim.id] = obj;
        this.observer.observe(obj.msg);
        popup.msgsContainer?.appendChild(obj.msg);
        if (!popup.preventScroll) setTimeout(() => popup.autoScrollTo(), 100);
      }

      const handler: InterimHandler = this.interimHandler[interim.id];
      if (!handler || (!interim.isFinal &&
        (handler.index > interim.index))) {
        return;
      }
      handler.addInterim(interim);
      if (!popup.preventScroll) setTimeout(() => popup.autoScrollTo(), 100);

      if (!interim.isFinal &&
        (this.lastIndex > interim.index)) {
        return;
      }
      this.lastIndex = interim.index;

      CCBox.shared.addInterim({ targetText: interim.translations[targetLang], isFinal: interim.isFinal });

      if (interim.isFinal) {
        if (
          popup.preventScroll &&
          popup.msgsContainer &&
          !popup.msgsContainer.hidden &&
          popup.msgsContainer.scrollHeight - popup.msgsContainer.scrollTop >= popup.msgsContainer.clientHeight + 10
        ) {
          Gladia.showNewMessageBtn = true;
          this.updateMessageCounter();
        }
      }

      /* Move side bar scroll bars to the bottom if its required */
      if (!popup?.preventScroll) {
        popup?.autoScrollTo();
        Gladia.showNewMessageBtn = false;
      }
    });
  }

  /**
   * Retranslate transcriptions interims to the target language when its required
   */
  private onDemandTranslation() {
    /* Get the target language */
    const targetLang = Settings.shared.speakerOutLang;

    /* Get the list of interims that require translation */
    const idxs: number[] = [];
    const texts: string[] = [];
    TranscriptionsData.interims.forEach((interim: IInterim, index: number) => {
      if (interim.isFinal && !interim.translations[targetLang]) {
        idxs.push(index);
        texts.push(interim.translations[Languages.EN]);
      }
    });

    /* Call to translate missing translations */
    translateTexts(texts, targetLang).then((translations) => {
      /* Update the interim with the translation */
      idxs.forEach((idx: number, index: number) => {
        TranscriptionsData.interims[idx].translations[targetLang] = translations[index].text;
      });

      /* Update all interims in the DOM */
      TranscriptionsData.interims.forEach((interim: IInterim) => {
        this.interimHandler[interim.id].addInterim(interim);
      });
    });
  }
}

const TranscriptionsCtrl = TranscriptionsController.shared;
export default TranscriptionsCtrl;
