import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../app/App';
import { GUIDE_OPEN_KEY } from '../guide/HowItWorks';

function setup() {
  const user = userEvent.setup();
  const view = render(<App />);
  return { user, ...view };
}

const themeGroup = () => screen.getByRole('group', { name: 'Theme' });
const captionText = () => screen.getByLabelText('Caption text');

describe('theme picker', () => {
  it('starts on Classic / Plain', () => {
    setup();
    expect(within(themeGroup()).getByRole('radio', { name: 'Classic' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Plain' })).toBeChecked();
    expect(within(themeGroup()).getAllByRole('radio')).toHaveLength(6);
  });

  it('shows sub-theme chips for the chosen theme and applies its colours, which stay editable', async () => {
    const { user } = setup();
    await user.click(within(themeGroup()).getByRole('radio', { name: 'Superhero' }));

    const styles = screen.getByRole('group', { name: 'Superhero styles' });
    expect(
      within(styles)
        .getAllByRole('radio')
        .map((radio) => radio.getAttribute('value')),
    ).toEqual(['shield', 'iron', 'thunder', 'gamma', 'doomsday']);
    expect(within(styles).getByRole('radio', { name: 'Shield' })).toBeChecked();
    expect(screen.getByLabelText('Code colour hex code')).toHaveValue('#0b1f4d');

    await user.click(within(styles).getByRole('radio', { name: 'Doomsday' }));
    expect(within(styles).getByRole('radio', { name: 'Doomsday' })).toBeChecked();
    expect(screen.getByLabelText('Code colour hex code')).toHaveValue('#2b0505');

    const hex = screen.getByLabelText('Code colour hex code');
    await user.clear(hex);
    await user.type(hex, '#123456');
    expect(screen.getByLabelText('Code colour')).toHaveValue('#123456');
    expect(within(styles).getByRole('radio', { name: 'Doomsday' })).toBeChecked();
  });

  it('can be used with the keyboard as a radio group', async () => {
    const { user } = setup();
    within(themeGroup()).getByRole('radio', { name: 'Classic' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(within(themeGroup()).getByRole('radio', { name: 'Superhero' })).toBeChecked();
  });
});

describe('caption', () => {
  it('switches on, counts characters and stops at 40', async () => {
    const { user } = setup();
    const toggle = screen.getByRole('switch', { name: 'Show caption' });
    expect(toggle).not.toBeChecked();

    await user.type(captionText(), 'Hello 👋');
    expect(toggle).toBeChecked();
    expect(screen.getByText('7/40')).toBeInTheDocument();

    await user.clear(captionText());
    await user.type(captionText(), 'x'.repeat(45));
    expect(captionText()).toHaveValue('x'.repeat(40));
    expect(screen.getByText('40/40')).toBeInTheDocument();

    await user.click(toggle);
    expect(toggle).not.toBeChecked();
    expect(captionText()).toHaveValue('x'.repeat(40));
  });

  it('offers the theme’s suggestion as a placeholder and fills it in on request', async () => {
    const { user } = setup();
    await user.click(within(themeGroup()).getByRole('radio', { name: 'Pookie' }));
    expect(captionText()).toHaveAttribute('placeholder', 'Scan me, pookie 💕');
    await user.click(screen.getByRole('button', { name: 'Use suggestion' }));
    expect(captionText()).toHaveValue('Scan me, pookie 💕');
    expect(screen.getByRole('switch', { name: 'Show caption' })).toBeChecked();
  });

  it('keeps the user’s own caption when switching themes', async () => {
    const { user } = setup();
    await user.type(captionText(), 'My own words');
    await user.click(within(themeGroup()).getByRole('radio', { name: 'Bollywood' }));
    await user.click(screen.getByRole('radio', { name: 'Rangoli' }));
    expect(captionText()).toHaveValue('My own words');
    expect(captionText()).toHaveAttribute('placeholder', 'शुभ आरंभ');
  });

  it('moves between top and bottom and is described in the preview’s alt text', async () => {
    const { user } = setup();
    await user.type(screen.getByLabelText('Web address'), 'example.com');
    await user.type(captionText(), 'Visit us');
    expect(screen.getByRole('radio', { name: 'Bottom' })).toBeChecked();
    await user.click(screen.getByRole('radio', { name: 'Top' }));
    expect(screen.getByRole('radio', { name: 'Top' })).toBeChecked();
    await waitFor(() =>
      expect(screen.getByRole('img', { name: /captioned “Visit us”/ })).toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(screen.getByTestId('scan-status')).toHaveTextContent('Scans correctly'),
    );
  });
});

describe('recent codes with themes', () => {
  it('saves and restores the theme, sub-theme and caption', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('tab', { name: 'Text' }));
    await user.type(screen.getByLabelText('Your text'), 'themed code');
    await user.click(within(themeGroup()).getByRole('radio', { name: "Retro '80s" }));
    await user.click(screen.getByRole('radio', { name: 'Cassette label' }));
    await user.type(captionText(), 'Mixtape vol. 2');
    await user.click(screen.getByRole('radio', { name: 'Top' }));
    await user.click(await screen.findByRole('button', { name: 'Save to recent' }));

    await user.click(within(themeGroup()).getByRole('radio', { name: 'Classic' }));
    await user.clear(captionText());
    await user.click(screen.getByRole('switch', { name: 'Show caption' }));
    await user.click(screen.getByRole('radio', { name: 'Bottom' }));

    const recent = screen.getByRole('list', { name: 'Recent codes' });
    await user.click(within(recent).getByRole('button', { name: /themed code.*Use this code/ }));

    expect(within(themeGroup()).getByRole('radio', { name: "Retro '80s" })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Cassette label' })).toBeChecked();
    expect(captionText()).toHaveValue('Mixtape vol. 2');
    expect(screen.getByRole('radio', { name: 'Top' })).toBeChecked();
    expect(screen.getByRole('switch', { name: 'Show caption' })).toBeChecked();
  });
});

describe('guide', () => {
  it('is open on the first visit and remembers being collapsed', async () => {
    const { user, unmount } = setup();
    expect(screen.getByText('Pick what to share')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Hide guide' }));
    expect(screen.getByText('Pick what to share')).not.toBeVisible();
    expect(localStorage.getItem(GUIDE_OPEN_KEY)).toBe('false');
    unmount();

    setup();
    expect(screen.getByRole('button', { name: 'Show guide' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.getByText('Pick what to share')).not.toBeVisible();
  });

  it('explains each section from its "?" button', async () => {
    const { user } = setup();
    const hint = screen.getByRole('button', { name: 'What is Preview?' });
    expect(hint).toHaveAttribute('aria-expanded', 'false');
    await user.click(hint);
    expect(hint).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/exactly as it will download/)).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Preview' })).toBeInTheDocument();
  });

  it('opens the scanning tips on request', async () => {
    const { user } = setup();
    expect(screen.getByText(/at least 2 cm wide/)).not.toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Show tips' }));
    expect(screen.getByText(/at least 2 cm wide/)).toBeVisible();
  });
});
