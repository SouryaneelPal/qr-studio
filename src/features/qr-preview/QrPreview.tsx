import type { ReactNode } from 'react';
import type { PreviewModel } from './analysePreview';
import { CapacityMeter } from './CapacityMeter';
import { QrCanvas } from './QrCanvas';
import { ScanStatus } from './ScanStatus';
import { WarningList } from './WarningList';
import { Mascot } from '../guide/Mascot';
import { SectionHint } from '../guide/SectionHint';

interface QrPreviewProps {
  model: PreviewModel;
  pending: boolean;
  actions: ReactNode;
}

export function QrPreview({ model, pending, actions }: QrPreviewProps) {
  return (
    <section
      className="panel panel--lilac panel--preview preview"
      aria-labelledby="preview-heading"
    >
      <div className="panel__header">
        <div className="panel__heading">
          <h2 id="preview-heading" className="panel__title">
            Preview
          </h2>
          <SectionHint section="Preview">
            Your code exactly as it will download. We scan it ourselves after every change.
          </SectionHint>
        </div>
      </div>

      <div className="preview__stage">
        {model.state === 'ready' ? (
          <QrCanvas plan={model.plan} altText={model.altText} />
        ) : (
          <div className="preview__placeholder">
            {model.state === 'error'
              ? 'Can’t draw this code'
              : 'Type something and your code pops up here'}
          </div>
        )}
      </div>

      <div className="scan-row">
        <Mascot
          mood={model.state !== 'ready' ? 'idle' : model.scan.status === 'ok' ? 'happy' : 'worried'}
          className="scan-row__mascot"
        />
        <ScanStatus check={model.state === 'ready' ? model.scan : null} pending={pending} />
      </div>

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
