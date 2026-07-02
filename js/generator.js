/* ============================================================
   Website Generator Engine
   Takes user input (business name, type, optional logo/details)
   plus a researched industry profile and produces a complete,
   standalone, premium single-page website as an HTML string.

   Design language: editorial. Oversized display type, mono
   micro-labels, numbered sections, hairline rules, a services
   ticker, scroll-reveal motion, film-grain texture, and a
   hand-drawn underline accent — built to feel hand-crafted.
   ============================================================ */

import { PALETTES, FONT_PAIRS, researchBusiness } from "./industries.js?v=__BUILD__";

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function fill(template, name, type) {
  return template.replaceAll("{name}", esc(name)).replaceAll("{type}", esc(type.toLowerCase()));
}

function initials(name) {
  const words = name.trim().split(/\s+/).filter(w => /[a-z0-9]/i.test(w));
  if (words.length === 0) return "•";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/* SVG monogram used when no logo is uploaded */
function monogramSvg(name, palette, size = 40) {
  const text = esc(initials(name));
  return `<svg class="logo-mark" viewBox="0 0 48 48" width="${size}" height="${size}" role="img" aria-label="${esc(name)} logo"><rect x="2" y="2" width="44" height="44" rx="12" fill="${palette.primary}"/><rect x="2" y="2" width="44" height="44" rx="12" fill="url(#lg${size})" opacity="0.35"/><defs><linearGradient id="lg${size}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><text x="24" y="30" text-anchor="middle" font-family="Arial, sans-serif" font-size="${text.length > 1 ? 17 : 22}" font-weight="700" fill="#fff">${text}</text></svg>`;
}

function logoHtml(input, palette, size = 40) {
  if (input.logoDataUrl) {
    return `<img class="logo-mark" src="${input.logoDataUrl}" alt="${esc(input.businessName)} logo" />`;
  }
  return monogramSvg(input.businessName, palette, size);
}

/* Hand-drawn underline stroke for the last word of the headline */
const HL_STROKE = `<svg class="hl-stroke" viewBox="0 0 220 14" preserveAspectRatio="none" aria-hidden="true"><path d="M4 10 C 42 4, 92 3, 132 7 S 198 12, 216 6" fill="none" stroke="var(--accent)" stroke-width="5.5" stroke-linecap="round" opacity=".9"/></svg>`;

function decorateHeadline(escapedText) {
  const words = escapedText.trim().split(" ");
  if (words.length < 2) return escapedText;
  const last = words.pop();
  return `${words.join(" ")} <span class="hl">${last}${HL_STROKE}</span>`;
}

/* Film-grain texture, inlined as an SVG data URI */
const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`;

/* ============================================================
   Content protection for the client-preview version.
   ============================================================ */
function protectionBlock(businessName) {
  const wmText = `PREVIEW · ${businessName.replace(/[<>&"']/g, "")}`;
  const wmSvg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="360"><text x="50%" y="50%" text-anchor="middle" transform="rotate(-27 260 180)" font-family="Arial, sans-serif" font-size="26" font-weight="700" fill="rgba(120,120,140,0.13)">${wmText}</text></svg>`
  );

  const style = `
<style id="pv-style">
  body { -webkit-user-select: none; -moz-user-select: none; user-select: none; }
  input, textarea { -webkit-user-select: text; -moz-user-select: text; user-select: text; }
  img, svg { -webkit-user-drag: none; user-drag: none; }
  #pv-watermark {
    position: fixed; inset: 0; z-index: 2147483646; pointer-events: none;
    background-image: url("data:image/svg+xml,${wmSvg}");
    background-repeat: repeat;
  }
  #pv-badge {
    position: fixed; bottom: 16px; right: 16px; z-index: 2147483647;
    background: rgba(17, 24, 39, 0.92); color: #fff; font-family: Arial, sans-serif;
    font-size: 12px; font-weight: 600; letter-spacing: 0.04em;
    padding: 9px 16px; border-radius: 999px; pointer-events: none;
    box-shadow: 0 6px 20px rgba(0,0,0,0.35);
  }
  @media print { body { display: none !important; } }
</style>`;

  const script = `
<script id="pv-script">
(function () {
  "use strict";
  var isFormField = function (t) { return t && t.closest && t.closest("input, textarea"); };

  ["contextmenu", "copy", "cut", "dragstart", "selectstart"].forEach(function (ev) {
    document.addEventListener(ev, function (e) {
      if ((ev === "copy" || ev === "cut" || ev === "selectstart") && isFormField(e.target)) return;
      e.preventDefault();
      e.stopPropagation();
    }, true);
  });

  document.addEventListener("keydown", function (e) {
    var k = (e.key || "").toLowerCase();
    var mod = e.ctrlKey || e.metaKey;
    if (mod && ["c", "x", "a", "s", "u", "p"].indexOf(k) !== -1 && !isFormField(e.target)) { e.preventDefault(); return; }
    if (e.key === "F12" || (mod && e.shiftKey && ["i", "j", "c", "k"].indexOf(k) !== -1)) { e.preventDefault(); }
  }, true);

  var ensure = function () {
    if (!document.getElementById("pv-watermark") || !document.getElementById("pv-badge") || !document.getElementById("pv-style")) {
      location.reload();
    }
  };
  setInterval(ensure, 1500);

  console.log("%cThis is a protected client preview. Content \\u00a9 its owner \\u2014 unauthorized copying is prohibited.", "font-size:14px;font-weight:bold;");
})();
<\/script>`;

  const overlay = `<div id="pv-watermark" aria-hidden="true"></div>
<div id="pv-badge">CLIENT PREVIEW &mdash; NOT FOR REDISTRIBUTION</div>`;

  return { style, script, overlay };
}

/**
 * Apply the client-preview protection layer to a finished (clean) site.
 * Works on any final HTML — including HTML that was edited after generation.
 */
function applyProtection(finalHtml, businessName) {
  const p = protectionBlock(businessName);
  return finalHtml
    .replace("</head>", `${p.style}\n</head>`)
    .replace("</body>", `${p.overlay}${p.script}\n</body>`);
}

/**
 * Generate a complete website.
 * @param {object} input - { businessName, businessType, tagline?, city?, phone?, email?, logoDataUrl?,
 *                           reviews?: [{ quote, who?, role?, stars? }] } real reviews (pasted by the
 *                           user, e.g. from the business's Google listing) replace example testimonials.
 * @param {object} [options] - { protect?: boolean } protect=true builds the watermarked,
 *                             copy-protected client-preview version.
 * @returns {{ html: string, profile: object }}
 */
function generateWebsite(input, options = {}) {
  const profile = researchBusiness(input.businessType);
  const palette = PALETTES[profile.palette];
  const fonts = FONT_PAIRS[profile.fonts];
  const name = input.businessName.trim();
  const type = input.businessType.trim();
  const year = new Date().getFullYear();

  const tagline = input.tagline?.trim();
  const heroHeadline = decorateHeadline(tagline ? esc(tagline) : fill(profile.heroHeadline, name, type));
  const heroSub = fill(profile.heroSub, name, type);
  const cityLine = input.city?.trim() ? `Proudly serving ${esc(input.city.trim())} and surrounding areas.` : "";

  const contactBits = [];
  if (input.phone?.trim()) contactBits.push(`<a class="contact-link" href="tel:${esc(input.phone.trim().replace(/[^+\d]/g, ""))}"><span class="ci">📞</span>${esc(input.phone.trim())}</a>`);
  if (input.email?.trim()) contactBits.push(`<a class="contact-link" href="mailto:${esc(input.email.trim())}"><span class="ci">✉️</span>${esc(input.email.trim())}</a>`);
  if (input.city?.trim()) contactBits.push(`<span class="contact-link"><span class="ci">📍</span>${esc(input.city.trim())}</span>`);

  const servicesHtml = profile.services.map((s, i) => `
        <article class="card reveal">
          <span class="card-num">(0${i + 1})</span>
          <h3>${esc(s.name)}</h3>
          <p>${fill(s.desc, name, type)}</p>
        </article>`).join("");

  const marqueeItems = profile.services.map(s => esc(s.name)).join('<span class="mq-sep">✦</span>');
  const marqueeSpan = `<span class="mq-chunk">${marqueeItems}<span class="mq-sep">✦</span></span>`;

  const statsHtml = profile.stats.map(([num, label]) => `
        <div class="stat reveal"><span class="stat-num">${esc(num)}</span><span class="stat-label">${esc(label)}</span></div>`).join("");

  // Real, user-pasted reviews take priority over the generated examples
  const customReviews = (input.reviews || []).filter(r => r.quote?.trim());
  const usingRealReviews = customReviews.length > 0;
  const reviewsData = usingRealReviews
    ? customReviews.map(r => {
        const rawWho = r.who?.trim() || "Verified customer";
        return {
          quote: esc(r.quote.trim()),
          who: esc(rawWho),
          role: esc(r.role?.trim() || "Customer review"),
          avatar: esc(rawWho[0].toUpperCase()),
          stars: Math.min(5, Math.max(1, parseInt(r.stars, 10) || 5)),
        };
      })
    : profile.reviews.map(([quote, who, role]) => ({
        quote: fill(quote, name, type), who: esc(who), role: esc(role),
        avatar: esc(who.trim()[0].toUpperCase()), stars: 5,
      }));

  const reviewsHtml = reviewsData.map(r => `
        <figure class="review reveal">
          <div class="stars" aria-label="${r.stars} out of 5 stars">${"★".repeat(r.stars)}${"☆".repeat(5 - r.stars)}</div>
          <blockquote>&ldquo;${r.quote}&rdquo;</blockquote>
          <figcaption><span class="avatar">${r.avatar}</span><span class="rev-meta"><strong>${r.who}</strong><span>${r.role}</span></span></figcaption>
        </figure>`).join("");

  const reviewsSub = usingRealReviews
    ? `Real reviews from real customers of ${esc(name)}.`
    : `Don't take our word for it — here's what people say about working with ${esc(name)}.`;

  const aboutHtml = profile.about.map(p => `<p>${fill(p, name, type)}</p>`).join("\n          ");

  const dark = palette.heroMode === "dark";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(name)} — ${esc(type)}</title>
<meta name="description" content="${esc(name)} — professional ${esc(type.toLowerCase())} services. ${esc(fill(profile.ctaSub, name, type)).slice(0, 140)}" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?${fonts.import}&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
<style>
  :root {
    --primary: ${palette.primary};
    --primary-dark: ${palette.primaryDark};
    --accent: ${palette.accent};
    --ink: ${palette.ink};
    --soft: ${palette.soft};
    --paper: ${dark ? "#fbfaf7" : "#fcfbf8"};
    --body-font: '${fonts.body}', system-ui, sans-serif;
    --heading-font: '${fonts.heading}', system-ui, sans-serif;
    --mono-font: 'IBM Plex Mono', ui-monospace, monospace;
    --hair: color-mix(in srgb, var(--ink) 14%, transparent);
    --ease: cubic-bezier(.16, 1, .3, 1);
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body {
    font-family: var(--body-font); color: var(--ink); line-height: 1.68;
    background: var(--paper); overflow-x: hidden;
  }
  /* film grain — the "printed" feel */
  body::after {
    content: ""; position: fixed; inset: 0; z-index: 998; pointer-events: none;
    background-image: ${GRAIN}; opacity: .05;
  }
  h1, h2, h3 { font-family: var(--heading-font); line-height: 1.04; letter-spacing: -0.02em; }
  ${fonts.caps ? "h1, .section-title, .cta h2, .footer-word { text-transform: uppercase; }" : ""}
  img { max-width: 100%; display: block; }
  .wrap { max-width: 1180px; margin: 0 auto; padding: 0 28px; }
  .mono { font-family: var(--mono-font); font-size: .72rem; font-weight: 500; letter-spacing: .16em; text-transform: uppercase; }

  /* reveal-on-scroll */
  .reveal { opacity: 0; transform: translateY(26px); transition: opacity .8s var(--ease), transform .8s var(--ease); }
  .reveal.in { opacity: 1; transform: none; }
  .cards .reveal:nth-child(2), .reviews .reveal:nth-child(2), .stats-inner .reveal:nth-child(2) { transition-delay: .08s; }
  .cards .reveal:nth-child(3), .reviews .reveal:nth-child(3), .stats-inner .reveal:nth-child(3) { transition-delay: .16s; }
  .cards .reveal:nth-child(4), .stats-inner .reveal:nth-child(4) { transition-delay: .24s; }
  .cards .reveal:nth-child(5) { transition-delay: .32s; }
  .cards .reveal:nth-child(6) { transition-delay: .4s; }
  @media (prefers-reduced-motion: reduce) {
    .reveal { opacity: 1; transform: none; transition: none; }
    .marquee-track { animation: none !important; }
    html { scroll-behavior: auto; }
  }

  /* buttons */
  .btn {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 15px 30px; border-radius: 999px; text-decoration: none;
    font-family: var(--mono-font); font-size: .78rem; font-weight: 500;
    letter-spacing: .14em; text-transform: uppercase;
    transition: transform .25s var(--ease), background .25s, color .25s, border-color .25s;
  }
  .btn:hover { transform: translateY(-2px); }
  .btn .arr { transition: transform .25s var(--ease); }
  .btn:hover .arr { transform: translateX(4px); }
  .btn-primary { background: var(--ink); color: var(--paper); }
  .btn-primary:hover { background: var(--primary); color: #fff; }
  .btn-ghost { border: 1.5px solid var(--hair); color: var(--ink); }
  .btn-ghost:hover { border-color: var(--ink); }

  /* section header pattern */
  .eyebrow {
    display: inline-flex; align-items: center; gap: 14px;
    font-family: var(--mono-font); font-size: .72rem; font-weight: 500;
    letter-spacing: .16em; text-transform: uppercase;
    color: color-mix(in srgb, var(--ink) 62%, transparent); margin-bottom: 22px;
  }
  .eyebrow::before { content: ""; width: 34px; height: 1.5px; background: var(--ink); }
  .section-title { font-size: clamp(2rem, 4.4vw, 3.1rem); margin-bottom: 18px; max-width: 18ch; }
  .section-sub { color: color-mix(in srgb, var(--ink) 62%, transparent); max-width: 58ch; margin-bottom: 56px; font-size: 1.05rem; }

  /* ---------- nav ---------- */
  .nav {
    position: sticky; top: 0; z-index: 50;
    background: color-mix(in srgb, var(--paper) 88%, transparent);
    backdrop-filter: blur(12px); border-bottom: 1px solid var(--hair);
  }
  .nav-inner { display: flex; align-items: center; justify-content: space-between; height: 76px; }
  .brand { display: flex; align-items: center; gap: 12px; text-decoration: none; color: var(--ink); }
  .brand .logo-mark { width: 40px; height: 40px; object-fit: contain; border-radius: 10px; }
  .brand-name { font-family: var(--heading-font); font-weight: 700; font-size: 1.1rem; letter-spacing: -0.01em; }
  .nav-links { display: flex; align-items: center; gap: 34px; list-style: none; }
  .nav-links a {
    text-decoration: none; color: color-mix(in srgb, var(--ink) 72%, transparent);
    font-family: var(--mono-font); font-size: .72rem; font-weight: 500;
    letter-spacing: .14em; text-transform: uppercase; position: relative;
  }
  .nav-links a:not(.nav-cta)::after {
    content: ""; position: absolute; left: 0; bottom: -6px; width: 100%; height: 1.5px;
    background: var(--ink); transform: scaleX(0); transform-origin: right;
    transition: transform .3s var(--ease);
  }
  .nav-links a:not(.nav-cta):hover { color: var(--ink); }
  .nav-links a:not(.nav-cta):hover::after { transform: scaleX(1); transform-origin: left; }
  .nav-cta {
    background: var(--ink); color: var(--paper) !important;
    padding: 12px 24px; border-radius: 999px; transition: background .25s;
  }
  .nav-cta:hover { background: var(--primary); }
  .nav-toggle { display: none; background: none; border: none; font-size: 1.6rem; cursor: pointer; color: var(--ink); }

  /* ---------- hero ---------- */
  .hero {
    position: relative;
    ${dark
      ? `background: color-mix(in srgb, var(--ink) 97%, #fff); color: var(--paper);`
      : `background: linear-gradient(168deg, var(--soft) 0%, var(--paper) 72%);`}
    overflow: hidden;
  }
  ${dark ? `.hero::before { content: ""; position: absolute; width: 720px; height: 720px; right: -220px; top: -260px; border-radius: 50%; background: radial-gradient(circle, color-mix(in srgb, var(--primary) 32%, transparent), transparent 68%); }` : ""}
  .hero-inner {
    position: relative; display: grid; grid-template-columns: 1.08fr .92fr;
    gap: 64px; align-items: center; padding: 96px 0 130px;
  }
  .hero-eyebrow {
    display: inline-flex; align-items: center; gap: 14px;
    font-family: var(--mono-font); font-size: .72rem; font-weight: 500;
    letter-spacing: .16em; text-transform: uppercase;
    color: ${dark ? "color-mix(in srgb, var(--paper) 66%, transparent)" : "color-mix(in srgb, var(--ink) 62%, transparent)"};
    margin-bottom: 30px;
  }
  .hero-eyebrow::before { content: ""; width: 34px; height: 1.5px; background: currentColor; }
  .hero h1 {
    font-size: clamp(2.7rem, 6.4vw, 4.7rem); font-weight: 800;
    letter-spacing: -0.03em; margin-bottom: 28px; max-width: 14ch;
  }
  .hl { position: relative; display: inline-block; white-space: nowrap; }
  .hl-stroke { position: absolute; left: -2%; bottom: -0.06em; width: 104%; height: .18em; }
  .hero p.sub {
    font-size: 1.12rem; max-width: 46ch; margin-bottom: 14px;
    color: ${dark ? "color-mix(in srgb, var(--paper) 78%, transparent)" : "color-mix(in srgb, var(--ink) 68%, transparent)"};
  }
  .hero .city {
    font-family: var(--mono-font); font-size: .74rem; letter-spacing: .08em;
    color: ${dark ? "color-mix(in srgb, var(--paper) 52%, transparent)" : "color-mix(in srgb, var(--ink) 48%, transparent)"};
    margin-bottom: 10px;
  }
  .hero-actions { display: flex; gap: 14px; flex-wrap: wrap; margin-top: 32px; }
  ${dark ? `.hero .btn-primary { background: var(--paper); color: var(--ink); } .hero .btn-primary:hover { background: var(--primary); color: #fff; } .hero .btn-ghost { border-color: color-mix(in srgb, var(--paper) 32%, transparent); color: var(--paper); } .hero .btn-ghost:hover { border-color: var(--paper); }` : ""}

  /* hero card — the "portrait" */
  .hero-visual { position: relative; }
  .hero-card {
    position: relative; aspect-ratio: 4 / 5; max-width: 440px; margin-left: auto;
    border-radius: 28px; transform: rotate(-2deg);
    background:
      radial-gradient(120% 90% at 12% 8%, color-mix(in srgb, var(--primary) 26%, transparent), transparent 52%),
      radial-gradient(110% 100% at 88% 92%, color-mix(in srgb, var(--accent) 30%, transparent), transparent 55%),
      linear-gradient(155deg, ${dark ? "color-mix(in srgb, var(--ink) 82%, #fff)" : "var(--soft)"}, ${dark ? "color-mix(in srgb, var(--ink) 94%, #fff)" : "#ffffff"});
    box-shadow: 0 34px 80px color-mix(in srgb, var(--ink) 22%, transparent);
    display: grid; place-items: center;
    transition: transform .6s var(--ease);
    border: 1px solid ${dark ? "color-mix(in srgb, var(--paper) 12%, transparent)" : "var(--hair)"};
  }
  .hero-card:hover { transform: rotate(0deg); }
  .hero-card .logo-mark { width: 42%; height: auto; max-height: 42%; object-fit: contain; filter: drop-shadow(0 18px 36px color-mix(in srgb, var(--ink) 30%, transparent)); }
  .hero-chip {
    position: absolute; bottom: 20px; left: 20px;
    font-family: var(--mono-font); font-size: .68rem; font-weight: 500;
    letter-spacing: .14em; text-transform: uppercase;
    background: var(--ink); color: var(--paper);
    padding: 10px 18px; border-radius: 999px;
  }
  .hero-badge {
    position: absolute; top: -26px; right: -18px; width: 92px; height: 92px;
    border-radius: 50%; background: var(--accent); color: var(--ink);
    display: grid; place-items: center; text-align: center;
    font-family: var(--mono-font); font-size: .66rem; font-weight: 500;
    letter-spacing: .1em; line-height: 1.5;
    box-shadow: 0 14px 34px color-mix(in srgb, var(--ink) 22%, transparent);
    transform: rotate(8deg);
  }
  .scroll-cue {
    position: absolute; bottom: 26px; left: 50%; transform: translateX(-50%);
    display: flex; flex-direction: column; align-items: center; gap: 10px;
    font-family: var(--mono-font); font-size: .64rem; letter-spacing: .22em;
    color: ${dark ? "color-mix(in srgb, var(--paper) 46%, transparent)" : "color-mix(in srgb, var(--ink) 42%, transparent)"};
  }
  .scroll-cue::after {
    content: ""; width: 1.5px; height: 42px;
    background: linear-gradient(currentColor, transparent);
    animation: cue 2.2s var(--ease) infinite;
  }
  @keyframes cue { 0%, 100% { transform: translateY(0); opacity: 1; } 50% { transform: translateY(8px); opacity: .4; } }

  /* ---------- services ticker ---------- */
  .marquee {
    overflow: hidden; white-space: nowrap; padding: 20px 0;
    border-block: 1px solid var(--hair); background: var(--paper);
  }
  .marquee-track { display: inline-block; animation: mq 32s linear infinite; }
  .mq-chunk {
    font-family: var(--mono-font); font-size: .78rem; font-weight: 500;
    letter-spacing: .2em; text-transform: uppercase;
    color: color-mix(in srgb, var(--ink) 72%, transparent);
  }
  .mq-sep { color: var(--primary); margin: 0 28px; }
  @keyframes mq { to { transform: translateX(-50%); } }

  /* ---------- stats ---------- */
  .stats { border-bottom: 1px solid var(--hair); background: var(--paper); }
  .stats-inner { display: grid; grid-template-columns: repeat(4, 1fr); }
  .stat { padding: 46px 24px; text-align: center; position: relative; }
  .stat + .stat::before { content: ""; position: absolute; left: 0; top: 26%; height: 48%; width: 1px; background: var(--hair); }
  .stat-num { display: block; font-family: var(--heading-font); font-size: clamp(2.1rem, 3.6vw, 2.9rem); font-weight: 800; letter-spacing: -0.02em; color: var(--ink); }
  .stat-num::after { content: "*"; color: var(--primary); font-size: .6em; vertical-align: super; margin-left: 2px; }
  .stat-label { font-family: var(--mono-font); font-size: .68rem; font-weight: 500; letter-spacing: .16em; text-transform: uppercase; color: color-mix(in srgb, var(--ink) 55%, transparent); margin-top: 8px; display: block; }

  /* ---------- sections ---------- */
  section.block { padding: 110px 0; }
  .block-tint { background: var(--soft); border-block: 1px solid var(--hair); }

  /* about */
  .about-grid { display: grid; grid-template-columns: 1.05fr .95fr; gap: 72px; align-items: start; }
  .about-copy p + p { margin-top: 18px; }
  .about-copy p { color: color-mix(in srgb, var(--ink) 76%, transparent); font-size: 1.06rem; max-width: 56ch; }
  .about-panel {
    background: var(--ink); border-radius: 24px; padding: 44px 40px; color: var(--paper);
    position: relative; overflow: hidden;
  }
  .about-panel::before {
    content: ""; position: absolute; width: 340px; height: 340px; right: -130px; bottom: -150px;
    border-radius: 50%; background: radial-gradient(circle, color-mix(in srgb, var(--primary) 42%, transparent), transparent 70%);
  }
  .about-panel .mono { color: var(--accent); display: block; margin-bottom: 18px; }
  .about-panel h3 { font-size: 1.45rem; margin-bottom: 24px; letter-spacing: -0.01em; }
  .about-panel ul { list-style: none; position: relative; }
  .about-panel li {
    padding: 14px 0; border-bottom: 1px solid color-mix(in srgb, var(--paper) 14%, transparent);
    display: flex; gap: 14px; align-items: baseline; font-size: .98rem;
    color: color-mix(in srgb, var(--paper) 86%, transparent);
  }
  .about-panel li:last-child { border-bottom: none; }
  .about-panel li::before { content: "→"; font-family: var(--mono-font); color: var(--accent); flex-shrink: 0; }

  /* services */
  .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; border: 1px solid var(--hair); border-radius: 20px; overflow: hidden; background: var(--hair); grid-gap: 1px; }
  .card {
    background: var(--paper); padding: 38px 32px 42px; position: relative;
    transition: background .3s;
  }
  .card:hover { background: color-mix(in srgb, var(--soft) 60%, var(--paper)); }
  .card-num { font-family: var(--mono-font); font-size: .72rem; font-weight: 500; letter-spacing: .14em; color: var(--primary); display: block; margin-bottom: 44px; }
  .card h3 { font-size: 1.18rem; margin-bottom: 12px; letter-spacing: -0.01em; }
  .card p { font-size: .94rem; color: color-mix(in srgb, var(--ink) 62%, transparent); }
  .card::after {
    content: "→"; position: absolute; top: 34px; right: 30px;
    font-family: var(--mono-font); color: var(--ink); opacity: 0;
    transform: translateX(-8px); transition: opacity .3s, transform .3s var(--ease);
  }
  .card:hover::after { opacity: .55; transform: none; }

  /* reviews */
  .reviews { display: grid; grid-template-columns: repeat(3, 1fr); gap: 26px; }
  .review {
    background: var(--paper); border: 1px solid var(--hair); border-radius: 20px;
    padding: 36px 30px; display: flex; flex-direction: column; gap: 18px; position: relative;
  }
  .review::before {
    content: "\\201C"; position: absolute; top: 14px; right: 26px;
    font-family: var(--heading-font); font-size: 5rem; line-height: 1;
    color: color-mix(in srgb, var(--primary) 22%, transparent);
  }
  .stars { color: var(--accent); letter-spacing: 4px; font-size: 1rem; }
  .review blockquote { font-size: 1.01rem; color: color-mix(in srgb, var(--ink) 80%, transparent); flex: 1; line-height: 1.6; }
  .review figcaption { display: flex; align-items: center; gap: 14px; padding-top: 18px; border-top: 1px solid var(--hair); }
  .avatar {
    width: 42px; height: 42px; border-radius: 50%; flex-shrink: 0;
    background: var(--ink); color: var(--paper);
    display: grid; place-items: center; font-family: var(--heading-font); font-weight: 700; font-size: 1rem;
  }
  .rev-meta { display: flex; flex-direction: column; }
  .rev-meta strong { font-size: .94rem; }
  .rev-meta span { font-family: var(--mono-font); font-size: .64rem; letter-spacing: .12em; text-transform: uppercase; color: color-mix(in srgb, var(--ink) 52%, transparent); margin-top: 3px; }

  /* CTA */
  .cta-block { padding: 0 28px 110px; }
  .cta {
    background: var(--ink); color: var(--paper); text-align: center;
    border-radius: 32px; padding: 100px 36px; max-width: 1180px; margin: 0 auto;
    position: relative; overflow: hidden;
  }
  .cta::before {
    content: ""; position: absolute; width: 560px; height: 560px; left: -180px; top: -260px;
    border-radius: 50%; background: radial-gradient(circle, color-mix(in srgb, var(--primary) 38%, transparent), transparent 68%);
  }
  .cta::after {
    content: ""; position: absolute; width: 420px; height: 420px; right: -140px; bottom: -200px;
    border-radius: 50%; background: radial-gradient(circle, color-mix(in srgb, var(--accent) 26%, transparent), transparent 68%);
  }
  .cta > * { position: relative; z-index: 1; }
  .cta .mono { color: var(--accent); display: block; margin-bottom: 22px; }
  .cta h2 { font-size: clamp(2.2rem, 5vw, 3.6rem); margin-bottom: 20px; letter-spacing: -0.02em; }
  .cta p { color: color-mix(in srgb, var(--paper) 74%, transparent); max-width: 52ch; margin: 0 auto 38px; font-size: 1.08rem; }
  .cta .btn-primary { background: var(--paper); color: var(--ink); }
  .cta .btn-primary:hover { background: var(--accent); }

  /* contact */
  .contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 72px; }
  .contact-links { display: flex; flex-direction: column; gap: 16px; margin-top: 34px; }
  .contact-link { display: inline-flex; align-items: center; gap: 16px; font-size: 1.02rem; color: var(--ink); text-decoration: none; font-weight: 500; }
  .contact-link:hover { color: var(--primary); }
  .ci { display: grid; place-items: center; width: 46px; height: 46px; border: 1px solid var(--hair); border-radius: 50%; font-size: 1.05rem; background: var(--paper); }
  .contact-form {
    background: var(--paper); border: 1px solid var(--hair); border-radius: 24px;
    padding: 38px 34px; display: flex; flex-direction: column; gap: 20px;
  }
  .contact-form label { display: flex; flex-direction: column; gap: 8px; font-family: var(--mono-font); font-size: .66rem; font-weight: 500; letter-spacing: .16em; text-transform: uppercase; color: color-mix(in srgb, var(--ink) 58%, transparent); }
  .contact-form input, .contact-form textarea {
    font-family: var(--body-font); font-size: 1rem; color: var(--ink);
    padding: 13px 2px; border: none; border-bottom: 1.5px solid var(--hair);
    background: transparent; outline: none; border-radius: 0;
    transition: border-color .2s; resize: vertical;
  }
  .contact-form input:focus, .contact-form textarea:focus { border-bottom-color: var(--ink); }
  .contact-form button {
    font-family: var(--mono-font); font-size: .78rem; font-weight: 500;
    letter-spacing: .14em; text-transform: uppercase;
    background: var(--ink); color: var(--paper); border: none;
    padding: 17px; border-radius: 999px; cursor: pointer; margin-top: 6px;
    transition: background .25s;
  }
  .contact-form button:hover { background: var(--primary); }
  .form-note { display: none; color: var(--primary); font-weight: 600; text-align: center; font-family: var(--body-font); }

  /* footer */
  footer { background: var(--ink); color: color-mix(in srgb, var(--paper) 78%, transparent); padding: 76px 0 40px; }
  .footer-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 40px; flex-wrap: wrap; padding-bottom: 48px; border-bottom: 1px solid color-mix(in srgb, var(--paper) 14%, transparent); }
  .footer-brand { display: flex; flex-direction: column; gap: 20px; color: var(--paper); }
  .footer-brand .logo-mark { width: 44px; height: 44px; object-fit: contain; border-radius: 10px; }
  .footer-word { font-family: var(--heading-font); font-weight: 800; font-size: clamp(1.9rem, 4.4vw, 3.2rem); letter-spacing: -0.02em; color: var(--paper); line-height: 1.05; max-width: 14ch; }
  .footer-links { display: flex; gap: 30px; list-style: none; padding-top: 10px; }
  .footer-links a { color: color-mix(in srgb, var(--paper) 66%, transparent); text-decoration: none; font-family: var(--mono-font); font-size: .7rem; font-weight: 500; letter-spacing: .14em; text-transform: uppercase; }
  .footer-links a:hover { color: var(--paper); }
  .copyright { display: flex; justify-content: space-between; gap: 18px; flex-wrap: wrap; font-family: var(--mono-font); font-size: .66rem; letter-spacing: .1em; text-transform: uppercase; color: color-mix(in srgb, var(--paper) 45%, transparent); margin-top: 30px; }

  /* ---------- responsive ---------- */
  @media (max-width: 960px) {
    .hero-inner { grid-template-columns: 1fr; gap: 52px; padding: 64px 0 110px; }
    .hero-card { margin: 0 auto; max-width: 380px; }
    .hero-badge { right: 4px; }
    .about-grid, .contact-grid { grid-template-columns: 1fr; gap: 48px; }
    .cards { grid-template-columns: 1fr; }
    .reviews { grid-template-columns: 1fr; }
    .stats-inner { grid-template-columns: repeat(2, 1fr); }
    .stat:nth-child(3)::before { display: none; }
    .nav-links {
      position: absolute; top: 76px; left: 0; right: 0; background: var(--paper);
      flex-direction: column; padding: 24px 28px; gap: 22px;
      border-bottom: 1px solid var(--hair); display: none; align-items: flex-start;
    }
    .nav-links.open { display: flex; }
    .nav-toggle { display: block; }
    section.block { padding: 76px 0; }
    .cta { padding: 72px 26px; }
    .scroll-cue { display: none; }
  }
