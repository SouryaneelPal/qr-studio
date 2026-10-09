# QR Studio

A browser-only QR code generator and designer that checks its own codes still scan.

**Live:** https://qr-studio-souryaneel.vercel.app

## What it does

- **Five QR types**, each with its own form: link, plain text, email (address, subject, body), phone number and Wi-Fi (network name, password, security type, hidden network).
- **Live preview** that updates as you type.
- **Customisation:** size (128–1024 px), code and background colours, error correction (L, M, Q, H) and margin.
- **Six presets** (Classic, Midnight, Ocean, Forest, Print-safe, High contrast) that stay editable after you pick one.
- **Themed scenes:** 6 themes × 5 sub-themes, with your own caption.
- **Downloads:** PNG and SVG, plus copy to clipboard. The download is drawn by the same code as the preview, so they always match.
- **Recent codes** saved in your browser, which survive a refresh and can be reused, deleted or cleared.
- **A built-in guide:** "How it works" steps, "Tips for codes that scan", and a short hint on every section.
- **Light and dark theme**, and a layout that works on phones (down to 360 px wide) and desktops.

Everything runs in your browser. The app makes no network requests, so nothing you type ever leaves your device.

## What makes it different

Most QR generators let you pick colours and hope the result still scans. I wanted QR Studio to *check*.

### 1. It scans its own codes

After every change, the app decodes its own preview with a QR reader (jsQR) and compares the result with what you typed. You see "Scans correctly" or "Won't scan" with the reason (the little mascot looks happy or worried too). It also warns about:

- contrast below 4.5:1 (WCAG formula)
- inverted colours (light code on a dark background)
- a margin under 4 modules
- modules smaller than 3 px
- low error correction on a dense code

A capacity meter shows the QR version (1–40), the grid size and how full the code is, and explains when long content forces a denser code.

### 2. A real-world stress test

A code that scans on a screen can still fail when printed small or scanned in dim light. The stress test damages a copy of your code in five ways and tries to read each one:

| Condition | What it simulates |
|---|---|
| Out of focus | A camera that hasn't focused |
| Printed small | A tiny print where details merge |
| Low light | A dim room, with low contrast |
| Slight tilt | A phone held about 7° off straight |
| Smudged corner | A sticker, fold or thumb covering a corner |

It shows a result like "Survives 4/5 real-world conditions", and when something fails it suggests the fix that applies to your settings, such as raising error correction to Q or H. It runs in a Web Worker, so typing stays smooth.

Calibrating it taught me a few things:

- **The smudge needed to be bigger.** A 12% smudge didn't break even the weakest error-correction level, because it covers only about 1.5% of the code's area, so it proved nothing. At 25%, the weakest level fails on small codes while Q and H survive.
- **Results shouldn't depend on export size.** A "camera capture" step scales the image to a fixed size first, as a real printed code would be seen.
- **The camera frames the code, not the whole scene.** With full-scene themes, busy artwork across the whole image confused the decoder in dim light even when the code itself was fine. The camera now frames the code plus some surrounding scene, the way a person points a phone at a poster.

### 3. Themed scenes that still scan

Six themes, each with five sub-themes. Every one is a full square scene where the code sits on something that belongs there:

| Theme | Sub-themes |
|---|---|
| Classic | Plain · Rounded card · Polaroid · Ticket stub · Postage stamp |
| Superhero | Shield · Iron · Thunder · Gamma · Doomsday |
| Pookie | Bubblegum · Lavender cloud · Strawberry milk · Bunny · Sparkle |
| Mafia Noir | Noir · Sepia film · Red rose · Gold deco · Smoky jazz |
| Retro '80s | Rusted metal · Neon arcade · Cassette label · VHS glitch · Boombox |
| Bollywood | Filmy marquee · Marigold mehendi · Hand-painted poster · Rangoli · Disco Diwali |

For example, Doomsday puts the code on a glowing monitor in a ruined skyline under a red sky, Neon arcade puts it on an arcade screen over a synthwave sunset, and Filmy marquee puts it on a cinema screen under bulb lights.

- **Original art:** all artwork is drawn in code (vector shapes, with seeded randomness for textures like rust and VHS glitch, so the output is identical every time). There are no logos, characters, film titles, quotes or downloaded images.
- **Your own caption:** turn it on, type up to 40 characters (emoji welcome), and place it at the top or bottom. It sits on a banner, sign or ticker inside the scene. Each theme suggests a caption you can use or ignore.
- **Blend slider:** tints the code's background with the scene's colours. It's capped at 25%, the highest level every scene still passes at.
- **Scannability is protected:** the code and its 4-module margin are never painted over, and the scenery fades in only outside that margin. A safety check drops anything that would touch the code; it caught a real bug where a spotlight beam would have covered the code's corners.

### 4. Security warnings for links

QR codes are a common way to hide phishing links ("quishing"). Link codes are checked first:

- **Blocked:** `javascript:`, `data:`, `vbscript:`, `file:` and any other non-web link.
- **Warned about:**
  - plain `http`
  - a login hidden in the link (`https://google.com@evil.com` really goes to `evil.com`)
  - an IP address instead of a domain
  - punycode or non-English domains (the real `xn--` form is shown)
  - Latin letters mixed with lookalike Cyrillic or Greek ones
  - link shorteners, which hide the real destination

