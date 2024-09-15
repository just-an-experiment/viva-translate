/* eslint-disable max-len */
import { DefineVariables } from '../define_variables';

declare const DEFINE_VARIABLES: DefineVariables;

/* DEFINE_VARAIBLES are injected via DefinePlugin at compile-time from webpack.config.js
   re-exporting as constants to make source more obvious */
export const { VERSION } = DEFINE_VARIABLES;

export const SUPPORT_MAIL = 'support@vivatranslate.com';
export const AUDIO_PROCESSOR = 'pcm-procesor';

export const SUBTITLE_MIN_LINES = 2;
export const SUBTITLE_INIT_LINES = 4;
export const SUBTITLE_BORDER_MARGIN = 16;
export const INIT_IFRAME_WIDTH = 740;
export const SAMPLE_RATE = 16000;

export const VAD_FREQUENCY_THRESHOLD = 10;
export const VAD_START_THRESHOLD = 3;
export const VAD_PRE_STOP_THRESHOLD = 5;
export const VAD_STOP_THRESHOLD = 15;
export const LATENCY_THRESHOLD = 500;

export enum Languages {
  EN = 'EN',
  ES = 'ES',
  PT = 'PT',
  DE = 'DE',
  FR = 'FR',
  IT = 'IT',
  JA = 'JA',
  ZH = 'ZH',
}
export enum TargetLanguage {
  EN = 'EN-US',
  PT = 'PT-BR',
}

export enum SupportedLocales {
  DE = 'Deutsch',
  EN = 'English',
  ES = 'Español',
  FR = 'Français',
  IT = 'Italiano',
  JA = '日本語',
  PT = 'Português',
  ZH = '中文'
}

export enum GeneralClasses {
  PRIMARY_CTA = 'primary-cta',
  LOGIN_POPUP = 'login-popup',
  TRIAL_POPUP = 'trial-popup',
  TRIAL_START_POPUP = 'trial-popup--start',
  TRIAL_LIMITED_POPUP = 'trial-popup--limited',
  TRIAL_CHARACTERS_POPUP = 'trial-popup--characters',
  TRIAL_END_POPUP = 'trial-popup--ended',
  TRIAL_POPUP_CTA = 'trial-popup__cta',
  TRIAL_POPUP_CLOSE = 'trial-popup__close',
  CONTEXT_MENU = 'icon-context-menu',
  CONTEXT_MENU_BTN = 'icon-context-menu__btn',
  CLICKED = 'clicked',
  GMAIL_TEMPLATE_APPLY = 'template-panel__apply-button',
  GMAIL_TEMPLATE_TOGGLE = 'template-panel__toggle-button',
  GMAIL_TEMPLATE_TOGGLE_LEFT = 'template-panel__toggle-button--left',
  GMAIL_TEMPLATE_TOGGLE_INACTIVE = 'template-panel__toggle-button--inactive',
  MODAL = 'viva-modal',
  PRIMARY_BTN = 'viva-primary-btn',
  GRADIENT_BTN = 'viva-gradient-btn',
  VIVA_ACTIVATOR_LISTENING = 'viva-minimized--is-listening',
}

