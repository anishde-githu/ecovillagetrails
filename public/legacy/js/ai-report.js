// public/legacy/js/ai-report.js
//
// ONE shared AI travel report generator + modal, callable from anywhere on
// the site via window.ECV_generateReport(destinationName). This is the
// "common travel-report architecture" every card should funnel through —
// Real vs Reality's "Generate Travel Plan" button, Plan Your Visit cards,
// and (as more entry points are added) Keep Exploring / Get Inspired.
//
// Deliberately reuses:
//   - the SAME backend: POST /api/calendar-ai (lib/groqCalendar.js) — the
//     exact same 12-key JSON shape and prompt already used by the AI
//     Planner widget in the #planner section (js/calendar.js). No second
//     AI system, no second prompt.
//   - the SAME card markup/classes (.atc-card, .atc-card-head, etc. from
//     css/calendar.css) so a report generated from a homepage card looks
//     identical to one generated from the planner's calendar — one visual
//     language, not two.
//
// Adds one thing the planner widget doesn't have yet: a "Book & Explore"
// section (Task 8) at the end of every report. Honesty note: this project
// has no live hotel/flight/train/bus booking API connected. Rather than
// invent fake prices or listings, that section shows real transport
// guidance (same /api/travel-options endpoint already used elsewhere,
// which is itself deliberately written to avoid fabricating specifics) and
// clearly-labeled "connect a booking provider" placeholders for the rest.

