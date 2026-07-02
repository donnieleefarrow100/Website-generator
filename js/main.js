/* ============================================================
   Website Generator — app controller
   Handles the input form, logo upload, the "research & build"
   progress flow, live preview, and download of the final site.
   ============================================================ */

import { generateWebsite, applyProtection } from "./generator.js?v=__BUILD__";
import { applyCommand } from "./commands.js?v=__BUILD__";

const $ = (id) => document.getElementById(id);

const formView = $("formView");
const progressView = $("progressView");
const previewView = $("previewView");
const form = $("genForm");
const formError = $("formError");

const typeInput = $("businessType");
const suggestionsBox = $("typeSuggestions");

const logoDrop = $("logoDrop");
const logoInput = $("logoInput");
const logoDropEmpty = $("logoDropEmpty");
const logoDropPreview = $("logoDropPreview");
const logoPreviewImg = $("logoPreviewImg");
const logoFileName = $("logoFileName");

let logoDataUrl = null;
let lastResult = null;   // { final: {html, profile}, protected: {html, profile} }
let lastInput = null;
let viewMode = "protected";

/* ---------- business type suggestions ---------- */

const SUGGESTIONS = [
  "Graphic designer", "Music producer", "Business consultant", "Construction company",
  "Accounting firm", "Law firm", "Restaurant", "Coffee shop", "Bakery", "Food truck",
  "Barbershop", "Hair salon", "Nail studio", "Spa & skincare", "Tattoo studio",
  "Photography studio", "Videographer", "Marketing agency", "Web design agency",
  "Software company", "IT support services", "Real estate agent", "Property management",
  "Plumbing company", "Electrician", "Roofing company", "HVAC services", "Landscaping company",
  "Painting contractor", "Handyman services", "Cleaning services", "Moving company",
  "Auto repair shop", "Car detailing", "Personal trainer", "Gym", "Yoga studio",
  "Dental clinic", "Chiropractor", "Therapy & counseling", "Massage therapy", "Veterinary clinic",
  "Pet grooming", "Dog walking", "Tutoring service", "Music lessons", "Driving school",
  "Daycare", "Event planner", "Wedding planner", "DJ & entertainment", "Catering company",
  "Interior designer", "Architect", "Florist", "Boutique clothing store", "Jewelry store",
  "Bookstore", "Insurance agency", "Financial advisor", "Recruiting agency", "Courier & delivery",
];

function renderSuggestions(query) {
  const q = query.trim().toLowerCase();
  suggestionsBox.innerHTML = "";
  if (q.length < 2) { suggestionsBox.classList.remove("open"); return; }

  const matches = SUGGESTIONS.filter(s => s.toLowerCase().includes(q)).slice(0, 6);
  if (matches.length === 0 || (matches.length === 1 && matches[0].toLowerCase() === q)) {
    suggestionsBox.classList.remove("open");
    return;
  }

  for (const m of matches) {
    const btn = document.createElement("button");
    btn.type = "button";
    const idx = m.toLowerCase().indexOf(q);
    btn.innerHTML =
      escapeHtml(m.slice(0, idx)) +
      `<span class="match">${escapeHtml(m.slice(idx, idx + q.length))}</span>` +
      escapeHtml(m.slice(idx + q.length));
    btn.addEventListener("click", () => {
      typeInput.value = m;
      suggestionsBox.classList.remove("open");
      typeInput.focus();
    });
    suggestionsBox.appendChild(btn);
  }
  suggestionsBox.classList.add("open");
}

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

typeInput.addEventListener("input", () => renderSuggestions(typeInput.value));
typeInput.addEventListener("focus", () => renderSuggestions(typeInput.value));
document.addEventListener("click", (e) => {
  if (!suggestionsBox.contains(e.target) && e.target !== typeInput) {
    suggestionsBox.classList.remove("open");
  }
});
typeInput.addEventListener("keydown", (e) => {
  if (e.key === "Escape") suggestionsBox.classList.remove("open");
});

/* ---------- logo upload ---------- */

