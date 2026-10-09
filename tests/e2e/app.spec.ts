import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import jsQR from 'jsqr';

const scanStatus = (page: Page) => page.getByTestId('scan-status');

async function chooseType(page: Page, name: string) {
  await page.getByRole('tab', { name, exact: true }).click();
}

async function expectScans(page: Page) {
  await expect(scanStatus(page)).toContainText('Scans correctly');
  await expect(page.getByRole('img', { name: /^QR code/ })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test.describe('every type produces a preview', () => {
  test('link', async ({ page }) => {
    await page.getByLabel('Web address').fill('gdg.community.dev');
    await expect(page.getByText('https://gdg.community.dev', { exact: true })).toBeVisible();
    await expectScans(page);
  });

  test('text', async ({ page }) => {
    await chooseType(page, 'Text');
    await page.getByLabel('Your text').fill('नमस्ते GDG 🎉');
    await expectScans(page);
  });

  test('email', async ({ page }) => {
    await chooseType(page, 'Email');
    await page.getByLabel('Email address').fill('team@example.com');
    await page.getByLabel('Subject').fill('Q&A? #1');
    await page.getByLabel('Message').fill('Hello\nthere');
    await expectScans(page);
  });

  test('phone', async ({ page }) => {
    await chooseType(page, 'Phone');
    await page.getByLabel('Phone number').fill('+91 98765 43210');
    await expectScans(page);
  });

  test('wi-fi', async ({ page }) => {
    await chooseType(page, 'Wi-Fi');
    await page.getByLabel('Network name (SSID)').fill('Café;"Net"');
    await page.getByLabel('Password', { exact: true }).fill(String.raw`p@ss:w,rd\;`);
    await page.getByLabel(/Hidden network/).check();
    await expectScans(page);
    await expect(page.getByRole('img', { name: /^QR code/ })).not.toHaveAccessibleName(/p@ss/);
  });
});

test('invalid input shows errors', async ({ page }) => {
  const url = page.getByLabel('Web address');
  await url.fill('javascript:alert(1)');
  await url.blur();
  await expect(url).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByText(/run code when opened/)).toBeVisible();
  await expect(page.getByRole('img', { name: /^QR code/ })).toHaveCount(0);

  await chooseType(page, 'Phone');
  const phone = page.getByLabel('Phone number');
  await phone.fill('123');
  await phone.blur();
  await expect(phone).toHaveAccessibleDescription(/7 to 15 digits/);
});

test('downloaded PNG matches the chosen size and decodes back to the payload', async ({ page }) => {
  await chooseType(page, 'Text');
  await page.getByLabel('Your text').fill('Download check ✓');
  await expectScans(page);

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download PNG' }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^qr-text-\d{8}-\d{6}\.png$/);
  const path = await download.path();
  const base64 = (await readFile(path)).toString('base64');

  const image = await page.evaluate(async (data) => {
    const bytes = Uint8Array.from(atob(data), (char) => char.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/png' }));
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('No 2D context');
    context.drawImage(bitmap, 0, 0);
    const pixels = context.getImageData(0, 0, bitmap.width, bitmap.height);
    return { width: pixels.width, height: pixels.height, data: Array.from(pixels.data) };
  }, base64);

  expect(image.width).toBe(512);
  expect(image.height).toBe(512);
  const decoded = jsQR(Uint8ClampedArray.from(image.data), image.width, image.height);
  expect(decoded).not.toBeNull();
  expect(new TextDecoder().decode(Uint8Array.from(decoded?.binaryData ?? []))).toBe(
    'Download check ✓',
  );
});

test('recent codes survive a reload', async ({ page }) => {
  await chooseType(page, 'Text');
  await page.getByLabel('Your text').fill('Kept after reload');
  await page.getByRole('button', { name: /Ocean/ }).click();
  await expectScans(page);
  await page.getByRole('button', { name: 'Save to recent' }).click();

  await page.reload();
  const recent = page.getByRole('list', { name: 'Recent codes' });
  await expect(recent.getByText('Kept after reload')).toBeVisible();

  await recent
    .getByRole('button', { name: /Kept after reload/ })
    .first()
    .click();
  await expect(page.getByRole('tab', { name: 'Text', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(page.getByLabel('Your text')).toHaveValue('Kept after reload');
  await expect(page.getByRole('button', { name: /Ocean/ })).toHaveAttribute('aria-pressed', 'true');
  await expectScans(page);
});

test('no horizontal overflow at 360 px wide', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.getByLabel('Web address').fill(`example.com/${'very-long-path-segment-'.repeat(8)}`);
  await expectScans(page);
  await page.getByRole('button', { name: 'Save to recent' }).click();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);

  // On narrow screens the preview comes before the controls.
  const previewTop = await page.getByRole('heading', { name: 'Preview' }).boundingBox();
  const contentTop = await page.getByRole('heading', { name: 'Content' }).boundingBox();
  expect(previewTop?.y ?? 0).toBeLessThan(contentTop?.y ?? 0);
});

test('makes no network requests after the page loads', async ({ page }) => {
  await page.waitForLoadState('networkidle');
  const requests: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    // blob: and data: URLs are local to the page (downloads), not network traffic.
    if (!url.startsWith('blob:') && !url.startsWith('data:')) requests.push(url);
  });

  await page.getByLabel('Web address').fill('https://example.com');
  await expectScans(page);
  await chooseType(page, 'Wi-Fi');
  await page.getByLabel('Network name (SSID)').fill('Home');
  await page.getByLabel('Password', { exact: true }).fill('correct horse');
  await expectScans(page);
  await page.getByRole('button', { name: /Midnight/ }).click();
  await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download PNG' }).click(),
  ]);
  await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download SVG' }).click(),
  ]);
  await page.getByRole('button', { name: /Switch to/ }).click();

  expect(requests).toEqual([]);
});
