import { EMPTY_INPUTS, type QrInputs, type QrType } from '../lib/payload/types';
import { clamp, DEFAULT_STYLE, MARGIN_RANGE, SIZE_RANGE, type QrStyle } from '../lib/render/style';
import type { HistoryEntry } from '../lib/storage/history';

export interface StudioState {
  type: QrType;
  inputs: QrInputs;
  style: QrStyle;
  rememberWifiPassword: boolean;
  // True after restoring a Wi-Fi entry whose password was not stored.
  wifiPasswordNeeded: boolean;
}

export type StudioAction =
  | { kind: 'select-type'; type: QrType }
  | { kind: 'edit-input'; type: QrType; patch: Partial<QrInputs[QrType]> }
  | { kind: 'edit-style'; patch: Partial<QrStyle> }
  | { kind: 'set-remember-wifi-password'; remember: boolean }
  | { kind: 'restore'; entry: HistoryEntry };

export const INITIAL_STATE: StudioState = {
  type: 'url',
  inputs: EMPTY_INPUTS,
  style: DEFAULT_STYLE,
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
    case 'set-remember-wifi-password':
      return { ...state, rememberWifiPassword: action.remember };
    case 'restore': {
      const { entry } = action;
      return {
        ...state,
        type: entry.type,
        inputs: { ...state.inputs, [entry.type]: { ...entry.input } },
        style: { ...entry.style },
        rememberWifiPassword:
          entry.type === 'wifi' && !entry.passwordOmitted && entry.input.password !== '',
        wifiPasswordNeeded: entry.passwordOmitted,
      };
    }
  }
}
