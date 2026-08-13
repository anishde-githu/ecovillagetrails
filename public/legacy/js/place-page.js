/* =====================================================================
   js/place-page.js
   Powers place.html. Reads ?name=&tag=&category=&grad=&video= from the
   URL (set by the feed cards on index.html) and renders:
   - Hero (real video if we have one, else the card's gradient)
   - A gallery of real photos (Wikimedia Commons, via /api/place-gallery)
   - Live weather for the place (Open-Meteo geocoding + forecast, no key)
   - A full AI trip-plan report (/api/place-info, mode:"detail")
   - A "Book Your Stay" button through to book.html
   ===================================================================== */

(function () {
  const WEATHER_CODES = {
    0: { label: "Clear sky", icon: "sun" }, 1: { label: "Mainly clear", icon: "sun" },
    2: { label: "Partly cloudy", icon: "cloud-sun" }, 3: { label: "Overcast", icon: "cloud" },
    45: { label: "Fog", icon: "cloud" }, 48: { label: "Fog", icon: "cloud" },
    51: { label: "Light drizzle", icon: "cloud" }, 53: { label: "Drizzle", icon: "cloud" }, 55: { label: "Dense drizzle", icon: "cloud" },
    61: { label: "Light rain", icon: "cloud" }, 63: { label: "Rain", icon: "cloud" }, 65: { label: "Heavy rain", icon: "cloud" },
    71: { label: "Light snow", icon: "cloud" }, 73: { label: "Snow", icon: "cloud" }, 75: { label: "Heavy snow", icon: "cloud" },
    80: { label: "Rain showers", icon: "cloud" }, 81: { label: "Rain showers", icon: "cloud" }, 82: { label: "Violent showers", icon: "cloud" },
    95: { label: "Thunderstorm", icon: "alert" }, 96: { label: "Thunderstorm", icon: "alert" }, 99: { label: "Thunderstorm", icon: "alert" },
  };
  function codeInfo(code) {
    return WEATHER_CODES[code] || { label: "—", icon: "cloud-sun" };
  }

  const REPORT_SECTIONS = [
    { key: "itinerary", icon: "route", title: "Suggested Itinerary" },
    { key: "thingsToDo", icon: "activity", title: "Things To Do" },
    { key: "foodTip", icon: "bed", title: "Food Tip" },
    { key: "sustainabilityTip", icon: "leaf", title: "Travel Responsibly" },
  ];

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    const params = new URLSearchParams(window.location.search);
    const place = {
      title: params.get("name") || "",
      tag: params.get("tag") || "",
      category: params.get("category") || "",
      grad: params.get("grad") || "linear-gradient(135deg,#1c5f78,#2a8fae 70%)",
      video: params.get("video") || "",
    };

    const main = document.getElementById("placeMain");
    if (!place.title) {
      main.innerHTML = `<p class="place-loading">No destination specified. <a href="index.html">Go back home</a>.</p>`;
      return;
    }

    document.title = place.title + " — EcoVillage Trails";
    renderShell(main, place);
    if (window.Icons) window.Icons.hydrate(main);

    loadGallery(place);
    loadWeather(place);
    loadReport(place);
  }

  function renderShell(main, place) {
    main.innerHTML = `
      <section class="place-hero" style="background:${place.grad}">
        ${place.video ? `<video autoplay muted loop playsinline class="place-hero-video"><source src="assets/${place.video}" type="video/mp4"></video>` : ""}
        <div class="place-hero-shade"></div>
        <div class="place-hero-body">
          <span class="feed-tag">${escapeHtml(place.tag || place.category)}</span>
          <h1>${escapeHtml(place.title)}</h1>
          <a class="btn btn-primary" href="book.html?${bookParams(place)}">
            <span class="h-icon" data-icon="route" data-icon-size="15"></span> Book Your Stay & Travel
          </a>
        </div>
      </section>

      <div class="place-body">
        <section class="place-section" id="placeOverview">
          <p class="place-loading"><span class="lu-spinner"></span> Writing your AI trip report...</p>
        </section>

        <section class="place-section" id="placeWeather">
          <h2><span class="h-icon" data-icon="cloud-sun" data-icon-size="18"></span> Weather</h2>
          <p class="place-loading"><span class="lu-spinner"></span> Fetching live weather...</p>
        </section>

        <section class="place-section" id="placeGallery">
          <h2><span class="h-icon" data-icon="compass" data-icon-size="18"></span> Photos</h2>
          <p class="place-loading"><span class="lu-spinner"></span> Finding real photos of ${escapeHtml(place.title)}...</p>
        </section>
      </div>
    `;
  }

  function bookParams(place) {
    return new URLSearchParams({ place: place.title, region: place.category }).toString();
  }

  // ---------------------------------------------------------------
  // AI trip-plan report
  // ---------------------------------------------------------------
  async function loadReport(place) {
    const el = document.getElementById("placeOverview");
    try {
      const res = await fetch("/api/place-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "detail", name: place.title, tag: place.tag, category: place.category }),
      });
      const data = await res.json();
      if (!data.success) throw new Error("AI report failed");

      const highlightsHtml = (data.highlights || []).map((h) => `<span>${escapeHtml(h)}</span>`).join("");
      const sectionsHtml = REPORT_SECTIONS.map((def) => {
        const value = data[def.key];
        if (!value || (Array.isArray(value) && value.length === 0)) return "";
        const body = Array.isArray(value)
          ? `<ul>${value.map((v) => `<li>${escapeHtml(v)}</li>`).join("")}</ul>`
          : `<p>${escapeHtml(value)}</p>`;
        return `<div class="report-card"><h4><span class="h-icon" data-icon="${def.icon}" data-icon-size="15"></span> ${def.title}</h4>${body}</div>`;
      }).join("");

      el.innerHTML = `
        <h2>About ${escapeHtml(place.title)}</h2>
        <p class="place-overview-text">${escapeHtml(data.overview || data.description || "")}</p>
        <div class="modal-tags">${highlightsHtml}</div>
        <div class="hg-modal-meta">
          ${data.bestSeason ? `<div><strong>Best season:</strong> ${escapeHtml(data.bestSeason)}</div>` : ""}
          ${data.howToReach ? `<div><strong>How to reach:</strong> ${escapeHtml(data.howToReach)}</div>` : ""}
        </div>
        <h2 style="margin-top:26px;">Your AI Trip Plan</h2>
        <div class="report-cards-grid">${sectionsHtml}</div>
        <p class="hg-ai-note"><span class="h-icon" data-icon="sparkle" data-icon-size="12"></span> Written by AI — details may vary, please verify before you travel.</p>
      `;
      if (window.Icons) window.Icons.hydrate(el);
    } catch (err) {
      console.error(err);
      el.innerHTML = `<p class="hg-ai-error">Couldn't generate the trip report right now. Please refresh to try again.</p>`;
    }
  }

  // ---------------------------------------------------------------
  // Photo gallery
  // ---------------------------------------------------------------
  async function loadGallery(place) {
    const el = document.getElementById("placeGallery");
    try {
      const res = await fetch("/api/place-gallery?name=" + encodeURIComponent(place.title));
      const data = await res.json();
      const images = (data.images || []).filter(Boolean);

      if (images.length === 0) {
        el.innerHTML = `
          <h2><span class="h-icon" data-icon="compass" data-icon-size="18"></span> Photos</h2>
          <p class="place-muted">No additional photos found for this place yet.</p>
        `;
        return;
      }

      el.innerHTML = `
        <h2><span class="h-icon" data-icon="compass" data-icon-size="18"></span> Photos <span class="place-photo-count">(${images.length})</span></h2>
        <div class="place-gallery-grid">
          ${images.map((src) => `<a href="${src}" target="_blank" rel="noopener noreferrer" class="place-gallery-item"><img src="${src}" loading="lazy" alt="Photo of ${escapeHtml(place.title)}"></a>`).join("")}
        </div>
      `;
      if (window.Icons) window.Icons.hydrate(el);
    } catch (err) {
      console.error(err);
      el.innerHTML = `<p class="place-muted">Couldn't load photos right now.</p>`;
    }
  }

  // ---------------------------------------------------------------
  // Weather (geocode the place name, then fetch forecast)
  // ---------------------------------------------------------------
  async function loadWeather(place) {
    const el = document.getElementById("placeWeather");
    try {
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(place.title)}&count=1&language=en&format=json`
      );
      const geoData = await geoRes.json();
      const loc = geoData.results?.[0];
      if (!loc) throw new Error("No location match");

      const wxRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}` +
          `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m` +
          `&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max&timezone=auto`
      );
      const wx = await wxRes.json();
      const info = codeInfo(wx.current.weather_code);

      const forecastHtml = wx.daily.time
        .slice(0, 5)
        .map((dateStr, i) => {
          const d = new Date(dateStr);
          const dayLabel = i === 0 ? "Today" : d.toLocaleDateString(undefined, { weekday: "short" });
          const dInfo = codeInfo(wx.daily.weather_code[i]);
          return `
            <div class="wx-day">
              <span class="wx-day-label">${dayLabel}</span>
              <span class="wx-day-icon">${window.Icons ? window.Icons.get(dInfo.icon, 20) : ""}</span>
              <span class="wx-day-temps"><strong>${Math.round(wx.daily.temperature_2m_max[i])}°</strong> / ${Math.round(wx.daily.temperature_2m_min[i])}°</span>
            </div>
          `;
        })
        .join("");

      el.innerHTML = `
        <h2><span class="h-icon" data-icon="cloud-sun" data-icon-size="18"></span> Weather in ${escapeHtml(loc.name)}</h2>
        <div class="wx-current">
          <div class="wx-current-icon">${window.Icons ? window.Icons.get(info.icon, 44) : ""}</div>
          <div class="wx-current-main">
            <div class="wx-current-temp">${Math.round(wx.current.temperature_2m)}°C</div>
            <div class="wx-current-label">${escapeHtml(info.label)} · feels like ${Math.round(wx.current.apparent_temperature)}°C</div>
          </div>
        </div>
        <div class="wx-forecast-strip">${forecastHtml}</div>
      `;
      if (window.Icons) window.Icons.hydrate(el);
    } catch (err) {
      console.error(err);
      el.innerHTML = `
        <h2><span class="h-icon" data-icon="cloud-sun" data-icon-size="18"></span> Weather</h2>
        <p class="place-muted">Live weather isn't available for this exact place right now.</p>
      `;
      if (window.Icons) window.Icons.hydrate(el);
    }
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }
})();