export enum Icons {
  ARROW_DOWN =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="none" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="48" d="M112 268 256 412 400 268"/><path fill="none" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="48" d="M256 392 256 100"/></svg>',
  VIVA_ICON =
  '<svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 345 327"><rect x=".2" y=".1" width="344.9" height="326.7" rx="42.9" fill="url(#a)"/><rect x="18.3" y="18.3" width="308.6" height="290.4" rx="27.2" fill="#0B0414"/><path d="M144.9 222.7a27.7 27.7 0 0 1-27.9 27.5 27.7 27.7 0 0 1-27.8-27.5A27.7 27.7 0 0 1 117 195a27.7 27.7 0 0 1 27.9 27.6Z" fill="url(#b)"/><path d="M88 127.8a31.3 31.3 0 1 1 58 0l-16.2 40.3a13.8 13.8 0 0 1-25.5 0L88 127.8Z" fill="url(#c)"/><path d="M257.5 207.2a31.3 31.3 0 1 1-58 0l16.2-40.3a13.8 13.8 0 0 1 25.5 0l16.3 40.3Z" fill="url(#d)"/><path d="M256.3 112.4a27.7 27.7 0 0 1-27.9 27.5 27.7 27.7 0 0 1-27.8-27.5 27.7 27.7 0 0 1 27.8-27.6 27.7 27.7 0 0 1 27.9 27.6Z" fill="url(#e)"/><path d="M137.6 222.8c0 10.8-9 19.5-20 19.5-11.1 0-20-8.7-20-19.5s8.9-19.5 20-19.5c11 0 20 8.7 20 19.5ZM95.7 125.2a22.9 22.9 0 1 1 42.7 0l-14.5 37.4a7.3 7.3 0 0 1-13.6 0l-14.6-37.4ZM208.6 112.4c0-10.8 9-19.5 20-19.5 11.1 0 20.1 8.7 20.1 19.5s-9 19.5-20 19.5c-11.1 0-20.1-8.7-20.1-19.5ZM250.5 210a22.9 22.9 0 1 1-42.7 0l14.6-37.4a7.3 7.3 0 0 1 13.6 0l14.5 37.5Z" fill="#0B0414"/><defs><linearGradient id="a" x1="172.6" y1=".1" x2="172.6" y2="326.9" gradientUnits="userSpaceOnUse"><stop stop-color="#D0B4FB"/><stop offset="1" stop-color="#CDE3FD"/></linearGradient><linearGradient id="b" x1="117" y1="195.1" x2="117" y2="250.2" gradientUnits="userSpaceOnUse"><stop stop-color="#D0B4FB"/><stop offset="1" stop-color="#CDE3FD"/></linearGradient><linearGradient id="c" x1="117" y1="84.8" x2="117" y2="176.7" gradientUnits="userSpaceOnUse"><stop stop-color="#D0B4FB"/><stop offset="1" stop-color="#CDE3FD"/></linearGradient><linearGradient id="d" x1="228.4" y1="158.3" x2="228.4" y2="250.2" gradientUnits="userSpaceOnUse"><stop stop-color="#D0B4FB"/><stop offset="1" stop-color="#CDE3FD"/></linearGradient><linearGradient id="e" x1="228.4" y1="84.8" x2="228.4" y2="139.9" gradientUnits="userSpaceOnUse"><stop stop-color="#D0B4FB"/><stop offset="1" stop-color="#CDE3FD"/></linearGradient></defs></svg>',
  BAD_WIFI =
  '<svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 38"><path d="M15.8 8A31.9 31.9 0 0 0 1 16.4a3.4 3.4 0 0 0 0 4.8 3.5 3.5 0 0 0 4.9 0c3-3 6.5-5 10.3-6.2l-.4-7Zm.7 12.7c-2.5 1-4.8 2.4-6.7 4.4a3.4 3.4 0 0 0 0 4.8 3.5 3.5 0 0 0 4.8 0 13 13 0 0 1 2.3-1.8v-.4l-.4-7Zm10.9 7.5v-.4l.4-7c2.5 1 4.7 2.4 6.7 4.4a3.4 3.4 0 0 1 0 4.8 3.5 3.5 0 0 1-4.9 0 9.6 9.6 0 0 0-2.2-1.8Zm.7-13.1.4-7a31.9 31.9 0 0 1 14.8 8.3c.6.7 1 1.4 1 2.3v.4a3.5 3.5 0 0 1-5.9 2.2c-3-3-6.5-5-10.3-6.2ZM22 32a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM18 5V3c.3-1.4 1.2-2.6 2.4-2.9L22 0l1.6.1c1.2.3 2.1 1.5 2.4 3V5l-1 21.6c0 1.9-1.4 3.4-3 3.4s-3-1.5-3-3.4L18 5Z" fill="#000"/></svg>',
  CHECKMARK =
  '<?xml version="1.0" encoding="utf-8"?><svg fill="#000000" width="800px" height="800px" viewBox="0 0 1920 1920" xmlns="http://www.w3.org/2000/svg"><path d="M1743.858 267.012 710.747 1300.124 176.005 765.382 0 941.387l710.747 710.871 1209.24-1209.116z" fill-rule="evenodd"/></svg>',
  CLOSE =
  '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill="#BABABA" d="M10.192 0.343994L5.94897 4.58599L1.70697 0.343994L0.292969 1.75799L4.53497 5.99999L0.292969 10.242L1.70697 11.656L5.94897 7.41399L10.192 11.656L11.606 10.242L7.36397 5.99999L11.606 1.75799L10.192 0.343994Z"/></svg>',
  COPY = '<svg width="14" height="16" viewBox="0 0 14 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 14V15.25C10 15.6642 9.66422 16 9.25 16H0.75C0.335781 16 0 15.6642 0 15.25V3.75C0 3.33578 0.335781 3 0.75 3H3V12.25C3 13.215 3.78503 14 4.75 14H10ZM10 3.25V0H4.75C4.33578 0 4 0.335781 4 0.75V12.25C4 12.6642 4.33578 13 4.75 13H13.25C13.6642 13 14 12.6642 14 12.25V4H10.75C10.3375 4 10 3.6625 10 3.25ZM13.7803 2.28034L11.7197 0.219656C11.579 0.0790133 11.3882 1.03999e-06 11.1893 0L11 0V3H14V2.81066C14 2.61175 13.921 2.42099 13.7803 2.28034V2.28034Z" fill="#fff"/></svg>',
  LIST = '<svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 20"><path fill-rule="evenodd" clip-rule="evenodd" d="M19 2H3a1 1 0 0 0-1 1v14c0 .6.4 1 1 1h16c.6 0 1-.4 1-1V3c0-.6-.4-1-1-1ZM3 0a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h16a3 3 0 0 0 3-3V3a3 3 0 0 0-3-3H3Zm2 5h2v2H5V5Zm5 0a1 1 0 0 0 0 2h6a1 1 0 1 0 0-2h-6ZM7 9H5v2h2V9Zm2 1c0-.6.4-1 1-1h6a1 1 0 1 1 0 2h-6a1 1 0 0 1-1-1Zm-2 3H5v2h2v-2Zm2 1c0-.6.4-1 1-1h6a1 1 0 0 1 0 2h-6a1 1 0 0 1-1-1Z" fill="#BABABA"/></svg>',
  LOADING_SPINNER =
  '<svg class="loading-spinner" width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg" stroke="#000"><g fill="none" fill-rule="evenodd" stroke-width="2"><circle cx="22" cy="22" r="1"><animate attributeName="r" begin="0s" dur="1.8s" values="1; 20" calcMode="spline" keyTimes="0; 1" keySplines="0.165, 0.84, 0.44, 1" repeatCount="indefinite" /><animate attributeName="stroke-opacity" begin="0s" dur="1.8s" values="1; 0" calcMode="spline" keyTimes="0; 1" keySplines="0.3, 0.61, 0.355, 1" repeatCount="indefinite" /></circle><circle cx="22" cy="22" r="1"><animate attributeName="r" begin="-0.9s" dur="1.8s" values="1; 20" calcMode="spline" keyTimes="0; 1" keySplines="0.165, 0.84, 0.44, 1" repeatCount="indefinite" /><animate attributeName="stroke-opacity" begin="-0.9s" dur="1.8s" values="1; 0" calcMode="spline" keyTimes="0; 1" keySplines="0.3, 0.61, 0.355, 1" repeatCount="indefinite" /></circle></g></svg>',
  MINIMIZE =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19.5,3.09L20.91,4.5L16.41,9H20V11H13V4H15V7.59L19.5,3.09M20.91,19.5L19.5,20.91L15,16.41V20H13V13H20V15H16.41L20.91,19.5M4.5,3.09L9,7.59V4H11V11H4V9H7.59L3.09,4.5L4.5,3.09M3.09,19.5L7.59,15H4V13H11V20H9V16.41L4.5,20.91L3.09,19.5Z" /></svg>',
  PAUSE =
  '<svg width="12" height="12" viewBox="0 0 10 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 11.8337H3.33333V0.166992H0V11.8337ZM6.66667 0.166992V11.8337H10V0.166992H6.66667Z" fill="#BABABA"/></svg>',
  PLAY = '<svg width="12" height="12" viewBox="0 0 134 194" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M128.737 87.5099C134.945 92.314 134.945 101.686 128.737 106.49L19.3443 191.149C11.4578 197.252 -5.82939e-06 191.631 -5.39349e-06 181.659L2.00761e-06 12.3413C2.44351e-06 2.36903 11.4578 -3.25205 19.3443 2.85126L128.737 87.5099Z" fill="#BABABA"/></svg>',
  SETTINGS =
  '<svg viewBox="0 0 13 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.69533 13.7176H5.30544C5.14611 13.7176 5.00803 13.6644 4.89119 13.5582C4.77435 13.452 4.70531 13.3192 4.68406 13.1599L4.49287 11.6782C4.35479 11.6251 4.22478 11.5613 4.10284 11.487C3.98048 11.4126 3.86088 11.333 3.74404 11.248L2.3579 11.8216C2.20919 11.8747 2.06049 11.88 1.91178 11.8375C1.76308 11.795 1.64624 11.7047 1.56127 11.5666L0.38225 9.51133C0.297276 9.37325 0.270721 9.22454 0.302587 9.06522C0.334452 8.90589 0.414115 8.77843 0.541576 8.68284L1.73652 7.77467C1.7259 7.70032 1.72059 7.62852 1.72059 7.55926V7.12908C1.72059 7.06025 1.7259 6.98866 1.73652 6.91431L0.541576 6.00615C0.414115 5.91055 0.334452 5.78309 0.302587 5.62377C0.270721 5.46444 0.297276 5.31574 0.38225 5.17765L1.56127 3.12234C1.63562 2.97364 1.7497 2.88059 1.9035 2.8432C2.05773 2.80624 2.20919 2.81431 2.3579 2.86742L3.74404 3.441C3.86088 3.35602 3.98303 3.27636 4.11049 3.20201C4.23795 3.12765 4.36541 3.06392 4.49287 3.01081L4.68406 1.52908C4.70531 1.36975 4.77435 1.23698 4.89119 1.13076C5.00803 1.02454 5.14611 0.971436 5.30544 0.971436H7.69533C7.85466 0.971436 7.99274 1.02454 8.10958 1.13076C8.22642 1.23698 8.29546 1.36975 8.31671 1.52908L8.5079 3.01081C8.64598 3.06392 8.7762 3.12765 8.89857 3.20201C9.0205 3.27636 9.13989 3.35602 9.25673 3.441L10.6429 2.86742C10.7916 2.81431 10.9403 2.809 11.089 2.85149C11.2377 2.89397 11.3545 2.98426 11.4395 3.12234L12.6185 5.17765C12.7035 5.31574 12.73 5.46444 12.6982 5.62377C12.6663 5.78309 12.5867 5.91055 12.4592 6.00615L11.2642 6.91431C11.2749 6.98866 11.2802 7.06025 11.2802 7.12908V7.55926C11.2802 7.62852 11.2696 7.70032 11.2483 7.77467L12.4433 8.68284C12.5707 8.77843 12.6504 8.90589 12.6823 9.06522C12.7141 9.22454 12.6876 9.37325 12.6026 9.51133L11.4236 11.5507C11.3386 11.6888 11.2192 11.7818 11.0654 11.8299C10.9112 11.8774 10.7597 11.8747 10.611 11.8216L9.25673 11.248C9.13989 11.333 9.01774 11.4126 8.89028 11.487C8.76282 11.5613 8.63536 11.6251 8.5079 11.6782L8.31671 13.1599C8.29546 13.3192 8.22642 13.452 8.10958 13.5582C7.99274 13.6644 7.85466 13.7176 7.69533 13.7176ZM6.53225 9.57506C7.14831 9.57506 7.67409 9.35732 8.10958 8.92182C8.54507 8.48633 8.76282 7.96056 8.76282 7.34449C8.76282 6.72843 8.54507 6.20265 8.10958 5.76716C7.67409 5.33167 7.14831 5.11392 6.53225 5.11392C5.90557 5.11392 5.37703 5.33167 4.94663 5.76716C4.51666 6.20265 4.30168 6.72843 4.30168 7.34449C4.30168 7.96056 4.51666 8.48633 4.94663 8.92182C5.37703 9.35732 5.90557 9.57506 6.53225 9.57506ZM6.53225 8.30045C6.26671 8.30045 6.0411 8.20741 5.85543 8.02131C5.66934 7.83564 5.57629 7.61004 5.57629 7.34449C5.57629 7.07895 5.66934 6.85334 5.85543 6.66767C6.0411 6.48158 6.26671 6.38853 6.53225 6.38853C6.79779 6.38853 7.02361 6.48158 7.20971 6.66767C7.39537 6.85334 7.48821 7.07895 7.48821 7.34449C7.48821 7.61004 7.39537 7.83564 7.20971 8.02131C7.02361 8.20741 6.79779 8.30045 6.53225 8.30045ZM5.86308 12.4429H7.12176L7.34481 10.7541C7.67409 10.6691 7.97957 10.5442 8.26126 10.3793C8.54252 10.2149 8.8 10.0159 9.03368 9.78219L10.611 10.4354L11.2324 9.35201L9.86217 8.31638C9.91528 8.16768 9.95246 8.0109 9.9737 7.84605C9.99495 7.68163 10.0056 7.51444 10.0056 7.34449C10.0056 7.17454 9.99495 7.00715 9.9737 6.8423C9.95246 6.67787 9.91528 6.52131 9.86217 6.3726L11.2324 5.33698L10.611 4.25356L9.03368 4.92273C8.8 4.67843 8.54252 4.47386 8.26126 4.30901C7.97957 4.14458 7.67409 4.01988 7.34481 3.93491L7.13769 2.24605H5.87901L5.65595 3.93491C5.32668 4.01988 5.02141 4.14458 4.74015 4.30901C4.45846 4.47386 4.20077 4.67312 3.96709 4.9068L2.38976 4.25356L1.76839 5.33698L3.1386 6.35667C3.08549 6.516 3.04831 6.67532 3.02707 6.83465C3.00583 6.99397 2.9952 7.16392 2.9952 7.34449C2.9952 7.51444 3.00583 7.67908 3.02707 7.8384C3.04831 7.99773 3.08549 8.15706 3.1386 8.31638L1.76839 9.35201L2.38976 10.4354L3.96709 9.76625C4.20077 10.0106 4.45846 10.2149 4.74015 10.3793C5.02141 10.5442 5.32668 10.6691 5.65595 10.7541L5.86308 12.4429Z" fill="#BABABA"/></svg>',
  SUBTITLE =
  '<svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 19"><path d="M21.3 0H2.7C2 0 1.3.3.7.8.4 1.3 0 2 0 2.8v13.5c0 .7.3 1.4.8 1.9s1.2.8 1.9.8h18.6c.7 0 1.4-.3 2-.8.4-.5.7-1.2.7-2V2.8c0-.7-.3-1.4-.8-2C22.7.4 22 0 21.3 0Zm.7 16.3c0 .2 0 .3-.2.5l-.5.2H2.7l-.5-.2a.7.7 0 0 1-.2-.5V2.7c0-.2 0-.3.2-.5l.5-.2h18.6l.5.2.2.5v13.6ZM9.9 8a1 1 0 0 0 1 .2 1 1 0 0 0 .6-.6 1 1 0 0 0-.2-1 4 4 0 0 0-4.4-1 4 4 0 0 0-2.5 3.8 4 4 0 0 0 1.2 2.9 4 4 0 0 0 4.4.9 4 4 0 0 0 1.3-1 1 1 0 0 0 0-1.4 1 1 0 0 0-1.5 0 2 2 0 0 1-2.1.5 2 2 0 0 1-1.3-2 2 2 0 0 1 1.3-1.8 2 2 0 0 1 2.2.5Zm8 0a1 1 0 0 0 1 .2 1 1 0 0 0 .6-.6 1 1 0 0 0-.2-1 4 4 0 0 0-4.4-1 4 4 0 0 0-2.5 3.8 4 4 0 0 0 1.2 2.9 4 4 0 0 0 4.4.9 4 4 0 0 0 1.3-1 1 1 0 0 0 .2-1 1 1 0 0 0-.6-.6 1 1 0 0 0-1 .2 2 2 0 0 1-2.2.5 2 2 0 0 1-1.3-2 2 2 0 0 1 1.3-1.8 2 2 0 0 1 2.2.5Z" fill="#BABABA"/></svg>',
  SWITCH_PANEL =
  '<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_1_2)"><path d="M0 106.667L0 405.333C0 464.149 57.4208 512 128 512H384C454.579 512 512 464.149 512 405.333V106.667C512 47.8507 454.579 0 384 0H128C57.4208 0 0 47.8507 0 106.667ZM384 469.333H128C85.6576 469.333 51.2 440.619 51.2 405.333V234.667H460.8V405.333C460.8 440.619 426.342 469.333 384 469.333ZM384 42.6667C426.342 42.6667 460.8 71.3813 460.8 106.667V192H51.2V106.667C51.2 71.3813 85.6576 42.6667 128 42.6667H384ZM256.1 85.3333C270.257 85.3333 281.7 94.8907 281.7 106.667V128C281.7 139.776 270.257 149.333 256.1 149.333C241.943 149.333 230.5 139.776 230.5 128V106.667C230.5 94.8907 241.943 85.3333 256.1 85.3333ZM358.4 85.3333C372.557 85.3333 384 94.8907 384 106.667V128C384 139.776 372.557 149.333 358.4 149.333C344.243 149.333 332.8 139.776 332.8 128V106.667C332.8 94.8907 344.243 85.3333 358.4 85.3333ZM153.6 85.3333C167.757 85.3333 179.2 94.8907 179.2 106.667V128C179.2 139.776 167.757 149.333 153.6 149.333C139.443 149.333 128 139.776 128 128V106.667C128 94.8907 139.443 85.3333 153.6 85.3333Z" fill="black"/></g><defs><clipPath id="clip0_1_2"><rect width="512" height="512" fill="white" transform="matrix(0 -1 1 0 0 512)"/></clipPath></defs></svg>',
  TRANSLATE_FILLED =
  '<svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 19 19"><path clip-rule="evenodd" d="M17.5 9.5v-6a2 2 0 0 0-2-2h-6a2 2 0 0 0-2 2v6c0 1.1.9 2 2 2h6a2 2 0 0 0 2-2Z" fill="transparent" stroke="#BABABA" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><path fill="transparent" d="M5.5 7.5h-2a2 2 0 0 0-2 2v6c0 1.1.9 2 2 2h6a2 2 0 0 0 2-2v-2" stroke="#BABABA" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.5 11.5h-3M8 13l-1 1c-.3.3-1.2.8-2.5 1.5" stroke="#BABABA" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.5 11.5c.3 1.2.8 2 1.5 2.5l2.5 1.5M12.5 3.5l-3 6M12.5 3.5l3 6M14.5 7.5h-4" stroke="#BABABA" stroke-linecap="round" stroke-linejoin="round"/></svg>',
}

