/* ============================================================
   Website Generator Engine
   Takes user input (business name, type, optional logo/details)
   plus a researched industry profile and produces a complete,
   standalone, modern single-page website as an HTML string.
   ============================================================ */

import { PALETTES, FONT_PAIRS, researchBusiness } from "./industries.js";

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
function monogramSvg(name, palette) {
  const text = esc(initials(name));
  return `<svg class="logo-mark" viewBox="0 0 48 48" width="40" height="40" role="img" aria-label="${esc(name)} logo"><rect x="2" y="2" width="44" height="44" rx="12" fill="${palette.primary}"/><rect x="2" y="2" width="44" height="44" rx="12" fill="url(#lg)" opacity="0.35"/><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><text x="24" y="30" text-anchor="middle" font-family="Arial, sans-serif" font-size="${text.length > 1 ? 17 : 22}" font-weight="700" fill="#fff">${text}</text></svg>`;
}

function logoHtml(input, palette) {
  if (input.logoDataUrl) {
    return `<img class="logo-mark" src="${input.logoDataUrl}" alt="${esc(input.businessName)} logo" />`;
  }
  return monogramSvg(input.businessName, palette);
}

/* Decorative hero artwork — abstract shapes tinted to the palette,
   so every generated site has visual interest without stock photos. */
function heroArt(palette) {
  return `<svg class="hero-art" viewBox="0 0 520 420" fill="none" aria-hidden="true">
    <circle cx="370" cy="160" r="150" fill="${palette.primary}" opacity="0.14"/>
    <circle cx="430" cy="240" r="100" fill="${palette.accent}" opacity="0.18"/>
    <circle cx="300" cy="300" r="60" fill="${palette.primary}" opacity="0.22"/>
    <rect x="120" y="80" width="230" height="150" rx="18" fill="white" stroke="${palette.primary}" stroke-opacity="0.25" stroke-width="2"/>
    <rect x="145" y="110" width="120" height="14" rx="7" fill="${palette.primary}" opacity="0.85"/>
    <rect x="145" y="138" width="180" height="9" rx="4.5" fill="${palette.ink}" opacity="0.18"/>
    <rect x="145" y="156" width="150" height="9" rx="4.5" fill="${palette.ink}" opacity="0.18"/>
    <rect x="145" y="186" width="86" height="26" rx="13" fill="${palette.accent}"/>
    <rect x="200" y="250" width="230" height="120" rx="18" fill="white" stroke="${palette.primary}" stroke-opacity="0.25" stroke-width="2"/>
    <circle cx="240" cy="290" r="17" fill="${palette.primary}" opacity="0.9"/>
    <rect x="270" y="278" width="130" height="10" rx="5" fill="${palette.ink}" opacity="0.2"/>
    <rect x="270" y="296" width="95" height="10" rx="5" fill="${palette.ink}" opacity="0.2"/>
    <rect x="225" y="330" width="180" height="9" rx="4.5" fill="${palette.accent}" opacity="0.65"/>
  </svg>`;
}

/* ============================================================
   Content protection for the client-preview version.
   Blocks text selection, copy/cut, right-click, image dragging,
   save/print/view-source shortcuts, and overlays a diagonal
   PREVIEW watermark. This is a strong deterrent for casual
   copying — the final published version ships without any of it.
   ============================================================ */
