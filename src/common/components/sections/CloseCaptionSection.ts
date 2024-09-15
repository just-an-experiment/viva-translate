import CCBox from '../../views/CCBox';
import { Icons } from '../../constants';
import Tooltip, { TooltipPosition } from '../Tooltip';
import SectionComponent from './SectionComponent';

class CloseCaptionSection extends SectionComponent {
  private static instance: CloseCaptionSection;

  public parent: any;

  private constructor() {
    super(true, 'SUBTITLE');
    this.initActivator();
  }

  public static get shared(): CloseCaptionSection {
    if (!CloseCaptionSection.instance) {
      CloseCaptionSection.instance = new CloseCaptionSection();
    }
    return CloseCaptionSection.instance;
  }

  /** Creates and injects the button to toggle subtitles on/off. */
  private initActivator() {
    if (!this.activator) return;

    this.activator.classList.add('icon-md');
    this.activator.addEventListener('click', () => {
      this.toggleSubtitles(false, false);
    });
    this.activator.innerHTML = `${Icons.SUBTITLE}`;
    const tooltip = new Tooltip(this.activator, 'meetings.tooltips.captions', {
      position: TooltipPosition.TOP,
    });
    this.activator.appendChild(tooltip.element);
  }

  /**
   * Toggle on/off subtitles
   */
  public async toggleSubtitles(
    forceOff = false,
    isSidePanel = false,
  ): Promise<void> {
    const ccBox = CCBox.shared;
    if (forceOff || ccBox.isVisible) {
      ccBox.removeFromPage();
      this.activator?.classList.remove('btn-active');
    } else {
      ccBox.addToPage(isSidePanel);
      this.activator?.classList.add('btn-active');
    }

    this.parent?.onPopupResize();
  }

  /** Check if CC is active */
  public isActive(): boolean | undefined {
    return this.activator?.classList.contains('btn-active');
  }
}

export default CloseCaptionSection;
