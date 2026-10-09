import type { BuildResult, FieldErrors, QrInputs, QrType } from '../../lib/payload/types';
import { EmailForm, PhoneForm, TextForm, UrlForm, WifiForm } from './forms';
import { TYPE_PANEL_ID as PANEL_ID, tabId } from './ids';
import { TypeSelector } from './TypeSelector';

interface QrInputPanelProps {
  type: QrType;
  inputs: QrInputs;
  build: BuildResult<unknown>;
  onTypeChange: (type: QrType) => void;
  onInputChange: <K extends QrType>(type: K, patch: Partial<QrInputs[K]>) => void;
  rememberWifiPassword: boolean;
  onRememberWifiPasswordChange: (remember: boolean) => void;
  wifiPasswordNeeded: boolean;
}

function errorsOf<T>(build: BuildResult<unknown>): FieldErrors<T> {
  return build.ok ? {} : (build.errors as FieldErrors<T>);
}

export function QrInputPanel({
  type,
  inputs,
  build,
  onTypeChange,
  onInputChange,
  rememberWifiPassword,
  onRememberWifiPasswordChange,
  wifiPasswordNeeded,
}: QrInputPanelProps) {
  return (
    <section className="panel panel--mint panel--content" aria-labelledby="content-heading">
      <h2 id="content-heading" className="panel__title">
        Content
      </h2>
      <TypeSelector value={type} onChange={onTypeChange} panelId={PANEL_ID} />
      <div id={PANEL_ID} role="tabpanel" aria-labelledby={tabId(type)} className="form-stack">
        {type === 'url' && (
          <UrlForm
            input={inputs.url}
            errors={errorsOf(build)}
            finalUrl={build.ok ? build.payload : null}
            onChange={(patch) => onInputChange('url', patch)}
          />
        )}
        {type === 'text' && (
          <TextForm
            input={inputs.text}
            errors={errorsOf(build)}
            onChange={(patch) => onInputChange('text', patch)}
          />
        )}
        {type === 'email' && (
          <EmailForm
            input={inputs.email}
            errors={errorsOf(build)}
            onChange={(patch) => onInputChange('email', patch)}
          />
        )}
        {type === 'phone' && (
          <PhoneForm
            input={inputs.phone}
            errors={errorsOf(build)}
            onChange={(patch) => onInputChange('phone', patch)}
          />
        )}
        {type === 'wifi' && (
          <WifiForm
            input={inputs.wifi}
            errors={errorsOf(build)}
            onChange={(patch) => onInputChange('wifi', patch)}
            rememberPassword={rememberWifiPassword}
            onRememberPasswordChange={onRememberWifiPasswordChange}
            passwordNeeded={wifiPasswordNeeded}
          />
        )}
      </div>
    </section>
  );
}