export enum ResizePoints {
  BOTTOM,
  LEFT,
  RIGHT,
  TOP,
  DIAGONAL_LEFT,
  DIAGONAL_RIGHT,
  DIAGONAL_LEFT_TOP,
  DIAGONAL_RIGHT_TOP,
}

export enum RunMode {
  MEETING = 1,
  WEB = 2,
}

export enum InterimEmitter {
  NON_DIARIZATION = 0,
  MICROPHONE = 1,
  SPEAKER = 2,
}

export enum MeetType {
  GOOGLE_MEET = 'meet',
  LIVE_CC = 'live-cc'
}

export enum MeetStatus {
  NOT_INITIALIZED,
  INITIALIZING,
  READY_TO_START,
  INITIALIZED,
}

export enum Identifiers {
  TOOLBOX = 'viva-toolbox',
  TOOLBOX_TOP_LEFT = 'viva-toolbox--top-left',
}

export enum InternalEvents {
  SPEAKER_OUT = 'speaker-out',
  LEARNING_MODE = 'learning-mode',
  OWN_SPEECH = 'own-transcriptions',
}

export enum Store {
  LANGUAGE = 'activeLanguage',
  POPUP_TARGET_LANG = 'popupTargetLang',
  CURRENT_LANG = 'currentLanguage',
  TEXT_TO_TRANSLATE = 'textToTranslate',
  TRANSLATED_TEXT = 'translatedText',
  CHAR_COUNT = 'charCount',
  IS_PINNED = 'isPinned',
  HIGHLIGHT_ACTIVE = 'isHighlightTranslationActive',
  HIGHLIGHT_TARGET_LANG = 'highlightTargetLang',
  HIGHLIGHT_X = 'highlightX',
  HIGHLIGHT_Y = 'highlightY',
  INPUT_TRANSLATE_ACTIVE = 'inputTranslationActive',
  VIDEO_CALL_ACTIVE = 'videoCallTranslationActive',
  SHOULD_RESET_VIDEO_CALL = 'resetVideoCallToActive',
  TOOLBOX_ACTIVE = 'toolboxActive',
  SPEAKER_OUT = 'speaker-out',
  LEARNING_MODE = 'learningMode',
  TBOX_RESIZE_HEIGHT = 'resizeCoordinatesHeight',
  TBOX_RESIZE_WIDTH = 'resizeCoordinatesWidth',
  TBOX_DRAG_X = 'dragAndDropCoordX',
  TBOX_DRAG_Y = 'dragAndDropCoordY',
  SUBTITLE_FONT_SIZE = 'subtitleFontSize',
  SHOW_OWN_TRANSCRIPTION = 'showOwnTranscription',
  SHOWN_TOOLTIP = 'ShownTooltip',
  SHOWN_TOOLTIP_MOVE_VIVA = 'Shown_tooltip-move_viva',
  GLADIA_KEY = 'gladia-key',
  DEEPL_KEY = 'deepl-key',
  OPENAI_KEY = 'openai-key',
}

