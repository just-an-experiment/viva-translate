import Settings from '../../utils/Settings';
import { Icons, InternalEvents, VERSION } from '../../constants';
import Tooltip, { TooltipPosition } from '../Tooltip';
import SectionComponent from './SectionComponent';
import getSpeakerOutContainer from '../pickers/lang-pickers';
import I18n from '../../utils/language';
import SubtitleFontPicker from '../pickers/SubtitleFontPicker';
import Toggle from '../Toggle';

const $ = document;

class SettingsWebSection extends SectionComponent {
  private static instance: SettingsWebSection;

  private speakerOutLangSelect?: HTMLSelectElement;

  public toggleSettingsSection: any;

  private learningModeToggle?: HTMLDivElement;

  private constructor() {
    super(true, 'SETTINGS');
    this.initActivator();
    this.initSection();

    Settings.shared.on(InternalEvents.SPEAKER_OUT, (newValue: string) => {
      if (this.speakerOutLangSelect) this.speakerOutLangSelect.value = newValue;
    });
  }

  public static get shared(): SettingsWebSection {
    if (!SettingsWebSection.instance) {
      SettingsWebSection.instance = new SettingsWebSection();
    }
    return SettingsWebSection.instance;
  }

  /** Creates and injects the settings button to go to the settings section. */
  private initActivator() {
    if (!this.activator) return;

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
    const speakerOut = getSpeakerOutContainer('any_web_transcription.output');
    languagePickers.appendChild(speakerOut);
    this.speakerOutLangSelect = speakerOut.lastChild as HTMLSelectElement;

    return languagePickers;
  }

  private initSection() {
    this.container.classList.add('settings-section');
    this.container.hidden = true;

    const langPickerTitle = $.createElement('h2');
    langPickerTitle.innerHTML = `${I18n.t('meetings.settings.lang_picker_title', langPickerTitle)}`;

    const langPicker = this.getLanguagePickers();

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

    const subtitleSizePicker = new SubtitleFontPicker().container;

    const version = $.createElement('span');
    version.classList.add('settings-container__version');
    version.innerHTML = `${I18n.t('general.version')} ${VERSION}`;

    this.container.append(
      langPickerTitle,
      langPicker,
      this.learningModeToggle,
      subtitleSizePicker,
      version
    );
  }

  public setFreeSettings() {
    this.learningModeToggle?.remove();
  }
}

export default SettingsWebSection;