const MAX_LOGO_BYTES = 2.5 * 1024 * 1024;

function setLogo(file) {
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    showError("That file doesn't look like an image. Please upload a PNG, JPG, SVG, or WebP.");
    return;
  }
  if (file.size > MAX_LOGO_BYTES) {
    showError("Logo file is too large — please use an image under 2.5 MB.");
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    logoDataUrl = reader.result;
    logoPreviewImg.src = logoDataUrl;
    logoFileName.textContent = file.name;
    logoDropEmpty.hidden = true;
    logoDropPreview.hidden = false;
    clearError();
  };
  reader.readAsDataURL(file);
}

function clearLogo() {
  logoDataUrl = null;
  logoInput.value = "";
  logoDropEmpty.hidden = false;
  logoDropPreview.hidden = true;
}

logoDrop.addEventListener("click", (e) => {
  if (e.target.id === "logoRemove") return;
  logoInput.click();
});
logoDrop.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); logoInput.click(); }
});
logoInput.addEventListener("change", () => setLogo(logoInput.files[0]));
$("logoRemove").addEventListener("click", (e) => { e.stopPropagation(); clearLogo(); });

["dragover", "dragenter"].forEach(ev =>
  logoDrop.addEventListener(ev, (e) => { e.preventDefault(); logoDrop.classList.add("dragover"); }));
["dragleave", "drop"].forEach(ev =>
  logoDrop.addEventListener(ev, (e) => { e.preventDefault(); logoDrop.classList.remove("dragover"); }));
logoDrop.addEventListener("drop", (e) => setLogo(e.dataTransfer.files[0]));

/* ---------- customer reviews (pasted in by the user) ---------- */

const reviewsList = $("reviewsList");
let reviewRowId = 0;

function addReviewRow(data = {}) {
  const row = document.createElement("div");
  row.className = "review-row";
  row.dataset.id = ++reviewRowId;
  row.innerHTML = `
    <textarea class="rv-quote" rows="3" placeholder="Paste the review text here…"></textarea>
    <div class="review-row-meta">
      <input type="text" class="rv-who" placeholder="Reviewer name (e.g. John D.)" />
      <input type="text" class="rv-role" placeholder="Source (e.g. Google review)" />
      <select class="rv-stars" aria-label="Star rating">
        <option value="5">★★★★★ (5)</option>
        <option value="4">★★★★☆ (4)</option>
        <option value="3">★★★☆☆ (3)</option>
        <option value="2">★★☆☆☆ (2)</option>
        <option value="1">★☆☆☆☆ (1)</option>
      </select>
      <button type="button" class="rv-remove" title="Remove this review">✕</button>
    </div>`;
  row.querySelector(".rv-quote").value = data.quote || "";
  row.querySelector(".rv-who").value = data.who || "";
  row.querySelector(".rv-role").value = data.role || "";
  row.querySelector(".rv-stars").value = data.stars || "5";
  row.querySelector(".rv-remove").addEventListener("click", () => row.remove());
  reviewsList.appendChild(row);
  return row;
}

$("addReviewBtn").addEventListener("click", () => {
  const row = addReviewRow();
  row.querySelector(".rv-quote").focus();
});

function collectReviews() {
  return [...reviewsList.querySelectorAll(".review-row")]
    .map(row => ({
      quote: row.querySelector(".rv-quote").value.trim(),
      who: row.querySelector(".rv-who").value.trim(),
      role: row.querySelector(".rv-role").value.trim(),
      stars: row.querySelector(".rv-stars").value,
    }))
    .filter(r => r.quote);
}

/* ---------- errors ---------- */

function showError(msg) { formError.textContent = msg; formError.hidden = false; }
function clearError() { formError.hidden = true; }

/* ---------- generate flow ---------- */