(function () {
  const CARD_DEFS = [
    { key: "festivalGuide", title: "Festival Guide" },
    { key: "itinerary", title: "Smart Itinerary Generator" },
    { key: "budget", title: "Budget Estimator" },
    { key: "weather", title: "Weather Summary" },
    { key: "news", title: "Latest News" },
    { key: "transport", title: "Transport Advisor" },
    { key: "photography", title: "Photography Guide" },
    { key: "food", title: "Food Guide" },
    { key: "shopping", title: "Local Shopping Guide" },
    { key: "sustainability", title: "Sustainable Tourism Tips" },
    { key: "hiddenGems", title: "Hidden Gems" },
    { key: "nearbyEvents", title: "Nearby Events" },
  ];

  let overlay, box, titleEl, subtitleEl, bodyEl;

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }

  function ensureModal() {
    if (overlay) return;
    overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.id = "ecvReportModalOverlay";
    overlay.innerHTML = `
      <div class="modal-box ecv-report-modal-box">
        <button class="modal-close" id="ecvReportModalClose" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
        <div class="ecv-report-header">
          <h3 id="ecvReportTitle">Trip report</h3>
          <p id="ecvReportSubtitle"></p>
        </div>
        <div class="atc-cards-grid active" id="ecvReportBody"></div>
      </div>
    `;
    document.body.appendChild(overlay);
    box = overlay.querySelector(".modal-box");
    titleEl = overlay.querySelector("#ecvReportTitle");
    subtitleEl = overlay.querySelector("#ecvReportSubtitle");
    bodyEl = overlay.querySelector("#ecvReportBody");

    overlay.querySelector("#ecvReportModalClose").addEventListener("click", close);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });
  }

  function close() {
    overlay?.classList.remove("open");
  }

  function labelize(camel) {
    return camel.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
  }

  function renderFieldValue(value) {
    if (Array.isArray(value)) {
      return (
        "<ul>" +
        value
          .map((item) => {
            if (typeof item === "object" && item !== null) {
              return "<li>" + Object.values(item).join(" — ") + "</li>";
            }
            return `<li>${escapeHtml(String(item))}</li>`;
          })
          .join("") +
        "</ul>"
      );
    }
    if (typeof value === "object" && value !== null) return renderObjectAsList(value);
    return `<dd>${escapeHtml(String(value))}</dd>`;
  }

  function renderObjectAsList(obj) {
    let html = "<dl>";
    for (const [key, value] of Object.entries(obj)) {
      if (key === "day") continue;
      if (Array.isArray(value) || (typeof value === "object" && value !== null)) {
        html += `<dt>${labelize(key)}</dt>${renderFieldValue(value)}`;
      } else {
        html += `<dt>${labelize(key)}</dt><dd>${escapeHtml(String(value))}</dd>`;
      }
    }
    html += "</dl>";
    return html;
  }

  function renderCardBody(key, data) {
    if (key === "itinerary" && data.days) {
      let html = `<dl><dt>Trip Summary</dt><dd>${escapeHtml(data.tripSummary || "")}</dd></dl>`;
      data.days.forEach((day) => {
        html += `<dl><dt>Day ${day.day}</dt>
          <dd><strong>Morning:</strong> ${escapeHtml(day.morning || "")}</dd>
          <dd><strong>Afternoon:</strong> ${escapeHtml(day.afternoon || "")}</dd>
          <dd><strong>Evening:</strong> ${escapeHtml(day.evening || "")}</dd>
          <dd><strong>Night:</strong> ${escapeHtml(day.night || "")}</dd></dl>`;
      });
      if (data.mapSuggestions) html += `<dl><dt>Map Suggestions</dt>${renderObjectAsList(data.mapSuggestions)}</dl>`;
      return html;
    }
    if (Array.isArray(data)) return renderFieldValue(data);
    return renderObjectAsList(data);
  }

  function toggleCard(card, body) {
    const isOpen = card.classList.contains("open");
    if (isOpen) {
      if (window.gsap) window.gsap.to(body, { maxHeight: 0, duration: 0.35, ease: "power2.inOut" });
      else body.style.maxHeight = "0";
      card.classList.remove("open");
    } else {
      card.classList.add("open");
      const inner = body.querySelector(".atc-card-body-inner");
      if (window.gsap) {
        window.gsap.set(body, { maxHeight: "none" });
        const targetHeight = inner.offsetHeight;
        window.gsap.fromTo(body, { maxHeight: 0 }, { maxHeight: targetHeight, duration: 0.4, ease: "power2.out" });
      } else {
        body.style.maxHeight = inner.offsetHeight + "px";
      }
    }
  }

  function renderCards(data) {
    bodyEl.innerHTML = "";
    CARD_DEFS.forEach((def) => {
      const sectionData = data[def.key];
      if (!sectionData) return;
      const card = document.createElement("div");
      card.className = "atc-card";
      card.innerHTML = `
        <button class="atc-card-head" type="button">
          <span>${def.title}</span>
          <span class="atc-chevron">▾</span>
        </button>
        <div class="atc-card-body">
          <div class="atc-card-body-inner">${renderCardBody(def.key, sectionData)}</div>
        </div>
      `;
      bodyEl.appendChild(card);
      const head = card.querySelector(".atc-card-head");
      const body = card.querySelector(".atc-card-body");
      head.addEventListener("click", () => toggleCard(card, body));
    });

    if (window.gsap) {
      window.gsap.fromTo(
        bodyEl.querySelectorAll(".atc-card"),
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: "power2.out" }
      );
    }

    const first = bodyEl.querySelector(".atc-card");
    if (first) toggleCard(first, first.querySelector(".atc-card-body"));

    appendBookAndExplore(data.__destination);
  }

  /* ---------------------------------------------------------------
     Task 8 — "Book & Explore". Honest by design: real transport
     guidance via the existing /api/travel-options endpoint; hotels/
     flights/trains/buses are clearly-labeled placeholders since no
     live booking API is connected to this project yet, rather than
     fabricated listings or prices.
     --------------------------------------------------------------- */
  async function appendBookAndExplore(destination) {
    const card = document.createElement("div");
    card.className = "atc-card ecv-book-explore";
    card.innerHTML = `
      <button class="atc-card-head" type="button">
        <span>Book &amp; Explore</span>
        <span class="atc-chevron">▾</span>
      </button>
      <div class="atc-card-body">
        <div class="atc-card-body-inner">
          <div class="ecv-book-grid" id="ecvBookGrid">
            <div class="ecv-book-loading">Loading real transport guidance…</div>
          </div>
        </div>
      </div>
    `;
    bodyEl.appendChild(card);
    const head = card.querySelector(".atc-card-head");
    const body = card.querySelector(".atc-card-body");
    head.addEventListener("click", () => toggleCard(card, body));

    const grid = card.querySelector("#ecvBookGrid");
    try {
      const res = await fetch("/api/travel-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ place: destination }),
      });
      const data = await res.json();
      if (!data.success) throw new Error("no data");

      grid.innerHTML = `
        <div class="ecv-book-card ecv-book-real">
          <span class="ecv-book-card-tag">✈️ Nearest airport</span>
          <p>${escapeHtml(data.nearestAirport || "—")}</p>
          <p class="ecv-book-guidance">${escapeHtml(data.flightGuidance || "")}</p>
        </div>
        <div class="ecv-book-card ecv-book-real">
          <span class="ecv-book-card-tag">🚆 Nearest railway station</span>
          <p>${escapeHtml(data.nearestRailwayStation || "—")}</p>
          <p class="ecv-book-guidance">${escapeHtml(data.trainGuidance || "")}</p>
        </div>
        <div class="ecv-book-card ecv-book-real">
          <span class="ecv-book-card-tag">🚌 Nearest bus hub</span>
          <p>${escapeHtml(data.nearestBusHub || "—")}</p>
          <p class="ecv-book-guidance">${escapeHtml(data.busGuidance || "")}</p>
        </div>
        <div class="ecv-book-card ecv-book-real">
          <span class="ecv-book-card-tag">🚗 By road</span>
          <p class="ecv-book-guidance">${escapeHtml(data.roadRoute || "")}</p>
        </div>
        <div class="ecv-book-card ecv-book-placeholder">
          <span class="ecv-book-card-tag">🏨 Hotels &amp; stays</span>
          <p>Live pricing isn't connected yet — this needs a booking-provider API (e.g. Booking.com, MakeMyTrip) wired in here.</p>
        </div>
        <div class="ecv-book-card ecv-book-placeholder">
          <span class="ecv-book-card-tag">📍 Nearby places</span>
          <p>Nearby attractions for ${escapeHtml(destination)} — see the Hidden Gems and Photography Guide sections above for real, AI-curated suggestions.</p>
        </div>
      `;
    } catch (err) {
      grid.innerHTML = `<div class="ecv-book-loading">Couldn't load transport guidance right now.</div>`;
    }
  }

  async function generate(destination, opts) {
    if (!destination) return;
    ensureModal();
    titleEl.textContent = `Planning your trip to ${destination}…`;
    subtitleEl.textContent = "AI-generated report";
    bodyEl.innerHTML = `<div class="ecv-report-loading">Building your ${destination} report — festivals, itinerary, budget, and more…</div>`;
    overlay.classList.add("open");

    const today = new Date().toISOString().slice(0, 10);
    try {
      const res = await fetch("/api/calendar-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: opts?.date || today,
          eventName: opts?.eventName || `Explore ${destination}`,
          location: destination,
          eventType: opts?.eventType || "General visit",
        }),
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) throw new Error(payload.error || "AI request failed.");

      titleEl.textContent = `${destination} — Trip Report`;
      subtitleEl.textContent = `AI-generated, ${new Date().toLocaleDateString()}`;
      renderCards({ ...payload.data, __destination: destination });
    } catch (err) {
      bodyEl.innerHTML = `<div class="ecv-report-loading">Couldn't generate your travel report: ${escapeHtml(err.message)}. Please try again.</div>`;
    }
  }

  window.ECV_generateReport = generate;
})();
