import { Icons, RunMode } from '../../constants';
import Settings from '../../utils/Settings';
import Tooltip, { TooltipPosition } from '../Tooltip';
import CloseCaptionSection from './CloseCaptionSection';
import SectionComponent from './SectionComponent';
import SettingsSection from './SettingsSection';
import SettingsWebSection from './SettingsWebSection';
import SummarySection from './SummarySection';
import SwitchSidePanel from './SwithPanelSection';

const $ = document;

class ButtonsSection extends SectionComponent {
  private static instance: ButtonsSection;

  private subtitlesBtn: HTMLButtonElement | string;

  private summaryBtn: HTMLButtonElement | string;

  private switchSidePanel: HTMLButtonElement | string;

  private settingsBtn: HTMLButtonElement | string;

  private minimizeBtn: HTMLButtonElement;

  private onMinimize: () => void;

  private constructor(onMinimize: () => void) {
    super();
    this.container = $.createElement('div');
    this.container.classList.add('buttons-section');
    this.onMinimize = onMinimize;

    /** Creates CC button * */
    this.subtitlesBtn = CloseCaptionSection.shared.activatorComponent || '';

    /** Creates summary button * */
    this.summaryBtn = SummarySection.shared.activatorComponent || '';

    /** Creates summary button * */
    // eslint-disable-next-line max-len
    this.switchSidePanel = Settings.shared.mode === RunMode.MEETING ? SwitchSidePanel.shared.activatorComponent || '' : '';

    /** Creates settings button * */
    const settings = Settings.shared.mode === RunMode.MEETING ? SettingsSection.shared : SettingsWebSection.shared;
    this.settingsBtn = settings.activatorComponent || '';

    /** Creates minimize button * */
    this.minimizeBtn = $.createElement('button');
    this.minimizeBtn.classList.add('icon-xl');
    this.minimizeBtn.addEventListener('click', () => this.onMinimize());
    this.minimizeBtn.innerHTML = `${Icons.MINIMIZE}`;
    const minimizeTooltip = new Tooltip(this.minimizeBtn, 'meetings.tooltips.minimize', {
      position: TooltipPosition.TOP,
    });
    this.minimizeBtn.appendChild(minimizeTooltip.element);

    /** Adds buttons to container * */
    this.container.append(
      this.subtitlesBtn,
      this.summaryBtn,
      this.settingsBtn,
      this.switchSidePanel,
      this.minimizeBtn
    );
  }

  public static get shared(): ButtonsSection {
    if (!ButtonsSection.instance) throw new Error('Instance not initialized');
    return ButtonsSection.instance;
  }

  public static initialize(onMinimize: () => void) {
    if (ButtonsSection.instance) return;
    ButtonsSection.instance = new ButtonsSection(onMinimize);
  }

  public hideSwitchSidePanel() {
    if (this.switchSidePanel instanceof HTMLButtonElement) this.switchSidePanel.style.display = 'none';
  }
}

export default ButtonsSection;
