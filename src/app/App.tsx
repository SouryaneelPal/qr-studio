import { useMemo, useReducer } from 'react';
import { ExportActions } from '../features/qr-export/ExportActions';
import { HowItWorks } from '../features/guide/HowItWorks';
import { Mascot } from '../features/guide/Mascot';
import { ScanTips } from '../features/guide/ScanTips';
import { HistoryPanel } from '../features/history/HistoryPanel';
import { useHistory } from '../features/history/useHistory';
import { QrInputPanel } from '../features/qr-input/QrInputPanel';
import { analysePreview, type PreviewRequest } from '../features/qr-preview/analysePreview';
import { QrPreview } from '../features/qr-preview/QrPreview';
import { StylePanel } from '../features/qr-style/StylePanel';
import { StressTestPanel } from '../features/stress-test/StressTestPanel';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { buildPayload } from '../lib/payload';
import type { StressRequest } from '../lib/scan/stress';
import { createEntry } from '../lib/storage/history';
import { INITIAL_STATE, studioReducer } from './studioState';
import { useFontsVersion } from './useFontsVersion';
import { useTheme } from './useTheme';

const PREVIEW_DELAY_MS = 100;

export function App() {
  const [state, dispatch] = useReducer(studioReducer, INITIAL_STATE);
  const history = useHistory();
  const { theme, toggle: toggleTheme } = useTheme();
  const fontsVersion = useFontsVersion();

  const input = state.inputs[state.type];
  const build = useMemo(() => buildPayload(state.type, input), [state.type, input]);

  const request = useMemo<PreviewRequest>(
    () => ({ type: state.type, input, style: state.style, design: state.design, fontsVersion }),
    [state.type, input, state.style, state.design, fontsVersion],
  );
  const shownRequest = useDebouncedValue(request, PREVIEW_DELAY_MS);
  const model = useMemo(() => analysePreview(shownRequest), [shownRequest]);
  const stressRequest = useMemo<StressRequest | null>(
    () =>
      model.state === 'ready'
        ? {
            plan: model.plan,
            payload: model.payload,
            errorCorrection: shownRequest.style.errorCorrection,
            margin: shownRequest.style.margin,
          }
        : null,
    [model, shownRequest.style],
  );

  // Save what is on screen, which may lag the form by the debounce delay.
  function saveShownToHistory() {
    history.add(
      createEntry(shownRequest.type, shownRequest.input, shownRequest.style, {
        rememberWifiPassword: state.rememberWifiPassword,
        design: shownRequest.design,
      }),
    );
  }

  return (
    <div className="app">
      <header className="masthead">
        <Mascot mood="wave" className="masthead__mascot" />
        <div className="masthead__text">
          <h1 className="masthead__title">
            QR <span className="masthead__sticker">Studio</span>
          </h1>
          <p className="masthead__tagline">
            Make QR codes that scan. Everything stays on your device.
          </p>
        </div>
        <button
          type="button"
          className="theme-toggle"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          onClick={toggleTheme}
        >
          <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span>
        </button>
      </header>

      <HowItWorks />

      <main className="layout">
        <div className="layout__preview">
          <QrPreview
            model={model}
            pending={request !== shownRequest}
            actions={
              model.state === 'ready' && (
                <ExportActions
                  type={shownRequest.type}
                  plan={model.plan}
                  onExported={saveShownToHistory}
                />
              )
            }
          />
          <StressTestPanel request={stressRequest} />
        </div>

        <div className="layout__controls">
          <QrInputPanel
            type={state.type}
            inputs={state.inputs}
            build={build}
            onTypeChange={(type) => dispatch({ kind: 'select-type', type })}
            onInputChange={(type, patch) => dispatch({ kind: 'edit-input', type, patch })}
            rememberWifiPassword={state.rememberWifiPassword}
            onRememberWifiPasswordChange={(remember) =>
              dispatch({ kind: 'set-remember-wifi-password', remember })
            }
            wifiPasswordNeeded={state.wifiPasswordNeeded}
          />
          <StylePanel
            style={state.style}
            onChange={(patch) => dispatch({ kind: 'edit-style', patch })}
            design={state.design}
            payload={build.ok ? build.payload : null}
            onSelectTheme={(themeId) => dispatch({ kind: 'select-theme', themeId })}
            onSelectSubTheme={(choice) => dispatch({ kind: 'select-sub-theme', choice })}
            onCaptionChange={(patch) => dispatch({ kind: 'edit-caption', patch })}
          />
          <HistoryPanel
            entries={history.entries}
            problem={history.problem}
            onUse={(entry) => dispatch({ kind: 'restore', entry })}
            onDelete={history.remove}
            onClear={history.clear}
          />
          <ScanTips />
        </div>
      </main>

      <footer className="footer">Works offline. No data leaves your browser.</footer>
    </div>
  );
}
