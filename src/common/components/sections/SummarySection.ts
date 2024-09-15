import { Icons } from '../../constants';
import Tooltip, { TooltipPosition } from '../Tooltip';
import SectionComponent from './SectionComponent';
import I18n from '../../utils/language';

class SummarySection extends SectionComponent {
  private static instance: SummarySection;

  public toggleSummarySection: any;

  private constructor() {
    super(true, 'LIST');
    this.initActivator();
  }

  public static get shared(): SummarySection {
    if (!SummarySection.instance) {
      SummarySection.instance = new SummarySection();
    }
    return SummarySection.instance;
  }

  /** Creates and injects the button to toggle the summary view on/off. */
  private initActivator() {
    if (!this.activator) return;
    this.activator.addEventListener('click', () => {
      if (this.toggleSummarySection) this.toggleSummarySection();
    });
    this.activator.classList.add('icon-md', 'btn-active');
    this.activator.innerHTML = `${Icons.LIST}`;
    const tooltip = new Tooltip(this.activator, 'meetings.tooltips.summary', {
      position: TooltipPosition.TOP,
    });
    this.activator.appendChild(tooltip.element);
  }

  /** Updates the tooltip text. */
  public updateTooltip(key: string) {
    const spanEl = this.activator?.querySelector('.viva-tooltip__text') as HTMLSpanElement;
    if (!spanEl) return;
    spanEl.setAttribute('data-viva-i18n', key);
    spanEl.innerText = I18n.t(key);
  }
}

export default SummarySection;
