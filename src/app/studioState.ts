import { EMPTY_INPUTS, type QrInputs, type QrType } from '../lib/payload/types';
import { limitCaption, type CaptionSettings } from '../lib/render/caption';
import { MAX_BLEND } from '../lib/render/plan';
import { DEFAULT_DESIGN, type QrDesign } from '../lib/render/renderQr';
import { clamp, DEFAULT_STYLE, MARGIN_RANGE, SIZE_RANGE, type QrStyle } from '../lib/render/style';
import { findSubTheme, findTheme, type ThemeChoice, type ThemeId } from '../lib/render/themes';
import type { HistoryEntry } from '../lib/storage/history';

export interface StudioState {
  type: QrType;
  inputs: QrInputs;
  style: QrStyle;
  design: QrDesign;
  rememberWifiPassword: boolean;
  // True after restoring a Wi-Fi entry whose password was not stored.
  wifiPasswordNeeded: boolean;
}

export type StudioAction =
  | { kind: 'select-type'; type: QrType }
  | { kind: 'edit-input'; type: QrType; patch: Partial<QrInputs[QrType]> }
  | { kind: 'edit-style'; patch: Partial<QrStyle> }
  | { kind: 'select-theme'; themeId: ThemeId }
  | { kind: 'select-sub-theme'; choice: ThemeChoice }
  | { kind: 'edit-caption'; patch: Partial<CaptionSettings> }
  | { kind: 'set-blend'; blend: number }
  | { kind: 'set-remember-wifi-password'; remember: boolean }
  | { kind: 'restore'; entry: HistoryEntry };

export const INITIAL_STATE: StudioState = {
  type: 'url',
  inputs: EMPTY_INPUTS,
  style: DEFAULT_STYLE,
  design: DEFAULT_DESIGN,
  rememberWifiPassword: false,
  wifiPasswordNeeded: false,
};

function withClampedRanges(style: QrStyle): QrStyle {
  return {
    ...style,
    size: clamp(Math.round(style.size), SIZE_RANGE.min, SIZE_RANGE.max),
    margin: clamp(Math.round(style.margin), MARGIN_RANGE.min, MARGIN_RANGE.max),
  };
}

// Like a preset: a theme sets the code's colours and error correction, all still editable after.
function applyTheme(state: StudioState, choice: ThemeChoice): StudioState {
  const { qr } = findSubTheme(choice);
  return {
    ...state,
    design: { ...state.design, theme: choice },
    style: {
      ...state.style,
      foreground: qr.foreground,
      background: qr.background,
      errorCorrection: qr.errorCorrection,
    },
  };
}

export function studioReducer(state: StudioState, action: StudioAction): StudioState {
  switch (action.kind) {
    case 'select-type':
      return { ...state, type: action.type };
    case 'edit-input':
      return {
        ...state,
        inputs: {
          ...state.inputs,
          [action.type]: { ...state.inputs[action.type], ...action.patch },
        },
      };
    case 'edit-style':
      return { ...state, style: withClampedRanges({ ...state.style, ...action.patch }) };
    case 'select-theme': {
      if (action.themeId === state.design.theme.themeId) return state;
      const first = findTheme(action.themeId).subThemes[0];
      return first ? applyTheme(state, { themeId: action.themeId, subThemeId: first.id }) : state;
    }
    case 'select-sub-theme':
      return applyTheme(state, action.choice);
    case 'edit-caption': {
      const caption = { ...state.design.caption, ...action.patch };
      return {
        ...state,
        design: { ...state.design, caption: { ...caption, text: limitCaption(caption.text) } },
      };
    }
    case 'set-blend':
      return { ...state, design: { ...state.design, blend: clamp(action.blend, 0, MAX_BLEND) } };
    case 'set-remember-wifi-password':
      return { ...state, rememberWifiPassword: action.remember };
    case 'restore': {
      const { entry } = action;
      return {
        ...state,
        type: entry.type,
        inputs: { ...state.inputs, [entry.type]: { ...entry.input } },
        style: { ...entry.style },
        design: {
          theme: { ...entry.design.theme },
          caption: { ...entry.design.caption },
          blend: entry.design.blend,
        },
        rememberWifiPassword:
          entry.type === 'wifi' && !entry.passwordOmitted && entry.input.password !== '',
        wifiPasswordNeeded: entry.passwordOmitted,
      };
    }
  }
}
