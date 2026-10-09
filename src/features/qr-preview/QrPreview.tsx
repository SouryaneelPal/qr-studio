import type { ReactNode } from 'react';
import type { PreviewModel } from './analysePreview';
import { CapacityMeter } from './CapacityMeter';
import { QrCanvas } from './QrCanvas';
import { ScanStatus } from './ScanStatus';
import { WarningList } from './WarningList';

interface QrPreviewProps {
  model: PreviewModel;
  pending: boolean;
  actions: ReactNode;
}

export function QrPreview({ model, pending, actions }: QrPreviewProps) {
  return (
    <section className="panel preview" aria-labelledby="preview-heading">
      <h2 id="preview-heading" className="panel__title">
        Preview
      </h2>

      <div className="preview__stage">
        {model.state === 'ready' ? (
          <QrCanvas plan={model.plan} altText={model.altText} />
        ) : (
          <div className="preview__placeholder">
            {model.state === 'error' ? 'Can’t draw this code' : 'Your code appears here'}
          </div>
        )}
      </div>

      <ScanStatus check={model.state === 'ready' ? model.scan : null} pending={pending} />

      {model.state === 'error' && (
        <div className="preview__error" role="alert">
          <p>{model.message}</p>
          {model.advice.length > 0 && (
            <ul className="advice">
              {model.advice.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {model.state === 'ready' && (
        <>
          {actions}
          <WarningList title="About this link" warnings={model.contentWarnings} />
          <WarningList title="Scan reliability" warnings={model.readabilityWarnings} />
          <CapacityMeter capacity={model.capacity} advice={model.advice} />
        </>
      )}
    </section>
  );
}
