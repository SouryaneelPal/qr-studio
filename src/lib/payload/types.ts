export type QrType = 'url' | 'text' | 'email' | 'phone' | 'wifi';

export const QR_TYPES: readonly QrType[] = ['url', 'text', 'email', 'phone', 'wifi'];

export type WifiSecurity = 'WPA' | 'WEP' | 'nopass';

export interface UrlInput {
  url: string;
}

export interface TextInput {
  text: string;
}

export interface EmailInput {
  address: string;
  subject: string;
  body: string;
}

export interface PhoneInput {
  phone: string;
}

export interface WifiInput {
  ssid: string;
  password: string;
  security: WifiSecurity;
  hidden: boolean;
}

export interface QrInputs {
  url: UrlInput;
  text: TextInput;
  email: EmailInput;
  phone: PhoneInput;
  wifi: WifiInput;
}

export interface Warning {
  id: string;
  message: string;
}

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

export type BuildResult<T> =
  { ok: true; payload: string; warnings: Warning[] } | { ok: false; errors: FieldErrors<T> };

export type ParsedPayload = {
  [K in QrType]: { type: K; input: QrInputs[K] };
}[QrType];

export const EMPTY_INPUTS: QrInputs = {
  url: { url: '' },
  text: { text: '' },
  email: { address: '', subject: '', body: '' },
  phone: { phone: '' },
  wifi: { ssid: '', password: '', security: 'WPA', hidden: false },
};