function protectionBlock(businessName) {
  const wmText = `PREVIEW · ${businessName.replace(/[<>&"']/g, "")}`;
  // Diagonal repeating watermark as an inline SVG background
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
    // copy / select-all / save / print / view-source
    if (mod && ["c", "x", "a", "s", "u", "p"].indexOf(k) !== -1 && !isFormField(e.target)) { e.preventDefault(); return; }
    // devtools shortcuts
    if (e.key === "F12" || (mod && e.shiftKey && ["i", "j", "c", "k"].indexOf(k) !== -1)) { e.preventDefault(); }
  }, true);

  // Keep the watermark present even if removed via devtools
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
 * Generate a complete website.
 * @param {object} input - { businessName, businessType, tagline?, city?, phone?, email?, logoDataUrl? }
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
  const heroHeadline = tagline ? esc(tagline) : fill(profile.heroHeadline, name, type);
  const heroSub = fill(profile.heroSub, name, type);
  const cityLine = input.city?.trim() ? `Proudly serving ${esc(input.city.trim())} and surrounding areas.` : "";

  const contactBits = [];
  if (input.phone?.trim()) contactBits.push(`<a class="contact-link" href="tel:${esc(input.phone.trim().replace(/[^+\d]/g, ""))}"><span class="ci">📞</span>${esc(input.phone.trim())}</a>`);
  if (input.email?.trim()) contactBits.push(`<a class="contact-link" href="mailto:${esc(input.email.trim())}"><span class="ci">✉️</span>${esc(input.email.trim())}</a>`);
  if (input.city?.trim()) contactBits.push(`<span class="contact-link"><span class="ci">📍</span>${esc(input.city.trim())}</span>`);

  const servicesHtml = profile.services.map(s => `
        <article class="card">
          <div class="card-icon">${s.icon}</div>
          <h3>${esc(s.name)}</h3>
          <p>${fill(s.desc, name, type)}</p>
        </article>`).join("");

  const statsHtml = profile.stats.map(([num, label]) => `
        <div class="stat"><span class="stat-num">${esc(num)}</span><span class="stat-label">${esc(label)}</span></div>`).join("");

  const reviewsHtml = profile.reviews.map(([quote, who, role]) => `
        <figure class="review">
          <div class="stars" aria-label="5 out of 5 stars">★★★★★</div>
          <blockquote>&ldquo;${fill(quote, name, type)}&rdquo;</blockquote>
          <figcaption><strong>${esc(who)}</strong><span>${esc(role)}</span></figcaption>
        </figure>`).join("");

  const aboutHtml = profile.about.map(p => `<p>${fill(p, name, type)}</p>`).join("\n          ");

  const dark = palette.heroMode === "dark";

  const protect = options.protect ? protectionBlock(name) : null;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(name)} — ${esc(type)}</title>
