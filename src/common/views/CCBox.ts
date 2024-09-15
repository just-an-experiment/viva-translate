import {
  SUBTITLE_MIN_LINES,
  SUBTITLE_INIT_LINES,
  SUBTITLE_BORDER_MARGIN,
  INIT_IFRAME_WIDTH,
  Store
} from '../constants';
import ResizeContainer from '../components/ResizeContainer';
import StorageCtrl from '../Storage';
import { ICCBoxInterim } from '../types';

class CCBox {
  private static instance: CCBox;

  private frameContainer: HTMLDivElement;

  private wrapperContainer: HTMLDivElement;

  private frameWrapper: HTMLDivElement;

  private frameWrapper2: HTMLDivElement;

  public body?: HTMLDivElement;

  private isDragging: boolean = false;

  private dragCursorOffsetY?: number;

  private dragCursorOffsetX?: number;

  private pollInterval: any;

  private lastTimestamp: number = 0;

  public lines: string[] = [];

  private currentInterim: any[] = [];

  private visible: boolean = false;

  private subtitleMaxLines: number = SUBTITLE_INIT_LINES;

  private constructor() {
    this.frameContainer = document.createElement('div');
    this.frameWrapper = document.createElement('div');
    this.frameWrapper2 = document.createElement('div');
    this.wrapperContainer = document.createElement('div');
    this.wrapperContainer.classList.add('viva_styles_content', 'notranslate');
    this.wrapperContainer.appendChild(this.frameContainer);
    this.initFrameContainer();
    this.initListeners();
  }

  public static get shared(): CCBox {
    if (!CCBox.instance) {
      CCBox.instance = new CCBox();
    }
    return CCBox.instance;
  }

  /** Builds the frame container element. */
  private initFrameContainer(): void {
    this.frameContainer.setAttribute('id', 'viva-subtitle-frame');
    this.frameContainer.classList.add('viva-subtitle-frame');
    this.frameContainer.style.top = `${SUBTITLE_BORDER_MARGIN}px`;
    this.frameContainer.style.visibility = 'hidden';
    this.frameContainer.style.minWidth = `${INIT_IFRAME_WIDTH}px`;
    this.frameContainer.style.left = '50%';
    this.frameContainer.style.transform = `translateX(-${(INIT_IFRAME_WIDTH / 2) - SUBTITLE_BORDER_MARGIN}px)`;

    this.frameWrapper.classList.add(
      'viva-subtitle-wrapper',
      `text-size__${StorageCtrl.getItem(Store.SUBTITLE_FONT_SIZE)}`
    );
    this.frameWrapper2.classList.add(
      'viva-subtitle-wrapper2'
    );
    this.frameWrapper2.appendChild(this.frameWrapper);
    this.frameContainer.appendChild(this.frameWrapper2);
    this.frameContainer.style.pointerEvents = 'none';

    const resizeContainer = new ResizeContainer(this.frameContainer);
    resizeContainer.setMarginConfig({
      TOP: 0,
      RIGHT: 0,
      BOTTOM: 0,
      LEFT: 0
    });

    resizeContainer.setEventListeners({
      onResizeX: () => {
        let maxSizeTitle = 0;
        [...this.frameWrapper.getElementsByClassName('viva-subtitle-wrapper__text')].forEach((subtitle) => {
          if (subtitle.clientWidth > maxSizeTitle) maxSizeTitle = 250;
        });
        resizeContainer.setSizeConfig({ minWidth: maxSizeTitle + SUBTITLE_BORDER_MARGIN * 2 });
      },
      onResizeY: () => {
        const minHeight = this.getSubtitleHeight() + SUBTITLE_BORDER_MARGIN * 2;
        resizeContainer.setSizeConfig({ minHeight });
      },
      onMouseUp: () => {
        this.recalculateInterims();
      }
    });
  }

  /** Inits event listeners for this component. */
  private initListeners(): void {
    this.frameContainer.addEventListener('mousedown', this.onMouseDown.bind(this));
    document.addEventListener('mouseup', this.onMouseUp.bind(this));
    document.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('resize', this.onWindowResize.bind(this));
    this.initPollInterval();

    StorageCtrl.on(Store.SUBTITLE_FONT_SIZE, (value: any) => {
      this.frameWrapper.className = '';
      this.frameWrapper.classList.add('viva-subtitle-wrapper');
      this.frameWrapper.classList.add(`text-size__${value}`);
      this.recalculateInterims();
    });
  }

