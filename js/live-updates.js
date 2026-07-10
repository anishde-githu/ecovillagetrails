/* =====================================================================
   js/live-updates.js
   Frontend logic for the 🌿 EcoVillage Live Updates section.
   Loads pre-processed JSON from /api/live-updates (which itself is
   backed by GROQ, not Gemini) — the page never calls the AI directly,
   keeping page loads fast and API costs low.
   ===================================================================== */

(function () {
  const FILTER_MAP = {
    All: null,
    Tourism: "Tourism News",
    Festivals: "Festivals",
    Weather: "Weather Alerts",
    Wildlife: "Wildlife",
    Eco: "Eco Tourism",
    Transport: "Transport Updates",
  };

  let allUpdates = [];
  let activeFilter = "All";
  let searchTerm = "";

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    renderSkeletons();
    try {
      const res = await fetchWithRetry("/api/live-updates", 2);
      const data = await res.json();
      allUpdates = Array.isArray(data.updates) ? data.updates : [];
      applySmartDestinationOrder();
      render();
    } catch (err) {
      console.error("Live updates failed to load:", err);
      showError();
    }

    wireControls();
  }

  // ---------------------------------------------------------------
  // Fetch with retry (basic resilience per spec)
  // ---------------------------------------------------------------
  async function fetchWithRetry(url, retries) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Bad response " + res.status);
      return res;
    } catch (err) {
      if (retries > 0) {
        await new Promise((r) => setTimeout(r, 600));
        return fetchWithRetry(url, retries - 1);
      }
      throw err;
    }
  }

  // ---------------------------------------------------------------
  // Smart destination filtering: if the current page path contains
  // /destinations/<state>.html, prioritize matching-state updates.
  // Falls back to national ordering if none match.
  // ---------------------------------------------------------------
  function applySmartDestinationOrder() {
    const match = window.location.pathname.match(
      /destinations\/([a-z-]+)\.html/i
    );
    if (!match) return;

    const stateSlug = match[1].toLowerCase().replace(/-/g, " ");
    const local = allUpdates.filter((u) =>
      (u.state || "").toLowerCase().includes(stateSlug)
    );
    const rest = allUpdates.filter(
      (u) => !(u.state || "").toLowerCase().includes(stateSlug)
    );

    if (local.length > 0) {
      allUpdates = [...local, ...rest];
    }
    // if no local updates exist, national updates (already loaded) show as-is
  }

  // ---------------------------------------------------------------
  // Controls: search box + filter chips
  // ---------------------------------------------------------------
  function wireControls() {
    const searchInput = document.getElementById("luSearch");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        searchTerm = e.target.value.trim().toLowerCase();
        render();
      });
    }

    document.querySelectorAll(".lu-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        document
          .querySelectorAll(".lu-chip")
          .forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        activeFilter = chip.dataset.filter;
        render();
      });

      chip.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          chip.click();
        }
      });
    });
  }

  // ---------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------
  function getFiltered() {
    const categoryFilter = FILTER_MAP[activeFilter];
    return allUpdates.filter((u) => {
      const matchesCategory = !categoryFilter || u.category === categoryFilter;
      const haystack = `${u.title} ${u.state} ${u.location} ${u.category}`
        .toLowerCase();
      const matchesSearch = !searchTerm || haystack.includes(searchTerm);
      return matchesCategory && matchesSearch;
    });
  }

  function render() {
    const grid = document.getElementById("luGrid");
    if (!grid) return;

    const items = getFiltered();

    if (items.length === 0) {
      grid.innerHTML = `<div class="lu-empty">No updates match your search right now. Try a different keyword or filter.</div>`;
      return;
    }

    grid.innerHTML = items.map(cardHtml).join("");

    grid.querySelectorAll("[data-ask-idx]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.dataset.askIdx);
        openAskAI(items[idx]);
      });
    });
  }

  function cardHtml(u, idx) {
    const badgeClass = u.priority === "high" ? "high" : "normal";
    const badgeLabel = u.priority === "high" ? "🔴 High Priority" : "🟢 Normal Update";

    return `
      <article class="lu-card" role="listitem" aria-label="${escapeHtml(u.title)}">
        <div class="lu-card-top">
          <span class="lu-category">${u.icon || "📰"} ${escapeHtml(u.category)}</span>
          <span class="lu-badge ${badgeClass}">${badgeLabel}</span>
        </div>
        <h3 class="lu-title">${escapeHtml(u.title)}</h3>
        <p class="lu-summary">${escapeHtml(u.summary)}</p>
        <div class="lu-meta">
          <span>📍 ${escapeHtml(u.location || u.state)}</span>
          <span>🗓 ${escapeHtml(u.date)}</span>
        </div>
        <button class="lu-ask-btn" data-ask-idx="${idx}" aria-haspopup="dialog">
          Ask AI
        </button>
      </article>
    `;
  }

  function renderSkeletons() {
    const grid = document.getElementById("luGrid");
    if (!grid) return;
    grid.innerHTML = Array.from({ length: 6 })
      .map(
        () => `
      <div class="lu-skeleton" aria-hidden="true">
        <div class="lu-skeleton-line short"></div>
        <div class="lu-skeleton-line"></div>
        <div class="lu-skeleton-line tall"></div>
        <div class="lu-skeleton-line short"></div>
      </div>`
      )
      .join("");
  }

  function showError() {
    const grid = document.getElementById("luGrid");
    if (!grid) return;
    grid.innerHTML = `<div class="lu-error">⚠ Couldn't load live updates right now. Please refresh the page.</div>`;
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // ---------------------------------------------------------------
  // Ask AI — reuses the site's existing /api/chat endpoint (Groq),
  // the same one that already powers the AI Travel Planner.
  // ---------------------------------------------------------------
  async function openAskAI(update) {
    const overlay = document.getElementById("luModalOverlay");
    const body = document.getElementById("luModalBody");
    const heading = document.getElementById("luModalHeading");
    if (!overlay || !body || !heading) return;

    heading.textContent = update.title;
    body.innerHTML = `<div class="lu-modal-loading"><span class="lu-spinner"></span> Thinking about this update...</div>`;
    overlay.classList.add("open");

    const prompt = `Explain this tourism update in simple language.

News: ${update.title}

Summary: ${update.summary}

Tell me:
- why this matters
- who should visit
- travel tips
- best time to go
- nearby attractions`;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt }),
      });
      const data = await res.json();

      if (data.success) {
        body.innerHTML = escapeHtml(data.reply).replace(/\n/g, "<br>");
      } else {
        body.innerHTML = `⚠ Unable to fetch AI explanation right now. Please try again.`;
      }
    } catch (err) {
      console.error(err);
      body.innerHTML = `❌ Server error. Please try again later.`;
    }
  }

  function closeAskAI() {
    const overlay = document.getElementById("luModalOverlay");
    if (overlay) overlay.classList.remove("open");
  }

  // expose close handler + Escape key support for the inline onclick/markup
  window.luCloseModal = closeAskAI;
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAskAI();
  });
})();
