import { useState } from 'react';
import type { QrType } from '../../lib/payload/types';
import { planToSvg } from '../../lib/render/outputs';
import type { DrawPlan } from '../../lib/render/plan';
import { planToPngBlob } from '../../lib/render/png';
import { canCopyImages, copyPngToClipboard, downloadBlob, exportFileName } from './exporters';

interface ExportActionsProps {
  type: QrType;
  plan: DrawPlan;
  onExported: () => void;
}

export function ExportActions({ type, plan, onExported }: ExportActionsProps) {
  const [message, setMessage] = useState('');

  async function downloadPng() {
    try {
      downloadBlob(await planToPngBlob(plan), exportFileName(type, 'png'));
      setMessage('PNG downloaded.');
      onExported();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The PNG couldn’t be created.');
    }
  }

  function downloadSvg() {
    downloadBlob(
      new Blob([planToSvg(plan)], { type: 'image/svg+xml' }),
      exportFileName(type, 'svg'),
    );
    setMessage('SVG downloaded.');
    onExported();
  }

  async function copyImage() {
    if (!canCopyImages()) {
      setMessage('Your browser can’t copy images. Download the PNG instead.');
      return;
    }
    try {
      await copyPngToClipboard(planToPngBlob(plan));
      setMessage('Image copied to the clipboard.');
      onExported();
    } catch {
      setMessage('Copying was blocked by the browser. Download the PNG instead.');
    }
  }

  function saveToRecent() {
    onExported();
    setMessage('Saved to recent codes.');
  }

  return (
    <div className="export">
      <div className="export__buttons">
        <button type="button" className="button button--primary" onClick={() => void downloadPng()}>
          Download PNG
        </button>
        <button type="button" className="button" onClick={downloadSvg}>
          Download SVG
        </button>
        <button type="button" className="button" onClick={() => void copyImage()}>
          Copy image
        </button>
        <button type="button" className="button" onClick={saveToRecent}>
          Save to recent
        </button>
      </div>
      <p className="export__message" role="status">
        {message}
      </p>
    </div>
  );
}
