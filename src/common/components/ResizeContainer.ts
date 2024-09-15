import { ResizePoints } from '../constants';
import { ResizeConfig } from '../types';

interface ResizeHandlers {
  resizeHandlerX?: HTMLDivElement;
  resizeHandlerXLeft?: HTMLDivElement;
  resizeHandlerY?: HTMLDivElement;
  resizeHandlerYTop?: HTMLDivElement;
  resizeHandlerDL?: HTMLDivElement;
  resizeHandlerDR?: HTMLDivElement;
  resizeHandlerDLT?: HTMLDivElement;
  resizeHandlerDRT?: HTMLDivElement;
}

interface MarginConfig {
  TOP: number;
  RIGHT: number;
  BOTTOM: number;
  LEFT: number;
}

interface SizeConfig {
  maxWidth: number,
  maxHeight: number,
  minWidth: number,
  minHeight: number
}

interface EventListeners {
  onResizeX: Function | undefined,
  onResizeY: Function | undefined,
  onMouseUp: Function | undefined
}

class ResizeContainer {
  private container: HTMLDivElement;

  private resizeHandlers: ResizeHandlers;

  private resizeConfig: ResizeConfig = {
    isResizingX: false,
    isResizingXLeft: false,
    isResizingY: false,
    isResizingYTop: false,
    lastDownX: null,
    finalX: 0,
    finalY: 0,
    oldX: 0,
  };

  private marginConfig: MarginConfig = {
    TOP: 0,
    RIGHT: 0,
    BOTTOM: 0,
    LEFT: 0
  };

  private sizeConfig: SizeConfig = {
    maxHeight: window.innerHeight - (this.marginConfig.TOP + this.marginConfig.BOTTOM),
    maxWidth: window.innerWidth - (this.marginConfig.LEFT + this.marginConfig.RIGHT),
    minWidth: 0,
    minHeight: 0
  };

  private eventListeners: EventListeners = {
    onResizeX: undefined,
    onResizeY: undefined,
    onMouseUp: undefined
  };

  public constructor(container: HTMLDivElement) {
    this.container = container;
    this.resizeHandlers = {};
    this.setResizeHandles();
    this.initListeners();
  }

  /** Allow set margin borders to resize */
  public setMarginConfig(marginConfig: MarginConfig) {
    this.marginConfig = { ...this.marginConfig, ...marginConfig };
  }

  /** Allow set min width and height to resize */
  public setSizeConfig(sizeConfig: any) {
    this.sizeConfig = { ...this.sizeConfig, ...sizeConfig };
  }

  /** Allow set event listeners */
  public setEventListeners(eventListeners: any) {
    this.eventListeners = { ...this.eventListeners, ...eventListeners };
  }

  /**
   * Actives resize event when a some resize element is pressed
   * @param event
   * @param resizePoint
   */
  protected activateResize = (event: MouseEvent, resizePoint: ResizePoints): void => {
    event.preventDefault();
    event.stopPropagation();

    const containerRect = this.container.getBoundingClientRect();
    switch (resizePoint) {
      case ResizePoints.TOP:
        this.resizeConfig.isResizingYTop = true;
        this.resizeConfig.finalY = containerRect.top + containerRect.height;
        break;
      case ResizePoints.BOTTOM:
        this.resizeConfig.isResizingY = true;
        break;
      case ResizePoints.LEFT:
        this.resizeConfig.isResizingXLeft = true;
        this.resizeConfig.finalX = containerRect.left + containerRect.width;
        break;
      case ResizePoints.RIGHT:
        this.resizeConfig.isResizingX = true;
        break;
      case ResizePoints.DIAGONAL_LEFT:
        this.resizeConfig.isResizingXLeft = true;
        this.resizeConfig.finalX = containerRect.left + containerRect.width;
        this.resizeConfig.isResizingY = true;
        break;
      case ResizePoints.DIAGONAL_LEFT_TOP:
        this.resizeConfig.isResizingXLeft = true;
        this.resizeConfig.isResizingYTop = true;
        this.resizeConfig.finalX = containerRect.left + containerRect.width;
        this.resizeConfig.finalY = containerRect.top + containerRect.height;
        break;
      case ResizePoints.DIAGONAL_RIGHT:
        this.resizeConfig.isResizingX = true;
        this.resizeConfig.isResizingY = true;
        break;
      case ResizePoints.DIAGONAL_RIGHT_TOP:
        this.resizeConfig.isResizingX = true;
        this.resizeConfig.isResizingYTop = true;
        this.resizeConfig.finalY = containerRect.top + containerRect.height;
        break;
      default:
        break;
    }
    this.resizeConfig.lastDownX = event.clientY;
  };

