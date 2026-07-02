/* ============================================================
   Plain-English command interpreter for editing generated sites.
   Takes commands like:
     "change headline to Building dreams from the ground up"
     "make the background blue"  /  "change colors to #1e90ff"
     "change background to match the logo"
     "move logo to footer"       /  "move logo back to header"
     "change button text to Get a free quote"
     "change fonts to elegant"
     "remove the reviews section"
     "change business name to Acme & Co"
   Operates on the clean (final) HTML and returns the updated
   HTML plus a human-readable confirmation message.
   ============================================================ */

import { FONT_PAIRS } from "./industries.js?v=__BUILD__";

/* ---------- color utilities ---------- */

const COLOR_NAMES = {
  "light blue": "#38bdf8", "sky blue": "#0ea5e9", "dark blue": "#1e40af",
  "dark green": "#166534", "dark red": "#991b1b", "royal blue": "#2563eb",
  blue: "#2563eb", navy: "#1e3a8a", indigo: "#4f46e5", purple: "#7c3aed",
  violet: "#8b5cf6", lavender: "#a78bfa", magenta: "#c026d3", pink: "#db2777",
  rose: "#e11d48", salmon: "#fb7185", red: "#dc2626", crimson: "#be123c",
  maroon: "#7f1d1d", burgundy: "#881337", orange: "#ea580c", coral: "#f97316",
  peach: "#fb923c", amber: "#d97706", yellow: "#ca8a04", gold: "#a16207",
  olive: "#4d7c0f", lime: "#65a30d", green: "#16a34a", forest: "#166534",
  mint: "#10b981", emerald: "#059669", teal: "#0d9488", turquoise: "#06b6d4",
  cyan: "#0891b2", aqua: "#06b6d4", brown: "#92400e", chocolate: "#78350f",
  tan: "#b45309", black: "#18181b", charcoal: "#27272a", gray: "#4b5563",
  grey: "#4b5563", silver: "#64748b", slate: "#334155",
};

function hexNorm(h) {
  h = h.toLowerCase();
  if (/^#[0-9a-f]{3}$/.test(h)) return "#" + [...h.slice(1)].map(c => c + c).join("");
  return h;
}

function mix(hexA, hexB, weightB) {
  const a = hexA.slice(1), b = hexB.slice(1);
  const ch = (i) => Math.round(
    parseInt(a.slice(i, i + 2), 16) * (1 - weightB) + parseInt(b.slice(i, i + 2), 16) * weightB
  ).toString(16).padStart(2, "0");
  return "#" + ch(0) + ch(2) + ch(4);
}

function findColor(text) {
  const hex = text.match(/#(?:[0-9a-f]{6}|[0-9a-f]{3})\b/i);
  if (hex) return hexNorm(hex[0]);
  const lower = text.toLowerCase();
  for (const name of Object.keys(COLOR_NAMES).sort((x, y) => y.length - x.length)) {
    if (new RegExp(`\\b${name}\\b`).test(lower)) return COLOR_NAMES[name];
  }
  return null;
}

/** Extract the dominant (most frequent, sufficiently saturated) color from a logo image. */
async function dominantLogoColor(dataUrl) {
  const img = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });
  const size = 48;
  const canvas = document.createElement("canvas");
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);

  const bins = new Map();
  const collect = (relaxed) => {
    bins.clear();
    for (let i = 0; i < data.length; i += 4) {
      const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
      if (a < 128) continue;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      const lightness = (max + min) / 510;
      const sat = max === min ? 0 : (max - min) / (255 - Math.abs(max + min - 255));
      if (!relaxed && (sat < 0.2 || lightness > 0.92 || lightness < 0.08)) continue;
      if (relaxed && lightness > 0.95) continue;
      const key = (r >> 5 << 10) | (g >> 5 << 5) | (b >> 5);
      const bin = bins.get(key) || { r: 0, g: 0, b: 0, n: 0 };
      bin.r += r; bin.g += g; bin.b += b; bin.n++;
      bins.set(key, bin);
    }
  };
  collect(false);
  if (bins.size === 0) collect(true); // e.g. black/white or grayscale logos
  if (bins.size === 0) return null;

  const best = [...bins.values()].sort((x, y) => y.n - x.n)[0];
  const to2 = (v) => Math.round(v / best.n).toString(16).padStart(2, "0");
  return "#" + to2(best.r) + to2(best.g) + to2(best.b);
}