const PROGRESS_STEP_MS = 620;

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearError();

  const businessType = typeInput.value.trim();
  const businessName = $("businessName").value.trim();

  if (!businessType) { showError("Please tell us your business type — any business works."); typeInput.focus(); return; }
  if (!businessName) { showError("Please enter your business name."); $("businessName").focus(); return; }

  lastInput = {
    businessType,
    businessName,
    tagline: $("tagline").value,
    city: $("city").value,
    phone: $("phone").value,
    email: $("email").value,
    logoDataUrl,
    reviews: collectReviews(),
  };

  suggestionsBox.classList.remove("open");
  await runProgress(businessType);

  hasManualEdits = false;
  lastResult = buildBoth(lastInput);
  showPreview();
});

function buildBoth(input) {
  return {
    final: generateWebsite(input),
    protected: generateWebsite(input, { protect: true }),
  };
}

async function runProgress(businessType) {
  const steps = [...progressView.querySelectorAll(".progress-steps li")];
  steps.forEach(li => li.classList.remove("active", "done"));
  $("progressTitle").textContent = `Researching "${businessType}"…`;
  progressView.hidden = false;

  for (let i = 0; i < steps.length; i++) {
    steps[i].classList.add("active");
    if (i === steps.length - 1) $("progressTitle").textContent = "Building your website…";
    await new Promise(r => setTimeout(r, PROGRESS_STEP_MS));
    steps[i].classList.remove("active");
    steps[i].classList.add("done");
  }
  await new Promise(r => setTimeout(r, 250));
  progressView.hidden = true;
}

/* ---------- preview ---------- */

const MODE_NOTES = {
  protected: "🔒 Client preview — watermarked, with text selection, copy/paste, right-click, image saving, and printing blocked. Host this file at your preview URL to share with clients.",
  final: "✅ Final site — clean and unprotected. Publish this version to the client's domain once they've purchased.",
  editing: "✏️ Edit mode — click any text on the page and type to change it. When you're done, click “Done editing” and your changes are saved into both the client preview and the final website.",
};

function showPreview() {
  $("previewName").textContent = lastInput.businessName;
  const { profile } = lastResult.final;
  $("previewMatch").textContent =
    profile.matchType === "industry" ? `Industry research: ${profile.matchLabel}`
    : profile.matchType === "category" ? `Industry research: ${profile.matchLabel} businesses`
    : "Industry research: general professional profile";

  renderFrame();
  formView.hidden = true;
  previewView.hidden = false;
}

function renderFrame() {
  $("previewFrame").srcdoc = lastResult[viewMode].html;
  $("previewNote").textContent = MODE_NOTES[viewMode];
}

/* protected / final mode toggle */
document.querySelectorAll(".mode-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    if (editing) return;
    document.querySelectorAll(".mode-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    viewMode = btn.dataset.mode;
    if (lastResult) renderFrame();
  });
});

/* ---------- in-preview text editing ---------- */

let editing = false;

const EDITABLE_SELECTOR = [
  "h1", "h2", "h3", "p", "li", "blockquote", "a", "button",
  ".stat-num", ".stat-label", ".eyebrow", ".hero-eyebrow",
  ".brand-name", ".stars", "figcaption strong", "figcaption span", ".copyright",
].join(", ");

function setEditingUi(on) {
  editing = on;
  $("editBtn").hidden = on;
  $("applyBtn").hidden = !on;
  $("discardBtn").hidden = !on;
  ["regenBtn", "downloadBtn", "downloadPreviewBtn", "backBtn", "commandInput", "commandApplyBtn"].forEach(id => { $(id).disabled = on; });
  document.querySelectorAll(".mode-btn").forEach(b => { b.disabled = on; b.classList.toggle("dimmed", on); });
  $("previewNote").textContent = on ? MODE_NOTES.editing : MODE_NOTES[viewMode];
  $("previewNote").classList.toggle("note-editing", on);
}