</style>
</head>
<body>

<nav class="nav">
  <div class="wrap nav-inner">
    <a class="brand" href="#top">
      ${logoHtml(input, palette)}
      <span class="brand-name">${esc(name)}</span>
    </a>
    <button class="nav-toggle" aria-label="Toggle menu" onclick="document.getElementById('navLinks').classList.toggle('open')">☰</button>
    <ul class="nav-links" id="navLinks">
      <li><a href="#about">About</a></li>
      <li><a href="#services">Services</a></li>
      <li><a href="#reviews">Reviews</a></li>
      <li><a href="#contact" class="nav-cta">${esc(fill(profile.ctaButton, name, type))}</a></li>
    </ul>
  </div>
</nav>

<header class="hero" id="top">
  <div class="wrap hero-inner">
    <div>
      <p class="hero-eyebrow">${esc(type)}</p>
      <h1>${heroHeadline}</h1>
      <p class="sub">${heroSub}</p>
      ${cityLine ? `<p class="city">${cityLine}</p>` : ""}
      <div class="hero-actions">
        <a class="btn btn-primary" href="#contact">${esc(fill(profile.ctaButton, name, type))} <span class="arr">→</span></a>
        <a class="btn btn-ghost" href="#services">View services</a>
      </div>
    </div>
    <div class="hero-visual">
      <div class="hero-card">
        ${logoHtml(input, palette, 150)}
        <span class="hero-chip">✦ ${esc(type)}</span>
        <span class="hero-badge">★★★★★<br />TOP&nbsp;RATED</span>
      </div>
    </div>
  </div>
  <div class="scroll-cue" aria-hidden="true">SCROLL</div>
