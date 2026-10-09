import type { CapacityReport } from '../../lib/capacity/capacity';

interface CapacityMeterProps {
  capacity: Extract<CapacityReport, { fits: true }>;
  advice: string[];
}

export function CapacityMeter({ capacity, advice }: CapacityMeterProps) {
  const percent = Math.round(capacity.fillRatio * 100);
  return (
    <div className="capacity">
      <dl className="capacity__facts">
        <div>
          <dt>Version</dt>
          <dd className="mono">{capacity.version} / 40</dd>
        </div>
        <div>
          <dt>Grid</dt>
          <dd className="mono">
            {capacity.gridSize}×{capacity.gridSize}
          </dd>
        </div>
        <div>
          <dt>Content</dt>
          <dd className="mono">{capacity.byteLength} bytes</dd>
        </div>
      </dl>
      <label className="capacity__label" htmlFor="capacity-meter">
        Version {capacity.version} is {percent}% full
      </label>
      <meter
        id="capacity-meter"
        className={`capacity__meter${capacity.fillRatio > 0.8 ? ' capacity__meter--high' : ''}`}
        min={0}
        max={1}
        low={0.75}
        high={0.9}
        optimum={0.3}
        value={capacity.fillRatio}
      />
      {advice.length > 0 && (
        <ul className="advice">
          {advice.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
