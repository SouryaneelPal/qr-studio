import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';
import { HISTORY_KEY } from '../lib/storage/history';

function setup() {
  const user = userEvent.setup();
  render(<App />);
  return { user };
}

async function expectScanStatus(text: RegExp) {
  await waitFor(() => expect(screen.getByTestId('scan-status')).toHaveTextContent(text), {
    timeout: 3000,
  });
}

describe('App', () => {
  it('shows the app title as the main heading', () => {
    setup();
    expect(screen.getByRole('heading', { level: 1, name: 'QR Studio' })).toBeInTheDocument();
  });

  it('previews a URL, shows the final address and confirms the scan', async () => {
    const { user } = setup();
    await user.type(screen.getByLabelText('Web address'), 'example.com');
    expect(screen.getByText('https://example.com')).toBeInTheDocument();
    await expectScanStatus(/Scans correctly/);
    expect(
      screen.getByRole('img', { name: /opens the link https:\/\/example\.com/ }),
    ).toBeInTheDocument();
  });

  it('switches types with the keyboard and keeps what was typed', async () => {
    const { user } = setup();
    await user.type(screen.getByLabelText('Web address'), 'example.com');

    screen.getByRole('tab', { name: 'Link' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Text' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Text' })).toHaveFocus();
    await user.type(screen.getByLabelText('Your text'), 'hello');

    await user.click(screen.getByRole('tab', { name: 'Link' }));
    expect(screen.getByLabelText('Web address')).toHaveValue('example.com');
    await user.click(screen.getByRole('tab', { name: 'Text' }));
    expect(screen.getByLabelText('Your text')).toHaveValue('hello');
  });

  it('shows linked errors after leaving an invalid field', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('tab', { name: 'Email' }));
    const address = screen.getByLabelText('Email address');
    await user.type(address, 'not-an-email');
    await user.tab();

    expect(address).toHaveAttribute('aria-invalid', 'true');
    expect(address).toHaveAccessibleDescription(/name@example\.com/);
  });

  it('blocks javascript: links with an error', async () => {
    const { user } = setup();
    const field = screen.getByLabelText('Web address');
    await user.type(field, 'javascript:alert(1)');
    await user.tab();
    expect(field).toHaveAccessibleDescription(/blocked/);
    expect(screen.queryByRole('img', { name: /QR code/ })).not.toBeInTheDocument();
  });

  it('shows URL security warnings', async () => {
    const { user } = setup();
    await user.type(screen.getByLabelText('Web address'), 'http://bit.ly/abc');
    await waitFor(() => expect(screen.getByText(/isn’t encrypted/)).toBeInTheDocument());
    expect(screen.getByText(/Link shorteners hide/)).toBeInTheDocument();
  });

  it('keeps presets editable after selecting one', async () => {
    const { user } = setup();
    const ocean = screen.getByRole('button', { name: /Ocean/ });
    await user.click(ocean);
    expect(ocean).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('Code colour hex code')).toHaveValue('#0b4f6c');

    const hex = screen.getByLabelText('Code colour hex code');
    await user.clear(hex);
    await user.type(hex, '#222222');
    expect(ocean).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByLabelText('Code colour')).toHaveValue('#222222');
    expect(screen.getByLabelText('Background colour hex code')).toHaveValue('#e6f6fb');
  });

  it('warns about low contrast and inverted colours', async () => {
    const { user } = setup();
    await user.type(screen.getByLabelText('Web address'), 'example.com');
    const fg = screen.getByLabelText('Code colour hex code');
    await user.clear(fg);
    await user.type(fg, '#ffffff');
    const bg = screen.getByLabelText('Background colour hex code');
    await user.clear(bg);
    await user.type(bg, '#000000');
    await waitFor(() =>
      expect(screen.getByText(/lighter than its background/)).toBeInTheDocument(),
    );
  });

  it('reports "Won’t scan" when the colours match', async () => {
    const { user } = setup();
    await user.type(screen.getByLabelText('Web address'), 'example.com');
    const fg = screen.getByLabelText('Code colour hex code');
    await user.clear(fg);
    await user.type(fg, '#ffffff');
    await expectScanStatus(/Won’t scan/);
    expect(screen.getByText(/contrast is 1\.0:1/)).toBeInTheDocument();
  });

  it('shows the capacity meter and an error for content that is too long', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('tab', { name: 'Text' }));
    await user.type(screen.getByLabelText('Your text'), 'hi');
    await waitFor(() => expect(screen.getByText(/Version 1 is \d+% full/)).toBeInTheDocument());

    await user.click(screen.getByLabelText('Your text'));
    await user.paste('x'.repeat(3000));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/Too much content/));
  });

  it('saves to recent codes without the Wi-Fi password and asks for it on reuse', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('tab', { name: 'Wi-Fi' }));
    await user.type(screen.getByLabelText('Network name (SSID)'), 'Home');
    await user.type(screen.getByLabelText('Password'), 'secret-pass');
    await user.click(await screen.findByRole('button', { name: 'Save to recent' }));

    expect(localStorage.getItem(HISTORY_KEY)).not.toContain('secret-pass');
    const recent = screen.getByRole('list', { name: 'Recent codes' });
    expect(within(recent).getByText(/password not saved/)).toBeInTheDocument();

    await user.clear(screen.getByLabelText('Password'));
    await user.click(within(recent).getByRole('button', { name: /Home.*Use this code/ }));
    expect(screen.getByText(/password wasn’t saved/)).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toHaveAttribute('aria-invalid', 'true');
  });

  it('restores type, input and style from a recent code', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('tab', { name: 'Text' }));
    await user.type(screen.getByLabelText('Your text'), 'remember me');
    await user.click(screen.getByRole('button', { name: /Forest/ }));
    await user.click(await screen.findByRole('button', { name: 'Save to recent' }));

    await user.click(screen.getByRole('button', { name: /Classic/ }));
    await user.click(screen.getByRole('tab', { name: 'Link' }));
    await user.click(
      within(screen.getByRole('list', { name: 'Recent codes' })).getByRole('button', {
        name: /remember me.*Use this code/,
      }),
    );

    expect(screen.getByRole('tab', { name: 'Text' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByLabelText('Your text')).toHaveValue('remember me');
    expect(screen.getByRole('button', { name: /Forest/ })).toHaveAttribute('aria-pressed', 'true');
  });

  it('keeps working with a notice when storage is blocked', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    const { user } = setup();
    await user.click(screen.getByRole('tab', { name: 'Text' }));
    await user.type(screen.getByLabelText('Your text'), 'still works');
    await user.click(await screen.findByRole('button', { name: 'Save to recent' }));

    expect(screen.getByText(/blocking storage/)).toBeInTheDocument();
    expect(
      within(screen.getByRole('list', { name: 'Recent codes' })).getByText('still works'),
    ).toBeInTheDocument();
  });

  it('loads saved codes after a fresh start and lets you delete them', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('tab', { name: 'Text' }));
    await user.type(screen.getByLabelText('Your text'), 'persisted');
    await user.click(await screen.findByRole('button', { name: 'Save to recent' }));
    act(() => {
      document.body.innerHTML = '';
    });

    const second = setup();
    const recent = screen.getByRole('list', { name: 'Recent codes' });
    expect(within(recent).getByText('persisted')).toBeInTheDocument();
    await second.user.click(screen.getByRole('button', { name: /Delete Text persisted/ }));
    expect(screen.queryByRole('list', { name: 'Recent codes' })).not.toBeInTheDocument();
  });

  it('toggles the theme', async () => {
    const { user } = setup();
    const toggle = screen.getByRole('button', { name: /Switch to (dark|light) theme/ });
    const before = toggle.getAttribute('aria-label');
    await user.click(toggle);
    expect(toggle.getAttribute('aria-label')).not.toBe(before);
    expect(document.documentElement.dataset.theme).toMatch(/light|dark/);
  });
});
