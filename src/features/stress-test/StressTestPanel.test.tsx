import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../app/App';

async function createTextCode(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.click(screen.getByRole('tab', { name: 'Text' }));
  await user.type(screen.getByLabelText('Your text'), text);
  await waitFor(() =>
    expect(screen.getByTestId('scan-status')).toHaveTextContent('Scans correctly'),
  );
}

async function setHex(user: ReturnType<typeof userEvent.setup>, label: string, value: string) {
  const field = screen.getByLabelText(label);
  await user.clear(field);
  await user.type(field, value);
}

describe('StressTestPanel', () => {
  it('cannot run until there is a valid code', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: 'Run stress test' })).toBeDisabled();
    expect(screen.getByTestId('stress-summary')).toHaveTextContent('Create a valid code');
  });

  it('reports a pass for every condition with text, not just colour', async () => {
    const user = userEvent.setup();
    render(<App />);
    await createTextCode(user, 'Hello GDG');
    await user.click(screen.getByRole('button', { name: 'Run stress test' }));

    await waitFor(() =>
      expect(screen.getByTestId('stress-summary')).toHaveTextContent(
        'Survives 5/5 real-world conditions',
      ),
    );
    const rows = within(screen.getByRole('list', { name: 'Stress test results' })).getAllByRole(
      'listitem',
    );
    expect(rows).toHaveLength(5);
    for (const row of rows) expect(row).toHaveTextContent('Passed');
    expect(screen.getByTestId('stress-summary')).toHaveAttribute('role', 'status');
  });

  it('re-runs after edits and suggests fixes for failures', async () => {
    const user = userEvent.setup();
    render(<App />);
    await createTextCode(user, 'Hello GDG');
    await user.click(screen.getByRole('button', { name: 'Run stress test' }));
    await waitFor(() => expect(screen.getByTestId('stress-summary')).toHaveTextContent('5/5'));

    await user.click(screen.getByRole('radio', { name: /^L/ }));
    await setHex(user, 'Code colour hex code', '#8a8a8a');

    await waitFor(
      () => expect(screen.getByTestId('stress-summary')).toHaveTextContent(/Survives [0-4]\/5/),
      {
        timeout: 4000,
      },
    );
    const lowLight = screen.getByText('Low light').closest('li');
    expect(lowLight).toHaveTextContent('Failed');
    expect(screen.getByTestId('stress-summary')).toHaveTextContent(/Failed: .*Low light/);
    expect(screen.getByRole('heading', { name: 'How to make it sturdier' })).toBeInTheDocument();
    expect(screen.getByText(/Raise error correction to Q or H/)).toBeInTheDocument();
    expect(screen.getByText(/Increase contrast/)).toBeInTheDocument();
  });
});