export enum StorageEvents {
  STORAGE_SINGLE_UPDATE = 'storage-single-update',
}

export enum WorkerEvents {
  SAVE_STORAGE_ITEM = 'save-storage-item',
  SAVE_STORAGE_ITEMS = 'save-storage-items',
  DELETE_STORAGE_ITEM = 'delete-storage-item',
  GET_ALL_STORAGE_ITEMS = 'get-all-storage-items',
  RELOAD_STORAGE_ITEM = 'reload-storage-item',
  TRANSLATE = 'translate',
  GENERATE_AI_FEATURE = 'generate-ai-feature',
  START_LIVE_CC = 'start-live-cc',
  STOP_LIVE_CC = 'stop-live-cc',
  OFFSCREEN_AUDIO_PACKET = 'offscreen-audio-packet',
  OFFSCREEN_ERROR_CAPTURING_AUDIO = 'offscreen-error-capturing-audio',
  INJECT_LIVE_CC = 'inject-live-cc',
  CHECK_LIVE_CC = 'check-live-cc',
  START_RECORDING = 'start-recording',
  STOP_RECORDING = 'stop-recording',
  RECORDING_STATUS = 'recording-status',
  SHOW_TRANSCRIPTION_RESULTS = 'show-transcription-results',
  AUDIO_PACKET = 'audio-packet',
  ERROR_CAPTURING_AUDIO = 'error-capturing-audio',
}

export enum MessageTarget {
  OFFSCREEN_RECORDER = 'offscreen-recorder',
}

export enum AIFeatures {
  Sumamry = 0,
}

export enum VADEvents {
  PRE_VAD_START = 'user-pre-vad-start',
  VAD_START = 'user-vad-start',
  PRE_VAD_STOP = 'user-pre-vad-stop',
  VAD_STOP = 'user-vad-stop',
}