function startEditing() {
  const frame = $("previewFrame");

  const enable = () => {
    const doc = frame.contentDocument;
    if (!doc || !doc.body) return;

    const style = doc.createElement("style");
    style.id = "edit-style";
    style.textContent = `
      [contenteditable="true"] { cursor: text; transition: outline-color .12s; outline: 2px dashed transparent; outline-offset: 3px; border-radius: 4px; }
      [contenteditable="true"]:hover { outline-color: rgba(99, 102, 241, .55); }
      [contenteditable="true"]:focus { outline: 2px solid #6366f1; background: rgba(99, 102, 241, .06); }
      html { scroll-behavior: auto; }
    `;
    doc.head.appendChild(style);

    doc.querySelectorAll(EDITABLE_SELECTOR).forEach(el => {
      // Don't make containers editable when a child already is
      if (!el.closest("form")) el.setAttribute("contenteditable", "true");
    });

    // While editing, links and buttons must not navigate or submit
    doc.addEventListener("click", (e) => {
      if (e.target.closest("a, button")) e.preventDefault();
    }, true);
  };

  frame.addEventListener("load", enable, { once: true });
  frame.srcdoc = lastResult.final.html; // edit the clean version — no watermark in the way
  setEditingUi(true);
}

let hasManualEdits = false;

function finishEditing(save) {
  const frame = $("previewFrame");
  if (save) {
    const doc = frame.contentDocument;
    doc.getElementById("edit-style")?.remove();
    doc.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute("contenteditable"));
    const html = "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
    lastResult.final.html = html;
    lastResult.protected.html = applyProtection(html, lastInput.businessName);
    hasManualEdits = true;
  }
  setEditingUi(false);
  renderFrame();
}

$("editBtn").addEventListener("click", startEditing);
$("applyBtn").addEventListener("click", () => finishEditing(true));
$("discardBtn").addEventListener("click", () => finishEditing(false));

/* ---------- plain-English command box ---------- */

let resultTimer = null;

function showCommandResult(message, ok) {
  const box = $("commandResult");
  box.textContent = message;
  box.classList.toggle("ok", ok);
  box.hidden = false;
  clearTimeout(resultTimer);
  resultTimer = setTimeout(() => { box.hidden = true; }, ok ? 6000 : 20000);
}

$("commandBar").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!lastResult || editing) return;
  const text = $("commandInput").value.trim();
  if (!text) return;

  $("commandApplyBtn").disabled = true;
  try {
    const res = await applyCommand(text, { html: lastResult.final.html, input: lastInput });
    showCommandResult(res.message, res.ok);
    if (res.ok && res.html) {
      lastResult.final.html = res.html;
      if (res.businessName) lastInput.businessName = res.businessName;
      lastResult.protected.html = applyProtection(lastResult.final.html, lastInput.businessName);
      hasManualEdits = true;
      renderFrame();
      $("commandInput").value = "";
      $("previewName").textContent = lastInput.businessName;
    }
  } finally {
    $("commandApplyBtn").disabled = false;
  }
});

$("commandHelpBtn").addEventListener("click", async () => {
  const res = await applyCommand("help", { html: lastResult?.final.html || "<html></html>", input: lastInput || {} });
  showCommandResult(res.message, false);
});

$("backBtn").addEventListener("click", () => {
  previewView.hidden = true;
  formView.hidden = false;
  window.scrollTo(0, 0);
});

$("regenBtn").addEventListener("click", async () => {
  if (hasManualEdits && !confirm("Regenerating will discard the text edits you made to this site. Continue?")) return;
  hasManualEdits = false;
  previewView.hidden = true;
  await runProgress(lastInput.businessType);
  lastResult = buildBoth(lastInput);
  showPreview();
});

/* device preview toggles */
document.querySelectorAll(".device-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".device-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const stage = $("previewStage");
    stage.classList.remove("tablet", "mobile");
    if (btn.dataset.device !== "desktop") stage.classList.add(btn.dataset.device);
  });
});

/* ---------- download ---------- */

function downloadHtml(html, suffix) {
  const slug = lastInput.businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "website";
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slug}${suffix}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

$("downloadBtn").addEventListener("click", () => {
  if (lastResult) downloadHtml(lastResult.final.html, "");
});

$("downloadPreviewBtn").addEventListener("click", () => {
  if (lastResult) downloadHtml(lastResult.protected.html, "-client-preview");
});