  /**
   * Return if the frame is visible or not
   */
  public get isVisible(): boolean {
    return this.visible;
  }

  /**
   * Add the frame to the active page
   */
  public addToPage(isSidePanel = false) {
    this.visible = true;
    const oldContainer = document?.querySelector('.viva_styles_content');

    if (!!oldContainer && !document?.body?.contains(this.frameContainer) && !isSidePanel) {
      oldContainer.insertBefore(this.frameContainer, oldContainer.firstChild);
    } else if ((!oldContainer && !document?.body?.contains(this.wrapperContainer)) || isSidePanel) {
      document?.body?.appendChild(this.wrapperContainer);
    }

    this.frameContainer.style.visibility = 'visible';
  }

  /**
   * Remove the frame from the current page
   */
  public removeFromPage() {
    this.visible = false;
    this.lines = [];
    this.currentInterim = [];
    this.frameWrapper.innerHTML = '';
    this.frameContainer.classList.remove('has-interim-text');
    this.frameContainer.style.visibility = 'hidden';
  }

  /**
   * Interval poll to check if the frame was not updated to clear the content
   */
  private initPollInterval() {
    this.pollInterval = setInterval(() => {
      const now = Date.now();
      if (now - this.lastTimestamp > 5000) {
        this.frameWrapper.replaceChildren();
        this.frameContainer.classList.remove('has-interim-text');
        this.lines = [];
      }
    }, 5100);
  }

  /**
   * Add a subtitle line to the frame
   * @param text
   */
  private addLine(text: string) {
    const lineSpan = document.createElement('span');
    lineSpan.classList.add('viva-subtitle-wrapper__text');
    lineSpan.innerText = text;
    this.frameWrapper.appendChild(lineSpan);
    this.frameContainer.classList.add('has-interim-text');
  }

  /**
   * Calculate an approximated of the maximum allowed characters
   * @returns
   */
  private getMaxChars(): number {
    const tmpDiv = document.createElement('span');
    tmpDiv.className = 'viva-subtitle-wrapper__text';
    tmpDiv.style.display = 'hidden';
    tmpDiv.textContent = '';

    this.frameWrapper.appendChild(tmpDiv);
    const maxWidth = this.frameWrapper.clientWidth;
    let maxChars = 0;
    let search = true;
    while (search) {
      tmpDiv.textContent += 'a';
      maxChars += 1;
      const currWidth = tmpDiv.clientWidth;
      search = currWidth < maxWidth;
    }
    return maxChars - 1;
  }

  /**
   * Return the height for one subtitle in the wrapper
   * @returns
   */
  private getSubtitleHeight(): number {
    const tmpDiv = document.createElement('span');
    tmpDiv.className = 'viva-subtitle-wrapper__text';
    tmpDiv.style.display = 'hidden';
    tmpDiv.textContent = 'A';
    this.frameWrapper.appendChild(tmpDiv);
    const divHeight = tmpDiv.clientHeight;
    tmpDiv.remove();
    return divHeight;
  }

  /**
   * Recalculated the widht and height interim and rerender them
   */
  private recalculateInterims(): void {
    const subtitleHeight = this.getSubtitleHeight();
    let numberLines = Math.floor((this.frameContainer.clientHeight - SUBTITLE_BORDER_MARGIN * 2) / subtitleHeight);
    numberLines = Math.max(numberLines, SUBTITLE_MIN_LINES);
    this.frameContainer.style.height = `${(numberLines * subtitleHeight) + (SUBTITLE_BORDER_MARGIN * 2)}px`;
    this.subtitleMaxLines = numberLines;

    this.frameWrapper.replaceChildren();
    const tmpLines = [...this.lines];
    this.lines = [];
    tmpLines.forEach((line: string) => {
      this.addInterim({ targetText: line, isFinal: true, fromLines: true });
    });
    this.addInterim(this.currentInterim[0]);
  }