<meta name="description" content="${esc(name)} — professional ${esc(type.toLowerCase())} services. ${esc(fill(profile.ctaSub, name, type)).slice(0, 140)}" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?${fonts.import}&display=swap" rel="stylesheet" />
<style>
  :root {
    --primary: ${palette.primary};
    --primary-dark: ${palette.primaryDark};
    --accent: ${palette.accent};
    --ink: ${palette.ink};
    --soft: ${palette.soft};
    --body-font: '${fonts.body}', system-ui, sans-serif;
    --heading-font: '${fonts.heading}', system-ui, sans-serif;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body { font-family: var(--body-font); color: var(--ink); line-height: 1.65; background: #fff; }
  h1, h2, h3 { font-family: var(--heading-font); line-height: 1.15; }
  img { max-width: 100%; display: block; }
  .wrap { max-width: 1120px; margin: 0 auto; padding: 0 24px; }
  .btn { display: inline-block; padding: 14px 30px; border-radius: 999px; font-weight: 600; text-decoration: none; font-size: 1rem; transition: transform .15s ease, box-shadow .15s ease; }
  .btn:hover { transform: translateY(-2px); }
  .btn-primary { background: var(--primary); color: #fff; box-shadow: 0 8px 24px color-mix(in srgb, var(--primary) 35%, transparent); }
  .btn-primary:hover { background: var(--primary-dark); }
  .btn-ghost { border: 2px solid color-mix(in srgb, var(--primary) 40%, transparent); color: var(--primary); }
  .eyebrow { display: inline-block; font-size: .8rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--primary); background: var(--soft); padding: 6px 14px; border-radius: 999px; margin-bottom: 16px; }
  .section-title { font-size: clamp(1.7rem, 3.5vw, 2.4rem); margin-bottom: 14px; }
  .section-sub { color: color-mix(in srgb, var(--ink) 65%, transparent); max-width: 620px; margin-bottom: 44px; font-size: 1.06rem; }

  /* Nav */
  .nav { position: sticky; top: 0; z-index: 50; background: rgba(255,255,255,.92); backdrop-filter: blur(10px); border-bottom: 1px solid rgba(0,0,0,.06); }
  .nav-inner { display: flex; align-items: center; justify-content: space-between; height: 72px; }
  .brand { display: flex; align-items: center; gap: 12px; text-decoration: none; color: var(--ink); }
  .brand .logo-mark { width: 40px; height: 40px; object-fit: contain; border-radius: 10px; }
  .brand-name { font-family: var(--heading-font); font-weight: 700; font-size: 1.15rem; }
  .nav-links { display: flex; align-items: center; gap: 28px; list-style: none; }
  .nav-links a { text-decoration: none; color: color-mix(in srgb, var(--ink) 75%, transparent); font-weight: 500; font-size: .95rem; }
  .nav-links a:hover { color: var(--primary); }
  .nav-cta { background: var(--primary); color: #fff !important; padding: 10px 20px; border-radius: 999px; font-weight: 600; }
  .nav-cta:hover { background: var(--primary-dark); }
  .nav-toggle { display: none; background: none; border: none; font-size: 1.6rem; cursor: pointer; color: var(--ink); }

  /* Hero */
  .hero { ${dark
    ? `background: linear-gradient(135deg, var(--primary-dark) 0%, color-mix(in srgb, var(--primary-dark) 60%, #000) 100%); color: #fff;`
    : `background: linear-gradient(160deg, var(--soft) 0%, #fff 65%);`} overflow: hidden; }
  .hero-inner { display: grid; grid-template-columns: 1.1fr .9fr; gap: 48px; align-items: center; padding: 88px 0 96px; }
  .hero h1 { font-size: clamp(2.2rem, 5vw, 3.4rem); margin-bottom: 20px; letter-spacing: -0.02em; }
  .hero p { font-size: 1.15rem; margin-bottom: 12px; ${dark ? "color: rgba(255,255,255,.85);" : "color: color-mix(in srgb, var(--ink) 70%, transparent);"} }
  .hero .city { font-size: .98rem; ${dark ? "color: rgba(255,255,255,.6);" : "color: color-mix(in srgb, var(--ink) 50%, transparent);"} margin-bottom: 8px; }
  .hero-eyebrow { display: inline-block; font-size: .8rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; padding: 6px 14px; border-radius: 999px; margin-bottom: 20px; ${dark ? "background: rgba(255,255,255,.14); color: #fff;" : "background: var(--soft); color: var(--primary);"} }
  .hero-actions { display: flex; gap: 14px; flex-wrap: wrap; margin-top: 24px; }
  ${dark ? ".hero .btn-ghost { border-color: rgba(255,255,255,.4); color: #fff; }" : ""}
  .hero-art { width: 100%; height: auto; }

  /* Stats */
  .stats { background: ${dark ? "var(--primary-dark)" : "var(--primary)"}; ${dark ? "border-top: 1px solid rgba(255,255,255,.12);" : ""} color: #fff; }
  .stats-inner { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; padding: 40px 0; text-align: center; }
  .stat-num { display: block; font-family: var(--heading-font); font-size: 2rem; font-weight: 700; }
  .stat-label { font-size: .9rem; opacity: .85; }

  /* Sections */
  section.block { padding: 88px 0; }
  .block-alt { background: var(--soft); }

  /* About */
  .about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 56px; align-items: center; }
  .about-copy p + p { margin-top: 16px; }
  .about-copy p { color: color-mix(in srgb, var(--ink) 78%, transparent); font-size: 1.05rem; }
  .about-panel { background: linear-gradient(135deg, var(--primary), var(--primary-dark)); border-radius: 24px; padding: 40px; color: #fff; }
  .about-panel h3 { font-size: 1.3rem; margin-bottom: 18px; }
  .about-panel ul { list-style: none; }
  .about-panel li { padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,.18); display: flex; gap: 10px; align-items: baseline; }
  .about-panel li:last-child { border-bottom: none; }
  .about-panel li::before { content: "✓"; font-weight: 700; color: var(--accent); }

  /* Services */
  .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
  .card { background: #fff; border: 1px solid rgba(0,0,0,.07); border-radius: 18px; padding: 30px 26px; transition: transform .18s ease, box-shadow .18s ease; }
  .card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,.09); }
  .card-icon { width: 52px; height: 52px; display: grid; place-items: center; font-size: 1.5rem; background: var(--soft); border-radius: 14px; margin-bottom: 18px; }
  .card h3 { font-size: 1.12rem; margin-bottom: 10px; }
  .card p { font-size: .95rem; color: color-mix(in srgb, var(--ink) 68%, transparent); }

  /* Reviews */
  .reviews { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
  .review { background: #fff; border-radius: 18px; padding: 30px 26px; border: 1px solid rgba(0,0,0,.07); display: flex; flex-direction: column; gap: 14px; }
  .stars { color: var(--accent); letter-spacing: 3px; font-size: 1.05rem; }
  .review blockquote { font-size: .98rem; color: color-mix(in srgb, var(--ink) 80%, transparent); flex: 1; }
  .review figcaption { display: flex; flex-direction: column; }
  .review figcaption span { font-size: .85rem; color: color-mix(in srgb, var(--ink) 55%, transparent); }

  /* CTA */
  .cta { background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%); color: #fff; text-align: center; border-radius: 28px; padding: 72px 32px; margin: 0 24px; }
  .cta h2 { font-size: clamp(1.8rem, 4vw, 2.6rem); margin-bottom: 14px; }
  .cta p { opacity: .9; max-width: 560px; margin: 0 auto 30px; font-size: 1.08rem; }
  .cta .btn-primary { background: #fff; color: var(--primary); box-shadow: 0 10px 30px rgba(0,0,0,.25); }
  .cta .btn-primary:hover { background: var(--soft); }

  /* Contact */
  .contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 56px; }
  .contact-links { display: flex; flex-direction: column; gap: 14px; margin-top: 24px; }
  .contact-link { display: inline-flex; align-items: center; gap: 12px; font-size: 1.05rem; color: var(--ink); text-decoration: none; font-weight: 500; }
  .contact-link:hover { color: var(--primary); }
  .ci { display: grid; place-items: center; width: 42px; height: 42px; background: var(--soft); border-radius: 12px; font-size: 1.1rem; }
  .contact-form { background: #fff; border: 1px solid rgba(0,0,0,.08); border-radius: 20px; padding: 32px; display: flex; flex-direction: column; gap: 16px; }
  .contact-form label { font-size: .88rem; font-weight: 600; display: flex; flex-direction: column; gap: 6px; }
  .contact-form input, .contact-form textarea { font-family: var(--body-font); font-size: .98rem; padding: 12px 14px; border: 1.5px solid rgba(0,0,0,.12); border-radius: 10px; outline: none; transition: border-color .15s; resize: vertical; }
  .contact-form input:focus, .contact-form textarea:focus { border-color: var(--primary); }
  .contact-form button { font-family: var(--body-font); font-size: 1rem; font-weight: 600; background: var(--primary); color: #fff; border: none; padding: 14px; border-radius: 999px; cursor: pointer; }
  .contact-form button:hover { background: var(--primary-dark); }
  .form-note { display: none; color: var(--primary); font-weight: 600; text-align: center; }

  /* Footer */
  footer { background: ${dark ? "color-mix(in srgb, var(--primary-dark) 55%, #000)" : "var(--ink)"}; color: rgba(255,255,255,.8); padding: 48px 0 32px; }
  .footer-inner { display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
  .footer-brand { display: flex; align-items: center; gap: 12px; color: #fff; font-family: var(--heading-font); font-weight: 700; font-size: 1.05rem; }
  .footer-brand .logo-mark { width: 34px; height: 34px; object-fit: contain; border-radius: 8px; }
  .footer-links { display: flex; gap: 22px; list-style: none; }
  .footer-links a { color: rgba(255,255,255,.75); text-decoration: none; font-size: .92rem; }
  .footer-links a:hover { color: #fff; }
  .copyright { width: 100%; text-align: center; font-size: .85rem; color: rgba(255,255,255,.5); margin-top: 28px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,.12); }

  @media (max-width: 900px) {
    .hero-inner, .about-grid, .contact-grid { grid-template-columns: 1fr; }
    .hero-inner { padding: 56px 0 64px; }
    .hero-art { max-width: 420px; margin: 0 auto; }
    .cards, .reviews { grid-template-columns: 1fr; }
    .stats-inner { grid-template-columns: repeat(2, 1fr); }
    .nav-links { position: absolute; top: 72px; left: 0; right: 0; background: #fff; flex-direction: column; padding: 20px 24px; gap: 18px; border-bottom: 1px solid rgba(0,0,0,.08); display: none; align-items: flex-start; }
    .nav-links.open { display: flex; }
    .nav-toggle { display: block; }
    section.block { padding: 64px 0; }
  }
</style>${protect ? protect.style : ""}
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
      <span class="hero-eyebrow">${esc(type)}</span>
      <h1>${heroHeadline}</h1>
      <p>${heroSub}</p>
      ${cityLine ? `<p class="city">${cityLine}</p>` : ""}
      <div class="hero-actions">
        <a class="btn btn-primary" href="#contact">${esc(fill(profile.ctaButton, name, type))}</a>
        <a class="btn btn-ghost" href="#services">Explore services</a>
      </div>
    </div>
    <div>${heroArt(palette)}</div>
  </div>
</header>

<div class="stats">
  <div class="wrap stats-inner">${statsHtml}
  </div>
</div>

<section class="block" id="about">
  <div class="wrap about-grid">
    <div class="about-copy">
      <span class="eyebrow">About us</span>
      <h2 class="section-title">${fill(profile.aboutTitle, name, type)}</h2>
      ${aboutHtml}
    </div>
    <div class="about-panel">
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

<section class="block block-alt" id="services">
  <div class="wrap">
    <span class="eyebrow">What we do</span>
    <h2 class="section-title">Services built around you</h2>
    <p class="section-sub">Everything ${esc(name)} offers is designed to deliver real value — done professionally, on time, and to a standard we're proud of.</p>
    <div class="cards">${servicesHtml}
    </div>
  </div>
</section>

<section class="block" id="reviews">
  <div class="wrap">
    <span class="eyebrow">Testimonials</span>
    <h2 class="section-title">What clients are saying</h2>
    <p class="section-sub">Don't take our word for it — here's what people say about working with ${esc(name)}.</p>
    <div class="reviews">${reviewsHtml}
    </div>
  </div>
</section>

<section class="block" style="padding-top: 0;">
  <div class="cta">
    <h2>${fill(profile.ctaTitle, name, type)}</h2>
    <p>${fill(profile.ctaSub, name, type)}</p>
    <a class="btn btn-primary" href="#contact">${esc(fill(profile.ctaButton, name, type))}</a>
  </div>
</section>

<section class="block block-alt" id="contact">
  <div class="wrap contact-grid">
    <div>
      <span class="eyebrow">Contact</span>
      <h2 class="section-title">Get in touch</h2>
      <p class="section-sub" style="margin-bottom: 0;">Have a question or ready to get started? Reach out — we'd love to hear from you.</p>
      <div class="contact-links">
        ${contactBits.length ? contactBits.join("\n        ") : `<span class="contact-link"><span class="ci">💬</span>Send us a message using the form</span>`}
      </div>
    </div>
    <form class="contact-form" onsubmit="event.preventDefault(); this.querySelector('.form-note').style.display='block'; this.reset();">
      <label>Your name<input type="text" name="name" required placeholder="Jane Smith" /></label>
      <label>Email<input type="email" name="email" required placeholder="jane@example.com" /></label>
      <label>Message<textarea name="message" rows="4" required placeholder="Tell us what you need..."></textarea></label>
      <button type="submit">Send message</button>
      <span class="form-note">Thanks! We'll be in touch soon.</span>
    </form>
  </div>
</section>

<footer>
  <div class="wrap footer-inner">
    <div class="footer-brand">
      ${logoHtml(input, palette)}
      <span>${esc(name)}</span>
    </div>
    <ul class="footer-links">
      <li><a href="#about">About</a></li>
      <li><a href="#services">Services</a></li>
      <li><a href="#reviews">Reviews</a></li>
      <li><a href="#contact">Contact</a></li>
    </ul>
    <p class="copyright">&copy; ${year} ${esc(name)} · ${esc(type)} · All rights reserved.</p>
  </div>
</footer>

${protect ? protect.overlay + protect.script : ""}
</body>
</html>`;

  return { html, profile };
}

export { generateWebsite };
