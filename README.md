# Website Generator

Generate a modern, clean, professional website for **any** business in seconds — graphic designer, music business consultant, construction company, accounting firm, or anything else.

## How it works

1. **Enter your business type** — free text, any business model works. Autocomplete suggestions help, but you can type anything.
2. **Enter your business name.**
3. **Attach a logo (optional)** — drag & drop or browse (PNG, JPG, SVG, WebP). No logo? A clean monogram is designed for you automatically.
4. Optionally add a tagline, city/service area, phone, and email.
5. Hit **Generate my website**. The generator researches your business type, then builds a complete site tailored to your industry.

### The research step

The generator matches your business type against a built-in knowledge base:

- **40+ specific industries** (graphic design, construction, accounting, legal, restaurants, barbershops, music, real estate, auto repair, and more), each with a hand-tuned color palette and font pairing.
- **18 broad business categories** (creative, trades, professional services, health, food, retail, tech, fitness, events, and more) as a keyword-scored fallback.
- A **general professional profile** as a final fallback — so even "underwater basket weaving" gets a credible, polished site.

Each profile drives industry-appropriate copy (hero headline, about story, six service cards, stats, testimonials, calls to action) plus the design direction (colors, typography, light or dark hero).

## What you get

A complete single-page website with:

- Sticky navigation with your logo (or generated monogram)
- Hero section with headline, subheadline, and calls to action
- Stats bar, About section, Services grid, Testimonials
- Call-to-action banner and a contact section with a form
- Fully responsive layout (desktop / tablet / mobile)

Preview it at desktop, tablet, and mobile widths, regenerate, edit your details, then download it — no build step, no dependencies.

## Two versions: client preview vs. final site

Built for a "show the client first, publish when they buy" workflow. Every generated site comes in two downloadable versions, switchable in the preview toolbar:

**🔒 Client preview** (`business-name-client-preview.html`) — for sharing at a preview URL before purchase. Content protection is baked into the file:

- Text selection and copy/paste are disabled (the contact form still works)
- Right-click / context menu is blocked
- Images and the logo can't be dragged or saved via drag-out
- Save (Ctrl+S), print (Ctrl+P), select-all, and view-source shortcuts are blocked; printing produces a blank page
- A diagonal `PREVIEW · Business Name` watermark tiles the whole page, plus a "Client preview — not for redistribution" badge
- The watermark self-restores if someone deletes it via devtools

Host this file anywhere (Netlify Drop, Vercel, GitHub Pages, any static host) to get a previewable link for your client.

> Note: no browser-side protection is absolute — a determined person can still screenshot or dig into the source. This layer stops casual copy/paste and content lifting, which covers the realistic risk while a client is deciding.

**✅ Final site** (`business-name.html`) — completely clean, no watermark, no restrictions. When the client buys, publish this version to the permanent domain you purchase from any provider (point the domain at your static host and upload the file as `index.html`).

## Running it

It's a static app — no install, no backend.

```bash
# any static server works, e.g.:
python3 -m http.server 8000
# then open http://localhost:8000
```

Or just open `index.html` from a local server of your choice (ES modules require http://, not file://).

## Project structure

```
index.html         The generator app (form, progress, preview UI)
styles.css         App styles
js/main.js         App controller: form, logo upload, preview, download
js/generator.js    Website builder: turns input + research into a full HTML site
js/industries.js   Research engine: industry knowledge base, palettes, fonts
```