  /**
   * Creates the resize handlers and injects it into container.
   */
  private setResizeHandles(): void {
    this.resizeHandlers.resizeHandlerX = document.createElement('div');
    this.resizeHandlers.resizeHandlerX.classList.add('resize-container__right');
    this.resizeHandlers.resizeHandlerX.addEventListener('mousedown', (event: MouseEvent) => {
      this.activateResize(event, ResizePoints.RIGHT);
    });
    this.container.appendChild(this.resizeHandlers.resizeHandlerX);

    this.resizeHandlers.resizeHandlerXLeft = document.createElement('div');
    this.resizeHandlers.resizeHandlerXLeft.classList.add('resize-container__left');
    this.resizeHandlers.resizeHandlerXLeft.addEventListener('mousedown', (event: MouseEvent) => {
      this.activateResize(event, ResizePoints.LEFT);
    });
    this.container.appendChild(this.resizeHandlers.resizeHandlerXLeft);

    this.resizeHandlers.resizeHandlerY = document.createElement('div');
    this.resizeHandlers.resizeHandlerY.classList.add('resize-container__bottom');
    this.resizeHandlers.resizeHandlerY.addEventListener('mousedown', (event: MouseEvent) => {
      this.activateResize(event, ResizePoints.BOTTOM);
    });
    this.container.appendChild(this.resizeHandlers.resizeHandlerY);

    this.resizeHandlers.resizeHandlerYTop = document.createElement('div');
    this.resizeHandlers.resizeHandlerYTop.classList.add('resize-container__top');
    this.resizeHandlers.resizeHandlerYTop.addEventListener('mousedown', (event: MouseEvent) => {
      this.activateResize(event, ResizePoints.TOP);
    });
    this.container.appendChild(this.resizeHandlers.resizeHandlerYTop);

    this.resizeHandlers.resizeHandlerDL = document.createElement('div');
    this.resizeHandlers.resizeHandlerDL.classList.add(
      'resize-container__diagonal-left-bottom'
    );
    this.resizeHandlers.resizeHandlerDL.addEventListener('mousedown', (event: MouseEvent) => {
      this.activateResize(event, ResizePoints.DIAGONAL_LEFT);
    });
    this.container.appendChild(this.resizeHandlers.resizeHandlerDL);

    this.resizeHandlers.resizeHandlerDLT = document.createElement('div');
    this.resizeHandlers.resizeHandlerDLT.classList.add(
      'resize-container__diagonal-left-top'
    );
    this.resizeHandlers.resizeHandlerDLT.addEventListener('mousedown', (event: MouseEvent) => {
      this.activateResize(event, ResizePoints.DIAGONAL_LEFT_TOP);
    });
    this.container.appendChild(this.resizeHandlers.resizeHandlerDLT);

    this.resizeHandlers.resizeHandlerDR = document.createElement('div');
    this.resizeHandlers.resizeHandlerDR.classList.add(
      'resize-container__diagonal-right-bottom'
    );
    this.resizeHandlers.resizeHandlerDR.addEventListener('mousedown', (event: MouseEvent) => {
      this.activateResize(event, ResizePoints.DIAGONAL_RIGHT);
    });
    this.container.appendChild(this.resizeHandlers.resizeHandlerDR);

    this.resizeHandlers.resizeHandlerDRT = document.createElement('div');
    this.resizeHandlers.resizeHandlerDRT.classList.add(
      'resize-container__diagonal-right-top'
    );
    this.resizeHandlers.resizeHandlerDRT.addEventListener('mousedown', (event: MouseEvent) => {
      this.activateResize(event, ResizePoints.DIAGONAL_RIGHT_TOP);
    });
    this.container.appendChild(this.resizeHandlers.resizeHandlerDRT);
  }

