import { GeneralClasses, Icons } from '../../constants';
import Gladia from '../../gladia';
import { padWithZero } from '../../utils/helpers';
import Tooltip, { TooltipPosition } from '../Tooltip';
import CloseCaptionSection from './CloseCaptionSection';
import SectionComponent from './SectionComponent';
import I18n from '../../utils/language';
import { showTranscriptionResults } from '../../api';
import TranscriptionsData from '../../transcriptions/TranscriptionsData';
import Settings from '../../utils/Settings';

const $ = document;

class RecordingSection extends SectionComponent {
  private static instance: RecordingSection;

  private recordBtn: HTMLButtonElement;

  private pauseBtn: HTMLButtonElement;

  private startBtn: HTMLButtonElement;

  private timer: HTMLSpanElement;

  private timerActive: boolean = false;

  private timerInterval?: ReturnType<typeof setInterval>;

  private hours = 0;

  private minutes = 0;

  private seconds = 0;

  private constructor() {
    super();
    this.container.classList.add('recording-section');
    this.recordBtn = $.createElement('button');
    this.recordBtn.classList.add('recording-section__recording');
    this.recordBtn.addEventListener('click', async () => {
      /* Show the transcription results */
      await showTranscriptionResults(Settings.shared.speakerOutLang);
      TranscriptionsData.reset();
      CloseCaptionSection.shared.toggleSubtitles(true, false);
      if (this.onClose) this.onClose(true);
    });
    const rTooltip = new Tooltip(this.recordBtn, 'meetings.tooltips.stop_recording', {
      position: TooltipPosition.TOP,
    });
    this.recordBtn.append(rTooltip.element);

    this.pauseBtn = $.createElement('button');
    this.pauseBtn.classList.add('recording-section__pause');
    this.pauseBtn.innerHTML = `${Icons.PAUSE}`;
    const pTooltip = new Tooltip(this.pauseBtn, 'meetings.tooltips.pause_recording', { position: TooltipPosition.TOP });
    this.pauseBtn.append(pTooltip.element);

    this.startBtn = $.createElement('button');
    this.startBtn.hidden = true;
    this.startBtn.classList.add('recording-section__pause');
    this.startBtn.innerHTML = `${Icons.PLAY}`;
    const sTooltip = new Tooltip(this.startBtn, 'meetings.tooltips.start_recording', { position: TooltipPosition.TOP });
    this.startBtn.append(sTooltip.element);

    this.pauseBtn.addEventListener('click', this.callPauseTranscripts);
    this.startBtn.addEventListener('click', this.callContinueTranscripts);

    this.timer = this.initTimer();

    this.container.append(this.recordBtn, this.pauseBtn, this.startBtn, this.timer);
  }

  public static get shared(): RecordingSection {
    if (!RecordingSection.instance) {
      RecordingSection.instance = new RecordingSection();
    }
    return RecordingSection.instance;
  }

  public resetTimer() {
    this.hours = 0;
    this.minutes = 0;
    this.seconds = 0;
  }

  /** Returns a span element with the meeting duration (updating every second). */
  // eslint-disable-next-line class-methods-use-this
  private initTimer(): HTMLSpanElement {
    const relativeTimeEl = $.createElement('span');
    relativeTimeEl.classList.add('recording-section__time');
    relativeTimeEl.innerText = '00:00';

    this.timerInterval = setInterval(() => {
      if (!this.timerActive) return;
      this.seconds += 1;
      if (this.seconds > 59) {
        this.minutes += 1;
        this.seconds %= 60;
      }
      if (this.minutes > 59) {
        this.hours += 1;
        this.minutes %= 60;
      }
      // eslint-disable-next-line max-len
      relativeTimeEl.innerText = `${this.hours > 0 ? `${this.hours}:` : ''}${padWithZero(this.minutes)}:${padWithZero(
        this.seconds
      )}`;
      Gladia.customTimeInMs += 1000;
    }, 1000);
    return relativeTimeEl;
  }

  /** Resumes the timer by setting the flag timerActive to true. */
  private resumeTimer(): void {
    this.pauseBtn.hidden = false;
    this.startBtn.hidden = true;
    this.timerActive = true;
    this.sendNotification('meetings.viva_messages.resume_transcript');
  }

  /** Pauses the current timer and updates the UI accordingly. */
  private pauseTimer(): void {
    const wasActive = this.timerActive;
    this.pauseBtn.hidden = true;
    this.startBtn.hidden = false;
    this.timerActive = false;

    if (wasActive) {
      this.sendNotification('meetings.viva_messages.pause_transcript');
    }
  }

  private callPauseTranscripts = () => {
    this.pauseTranscripts();
  };

  private callContinueTranscripts = () => {
    this.continueTranscripts();
  };

  public isPaused() {
    return this.pauseBtn.hidden;
  }

  public pauseTranscripts = () => {
    const activator = $?.querySelector('.viva-toolbox__toggle') as HTMLElement;
    if (activator) {
      activator.title = I18n.t('meetings.tooltips.not_active');
      activator?.parentElement?.classList.remove(GeneralClasses.VIVA_ACTIVATOR_LISTENING);
    }
    Gladia.paused = true;
    this.pauseTimer();
  };

  public continueTranscripts = () => {
    const activator = $?.querySelector('.viva-toolbox__toggle') as HTMLElement;
    if (activator) {
      activator.title = I18n.t('meetings.tooltips.active');
      activator?.parentElement?.classList.add(GeneralClasses.VIVA_ACTIVATOR_LISTENING);
    }
    Gladia.paused = false;
    this.resumeTimer();
  };

  public destroy() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    super.destroy();
  }
}

export default RecordingSection;
