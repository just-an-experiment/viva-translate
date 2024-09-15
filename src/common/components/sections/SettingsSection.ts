import { Icons, InternalEvents } from '../../constants';
import I18n from '../../utils/language';
import Settings from '../../utils/Settings';
import getSpeakerOutContainer from '../pickers/lang-pickers';
import SubtitleFontPicker from '../pickers/SubtitleFontPicker';
import Toggle from '../Toggle';
import Tooltip, { TooltipPosition } from '../Tooltip';
import SectionComponent from './SectionComponent';

const $ = document;

class SettingsSection extends SectionComponent {
  private static instance: SettingsSection;

  private speakerOutLangSelect?: HTMLSelectElement;

  public toggleSettingsSection: any;

  private ownTranscriptToggle?: HTMLDivElement;

  private learningModeToggle?: HTMLDivElement;

  private constructor() {
    super(true, 'SETTINGS');
    this.initActivator();
    this.initSection();

    Settings.shared.on(InternalEvents.SPEAKER_OUT, (newValue: string) => {
      if (this.speakerOutLangSelect) this.speakerOutLangSelect.value = newValue;
    });
  }

  public static get shared(): SettingsSection {
    if (!SettingsSection.instance) {
      SettingsSection.instance = new SettingsSection();
    }
    return SettingsSection.instance;
  }

  /** Creates and injects the settings button to go to the settings section. */
  private initActivator() {
    if (!this.activator) return;
    this.activator.classList.add('icon-md');
    this.activator.addEventListener('click', () => {
      if (this.toggleSettingsSection) this.toggleSettingsSection();
    });
    this.activator.innerHTML = `${Icons.SETTINGS}`;
    const tooltip = new Tooltip(this.activator, 'meetings.tooltips.settings', {
      position: TooltipPosition.TOP,
    });
    this.activator.classList.add('icon-md');
    this.activator.appendChild(tooltip.element);
  }

  /**
   * Gets the language picker container. User can pick mic input + output
   * as well as speaker input + output languages.
   */
  private getLanguagePickers(): HTMLDivElement {
    const languagePickers = $.createElement('div');
    languagePickers.classList.add('option-container');

    /* Speaker OUT language */
    const speakerOut = getSpeakerOutContainer();
    languagePickers.appendChild(speakerOut);
    this.speakerOutLangSelect = speakerOut.lastChild as HTMLSelectElement;

    return languagePickers;
  }

  private initSection() {
    this.container.classList.add('settings-section');
    this.container.hidden = true;

    /* Title */
    const title = document.createElement('h2');
    const key = 'meetings.settings.title';
    title.innerText = `${I18n.t(key)}`;
    title.setAttribute('data-viva-i18n', key);

    /* Transcript Language */
    const transcriptLanguageContainer = this.getLanguagePickers();

    /* Your Speech */
    const showOwnTranscriptionToggle = new Toggle(
      Settings.shared.seeOwnTranscriptions,
      'meetings.settings.show_own_transcription'
    );
    showOwnTranscriptionToggle.onChangeListener((event: Event) => {
      const ownTranscriptions = (event?.target as HTMLInputElement).checked;
      Settings.shared.seeOwnTranscriptions = ownTranscriptions;
    });
    this.ownTranscriptToggle = showOwnTranscriptionToggle.container;

    /* Learning mode */
    const learningModeToggle = new Toggle(
      Settings.shared.learningMode,
      'meetings.settings.learning_mode'
    );
    learningModeToggle.onChangeListener((event: Event) => {
      const learningModeActive = (event?.target as HTMLInputElement).checked;
      Settings.shared.learningMode = learningModeActive;
    });
    this.learningModeToggle = learningModeToggle.container;

    Settings.shared.on(InternalEvents.LEARNING_MODE, (value: boolean) => {
      if (learningModeToggle) learningModeToggle.toggle.checked = value;
    });

    /* Subtitle Size */
    const fontPicker = new SubtitleFontPicker();
    const subtitleSizeContainer = fontPicker.container;

    // eslint-disable-next-line max-len
    this.container.append(title, transcriptLanguageContainer, this.ownTranscriptToggle, this.learningModeToggle, subtitleSizeContainer);
  }
}

export default SettingsSection;