### 5. Privacy by default

Wi-Fi passwords are **never** saved in recent codes unless you tick "Remember this Wi-Fi password". Recent codes store settings (including theme, caption and blend) rather than images, are capped at 20, and are checked when loaded. If browser storage is full, blocked (private browsing) or corrupt, the app keeps working and shows a notice.

### 6. Correct encoding in tricky cases

- Wi-Fi network names and passwords containing `\ ; , : "` are escaped as the Wi-Fi QR format requires
- open networks have no password, and hidden networks are marked as hidden
- email subjects and bodies with `&`, `?`, `#`, line breaks or non-English text are encoded properly
- emoji and Hindi text work
- phone numbers are normalised, with a warning when there's no country code

Property-based tests generate random inputs of every type, turn each into a QR code, decode it, parse it back, and check it matches exactly.

## How it works

- **One drawing plan:** each code (with its scene and caption) is turned into a single "drawing plan". The preview, PNG, SVG, clipboard copy, scan check and stress test all use it, so what you see is exactly what you download.
- **Text encoding:** everything is encoded as UTF-8 bytes, so emoji and other scripts decode reliably. A test checks my capacity tables against the QR library at all 40 versions and all 4 error-correction levels.
- **Saving recent codes:** codes are saved when you download or copy them, or press "Save to recent", so the list doesn't fill with half-typed codes.

```
src/
  features/   UI: input forms, style panel and theme picker, preview, export,
              history, stress test, guide
  lib/        pure logic: payloads and parsers, URL safety, rendering and scenes,
              scanning and transforms, capacity, storage
```

## Design

A friendly "tactile" look: cream background, one colour per section (mint for content, butter for style, lilac for the preview, peach for the stress test), thick outlines with solid offset shadows, and buttons that press down when clicked. A small original block mascot waves in the header, and downloading a PNG sets off a little confetti burst.

- **Fonts:** headings use Bricolage Grotesque, and numbers and hex values use DM Mono. Scene captions use Playfair Display, Bungee and Yatra One (which supports Devanagari).
- **No network requests:** all fonts are bundled with the app rather than loaded from Google.
- **Contrast:** every colour pair meets WCAG AA. Buttons use dark text on the orange accent because white text didn't pass.
- **Dark theme and motion:** there's a matching dark theme, and the animations are off for people who prefer reduced motion.

## Accessibility

- **Keyboard:** the type tabs and the theme and sub-theme pickers work with the keyboard.
- **Fields:** every field has a label, and errors are linked to their fields.
- **Screen readers:** the scan status and stress test results are announced. The preview's description never includes a Wi-Fi password.
- **Colour:** pass and fail are never shown by colour alone.
- **Motion:** the app respects reduced-motion settings.

## Run it locally

Requirements: Node.js 20 or newer.

```bash
git clone https://github.com/SouryaneelPal/qr-studio.git
cd qr-studio
npm install
npm run dev
```

| Command | What it does |
|---|---|
| `npm run dev` | Starts the dev server |
| `npm run build` | Builds for production into `dist/` |
| `npm test` | Unit, component, property-based and in-browser rendering tests |
| `npm run test:e2e` | End-to-end tests in a real browser (desktop and mobile) |
| `npm run typecheck` | TypeScript checks |
| `npm run lint` | ESLint and Prettier |

## Testing

There are 507 unit, component and rendering tests (357 in jsdom and 150 in real Chromium for anything that needs a canvas), plus 26 end-to-end tests on desktop and mobile.

- **Every QR type:** all builders, validators and parsers, including the tricky cases above.
- **Round trips:** property-based tests (fast-check) build, render, decode and parse random inputs of every type.
- **Every scene:** all 30 scenes are tested with no caption, with a 40-character caption, and at maximum blend. Each must decode to the input and survive at least 4/5 stress conditions. Geometry tests check that no art, caption or fade touches the code or its margin, and that every scene keeps 4.5:1 contrast.
- **URL security:** every rule has a case that should warn and one that shouldn't.
- **Stress test:** each image transform, plus fixed outcomes. Classic passes all 5 conditions, low contrast at L fails low light, and H survives the smudge where L fails.
- **Storage:** persistence, the 20-entry cap, Wi-Fi passwords not stored by default, theme and caption restored from history, and recovery from blocked or corrupt storage.
- **End to end:**
  - every type produces a preview
  - invalid input shows errors
  - **downloaded PNGs (including themed scenes with captions) are decoded and must match what was typed**
  - recent codes survive a reload
  - no horizontal scrolling at 360 px
  - **no network requests are made** while typing, downloading, switching theme or running the stress test

## Tech stack

React 19, TypeScript (strict), Vite, `qrcode` (QR matrix), `jsqr` (decoding), Vitest (jsdom and browser mode), Testing Library, fast-check, Playwright, ESLint and Prettier. Deployed on Vercel.

## Limitations and future work

- The stress test simulates damage. It can't guarantee every phone camera will read a code, but it catches the common failures.
- The smudge test is tuned for small and medium codes. On very short codes, even error correction M can fail it.
- Two scenes need polish: Bubblegum's heart cloud reads more like a plain cloud, and a top caption on Bunny covers the bunny's ears.
- **Future work:**
  - reading an existing QR code from an uploaded image
  - a print-size advisor
  - offline install as a PWA