  /**
   * Add new interim to the subtitle frame
   * @param interim
   * @returns
   */
  public addInterim(interim: ICCBoxInterim) {
    /* Ignore if the substitle is not visible */
    if (!interim?.targetText?.length) return;
    if (!interim.isFinal) {
      this.currentInterim.pop();
      this.currentInterim.push(interim);
    } else if (!interim.fromLines) {
      this.currentInterim.pop();
    }

    this.lastTimestamp = Date.now();

    const text: string = interim.targetText;
    const maxChars = this.getMaxChars();
    let startIdx = 0;
    let cutIdx = maxChars;
    let hasNext = true;
    const tmpLines = [];
    while (hasNext) {
      const itr = text.indexOf(' ', cutIdx);
      if (itr < 0) {
        hasNext = false;
        tmpLines.push(text.substring(startIdx));
      } else {
        tmpLines.push(text.substring(startIdx, itr));
        startIdx = itr + 1;
        cutIdx = startIdx + maxChars;
      }
    }

    /* Check the ammount of final lines to keep in the subtitle */
    if (tmpLines.length >= this.subtitleMaxLines) {
      this.lines = [];
    } else {
      const toRemove = this.lines.length + tmpLines.length - this.subtitleMaxLines;
      if (toRemove > 0) this.lines.splice(0, toRemove);
    }

    /* Remove old subtitles lines */
    this.frameWrapper.replaceChildren();
    this.frameContainer.classList.remove('has-interim-text');

    /* Add final lines */
    this.lines.forEach((line: string) => this.addLine(line));

    /* Add partial interim lines */
    startIdx = tmpLines.length <= this.subtitleMaxLines ? 0 : tmpLines.length - this.subtitleMaxLines;
    while (startIdx < tmpLines.length) {
      const line = tmpLines[startIdx];
      this.addLine(line);
      if (interim.isFinal) this.lines.push(line);
      startIdx += 1;
    }
  }

  /**
   * Update the frame position after moving the subtitle frame
   * Move the frame only vertically
   *
   * @param event
   * @returns
   */
  private updatePosition(event: MouseEvent) {
    const clientX = Math.max(event.clientX, 0);
    const clientY = Math.max(event.clientY, 0);
    const height = this.frameContainer.clientHeight;
    const width = this.frameContainer.clientWidth;

    const calculatedY = Math.min(
      Math.max(Number(clientY) - Number(this.dragCursorOffsetY), 0),
      window.innerHeight - height
    );
    const calculatedX = Math.min(
      Math.max(Number(clientX) - Number(this.dragCursorOffsetX), 0),
      window.innerWidth - width
    );
    const xPosition = Math.max(calculatedX, 0);
    const yPosition = Math.max(calculatedY, 0);

    this.frameContainer.style.top = `${yPosition}px`;
    this.frameContainer.style.left = `${xPosition}px`;
    this.frameContainer.style.transform = 'translateX(0)';
  }

  /**
   * Mouse event to handle the frame move
   * @returns
   */
  private onMouseDown(event: MouseEvent) {
    event.preventDefault();
    this.isDragging = true;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.dragCursorOffsetX = event.clientX - rect.left;
    this.dragCursorOffsetY = event.clientY - rect.top;
  }

  /**
   * Mouse event to handle the frame move
   * @returns
   */
  private onMouseMove(event: MouseEvent) {
    if (!this.isDragging) return;
    event.preventDefault();
    document.body.style.cursor = 'move';
    this.frameContainer.style.cursor = 'move';
    this.updatePosition(event);
  }

  /**
   * Mouse event to handle the frame move
   * @returns
   */
  private onMouseUp(event: MouseEvent) {
    if (!this.isDragging) return;
    event.preventDefault();
    this.isDragging = false;
    document.body.style.cursor = 'initial';
    this.frameContainer.style.cursor = 'initial';
    this.dragCursorOffsetY = undefined;
    this.dragCursorOffsetX = undefined;
  }

  /**
   * Window resize event
   */
  private onWindowResize() {
    let maxSizeTitle = 0;
    [...this.frameContainer.getElementsByClassName('viva-subtitle-wrapper__text')].forEach((subtitle) => {
      if (subtitle.clientWidth > maxSizeTitle) maxSizeTitle = subtitle.clientWidth + SUBTITLE_BORDER_MARGIN * 2;
    });

    if (this.frameContainer.getBoundingClientRect().left + maxSizeTitle > window.innerWidth) {
      const xPosition = window.innerWidth - maxSizeTitle;
      this.frameContainer.style.left = `${xPosition}px`;
      this.frameContainer.style.width = `calc(100vw - ${xPosition + SUBTITLE_BORDER_MARGIN}px)`;
      this.frameContainer.style.transform = 'translateX(0)';
    }
  }
}

export default CCBox;
