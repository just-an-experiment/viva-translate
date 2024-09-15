import I18n from '../utils/language';
import { GeneralClasses } from '../constants';

export enum TooltipPosition {
  BOTTOM = 'bottom',
  TOP = 'top',
}
export enum TooltipType {
  STATIC = 'static',
  NORMAL = 'normal',
}

export interface TooltipConfig {
  position: TooltipPosition;
  type?: TooltipType
}

class Tooltip {
  tooltipEl: HTMLDivElement;

  hoverEl: HTMLElement;

  config: TooltipConfig;

  customClasses: string[] = [];

  constructor(
    hoverEl: HTMLElement,
    textKey: string,
    config: TooltipConfig,
    customClasses?: string[],
  ) {
    this.tooltipEl = document.createElement('div');
    this.hoverEl = hoverEl;
    this.config = config;
    if (customClasses?.length) this.customClasses = customClasses;
    if (hoverEl) this.createElement(textKey);
  }

  /**
   * Creates a tooltip element
   * @param textKey Text to be rendered inside of the tooltip.
   */
  private createElement(textKey: string): void {
    if (!textKey.length) return;
    this.hoverEl.style.position = 'relative';
    this.tooltipEl.classList.add('viva-tooltip', ...this.customClasses);
    const textEl = document.createElement('span');
    textEl.classList.add('viva-tooltip__text');
    textEl.innerHTML = `${I18n.t(textKey, textEl)}`;
    this.tooltipEl.appendChild(textEl);
    this.tooltipEl.hidden = true;

    this.setPosition();
    this.setListeners();
  }

  /** Set listeners to show/hide the tooltip. */
  private setListeners(): void {
    if (this.config.type !== TooltipType.STATIC) {
      this.hoverEl.addEventListener('mouseover', () => {
        if (!this.tooltipEl.hidden) return;
        this.setPosition();
        this.tooltipEl.hidden = false;
      });
      this.hoverEl.addEventListener('mouseleave', () => {
        if (this.tooltipEl.hidden) return;
        this.tooltipEl.hidden = true;
      });
      this.hoverEl.addEventListener('click', () => {
        if (this.tooltipEl.hidden) return;
        this.tooltipEl.hidden = true;
      });
    } else {
      this.tooltipEl.addEventListener('click', () => {
        this.tooltipEl.hidden = true;
      });
      const btnEl = document.createElement('button');
      btnEl.classList.add(GeneralClasses.GRADIENT_BTN);
      btnEl.innerHTML = `${I18n.t('meetings.tooltips.button', btnEl)}`;
      btnEl.addEventListener('click', () => {
        this.tooltipEl.hidden = true;
      });
      this.tooltipEl.appendChild(btnEl);
    }
  }

  /** Sets the tooltip position class. */
  private setPosition(): void {
    /* Default values */
    this.tooltipEl.style.left = '50%';
    this.tooltipEl.style.right = 'unset';
    this.tooltipEl.style.transform = 'translateX(-50%)';
    this.tooltipEl.style[this.config.position === TooltipPosition.TOP ? 'bottom' : 'top'] = 'unset';

    /* Create dummy el to calculate correct position. */
    const tempEl = this.tooltipEl.cloneNode(true) as HTMLDivElement;
    this.hoverEl.appendChild(tempEl);
    tempEl.style[this.config.position] = `${-tempEl.getBoundingClientRect().height - 5}px`;
    const tempElRect = tempEl.getBoundingClientRect();
    this.hoverEl.removeChild(tempEl);

    const offsetPx = `${-tempElRect.height - 5}px`;
    this.tooltipEl.style[this.config.position] = offsetPx;

    /* Check if tooltip goes out of bounds on RIGHT size of parent element. */
    if (tempElRect.left + tempElRect.width > window.innerWidth) {
      this.tooltipEl.style.left = 'unset';
      this.tooltipEl.style.right = '0';
      this.tooltipEl.style.transform = 'translateX(0)';
    }

    /* Check if tooltip goes out of bounds on LEFT size of parent element. */
    const parentElRect = this.hoverEl?.parentElement?.parentElement?.getBoundingClientRect();
    if (parentElRect && tempElRect?.left < parentElRect?.left) {
      this.tooltipEl.style.left = '0';
      this.tooltipEl.style.transform = 'translateX(-10px)';
    }

    if (tempElRect.left < 0) {
      this.tooltipEl.style.left = `calc(50% - ${tempElRect.left}px)`;
    }

    if (this.config.position === TooltipPosition.TOP && tempElRect.top < 0) {
      this.tooltipEl.style.top = 'unset';
      this.tooltipEl.style.bottom = offsetPx;
    }

    if (this.config.position === TooltipPosition.BOTTOM && tempElRect.bottom >= window.innerHeight) {
      this.tooltipEl.style.top = offsetPx;
      this.tooltipEl.style.bottom = 'unset';
    }
  }

  public get element(): HTMLDivElement {
    return this.tooltipEl;
  }
}

export default Tooltip;
