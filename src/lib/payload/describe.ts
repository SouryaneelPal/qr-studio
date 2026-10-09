import { normaliseUrl } from './url';
import type { QrInputs, QrType } from './types';

const TYPE_LABELS: Record<QrType, string> = {
  url: 'Link',
  text: 'Text',
  email: 'Email',
  phone: 'Phone',
  wifi: 'Wi-Fi',
};

export function typeLabel(type: QrType): string {
  return TYPE_LABELS[type];
}

function truncate(value: string, maxLength: number): string {
  const chars = Array.from(value);
  return chars.length > maxLength ? `${chars.slice(0, maxLength - 1).join('')}…` : value;
}

// Never includes the Wi-Fi password: this text is used for alt text and the history list.
export function describeInput<K extends QrType>(type: K, input: QrInputs[K]): string;
export function describeInput(type: QrType, input: QrInputs[QrType]): string {
  switch (type) {
    case 'url':
      return normaliseUrl((input as QrInputs['url']).url);
    case 'text':
      return truncate((input as QrInputs['text']).text.trim(), 80);
    case 'email': {
      const email = input as QrInputs['email'];
      const subject = email.subject ? `, subject “${truncate(email.subject, 40)}”` : '';
      return `${email.address.trim()}${subject}`;
    }
    case 'phone':
      return (input as QrInputs['phone']).phone.trim();
    case 'wifi': {
      const wifi = input as QrInputs['wifi'];
      const security = wifi.security === 'nopass' ? 'open network' : `${wifi.security} secured`;
      return `${wifi.ssid} (${security}${wifi.hidden ? ', hidden' : ''})`;
    }
  }
}

export function describeForScreenReader<K extends QrType>(type: K, input: QrInputs[K]): string {
  const prefixes: Record<QrType, string> = {
    url: 'QR code that opens the link',
    text: 'QR code containing the text',
    email: 'QR code that starts an email to',
    phone: 'QR code that calls',
    wifi: 'QR code that joins the Wi-Fi network',
  };
  return `${prefixes[type]} ${describeInput(type, input)}`;
}