/* ---------- document helpers ---------- */

function parseDoc(html) {
  return new DOMParser().parseFromString(html, "text/html");
}

function serialize(doc) {
  return "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
}

function setOverride(doc, id, css) {
  let st = doc.getElementById(id);
  if (!st) {
    st = doc.createElement("style");
    st.id = id;
    doc.head.appendChild(st);
  }
  st.textContent = css;
}

function recolor(doc, hex) {
  setOverride(doc, "theme-override",
    `:root { --primary: ${hex}; --primary-dark: ${mix(hex, "#000000", 0.35)}; --soft: ${mix(hex, "#ffffff", 0.92)}; }`);
}

function stripQuotes(s) {
  return s.trim().replace(/^["'\u201c\u201d\u2018\u2019]+/, "").replace(/["'\u201c\u201d\u2018\u2019]+$/, "").trim();
}

const SECTION_MAP = {
  about: { sel: "#about", label: "About" },
  service: { sel: "#services", label: "Services" },
  services: { sel: "#services", label: "Services" },
  review: { sel: "#reviews", label: "Reviews" },
  reviews: { sel: "#reviews", label: "Reviews" },
  testimonial: { sel: "#reviews", label: "Reviews" },
  testimonials: { sel: "#reviews", label: "Reviews" },
  stats: { sel: ".stats", label: "Stats bar" },
  stat: { sel: ".stats", label: "Stats bar" },
  numbers: { sel: ".stats", label: "Stats bar" },
  contact: { sel: "#contact", label: "Contact" },
  cta: { sel: ".cta", label: "Call-to-action banner" },
  banner: { sel: ".cta", label: "Call-to-action banner" },
};

/* ---------- command matchers (checked in order) ---------- */

const MATCHERS = [
  {
    // "change background to match the logo", "use the logo colors", "match logo"
    match: (t) => /(?:match(?:ing)?\s+(?:the\s+)?logo|logo\s+colou?rs?|colou?rs?\s+(?:that\s+)?match(?:es)?\s+(?:the\s+)?logo|based\s+on\s+(?:the\s+)?logo|from\s+(?:the\s+)?logo)/i.test(t) ? {} : null,
    run: async (doc, _m, ctx) => {
      if (!ctx.input.logoDataUrl) {
        return { ok: false, message: "There's no uploaded logo to match — go back to \u201cEdit details\u201d and add a logo first, or name a color instead (e.g. \u201cmake the background blue\u201d)." };
      }
      const hex = await dominantLogoColor(ctx.input.logoDataUrl);
      if (!hex) return { ok: false, message: "I couldn't pick a usable color out of that logo. Try naming a color instead, e.g. \u201cchange colors to navy\u201d." };
      recolor(doc, hex);
      return { ok: true, message: `\u2713 Site colors now match the logo (dominant color ${hex}).` };
    },
  },
  {
    // "move logo to footer", "remove logo from header"
    match: (t) => {
      const move = t.match(/(?:move|put|place)\s+(?:the\s+)?logo\s+(?:back\s+|down\s+|up\s+)?(?:to|in|into)?\s*(?:the\s+)?(footer|bottom|header|nav(?:bar|igation)?|top)/i);
      if (move) return { dest: /footer|bottom/i.test(move[1]) ? "footer" : "header" };
      if (/(?:remove|hide)\s+(?:the\s+)?logo\s+(?:from\s+(?:the\s+)?(?:header|nav|top))?$/i.test(t.trim())) return { dest: "footer" };
      return null;
    },
    run: (doc, m) => {
      const navLogo = doc.querySelector(".nav .brand .logo-mark");
      if (m.dest === "footer") {
        if (!navLogo) return { ok: false, message: "The logo is already only in the footer." };
        navLogo.remove();
        return { ok: true, message: "\u2713 Logo removed from the header — it now appears only in the footer." };
      }
      if (navLogo) return { ok: false, message: "The logo is already in the header." };
      const footerLogo = doc.querySelector(".footer-brand .logo-mark");
      if (!footerLogo) return { ok: false, message: "No logo found to move." };
      doc.querySelector(".nav .brand").prepend(footerLogo.cloneNode(true));
      return { ok: true, message: "\u2713 Logo restored to the header." };
    },
  },
  {
    // "change about title to ..."
    match: (t) => t.match(/about\s+(?:section\s+)?(?:title|heading|headline)\s*(?:to\s+say|to|say|:|=)\s+(.+)/i),
    run: (doc, m) => {
      const el = doc.querySelector("#about h2");
      if (!el) return { ok: false, message: "The About section isn't on this site." };
      el.textContent = stripQuotes(m[1]);
      return { ok: true, message: `\u2713 About title changed to \u201c${stripQuotes(m[1])}\u201d.` };
    },
  },
  {
    // "change headline to ...", "change the title to ..."
    match: (t) => t.match(/(?:headline|hero\s+(?:title|heading|headline|text)|main\s+(?:title|heading)|title)\s*(?:to\s+say|to|say|:|=)\s+(.+)/i),
    run: (doc, m) => {
      doc.querySelector(".hero h1").textContent = stripQuotes(m[1]);
      return { ok: true, message: `\u2713 Headline changed to \u201c${stripQuotes(m[1])}\u201d.` };
    },
  },
  {
    // "change tagline / subheadline to ..."
    match: (t) => t.match(/(?:tagline|slogan|sub\s*headline|subtitle|sub\s*heading|hero\s+(?:sub)?text|text\s+under\s+the\s+headline)\s*(?:to\s+say|to|say|:|=)\s+(.+)/i),
    run: (doc, m) => {
      const el = doc.querySelector(".hero p");
      if (!el) return { ok: false, message: "Couldn't find the subheadline text." };
      el.textContent = stripQuotes(m[1]);
      return { ok: true, message: `\u2713 Subheadline changed to \u201c${stripQuotes(m[1])}\u201d.` };
    },
  },
  {
    // "change button text to ..."
    match: (t) => t.match(/(?:button|cta|call\s*to\s*action)s?\s*(?:text|label|wording)?\s*(?:to\s+say|to|say|:|=)\s+(.+)/i),
    run: (doc, m) => {
      const text = stripQuotes(m[1]);
      const targets = doc.querySelectorAll(".nav-cta, .hero-actions .btn-primary, .cta .btn-primary");
      if (targets.length === 0) return { ok: false, message: "No buttons found to change." };
      targets.forEach(el => { el.textContent = text; });
      return { ok: true, message: `\u2713 Main buttons now say \u201c${text}\u201d (${targets.length} button${targets.length > 1 ? "s" : ""} updated).` };
    },
  },
  {
    // "change business name to ..."
    match: (t) => t.match(/(?:business\s+|company\s+|brand\s+)?name\s*(?:to|:|=)\s+(.+)/i),
    run: (doc, m, ctx) => {
      const newName = stripQuotes(m[1]);
      const oldName = ctx.input.businessName;
      const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        if (node.nodeValue.includes(oldName)) node.nodeValue = node.nodeValue.replaceAll(oldName, newName);
      }
      doc.title = doc.title.replaceAll(oldName, newName);
      return { ok: true, message: `\u2713 Business name changed from \u201c${oldName}\u201d to \u201c${newName}\u201d everywhere on the site.`, businessName: newName };
    },
  },
  {
    // "remove the reviews section"
    match: (t) => {
      const m = t.match(/(?:remove|hide|delete|take\s+(?:out|off|away))\s+(?:the\s+)?(about|services?|reviews?|testimonials?|stats?|numbers|contact|cta|call\s*to\s*action|banner)\s*(?:section|part|area|bar)?/i);
      return m ? { key: m[1].toLowerCase().replace(/\s+/g, "") } : null;
    },
    run: (doc, m) => {
      const entry = SECTION_MAP[m.key] || SECTION_MAP[m.key.replace(/s$/, "")] || (m.key.startsWith("call") ? SECTION_MAP.cta : null);
      if (!entry) return { ok: false, message: `I don't recognize a \u201c${m.key}\u201d section.` };
      const el = doc.querySelector(entry.sel);
      if (!el) return { ok: false, message: `The ${entry.label} section was already removed.` };
      const section = el.closest("section") || el;
      section.remove();
      if (entry.sel.startsWith("#")) {
        doc.querySelectorAll(`a[href="${entry.sel}"]`).forEach(a => (a.closest("li") || a).remove());
      }
      return { ok: true, message: `\u2713 ${entry.label} section removed (regenerate to bring it back).` };
    },
  },
  {
    // "change fonts to elegant"
    match: (t) => t.match(/\bfonts?\b.*\b(modern|elegant|friendly|bold|classic)\b|\b(modern|elegant|friendly|bold|classic)\b.*\bfonts?\b/i),
    run: (doc, m) => {
      const styleName = (m[1] || m[2]).toLowerCase();
      const pair = FONT_PAIRS[styleName];
      const link = doc.querySelector('link[href*="fonts.googleapis.com/css2"]');
      if (link) link.setAttribute("href", `https://fonts.googleapis.com/css2?${pair.import}&display=swap`);
      setOverride(doc, "font-override",
        `:root { --heading-font: '${pair.heading}', system-ui, sans-serif; --body-font: '${pair.body}', system-ui, sans-serif; }`);
      return { ok: true, message: `\u2713 Fonts changed to the ${styleName} pairing (${pair.heading} + ${pair.body}).` };
    },
  },
  {
    // "make the background blue", "change colors to #1e90ff", "make it green"
    match: (t) => {
      if (!/(colou?rs?|background|theme|palette|scheme|paint|make\s+(?:it|the\s+site|everything))/i.test(t)) return null;
      const color = findColor(t);
      return color ? { color } : { color: null };
    },
    run: (doc, m) => {
      if (!m.color) {
        return { ok: false, message: "I couldn't recognize that color. Try a common color name (blue, navy, forest, teal, burgundy\u2026) or a hex code like #1e90ff. You can also say \u201cmatch the logo colors\u201d." };
      }
      recolor(doc, m.color);
      return { ok: true, message: `\u2713 Site colors changed to ${m.color}. Buttons, accents, and backgrounds all follow.` };
    },
  },
];

const HELP = `Here's what you can ask for right now:
\u2022 change headline to Your new headline here
\u2022 change tagline to Your new subheadline
\u2022 change about title to Our story
\u2022 change button text to Get a free quote
\u2022 change business name to New Name LLC
\u2022 make the background blue \u2014 or any color name / hex code
\u2022 change colors to match the logo
\u2022 change fonts to elegant (or modern, friendly, bold, classic)
\u2022 move logo to footer / move logo back to header
\u2022 remove the reviews section (or about, services, stats, contact, banner)
For anything else, use \u270f\ufe0f Edit text to change any text directly on the page.`;

/**
 * Interpret and apply a plain-English edit command.
 * @param {string} text - the user's command
 * @param {object} ctx - { html: finalHtml, input: lastInput }
 * @returns {Promise<{ok: boolean, message: string, html?: string, businessName?: string}>}
 */
async function applyCommand(text, ctx) {
  const t = text.trim();
  if (!t || /^(help|what can (?:i|you)|commands?|\?)/i.test(t)) return { ok: false, message: HELP };

  const doc = parseDoc(ctx.html);
  for (const matcher of MATCHERS) {
    const m = matcher.match(t);
    if (m) {
      const res = await matcher.run(doc, m, ctx);
      return res.ok ? { ...res, html: serialize(doc) } : res;
    }
  }
  return { ok: false, message: "I didn't understand that one.\n" + HELP };
}

export { applyCommand };
