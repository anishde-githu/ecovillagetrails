/* =====================================================================
   js/feed.js
   Endless "Keep exploring" feed at the bottom of the page.
   - First loads real seeded destinations (data/destinations.json).
   - Once those run out, keeps asking the AI for more (mode:"suggest"),
     cycling through themes, so scrolling never really "ends" (Instagram/
     Facebook-style), up to a safety cap so nobody accidentally runs up
     an unbounded Groq bill just by scrolling.
   - Clicking any card opens a full place.html page with photos, weather,
     and an AI trip plan for that destination.
   ===================================================================== */

(function () {
  const BATCH_SIZE = 6;
  const MAX_AI_BATCHES = 8; // safety cap once seed data is exhausted

  let seedQueue = [];
  let categories = [];
  let categoryCursor = 0;
  let aiBatchesLoaded = 0;
  let loading = false;
  let ended = false;

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    const grid = document.getElementById("feedGrid");
    const sentinel = document.getElementById("feedSentinel");
    if (!grid || !sentinel) return;

    try {
      const res = await fetch("data/destinations.json");
      const data = await res.json();
      categories = data.categories || [];
      seedQueue = shuffle(
        categories.flatMap((cat) =>
          cat.places.map((p) => ({ ...p, category: cat.title, categoryKey: cat.key }))
        )
      );
    } catch (err) {
      console.error("Failed to load destinations for feed:", err);
    }

    loadNextBatch(); // first batch loads immediately, not on scroll

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadNextBatch();
      },
      { rootMargin: "600px" }
    );
    observer.observe(sentinel);
  }

  async function loadNextBatch() {
    if (loading || ended) return;
    loading = true;
    const grid = document.getElementById("feedGrid");
    const sentinel = document.getElementById("feedSentinel");
    const endMsg = document.getElementById("feedEnd");

    let batch = [];

    if (seedQueue.length > 0) {
      batch = seedQueue.splice(0, BATCH_SIZE);
    } else if (aiBatchesLoaded < MAX_AI_BATCHES && categories.length) {
      batch = await fetchAiBatch();
      aiBatchesLoaded += 1;
    }

    if (batch.length === 0) {
      ended = true;
      sentinel.style.display = "none";
      if (endMsg) endMsg.style.display = "block";
      loading = false;
      return;
    }

    batch.forEach((place) => grid.insertAdjacentHTML("beforeend", cardHtml(place)));
    if (window.Icons) window.Icons.hydrate(grid);
    grid.querySelectorAll(".feed-card:not([data-wired])").forEach((el) => {
      el.setAttribute("data-wired", "1");
      const place = JSON.parse(el.getAttribute("data-place"));
      el.addEventListener("click", () => goToPlacePage(place));
      loadCardPhoto(el, place);
    });

    loading = false;
  }

  function goToPlacePage(place) {
    const params = new URLSearchParams({
      name: place.title,
      tag: place.tag || "",
      category: place.category || "",
      grad: place.grad || "",
      video: place.video || "",
    });
    window.location.href = "place.html?" + params.toString();
  }

  const photoCache = new Map(); // place title -> image URL (or null if none found)

  async function fetchPlacePhoto(name) {
    if (photoCache.has(name)) return photoCache.get(name);
    try {
      const res = await fetch("/api/place-image?name=" + encodeURIComponent(name));
      const data = await res.json();
      const url = data.success ? data.image : null;
      photoCache.set(name, url);
      return url;
    } catch (err) {
      photoCache.set(name, null);
      return null;
    }
  }

  async function loadCardPhoto(cardEl, place) {
    if (place.video) return; // already has a real video, no need for a photo
    const url = await fetchPlacePhoto(place.title);
    if (!url) return;
    const art = cardEl.querySelector(".feed-art");
    if (!art) return;
    const img = new Image();
    img.onload = () => {
      art.style.backgroundImage = `url("${url}")`;
      art.style.backgroundSize = "cover";
      art.style.backgroundPosition = "center";
      art.classList.add("has-photo");
    };
    img.src = url;
  }

  async function fetchAiBatch() {
    // Cycle through categories so the endless feed stays varied.
    const cat = categories[categoryCursor % categories.length];
    categoryCursor += 1;
    try {
      const res = await fetch("/api/place-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "suggest", category: cat.title, exclude: cat.places.map((p) => p.title) }),
      });
      const data = await res.json();
      if (!data.success || !Array.isArray(data.places)) return [];
      return data.places.map((sp, i) => ({
        key: `ai_${cat.key}_${Date.now()}_${i}`,
        title: sp.name,
        tag: sp.tag,
        grad: pickGradient(categoryCursor + i),
        video: null,
        category: cat.title,
        categoryKey: cat.key,
        aiTeaser: sp.oneLiner,
      }));
    } catch (err) {
      console.error("AI feed batch failed:", err);
      return [];
    }
  }

  function cardHtml(p) {
    const art = p.video
      ? `<video autoplay muted loop playsinline class="feed-video"><source src="assets/${p.video}" type="video/mp4"></video>`
      : "";
    return `
      <article class="feed-card" role="listitem" data-place='${JSON.stringify(p).replace(/'/g, "&#39;")}'>
        <div class="feed-art" style="background:${p.grad || "linear-gradient(135deg,#1c5f78,#2a8fae 70%)"};">${art}</div>
        <div class="feed-shade"></div>
        <div class="feed-body">
          <span class="feed-tag">${escapeHtml(p.tag || p.category)}</span>
          <h3>${escapeHtml(p.title)}</h3>
          <p class="feed-teaser">${window.Icons ? window.Icons.get("sparkle", 12) : ""} ${escapeHtml(p.aiTeaser || "Tap to explore this place")}</p>
        </div>
      </article>
    `;
  }

  const GRADIENTS = [
    "linear-gradient(135deg,#1c5f78,#2a8fae 70%)",
    "linear-gradient(135deg,#0f5c3d,#1f8a5a 70%)",
    "linear-gradient(135deg,#9c4a26,#e1672e 70%)",
    "linear-gradient(135deg,#b9810f,#f0ad2e 70%)",
    "linear-gradient(135deg,#52645b,#9adde8 70%)",
  ];
  function pickGradient(i) {
    return GRADIENTS[i % GRADIENTS.length];
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }
})();