</header>

<div class="marquee" aria-hidden="true">
  <div class="marquee-track">${marqueeSpan}${marqueeSpan}</div>
</div>

<div class="stats">
  <div class="wrap stats-inner">${statsHtml}
  </div>
</div>

<section class="block" id="about">
  <div class="wrap about-grid">
    <div class="about-copy reveal">
      <p class="eyebrow">(01) · About us</p>
      <h2 class="section-title">${fill(profile.aboutTitle, name, type)}</h2>
      ${aboutHtml}
    </div>
    <div class="about-panel reveal">
      <span class="mono">Why choose us</span>
      <h3>Why choose ${esc(name)}</h3>
      <ul>
        <li>Experienced, dedicated professionals</li>
        <li>Clear communication at every step</li>
        <li>Honest, transparent pricing</li>
        <li>Work we proudly stand behind</li>
        <li>Fast, reliable response times</li>
      </ul>
    </div>
  </div>
</section>

<section class="block block-tint" id="services">
  <div class="wrap">
    <p class="eyebrow">(02) · What we do</p>
    <h2 class="section-title">Services built around you</h2>
    <p class="section-sub">Everything ${esc(name)} offers is designed to deliver real value — done professionally, on time, and to a standard we're proud of.</p>
    <div class="cards">${servicesHtml}
    </div>
  </div>
