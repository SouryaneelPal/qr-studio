import { useMemo, useReducer } from 'react';
import { ExportActions } from '../features/qr-export/ExportActions';
import { HistoryPanel } from '../features/history/HistoryPanel';
import { useHistory } from '../features/history/useHistory';
import { QrInputPanel } from '../features/qr-input/QrInputPanel';
import { analysePreview, type PreviewRequest } from '../features/qr-preview/analysePreview';
import { QrPreview } from '../features/qr-preview/QrPreview';
import { StylePanel } from '../features/qr-style/StylePanel';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { buildPayload } from '../lib/payload';
import { createEntry } from '../lib/storage/history';
import { INITIAL_STATE, studioReducer } from './studioState';
import { useTheme } from './useTheme';

const PREVIEW_DELAY_MS = 100;

export function App() {
  const [state, dispatch] = useReducer(studioReducer, INITIAL_STATE);
  const history = useHistory();
  const { theme, toggle: toggleTheme } = useTheme();

  const input = state.inputs[state.type];
  const build = useMemo(() => buildPayload(state.type, input), [state.type, input]);

  const request = useMemo<PreviewRequest>(
    () => ({ type: state.type, input, style: state.style }),
    [state.type, input, state.style],
  );
  const shownRequest = useDebouncedValue(request, PREVIEW_DELAY_MS);
  const model = useMemo(() => analysePreview(shownRequest), [shownRequest]);

  // Save what is on screen, which may lag the form by the debounce delay.
  function saveShownToHistory() {
    history.add(
      createEntry(shownRequest.type, shownRequest.input, shownRequest.style, {
        rememberWifiPassword: state.rememberWifiPassword,
      }),
    );
  }

  return (
    <div className="app">
      <header className="masthead">
        <div>
          <h1 className="masthead__title">QR Studio</h1>
          <p className="masthead__tagline">
            Make QR codes that scan. Everything stays on your device.
          </p>
        </div>
        <button
          type="button"
          className="button button--quiet theme-toggle"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          onClick={toggleTheme}
        >
          <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span>
        </button>
      </header>

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
          />
          <HistoryPanel
            entries={history.entries}
            problem={history.problem}
            onUse={(entry) => dispatch({ kind: 'restore', entry })}
            onDelete={history.remove}
            onClear={history.clear}
          />
        </div>
      </main>

      <footer className="footer">Works offline. No data leaves your browser.</footer>
    </div>
  );
}
