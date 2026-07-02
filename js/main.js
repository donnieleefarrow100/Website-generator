/* ============================================================
   Website Generator — app controller
   Handles the input form, logo upload, the "research & build"
   progress flow, live preview, and download of the final site.
   ============================================================ */

import { generateWebsite } from "./generator.js";

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
  };

  suggestionsBox.classList.remove("open");
  await runProgress(businessType);

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
    document.querySelectorAll(".mode-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    viewMode = btn.dataset.mode;
    if (lastResult) renderFrame();
  });
});

$("backBtn").addEventListener("click", () => {
  previewView.hidden = true;
  formView.hidden = false;
  window.scrollTo(0, 0);
});

$("regenBtn").addEventListener("click", async () => {
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
