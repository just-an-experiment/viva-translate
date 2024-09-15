/* eslint-disable max-len */
export type LanguagesCode = 'DE' | 'EN' | 'ES' | 'FR' | 'IT' | 'JA' | 'PT' | 'ZH';

export interface SelectOption {
  i18nKey?: string;
  text?: string;
  value: string;
}

export interface HTMLMediaElementWithCaptureStream extends HTMLMediaElement {
  captureStream(): MediaStream;
}

export interface ErrorResponse {
  error?: {
    unknown?: boolean;
  };
}

export interface Translation {
  sourceLang: string;
  text: string;
}

export interface DragConfig {
  canDrag: boolean;
  cursorOffsetX: number | null;
  cursorOffsetY: number | null;
  isDragging: boolean;
}

export interface ResizeConfig {
  isResizingX: boolean;
  isResizingXLeft: boolean;
  isResizingY: boolean;
  isResizingYTop: boolean;
  lastDownX: number | null;
  finalX: number;
  finalY: number;
  oldX: number;
}

export interface IInterim {
  id: number;
  index: number;
  originalLang: string;
  originalText: string;
  translations: Record<string, string>;
  isFinal: boolean;
  createdAt: number;
  isSystem: boolean;
  additionalText?: string;
}

export interface ICCBoxInterim {
  targetText: string;
  isFinal: boolean;
  fromLines?: boolean;
}

export interface ISummary {
  id: number;
  translations: Record<string, string>;
}
