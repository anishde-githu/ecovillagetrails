// public/legacy/js/homepage-highlights.js
//
// Renders three AI-curated sections just above "EcoVillage Live Updates":
//   1. Seasonal Picks   — Accordion Gallery (vertical panels, expand on hover)
//   2. Real vs Reality   — Circular Gallery (horizontal scroll-snap cards)
//   3. Plan Your Visit   — Depth Carousel (single big card, arrows + dots)
// Data + copy comes from /api/homepage-highlights (Groq-written, real
// Wikipedia photography, and — for Real vs Reality specifically — a genuine
// AI-generated "expectation" image via Pollinations.ai). See that route's
// comments for the full breakdown of what's real vs AI-generated.

(function () {
  function init() {
    const mount = document.getElementById("ecvHighlights");
    if (!mount) return;
    run(mount);
  }

  function run(mount) {
  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }

  function fallbackImg(name) {
    // Soft gradient placeholder if a Wikipedia photo genuinely can't be found.
    return `https://placehold.co/640x640/1f8a5a/ffffff?text=${encodeURIComponent(name)}`;
  }

  async function load() {
    try {
      const res = await fetch("/api/homepage-highlights");
      const data = await res.json();
      if (!data.success) throw new Error("no data");
      render(data);
    } catch (err) {
      console.error("[EcoVillage] homepage highlights failed to load:", err);
      mount.style.display = "none";
    }
  }

  function render(data) {
    mount.innerHTML = `
      ${renderSeasonalPicks(data.seasonalPicks || [], data.season)}
      ${renderRealityChecks(data.realityChecks || [])}
      ${renderPlanYourVisit(data.planYourVisit || [])}
    `;
    wireAccordion();
    wireCircular();
    wireDepthCarousel();
  }

  /* ============================================================
     1. SEASONAL PICKS — Accordion Gallery
     ============================================================ */
  function renderSeasonalPicks(items, season) {
    if (!items.length) return "";
    const panels = items
      .map(
        (item, i) => `
        <div class="ecv-acc-panel${i === 0 ? " is-open" : ""}" data-i="${i}">
          <img src="${escapeHtml(item.image || fallbackImg(item.name))}" alt="${escapeHtml(item.name)}" loading="lazy">
          <div class="ecv-acc-panel-overlay">
            <span class="ecv-acc-panel-name">${escapeHtml(item.name)}</span>
            <p class="ecv-acc-panel-blurb">${escapeHtml(item.blurb)}</p>
          </div>
        </div>
      `
      )
      .join("");

    return `
      <section class="section ecv-highlight-section" id="seasonal-picks">
        <div class="container">
          <h2 class="section-title">Best places to visit this ${escapeHtml(season || "season")}</h2>
          <p class="section-subtitle">Curated by our AI trip planner from everywhere we cover — tap or hover a panel to open it.</p>
          <div class="ecv-accordion">${panels}</div>
        </div>
      </section>
    `;
  }

  function wireAccordion() {
    const accordion = mount.querySelector(".ecv-accordion");
    if (!accordion) return;
    const panels = Array.from(accordion.querySelectorAll(".ecv-acc-panel"));

    function open(panel) {
      panels.forEach((p) => p.classList.toggle("is-open", p === panel));
    }
    panels.forEach((p) => {
      p.addEventListener("mouseenter", () => open(p));
      p.addEventListener("click", () => open(p));
    });
  }

  /* ============================================================
     2. REAL VS REALITY — Circular Gallery
     ============================================================ */
  function renderRealityChecks(items) {
    if (!items.length) return "";
    const cards = items
      .map(
        (item) => `
        <div class="ecv-reality-card">
          <div class="ecv-reality-flip">
            <div class="ecv-reality-face ecv-reality-front">
              <div class="ecv-reality-face-inner">
                <img src="${escapeHtml(item.aiImage || fallbackImg(item.name))}" alt="Expectation: ${escapeHtml(item.name)}" loading="lazy">
                <span class="ecv-reality-tag ecv-reality-tag-ai">✨ Expectation (AI-generated)</span>
              </div>
            </div>
            <div class="ecv-reality-face ecv-reality-back">
              <div class="ecv-reality-face-inner">
                <img src="${escapeHtml(item.image || fallbackImg(item.name))}" alt="Reality: ${escapeHtml(item.name)}" loading="lazy">
                <span class="ecv-reality-tag ecv-reality-tag-real">📷 Reality (real photo)</span>
              </div>
            </div>
          </div>
          <div class="ecv-reality-caption">
            <strong>${escapeHtml(item.name)}</strong>
            <p>"${escapeHtml(item.expectation)}" vs. ${escapeHtml(item.reality)}</p>
            <span class="ecv-reality-hint">Tap the photo to flip →</span>
            <button type="button" class="ecv-generate-plan-btn" data-destination="${escapeHtml(item.name)}">
              ✨ Generate Travel Plan
            </button>
          </div>
        </div>
      `
      )
      .join("");

    return `
      <section class="section ecv-highlight-section" id="reality-checks">
        <div class="container">
          <h2 class="section-title">Real vs Reality</h2>
          <p class="section-subtitle">The Instagram expectation (AI-imagined) next to what you'll actually find — still worth the trip.</p>
          <div class="ecv-reality-track">${cards}</div>
        </div>
      </section>
    `;
  }

  function wireCircular() {
    mount.querySelectorAll(".ecv-reality-card").forEach((card) => {
      card.addEventListener("click", () => card.classList.toggle("is-flipped"));
    });
    // The "Generate Travel Plan" button sits inside the flip card but must
    // NOT trigger the flip — stop the click from bubbling to the card.
    mount.querySelectorAll(".ecv-generate-plan-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (window.ECV_generateReport) window.ECV_generateReport(btn.dataset.destination);
      });
    });
  }

  /* ============================================================
     3. PLAN YOUR VISIT — Depth Carousel
     ============================================================ */
  function renderPlanYourVisit(items) {
    if (!items.length) return "";
    const slides = items
      .map(
        (item, i) => `
        <div class="ecv-depth-slide${i === 0 ? " is-active" : ""}" data-i="${i}" data-destination="${escapeHtml(item.name)}">
          <img src="${escapeHtml(item.image || fallbackImg(item.name))}" alt="${escapeHtml(item.name)}" loading="lazy">
          <div class="ecv-depth-slide-info">
            <span class="ecv-depth-slide-time">🗓️ Best time: ${escapeHtml(item.bestTime)}</span>
            <h3>${escapeHtml(item.name)}</h3>
            <p>${escapeHtml(item.tip)}</p>
            <button type="button" class="ecv-generate-plan-btn ecv-generate-plan-btn-light" data-destination="${escapeHtml(item.name)}">
              ✨ Generate Travel Plan
            </button>
          </div>
        </div>
      `
      )
      .join("");
    const dots = items.map((_, i) => `<button class="ecv-depth-dot${i === 0 ? " is-active" : ""}" data-i="${i}" aria-label="Slide ${i + 1}"></button>`).join("");

    return `
      <section class="section ecv-highlight-section" id="plan-your-visit">
        <div class="container">
          <h2 class="section-title">Plan your visit</h2>
          <p class="section-subtitle">When to go, and one practical tip for each — so the trip matches the postcard.</p>
          <div class="ecv-depth-carousel">
            <button class="ecv-depth-arrow ecv-depth-prev" aria-label="Previous">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <div class="ecv-depth-stage">${slides}</div>
            <button class="ecv-depth-arrow ecv-depth-next" aria-label="Next">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
          <div class="ecv-depth-dots">${dots}</div>
        </div>
      </section>
    `;
  }

  function wireDepthCarousel() {
    const stage = mount.querySelector(".ecv-depth-stage");
    if (!stage) return;
    const slides = Array.from(stage.querySelectorAll(".ecv-depth-slide"));
    const dots = Array.from(mount.querySelectorAll(".ecv-depth-dot"));
    let current = 0;

    function goTo(i) {
      current = (i + slides.length) % slides.length;
      slides.forEach((s, idx) => {
        s.classList.remove("is-active", "is-prev", "is-next");
        if (idx === current) s.classList.add("is-active");
        else if (idx === (current - 1 + slides.length) % slides.length) s.classList.add("is-prev");
        else if (idx === (current + 1) % slides.length) s.classList.add("is-next");
      });
      dots.forEach((d, idx) => d.classList.toggle("is-active", idx === current));
    }

    mount.querySelector(".ecv-depth-prev")?.addEventListener("click", () => goTo(current - 1));
    mount.querySelector(".ecv-depth-next")?.addEventListener("click", () => goTo(current + 1));
    dots.forEach((d) => d.addEventListener("click", () => goTo(Number(d.dataset.i))));

    // Task 4: clicking a slide's "Generate Travel Plan" button opens the
    // shared report modal for that destination — stopPropagation so it
    // doesn't also register as a slide-navigation click.
    mount.querySelectorAll(".ecv-depth-slide .ecv-generate-plan-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (window.ECV_generateReport) window.ECV_generateReport(btn.dataset.destination);
      });
    });

    let autoplay = setInterval(() => goTo(current + 1), 5000);
    stage.addEventListener("mouseenter", () => clearInterval(autoplay));
    stage.addEventListener("mouseleave", () => (autoplay = setInterval(() => goTo(current + 1), 5000)));

    goTo(0);
  }

  load();
  } // end run()

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