  /**
   * Updates the coordinates of the transcription popup based on user resizing.
   * @param event Used to get mouse coordinates.
   */
  protected updateResizeY(event: MouseEvent): void {
    if (this.container.clientHeight > window.innerHeight) return;
    if (this.eventListeners?.onResizeY) this.eventListeners?.onResizeY();

    const containerRect = this.container.getBoundingClientRect();
    if (!this.container.style.top) this.container.style.top = `${containerRect.top}px`;

    if (this.resizeConfig.isResizingY) {
      const clientY = Math.min(event.clientY, window.innerHeight - this.marginConfig.BOTTOM);
      const newHeight = clientY - containerRect.top;
      if (newHeight > this.sizeConfig.minHeight && newHeight < this.sizeConfig.maxHeight) {
        this.container.style.height = `${newHeight}px`;
      }
    }

    if (this.resizeConfig.isResizingYTop) {
      const clientY = Math.max(event.clientY, this.marginConfig.TOP);
      const newHeight = this.resizeConfig.finalY - clientY;
      if (newHeight > this.sizeConfig.minHeight && newHeight < this.sizeConfig.maxHeight) {
        this.container.style.top = `${clientY}px`;
        this.container.style.height = `${newHeight}px`;
      }
    }
  }

  /**
   * Updates the coordinates and width of the transcription box if user resizes horizontally.
   * @param event Used to obtain mouse position.
   */
  protected updateResizeX(event: MouseEvent) {
    if (this.eventListeners?.onResizeX) this.eventListeners?.onResizeX();
    const containerRect = this.container.getBoundingClientRect();
    if (this.resizeConfig.isResizingX) {
      const clientX = Math.min(event.clientX, window.innerWidth - this.marginConfig.RIGHT);
      const newWidth = clientX - containerRect.left;
      if (newWidth > this.sizeConfig.minWidth && newWidth < this.sizeConfig.maxWidth) {
        this.container.style.minWidth = `${newWidth}px`;
        this.container.style.width = `${newWidth}px`;
      }
    }

    if (this.resizeConfig.isResizingXLeft) {
      const clientX = Math.max(event.clientX, this.marginConfig.LEFT);
      const newWidth = this.resizeConfig.finalX - clientX;
      if (newWidth > this.sizeConfig.minWidth && newWidth < this.sizeConfig.maxWidth) {
        this.container.style.left = `${clientX}px`;
        this.container.style.minWidth = `${newWidth}px`;
        this.container.style.width = `${newWidth}px`;
      }
    }
  }

  /**
   * Mouse event to handle the container resize
   * @returns
   */
  private onMouseMove(event: MouseEvent) {
    if (this.resizeConfig.isResizingY || this.resizeConfig.isResizingYTop) {
      this.updateResizeY(event);
    }

    if (this.resizeConfig.isResizingX || this.resizeConfig.isResizingXLeft) {
      this.updateResizeX(event);
    }
  }

  /**
   * Mouse event to handle the container resize
   * @returns
   */
  private onMouseUp(event: MouseEvent) {
    event.preventDefault();
    if (
      this.resizeConfig.isResizingX ||
      this.resizeConfig.isResizingXLeft ||
      this.resizeConfig.isResizingY ||
      this.resizeConfig.isResizingYTop
    ) {
      if (this.eventListeners.onMouseUp) this.eventListeners.onMouseUp(event);
    }
    this.resizeConfig.isResizingX = false;
    this.resizeConfig.isResizingXLeft = false;
    this.resizeConfig.isResizingY = false;
    this.resizeConfig.isResizingYTop = false;
  }

  /** Inits event listeners for this component. */
  private initListeners(): void {
    document.addEventListener('mouseup', this.onMouseUp.bind(this));
    document.addEventListener('mousemove', this.onMouseMove.bind(this));
  }
}

export default ResizeContainer;
