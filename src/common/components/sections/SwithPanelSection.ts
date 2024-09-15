import { Icons } from '../../constants';
import Tooltip, { TooltipPosition } from '../Tooltip';
import SectionComponent from './SectionComponent';

class SwithPanelSection extends SectionComponent {
  private static instance: SwithPanelSection;

  public toggleSwithPanelSection: any;

  private constructor() {
    super(true, 'SWITCH_PANEL');
    this.initActivator();
  }

  public static get shared(): SwithPanelSection {
    if (!SwithPanelSection.instance) {
      SwithPanelSection.instance = new SwithPanelSection();
    }
    return SwithPanelSection.instance;
  }

  /** Creates and injects the button to toggle the summary view on/off. */
  private initActivator() {
    if (!this.activator) return;
    this.activator.addEventListener('click', () => {
      if (this.toggleSwithPanelSection) this.toggleSwithPanelSection();
    });
    this.activator.classList.add('icon-md');
    this.activator.innerHTML = `${Icons.SWITCH_PANEL}`;
    const tooltip = new Tooltip(this.activator, 'meetings.tooltips.switchPanel', {
      position: TooltipPosition.TOP,
    });
    this.activator.appendChild(tooltip.element);
  }
}

export default SwithPanelSection;
