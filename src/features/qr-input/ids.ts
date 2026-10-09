import type { QrType } from '../../lib/payload/types';

export const TYPE_PANEL_ID = 'qr-type-panel';

export function tabId(type: QrType): string {
  return `qr-type-tab-${type}`;
}
