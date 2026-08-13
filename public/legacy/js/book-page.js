/* =====================================================================
   js/book-page.js
   Powers book.html. We never fake actual bookings — this page gives an
   AI-written overview of how to reach a place, plus real links out to
   IRCTC/RedBus/Google Flights/Booking.com/Airbnb where a traveller can
   see live, accurate options and complete a real booking. It also shows
   any real partner hotels/homestays already listed on this site for the
   region.
   ===================================================================== */

(function () {
  document.addEventListener("DOMContentLoaded", init);

  function init() {
    const params = new URLSearchParams(window.location.search);
    const place = params.get("place") || "";
    const region = params.get("region") || place;

    const main = document.getElementById("bookMain");
    if (!place) {
      main.innerHTML = `<p class="place-loading">No destination specified. <a href="index.html">Go back home</a>.</p>`;
      return;
    }

    document.title = "Book: " + place + " — EcoVillage Trails";
    renderShell(main, place);
    if (window.Icons) window.Icons.hydrate(main);

    loadTravelOptions(place, region);
    loadStays(region, place);
  }

  function renderShell(main, place) {
    main.innerHTML = `
      <section class="place-section" style="margin-top:20px;">
        <h1 class="book-title">Plan your trip to ${escapeHtml(place)}</h1>
        <p class="book-disclaimer">
          <span class="h-icon" data-icon="alert" data-icon-size="14"></span>
          EcoVillage Trails doesn't process train, flight, bus, or hotel payments directly.
          Below is an AI-written overview to help you plan, plus direct links to real booking
          platforms (IRCTC, RedBus, Google Flights, Booking.com, Airbnb) where you complete the
          actual booking.
        </p>
      </section>

      <section class="place-section" id="bookTravel">
        <h2><span class="h-icon" data-icon="route" data-icon-size="18"></span> Getting There</h2>
        <p class="place-loading"><span class="lu-spinner"></span> Working out the best routes...</p>
      </section>

      <section class="place-section" id="bookStays">
        <h2><span class="h-icon" data-icon="bed" data-icon-size="18"></span> Where to Stay</h2>
        <p class="place-loading"><span class="lu-spinner"></span> Checking our partner stays...</p>
      </section>
    `;
  }

  // ---------------------------------------------------------------
  // Getting There
  // ---------------------------------------------------------------
  async function loadTravelOptions(place, region) {
    const el = document.getElementById("bookTravel");
    const q = encodeURIComponent(place);
    const links = [
      { label: "Search trains (IRCTC)", href: `https://www.google.com/search?q=trains+to+${q}+site:irctc.co.in+OR+IRCTC`, icon: "route" },
      { label: "Search buses (RedBus)", href: `https://www.google.com/search?q=buses+to+${q}+redbus`, icon: "route" },
      { label: "Search flights (Google Flights)", href: `https://www.google.com/travel/flights?q=Flights%20to%20${q}`, icon: "route" },
      { label: "Get driving directions (Maps)", href: `https://www.google.com/maps/dir/?api=1&destination=${q}`, icon: "compass" },
    ];
    const linksHtml = links
      .map(
        (l) => `<a class="book-link-btn" href="${l.href}" target="_blank" rel="noopener noreferrer">
          <span class="h-icon" data-icon="${l.icon}" data-icon-size="14"></span> ${l.label}
          <span class="h-icon" data-icon="external-link" data-icon-size="12"></span>
        </a>`
      )
      .join("");

    try {
      const res = await fetch("/api/travel-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ place, region }),
      });
      const data = await res.json();
      if (!data.success) throw new Error("failed");

      el.innerHTML = `
        <h2><span class="h-icon" data-icon="route" data-icon-size="18"></span> Getting There</h2>
        <div class="hg-modal-meta" style="margin-bottom:16px;">
          ${data.nearestRailwayStation ? `<div><strong>Nearest railway station:</strong> ${escapeHtml(data.nearestRailwayStation)}</div>` : ""}
          ${data.nearestAirport ? `<div><strong>Nearest airport:</strong> ${escapeHtml(data.nearestAirport)}</div>` : ""}
          ${data.nearestBusHub ? `<div><strong>Nearest bus hub:</strong> ${escapeHtml(data.nearestBusHub)}</div>` : ""}
        </div>
        <div class="report-cards-grid">
          ${data.trainGuidance ? `<div class="report-card"><h4><span class="h-icon" data-icon="route" data-icon-size="15"></span> By Train</h4><p>${escapeHtml(data.trainGuidance)}</p></div>` : ""}
          ${data.busGuidance ? `<div class="report-card"><h4><span class="h-icon" data-icon="route" data-icon-size="15"></span> By Bus</h4><p>${escapeHtml(data.busGuidance)}</p></div>` : ""}
          ${data.flightGuidance ? `<div class="report-card"><h4><span class="h-icon" data-icon="route" data-icon-size="15"></span> By Air</h4><p>${escapeHtml(data.flightGuidance)}</p></div>` : ""}
          ${data.roadRoute ? `<div class="report-card"><h4><span class="h-icon" data-icon="compass" data-icon-size="15"></span> By Road</h4><p>${escapeHtml(data.roadRoute)}</p></div>` : ""}
        </div>
        <p class="hg-ai-note"><span class="h-icon" data-icon="sparkle" data-icon-size="12"></span> General AI guidance — exact schedules and fares change, always confirm on the live site below.</p>
        <div class="book-links-row">${linksHtml}</div>
      `;
      if (window.Icons) window.Icons.hydrate(el);
    } catch (err) {
      console.error(err);
      el.innerHTML = `
        <h2><span class="h-icon" data-icon="route" data-icon-size="18"></span> Getting There</h2>
        <p class="hg-ai-error">Couldn't generate travel guidance right now — but you can still search directly:</p>
        <div class="book-links-row">${linksHtml}</div>
      `;
      if (window.Icons) window.Icons.hydrate(el);
    }
  }

  // ---------------------------------------------------------------
  // Where to Stay
  // ---------------------------------------------------------------
  async function loadStays(region, place) {
    const el = document.getElementById("bookStays");
    const q = encodeURIComponent(place);
    const externalLinks = [
      { label: "Search on Booking.com", href: `https://www.booking.com/searchresults.html?ss=${q}` },
      { label: "Search on Airbnb", href: `https://www.airbnb.co.in/s/${q}/homes` },
      { label: "Search on MakeMyTrip", href: `https://www.makemytrip.com/hotels/hotel-listing/?searchText=${q}` },
    ];
    const externalHtml = externalLinks
      .map(
        (l) => `<a class="book-link-btn" href="${l.href}" target="_blank" rel="noopener noreferrer">
          <span class="h-icon" data-icon="bed" data-icon-size="14"></span> ${l.label}
          <span class="h-icon" data-icon="external-link" data-icon-size="12"></span>
        </a>`
      )
      .join("");

    let partnerHtml = "";
    try {
      const apiBase = window.ECOVILLAGE_API_BASE || "";
      const res = await fetch(`${apiBase}/api/listings?category=hotel&region=${encodeURIComponent(region)}`);
      const data = await res.json();
      const listings = data.listings || [];
      if (listings.length) {
        partnerHtml = `
          <h3 class="book-subheading">Partner stays on EcoVillage Trails</h3>
          <div class="report-cards-grid">
            ${listings
              .slice(0, 6)
              .map(
                (l) => `
              <div class="report-card">
                <h4>${escapeHtml(l.name)}</h4>
                <p>${escapeHtml(l.tagline || l.description || "")}</p>
                ${l.contactPhone ? `<p><strong>Contact:</strong> ${escapeHtml(l.contactPhone)}</p>` : ""}
              </div>
            `
              )
              .join("")}
          </div>
        `;
      }
    } catch (err) {
      console.info("No partner listings available for this region yet.");
    }

    el.innerHTML = `
      <h2><span class="h-icon" data-icon="bed" data-icon-size="18"></span> Where to Stay</h2>
      ${partnerHtml || `<p class="place-muted">No partner homestays listed for this region yet — search real-time availability below.</p>`}
      <h3 class="book-subheading">${partnerHtml ? "More options" : "Search live availability"}</h3>
      <div class="book-links-row">${externalHtml}</div>
    `;
    if (window.Icons) window.Icons.hydrate(el);
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }
})();
