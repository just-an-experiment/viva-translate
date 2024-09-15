import { SelectOption } from '../../types';
import I18n from '../../utils/language';
import Select from '../Select';
import Settings from '../../utils/Settings';
import { SupportedLocales } from '../../constants';

function getSpeakerOutContainer(labelCaption?: string): HTMLDivElement {
  const langSelectOptions: SelectOption[] = I18n.supportedLangs.map((locale: string) => ({
    text: SupportedLocales[locale as keyof typeof SupportedLocales],
    value: locale,
  }));

  const speakerOutContainer = document.createElement('div');
  speakerOutContainer.id = 'transcript-lang';
  speakerOutContainer.classList.add('select-box');
  const speakerOutLabel = document.createElement('span');
  speakerOutLabel.innerHTML = `${I18n.t(labelCaption || 'meetings.speaker_transcription', speakerOutLabel)}`;
  const speakerOutDefault: SelectOption | undefined = langSelectOptions.find(
    (option) => option.value === Settings.shared.speakerOutLang
  );

  const selectEl = new Select(
    (value: string) => {
      Settings.shared.speakerOutLang = value;
    },
    langSelectOptions,
    speakerOutDefault,
    undefined
  ).element;
  speakerOutContainer.append(speakerOutLabel, selectEl);
  return speakerOutContainer;
}

export default getSpeakerOutContainer;