</section>

<section class="block" id="reviews">
  <div class="wrap">
    <p class="eyebrow">(03) · ${usingRealReviews ? "Reviews" : "Testimonials"}</p>
    <h2 class="section-title">What clients are saying</h2>
    <p class="section-sub">${reviewsSub}</p>
    <div class="reviews">${reviewsHtml}
    </div>
  </div>
</section>

<section class="cta-block">
  <div class="cta reveal">
    <span class="mono">Let's work together</span>
    <h2>${fill(profile.ctaTitle, name, type)}</h2>
    <p>${fill(profile.ctaSub, name, type)}</p>
    <a class="btn btn-primary" href="#contact">${esc(fill(profile.ctaButton, name, type))} <span class="arr">→</span></a>
  </div>
</section>

<section class="block block-tint" id="contact">
  <div class="wrap contact-grid">
    <div class="reveal">
      <p class="eyebrow">(04) · Contact</p>
      <h2 class="section-title">Get in touch</h2>
      <p class="section-sub" style="margin-bottom: 0;">Have a question or ready to get started? Reach out — we'd love to hear from you.</p>
      <div class="contact-links">
        ${contactBits.length ? contactBits.join("\n        ") : `<span class="contact-link"><span class="ci">💬</span>Send us a message using the form</span>`}
      </div>
    </div>
    <form class="contact-form reveal" onsubmit="event.preventDefault(); this.querySelector('.form-note').style.display='block'; this.reset();">
      <label>Your name<input type="text" name="name" required placeholder="Jane Smith" /></label>
      <label>Email<input type="email" name="email" required placeholder="jane@example.com" /></label>
      <label>Message<textarea name="message" rows="4" required placeholder="Tell us what you need..."></textarea></label>
      <button type="submit">Send message →</button>
      <span class="form-note">Thanks! We'll be in touch soon.</span>
    </form>
  </div>
</section>

<footer>
  <div class="wrap">
    <div class="footer-top">
      <div class="footer-brand">
        ${logoHtml(input, palette)}
        <span class="footer-word">${esc(name)}</span>
      </div>
      <ul class="footer-links">
        <li><a href="#about">About</a></li>
        <li><a href="#services">Services</a></li>
        <li><a href="#reviews">Reviews</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
    </div>
    <p class="copyright"><span>&copy; ${year} ${esc(name)} · ${esc(type)}</span><span>All rights reserved</span></p>
  </div>
</footer>

<script>
(function () {
  var els = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) {
    els.forEach(function (e) { e.classList.add("in"); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
    });
  }, { threshold: 0 });
  els.forEach(function (e) { io.observe(e); });
})();
</script>

</body>
</html>`;

  return { html: options.protect ? applyProtection(html, name) : html, profile };
}

export { generateWebsite, applyProtection };
