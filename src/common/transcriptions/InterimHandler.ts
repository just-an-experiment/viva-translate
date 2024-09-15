import Settings from '../utils/Settings';
import { msToHMS } from '../utils/helpers';
import Gladia from '../gladia';
import { IInterim } from '../types';
import { Languages } from '../constants';

class InterimHandler {
  private id: number;

  public msg: HTMLDivElement;

  public index: number = 0;

  public paragraph: HTMLParagraphElement;

  public content: HTMLDivElement;

  private timestamp: HTMLSpanElement;

  constructor(
    id: number,
    meetType: string,
  ) {
    this.id = id;
    this.msg = document.createElement('div');
    this.msg.classList.add('interim', 'interim-text', 'block-no-animation', `viva-${meetType}`);
    this.msg.setAttribute('aria-shown', 'false');
    this.msg.style.display = 'none';

    this.content = document.createElement('div');
    this.content.classList.add('viva-message-content');

    this.timestamp = document.createElement('span');
    this.timestamp.classList.add('viva-message-timestamp');
    this.timestamp.textContent = '';

    this.paragraph = document.createElement('p');
    this.paragraph.classList.add('viva-message-content__text');
    this.paragraph.textContent = '';

    this.content.append(this.timestamp, this.paragraph);
    this.msg.append(this.content);
  }

  public addInterim(interim: IInterim) {
    if (interim.isSystem) {
      this.paragraph.textContent = interim.translations[Languages.EN];

      if (interim.additionalText) {
        const additionalText = document.createElement('span');
        additionalText.innerText = `${interim.additionalText}.`;
        this.paragraph.append(additionalText);
      }

      /* Remove the timestamp line */
      this.content.removeChild(this.timestamp);

      /* Add the viva logo */
      const avatar = document.createElement('span');
      avatar.classList.add('viva-message-speaker-image', 'bg-viva');
      this.msg.prepend(avatar);

      this.close();
      this.msg.style.display = 'flex';
      return;
    }

    this.index = interim.index;
    const targetLang = Settings.shared.speakerOutLang;

    if (interim.originalLang !== targetLang) {
      this.paragraph.innerHTML = `
        <span class="translated-text">${interim.translations[targetLang]}</span>
        <span class="original-transcript" ${Settings.shared.learningMode ? '' : 'hidden'}>${interim.originalText}</span>
      `;
    } else {
      this.paragraph.textContent = interim.translations[targetLang];
    }

    if (interim.isFinal) {
      this.close();
    }
    this.msg.style.display = 'flex';
  }

  public close() {
    this.timestamp.textContent = msToHMS(Gladia.customTimeInMs);
    if (this.id) {
      this.paragraph.setAttribute('id', `transcription-${this.id}`);
    }
    /* Remove interim text color */
    this.msg.classList.remove('interim-text', 'interim--secondary');
    this.msg.classList.add('interim--primary');
  }
}

export default InterimHandler;
