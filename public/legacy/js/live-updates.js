/* =====================================================================
 js/live-updates.js
 Frontend logic for the EcoVillage Live Updates section.
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
 const badgeLabel = u.priority === "high" ? "High Priority" : "Normal Update";
 const catIcon = window.Icons ? window.Icons.get(u.icon || "compass", 14) : "";
 const pinIcon = window.Icons ? window.Icons.get("map-pin", 12) : "";
 const calIcon = window.Icons ? window.Icons.get("calendar-check", 12) : "";
 const readMoreHref = u.link || ("https://news.google.com/search?q=" + encodeURIComponent(u.title));

 return `
 <article class="lu-card" role="listitem" aria-label="${escapeHtml(u.title)}">
 <div class="lu-card-top">
 <span class="lu-category">${catIcon} ${escapeHtml(u.category)}</span>
 <span class="lu-badge ${badgeClass}">${badgeLabel}</span>
 </div>
 <h3 class="lu-title">${escapeHtml(u.title)}</h3>
 <p class="lu-summary">${escapeHtml(u.summary)}</p>
 <div class="lu-meta">
 <span>${pinIcon} ${escapeHtml(u.location || u.state)}</span>
 <span>${calIcon} ${escapeHtml(u.date)}</span>
 </div>
 <div class="lu-card-actions">
 <button class="lu-ask-btn" data-ask-idx="${idx}" aria-haspopup="dialog">
 Ask AI
 </button>
 <a class="lu-readmore-btn" href="${readMoreHref}" target="_blank" rel="noopener noreferrer">
 Read more on ${escapeHtml(u.sourceName || "Google News")} ${window.Icons ? window.Icons.get("external-link", 12) : ""}
 </a>
 </div>
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
 grid.innerHTML = `<div class="lu-error"> Couldn't load live updates right now. Please refresh the page.</div>`;
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
 body.innerHTML = `<div class="lu-modal-loading"><span class="lu-spinner"></span> Writing the story...</div>`;
 overlay.classList.add("open");

 const dateline = `${(update.location || update.state || "India").toUpperCase()} — ${update.date || "Today"}`;
 const readMoreHref = update.link || ("https://news.google.com/search?q=" + encodeURIComponent(update.title));
 const readMoreLabel = update.sourceName || "Google News";

 const prompt = `You are a newspaper staff writer for EcoVillage Times, a travel section.
Rewrite the following tourism update as a short newspaper-style article for travellers.

Headline: ${update.title}
Category: ${update.category}
Location: ${update.location || update.state}
Raw summary: ${update.summary}

Write EXACTLY in this structure, plain text, no markdown symbols:
1. A punchy headline (max 12 words) on the first line.
2. A blank line.
3. 3 short newspaper-style paragraphs (lede, context, practical takeaway) covering: why this matters, who should visit, travel tips, and the best time to go. Write in third-person journalistic tone, not bullet points.

Do not include a byline, dateline, or sign-off — those are added separately.`;

 try {
 const res = await fetch("/api/chat", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ message: prompt }),
 });
 const data = await res.json();

 if (data.success) {
 const lines = String(data.reply).trim().split("\n").filter(Boolean);
 const aiHeadline = lines.shift() || update.title;
 const paragraphs = lines
 .join("\n")
 .split(/\n{1,2}/)
 .map((p) => p.trim())
 .filter(Boolean);

 body.innerHTML = `
 <article class="lu-news-article">
 <h2 class="lu-news-headline">${escapeHtml(aiHeadline)}</h2>
 <p class="lu-news-dateline">${escapeHtml(dateline)} <span class="lu-news-byline">EcoVillage AI Desk</span></p>
 ${paragraphs.map((p) => `<p class="lu-news-para">${escapeHtml(p)}</p>`).join("")}
 <a class="lu-readmore-btn lu-readmore-modal" href="${readMoreHref}" target="_blank" rel="noopener noreferrer">
 Read the original report on ${escapeHtml(readMoreLabel)} ${window.Icons ? window.Icons.get("external-link", 12) : ""}
 </a>
 </article>
 `;
 } else {
 body.innerHTML = `<p class="lu-news-para">Unable to generate the article right now. Please try again.</p>`;
 }
 } catch (err) {
 console.error(err);
 body.innerHTML = `<p class="lu-news-para">Server error. Please try again later.</p>`;
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
