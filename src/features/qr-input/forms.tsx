import { useState } from 'react';
import { utf8Length } from '../../lib/payload/wifi';
import type {
  EmailInput,
  FieldErrors,
  PhoneInput,
  TextInput,
  UrlInput,
  WifiInput,
  WifiSecurity,
} from '../../lib/payload/types';
import { Field } from './Field';

interface FormProps<T> {
  input: T;
  errors: FieldErrors<T>;
  onChange: (patch: Partial<T>) => void;
}

export function UrlForm({
  input,
  errors,
  onChange,
  finalUrl,
}: FormProps<UrlInput> & { finalUrl: string | null }) {
  return (
    <Field
      id="url"
      label="Web address"
      value={input.url}
      inputType="url"
      inputMode="url"
      autoComplete="url"
      required
      error={errors.url}
      onChange={(url) => onChange({ url })}
      hint={
        finalUrl ? (
          <>
            Opens <span className="mono break">{finalUrl}</span>
          </>
        ) : (
          'For example example.com. We add https:// if you leave it out.'
        )
      }
    />
  );
}

export function TextForm({ input, errors, onChange }: FormProps<TextInput>) {
  return (
    <Field
      id="text"
      label="Your text"
      value={input.text}
      multiline
      required
      error={errors.text}
      onChange={(text) => onChange({ text })}
      hint="Any language and emoji are fine."
    />
  );
}

export function EmailForm({ input, errors, onChange }: FormProps<EmailInput>) {
  return (
    <>
      <Field
        id="email-address"
        label="Email address"
        value={input.address}
        inputType="email"
        inputMode="email"
        autoComplete="email"
        required
        error={errors.address}
        onChange={(address) => onChange({ address })}
      />
      <Field
        id="email-subject"
        label="Subject"
        value={input.subject}
        onChange={(subject) => onChange({ subject })}
      />
      <Field
        id="email-body"
        label="Message"
        value={input.body}
        multiline
        onChange={(body) => onChange({ body })}
      />
    </>
  );
}

export function PhoneForm({ input, errors, onChange }: FormProps<PhoneInput>) {
  return (
    <Field
      id="phone"
      label="Phone number"
      value={input.phone}
      inputType="tel"
      inputMode="tel"
      autoComplete="tel"
      required
      error={errors.phone}
      onChange={(phone) => onChange({ phone })}
      hint="Include the country code, for example +91 98765 43210."
    />
  );
}

const SECURITY_OPTIONS: { value: WifiSecurity; label: string }[] = [
  { value: 'WPA', label: 'WPA / WPA2 / WPA3' },
  { value: 'WEP', label: 'WEP (old)' },
  { value: 'nopass', label: 'None (open network)' },
];

interface WifiFormProps extends FormProps<WifiInput> {
  rememberPassword: boolean;
  onRememberPasswordChange: (remember: boolean) => void;
  passwordNeeded: boolean;
}

export function WifiForm({
  input,
  errors,
  onChange,
  rememberPassword,
  onRememberPasswordChange,
  passwordNeeded,
}: WifiFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const needsPassword = input.security !== 'nopass';
  const ssidBytes = utf8Length(input.ssid);

  return (
    <>
      <Field
        id="wifi-ssid"
        label="Network name (SSID)"
        value={input.ssid}
        required
        error={errors.ssid}
        onChange={(ssid) => onChange({ ssid })}
        hint={`${ssidBytes} of 32 bytes used.`}
      />

      <div className="field">
        <label htmlFor="wifi-security">Security</label>
        <select
          id="wifi-security"
          value={input.security}
          onChange={(event) => onChange({ security: event.target.value as WifiSecurity })}
        >
          {SECURITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {needsPassword && (
        <>
          {passwordNeeded && input.password === '' && (
            <p className="notice" role="note">
              This network’s password wasn’t saved. Enter it to recreate the code.
            </p>
          )}
          <Field
            id="wifi-password"
            label="Password"
            value={input.password}
            inputType={showPassword ? 'text' : 'password'}
            autoComplete="off"
            required
            revealError={passwordNeeded}
            error={errors.password}
            onChange={(password) => onChange({ password })}
            trailing={
              <button
                type="button"
                className="button button--quiet field__toggle"
                aria-controls="wifi-password"
                aria-pressed={showPassword}
                onClick={() => setShowPassword((shown) => !shown)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            }
          />
          <label className="check">
            <input
              type="checkbox"
              checked={rememberPassword}
              onChange={(event) => onRememberPasswordChange(event.target.checked)}
            />
            Remember this Wi-Fi password in recent codes
          </label>
        </>
      )}

      <label className="check">
        <input
          type="checkbox"
          checked={input.hidden}
          onChange={(event) => onChange({ hidden: event.target.checked })}
        />
        Hidden network (doesn’t broadcast its name)
      </label>
    </>
  );
}
