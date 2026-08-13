/* =====================================================================
   js/weather.js
   Asks for the visitor's location once, shows a live temperature pill in
   the navbar, and opens a full "weather app" style broadcast (current
   conditions, hourly strip, 24h temp/rain graph, air quality, wind,
   humidity, sun hours and a mini map) when clicked.

   The broadcast re-themes its background gradient to match live
   conditions (clear / cloudy / rain / storm / snow / fog, day or night).

   Data sources (all free, no API key required):
   - Open-Meteo forecast API      -> temperature, wind, humidity, rain...
   - Open-Meteo air-quality API   -> US AQI
   - BigDataCloud reverse-geocode -> place name for display
   - OpenStreetMap embed          -> mini location map
   ===================================================================== */

(function () {
  /* ---------------------------------------------------------------
     WMO weather codes -> label + icon (day/night aware) + theme
     --------------------------------------------------------------- */
  const WEATHER_CODES = {
    0: { label: "Clear sky", icon: "sun", nightIcon: "moon", theme: "clear" },
    1: { label: "Mainly clear", icon: "sun", nightIcon: "moon", theme: "clear" },
    2: { label: "Partly cloudy", icon: "cloud-sun", nightIcon: "cloud-moon", theme: "cloudy" },
    3: { label: "Overcast", icon: "cloud", nightIcon: "cloud", theme: "cloudy" },
    45: { label: "Fog", icon: "cloud", nightIcon: "cloud", theme: "fog" },
    48: { label: "Depositing rime fog", icon: "cloud", nightIcon: "cloud", theme: "fog" },
    51: { label: "Light drizzle", icon: "cloud-rain", nightIcon: "cloud-rain", theme: "rain" },
    53: { label: "Drizzle", icon: "cloud-rain", nightIcon: "cloud-rain", theme: "rain" },
    55: { label: "Dense drizzle", icon: "cloud-rain", nightIcon: "cloud-rain", theme: "rain" },
    61: { label: "Light rain", icon: "cloud-rain", nightIcon: "cloud-rain", theme: "rain" },
    63: { label: "Rain", icon: "cloud-rain", nightIcon: "cloud-rain", theme: "rain" },
    65: { label: "Heavy rain", icon: "cloud-rain", nightIcon: "cloud-rain", theme: "rain" },
    71: { label: "Light snow", icon: "snow", nightIcon: "snow", theme: "snow" },
    73: { label: "Snow", icon: "snow", nightIcon: "snow", theme: "snow" },
    75: { label: "Heavy snow", icon: "snow", nightIcon: "snow", theme: "snow" },
    80: { label: "Rain showers", icon: "cloud-rain", nightIcon: "cloud-rain", theme: "rain" },
    81: { label: "Rain showers", icon: "cloud-rain", nightIcon: "cloud-rain", theme: "rain" },
    82: { label: "Violent rain showers", icon: "cloud-rain", nightIcon: "cloud-rain", theme: "rain" },
    95: { label: "Thunderstorm", icon: "alert", nightIcon: "alert", theme: "storm" },
    96: { label: "Thunderstorm with hail", icon: "alert", nightIcon: "alert", theme: "storm" },
    99: { label: "Thunderstorm with hail", icon: "alert", nightIcon: "alert", theme: "storm" },
  };
  function codeInfo(code, isDay) {
    const info = WEATHER_CODES[code] || { label: "—", icon: "cloud-sun", nightIcon: "cloud-moon", theme: "cloudy" };
    return {
      label: info.label,
      icon: isDay === 0 ? info.nightIcon : info.icon,
      theme: info.theme === "clear" ? (isDay === 0 ? "clear-night" : "clear-day") : info.theme,
    };
  }

  let lastData = null;
  let lastAQI = null;
  let lastPlaceName = "";
  let lastLat = null;
  let lastLon = null;

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    const btn = document.getElementById("navWeatherBtn");
    if (!btn) return;

    btn.addEventListener("click", () => openBroadcast());

    const closeBtn = document.getElementById("weatherModalClose");
    const overlay = document.getElementById("weatherModalOverlay");
    if (closeBtn && overlay) {
      closeBtn.addEventListener("click", () => overlay.classList.remove("open"));
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) overlay.classList.remove("open");
      });
    }

    if (!("geolocation" in navigator)) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => loadWeather(pos.coords.latitude, pos.coords.longitude),
      () => {
        // Permission denied or unavailable — fail silently, widget just stays hidden
        console.info("Location not available — weather widget hidden.");
      },
      { timeout: 8000, maximumAge: 30 * 60 * 1000 }
    );
  }

  async function loadWeather(lat, lon) {
    lastLat = lat;
    lastLon = lon;
    try {
      const [weatherRes, aqiRes, placeRes] = await Promise.all([
        fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
            `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,` +
            `wind_speed_10m,wind_gusts_10m,wind_direction_10m,surface_pressure,is_day` +
            `&hourly=temperature_2m,weather_code,precipitation_probability,visibility,uv_index,dew_point_2m,surface_pressure` +
            `&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max,sunrise,sunset,uv_index_max` +
            `&timezone=auto`
        ),
        fetch(
          `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi&timezone=auto`
        ).catch(() => null),
        fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`).catch(
          () => null
        ),
      ]);

      const data = await weatherRes.json();
      lastData = data;

      if (aqiRes) {
        try {
          lastAQI = await aqiRes.json();
        } catch {
          lastAQI = null;
        }
      }

      if (placeRes) {
        try {
          const place = await placeRes.json();
          lastPlaceName = place.city || place.locality || place.principalSubdivision || "";
        } catch {
          lastPlaceName = "";
        }
      }

      renderNavPill(data);
    } catch (err) {
      console.error("Weather fetch failed:", err);
    }
  }

  function renderNavPill(data) {
    const btn = document.getElementById("navWeatherBtn");
    const iconEl = document.getElementById("navWeatherIcon");
    const tempEl = document.getElementById("navWeatherTemp");
    if (!btn || !data.current) return;

    const info = codeInfo(data.current.weather_code, data.current.is_day);
    iconEl.innerHTML = window.Icons ? window.Icons.get(info.icon, 15) : "";
    tempEl.textContent = Math.round(data.current.temperature_2m) + "°C";
    btn.style.display = "inline-flex";
  }

  /* ---------------------------------------------------------------
     Small helpers
     --------------------------------------------------------------- */
  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }

  function fmtHour(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString(undefined, { hour: "numeric" }).replace(" ", "");
  }

  function fmtClock(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }

  function beaufort(kmh) {
    const table = [
      [1, "Calm"], [5, "Light air"], [11, "Light breeze"], [19, "Gentle breeze"],
      [28, "Moderate breeze"], [38, "Fresh breeze"], [49, "Strong breeze"],
      [61, "High wind"], [74, "Gale"], [88, "Severe gale"], [102, "Storm"],
      [117, "Violent storm"], [Infinity, "Hurricane"],
    ];
    for (let i = 0; i < table.length; i++) {
      if (kmh <= table[i][0]) return { force: i, label: table[i][1] };
    }
    return { force: 12, label: "Hurricane" };
  }

  function visibilityInfo(km) {
    if (km >= 10) return "Excellent";
    if (km >= 4) return "Good";
    if (km >= 1) return "Moderate";
    return "Poor";
  }

  function uvInfo(uv) {
    if (uv <= 2) return "Low";
    if (uv <= 5) return "Moderate";
    if (uv <= 7) return "High";
    if (uv <= 10) return "Very High";
    return "Extreme";
  }

  function aqiInfo(aqi) {
    if (aqi == null) return { label: "—", color: "#9aa5a0" };
    if (aqi <= 50) return { label: "Good", color: "#1f8a5a" };
    if (aqi <= 100) return { label: "Moderate", color: "#f0ad2e" };
    if (aqi <= 150) return { label: "Unhealthy (sensitive)", color: "#e1672e" };
    if (aqi <= 200) return { label: "Unhealthy", color: "#d64545" };
    if (aqi <= 300) return { label: "Very Unhealthy", color: "#8b3fa8" };
    return { label: "Hazardous", color: "#7a2137" };
  }

  function icon(name, size) {
    return window.Icons ? window.Icons.get(name, size || 16) : "";
  }

  /* ---------------------------------------------------------------
     Broadcast rendering
     --------------------------------------------------------------- */
  function openBroadcast() {
    const overlay = document.getElementById("weatherModalOverlay");
    const box = overlay ? overlay.querySelector(".modal-box") : null;
    const content = document.getElementById("weatherModalContent");
    if (!overlay || !content || !lastData || !lastData.current) return;

    const cur = lastData.current;
    const daily = lastData.daily;
    const hourly = lastData.hourly;
    const info = codeInfo(cur.weather_code, cur.is_day);

    // strip any previous theme class, apply the live one
    if (box) {
      box.className = "modal-box weather-modal-box";
    }

    content.innerHTML =
      `<div class="wxb-sheet wxb-theme-${info.theme}">` +
      renderHeader() +
      renderHero(cur, info) +
      renderHourlyStrip(hourly) +
      renderGraph(hourly) +
      renderGrid(cur, hourly, daily) +
      renderAnalysis(cur, hourly, daily, info) +
      `</div>`;

    if (window.Icons) window.Icons.hydrate(content);
    overlay.classList.add("open");
  }

  function renderHeader() {
    return `
      <div class="wxb-header">
        ${icon("map-pin", 17)}
        <span>${escapeHtml(lastPlaceName || "Your location")}</span>
      </div>
    `;
  }

  function renderHero(cur, info) {
    const feelsDelta = Math.round(cur.apparent_temperature) - Math.round(cur.temperature_2m);
    let feelsNote = "Feels about the same";
    if (feelsDelta >= 2) feelsNote = `Feels ${feelsDelta}° warmer`;
    else if (feelsDelta <= -2) feelsNote = `Feels ${Math.abs(feelsDelta)}° cooler`;
    return `
      <div class="wxb-hero">
        <div class="wxb-hero-icon">${icon(info.icon, 96)}</div>
        <div style="text-align:right;">
          <div class="wxb-hero-temp">${Math.round(cur.temperature_2m)}°</div>
          <div class="wxb-hero-sub">${escapeHtml(info.label)} · ${feelsNote}</div>
        </div>
      </div>
    `;
  }

  function renderHourlyStrip(hourly) {
    if (!hourly || !hourly.time) return "";
    const nowIdx = nearestIndex(hourly.time);
    const slots = [];
    for (let i = 0; i < 5 && nowIdx + i < hourly.time.length; i++) {
      const idx = nowIdx + i;
      const hInfo = codeInfo(hourly.weather_code[idx], 1);
      slots.push(`
        <div class="wxb-hour">
          <span class="wxb-hour-time">${i === 0 ? "Now" : fmtHour(hourly.time[idx])}</span>
          <span class="wxb-hour-icon">${icon(hInfo.icon, 20)}</span>
          <span class="wxb-hour-temp">${Math.round(hourly.temperature_2m[idx])}°</span>
        </div>
      `);
    }
    return `<div class="wxb-hourly">${slots.join("")}</div>`;
  }

  function nearestIndex(timeArr) {
    const now = new Date();
    for (let i = 0; i < timeArr.length; i++) {
      if (new Date(timeArr[i]) >= now) return Math.max(0, i);
    }
    return 0;
  }

  function renderGraph(hourly) {
    if (!hourly || !hourly.time) return "";
    const startIdx = nearestIndex(hourly.time);
    const points = [];
    for (let i = 0; i < 8; i++) {
      const idx = startIdx + i * 3;
      if (idx >= hourly.time.length) break;
      points.push({
        time: hourly.time[idx],
        temp: hourly.temperature_2m[idx],
        rain: hourly.precipitation_probability ? hourly.precipitation_probability[idx] : 0,
      });
    }
    if (points.length < 2) return "";

    const w = 320, h = 90, pad = 18;
    const temps = points.map((p) => p.temp);
    const min = Math.min(...temps), max = Math.max(...temps);
    const range = Math.max(max - min, 1);
    const stepX = (w - pad * 2) / (points.length - 1);

    const coords = points.map((p, i) => {
      const x = pad + i * stepX;
      const y = pad + (1 - (p.temp - min) / range) * (h - pad * 2 - 14) + 8;
      return { x, y, p };
    });

    const linePath = coords.map((c, i) => (i === 0 ? `M${c.x},${c.y}` : `L${c.x},${c.y}`)).join(" ");
    const areaPath = `${linePath} L${coords[coords.length - 1].x},${h} L${coords[0].x},${h} Z`;

    const tempLabels = coords
      .map((c) => `<text x="${c.x}" y="${c.y - 8}" text-anchor="middle" font-size="10" font-weight="700" fill="var(--ink)">${Math.round(c.p.temp)}°</text>`)
      .join("");

    const timeLabels = coords
      .map((c) => {
        const d = new Date(c.p.time);
        const label = d.toLocaleTimeString(undefined, { hour: "numeric" }).replace(" ", "").replace(":00", "");
        return `<span>${label}</span>`;
      })
      .join("");

    const rainLabels = coords
      .map((c) => `<span>${icon("droplet", 10)} ${c.p.rain ?? 0}%</span>`)
      .join("");

    return `
      <div class="wxb-graph">
        <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
          <defs>
            <linearGradient id="wxbGraphFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="var(--orange)" stop-opacity="0.35"/>
              <stop offset="100%" stop-color="var(--orange)" stop-opacity="0"/>
            </linearGradient>
          </defs>
          <path d="${areaPath}" fill="url(#wxbGraphFill)"/>
          <path d="${linePath}" fill="none" stroke="var(--orange)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          ${tempLabels}
        </svg>
        <div class="wxb-graph-rain">${rainLabels}</div>
        <div class="wxb-graph-times">${timeLabels}</div>
      </div>
    `;
  }

  function renderGrid(cur, hourly, daily) {
    const nowIdx = hourly && hourly.time ? nearestIndex(hourly.time) : 0;
    const visKm = hourly && hourly.visibility ? hourly.visibility[nowIdx] / 1000 : null;
    const uv = hourly && hourly.uv_index ? hourly.uv_index[nowIdx] : (daily ? daily.uv_index_max[0] : null);
    const dewPoint = hourly && hourly.dew_point_2m ? hourly.dew_point_2m[nowIdx] : null;

    // pressure trend from hourly series (compare to 3h ago if we have it)
    let trendLabel = "Steady";
    if (hourly && hourly.surface_pressure) {
      const pastIdx = Math.max(0, nowIdx - 3);
      const delta = cur.surface_pressure - hourly.surface_pressure[pastIdx];
      const mag = Math.abs(delta) >= 3 ? "quickly" : "slowly";
      if (delta >= 1) trendLabel = `Rising ${mag}`;
      else if (delta <= -1) trendLabel = `Falling ${mag}`;
      else trendLabel = "Steady";
    }
    const pressurePct = Math.min(100, Math.max(0, ((cur.surface_pressure - 970) / (1050 - 970)) * 100));

    const aqiVal = lastAQI && lastAQI.current ? lastAQI.current.us_aqi : null;
    const aqiC = aqiInfo(aqiVal);
    const aqiPct = aqiVal != null ? Math.min(100, (aqiVal / 300) * 100) : 0;

    const beauf = beaufort(cur.wind_speed_10m);
    const windRotation = ((cur.wind_direction_10m || 0) + 180) % 360;

    const humidity = cur.relative_humidity_2m;
    const humidityBars = Array.from({ length: 8 }, (_, i) => {
      const filled = i < Math.round((humidity / 100) * 8);
      const height = 10 + i * 4;
      return `<span class="${filled ? "filled" : ""}" style="height:${height}px;"></span>`;
    }).join("");

    let sunHtml = "";
    if (daily && daily.sunrise && daily.sunset) {
      const sunrise = new Date(daily.sunrise[0]);
      const sunset = new Date(daily.sunset[0]);
      const now = new Date();
      const total = sunset - sunrise;
      const elapsed = Math.min(Math.max(now - sunrise, 0), total);
      const pct = total > 0 ? elapsed / total : 0;
      const dayMs = sunset - sunrise;
      const hrs = Math.floor(dayMs / 3600000);
      const mins = Math.round((dayMs % 3600000) / 60000);
      const cx = 6 + pct * 68;
      const cy = 34 - Math.sin(pct * Math.PI) * 30;
      sunHtml = `
        <svg class="wxb-sun-arc" viewBox="0 0 80 40">
          <path d="M6,34 Q40,-6 74,34" fill="none" stroke="var(--line)" stroke-width="2"/>
          <path d="M6,34 Q40,-6 74,34" fill="none" stroke="var(--orange)" stroke-width="2"
            stroke-dasharray="110" stroke-dashoffset="${110 - pct * 110}" stroke-linecap="round"/>
          <circle cx="${cx}" cy="${cy}" r="4" fill="var(--orange)"/>
        </svg>
        <div class="wxb-sun-time">${hrs}h ${mins}m</div>
        <div class="wxb-sun-range"><span>${fmtClock(daily.sunrise[0])}</span><span>${fmtClock(daily.sunset[0])}</span></div>
      `;
    }

    const mapHtml =
      lastLat != null
        ? `
        <iframe class="wxb-map-frame" loading="lazy" tabindex="-1"
          src="https://www.openstreetmap.org/export/embed.html?bbox=${lastLon - 0.06}%2C${lastLat - 0.04}%2C${lastLon + 0.06}%2C${lastLat + 0.04}&layer=mapnik&marker=${lastLat}%2C${lastLon}"></iframe>
        <a class="wxb-map-btn" href="https://www.openstreetmap.org/?mlat=${lastLat}&mlon=${lastLon}#map=12/${lastLat}/${lastLon}" target="_blank" rel="noopener">
          ${icon("map", 11)} Larger map
        </a>`
        : "";

    return `
      <div class="wxb-grid">
        <div class="wxb-card wxb-card-vis">
          <div class="wxb-card-label"><span>Visibility</span>${icon("eye", 13)}</div>
          <div class="wxb-card-value">${visKm != null ? visKm.toFixed(1) + " km" : "—"}</div>
          <div class="wxb-card-sub">${visKm != null ? visibilityInfo(visKm) : ""}</div>
        </div>

        <div class="wxb-card wxb-card-pressure">
          <div class="wxb-card-label"><span>Pressure</span>${icon("gauge", 13)}</div>
          <div class="wxb-card-value">${Math.round(cur.surface_pressure)} <span style="font-size:11px;font-weight:600;">mb</span></div>
          <div class="wxb-pressure-track"><span class="wxb-pressure-dot" style="left:${pressurePct}%;"></span></div>
          <div class="wxb-card-sub">${trendLabel}</div>
        </div>

        <div class="wxb-card wxb-card-aqi">
          <div class="wxb-card-label"><span>AQI</span></div>
          <div class="wxb-gauge">
            <div>
              <div class="wxb-card-value">${aqiVal != null ? Math.round(aqiVal) : "—"}</div>
              <div class="wxb-card-sub" style="color:${aqiC.color};font-weight:600;">${aqiC.label}</div>
            </div>
            <svg width="34" height="34" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="var(--line)" stroke-width="4"/>
              <circle cx="18" cy="18" r="15" fill="none" stroke="${aqiC.color}" stroke-width="4"
                stroke-dasharray="94" stroke-dashoffset="${94 - (aqiPct / 100) * 94}" stroke-linecap="round" transform="rotate(-90 18 18)"/>
            </svg>
          </div>
        </div>

        <div class="wxb-card wxb-card-uv">
          <div class="wxb-card-label"><span>UV</span></div>
          <div class="wxb-card-value">${uv != null ? Math.round(uv) : "—"}</div>
          <div class="wxb-card-sub">${uv != null ? uvInfo(uv) : ""}</div>
        </div>

        <div class="wxb-card wxb-card-wind">
          <div class="wxb-card-label"><span>Wind</span>${icon("wind", 13)}</div>
          <div class="wxb-wind-compass">
            <svg viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="var(--line)" stroke-width="2"/>
              <text x="40" y="12" text-anchor="middle" font-size="9" fill="var(--ink-soft)">N</text>
              <text x="40" y="74" text-anchor="middle" font-size="9" fill="var(--ink-soft)">S</text>
              <text x="8" y="43" text-anchor="middle" font-size="9" fill="var(--ink-soft)">W</text>
              <text x="72" y="43" text-anchor="middle" font-size="9" fill="var(--ink-soft)">E</text>
              <g transform="rotate(${windRotation} 40 40)">
                <path d="M40 16 L46 42 L40 36 L34 42 Z" fill="var(--blue-deep)"/>
              </g>
            </svg>
          </div>
          <div class="wxb-wind-stats">
            <div><span>Speed</span><strong>${Math.round(cur.wind_speed_10m)} km/h</strong></div>
            <div><span>Gusts</span><strong>${Math.round(cur.wind_gusts_10m || 0)} km/h</strong></div>
          </div>
          <div class="wxb-wind-force">Force ${beauf.force} (${beauf.label})</div>
        </div>

        <div class="wxb-card wxb-card-map">${mapHtml}</div>

        <div class="wxb-card wxb-card-humidity">
          <div class="wxb-card-label"><span>Humidity</span>${icon("droplet", 13)}</div>
          <div class="wxb-humidity-bars">${humidityBars}</div>
          <div class="wxb-humidity-value">${humidity}%</div>
          <div class="wxb-card-sub">${dewPoint != null ? "Dew point " + Math.round(dewPoint) + "°" : ""} · ${humidity >= 70 ? "Very humid" : humidity >= 40 ? "Comfortable" : "Dry"}</div>
        </div>

        <div class="wxb-card wxb-card-sun">
          <div class="wxb-card-label"><span>Sun hours</span>${icon("sunrise", 13)}</div>
          ${sunHtml}
        </div>
      </div>
    `;
  }

  function renderAnalysis(cur, hourly, daily, info) {
    const place = lastPlaceName || "your area";
    const temp = Math.round(cur.temperature_2m);
    const feels = Math.round(cur.apparent_temperature);
    const maxRain = daily && daily.precipitation_probability_max ? daily.precipitation_probability_max[0] : 0;
    const uv = daily && daily.uv_index_max ? Math.round(daily.uv_index_max[0]) : null;
    const beauf = beaufort(cur.wind_speed_10m);

    let p1 = `It's currently ${escapeHtml(info.label).toLowerCase()} in ${escapeHtml(place)} at ${temp}°C, feeling closer to ${feels}°C. `;
    if (maxRain >= 60) p1 += `There's a high ${maxRain}% chance of rain today, so an umbrella or waterproof layer is worth packing.`;
    else if (maxRain >= 30) p1 += `There's a moderate ${maxRain}% chance of rain, so it may be worth keeping a light rain jacket handy.`;
    else p1 += `Rain is unlikely today, at around a ${maxRain}% chance.`;

    let p2 = `Winds are ${beauf.label.toLowerCase()} at ${Math.round(cur.wind_speed_10m)} km/h. `;
    if (uv != null) {
      if (uv >= 6) p2 += `UV is ${uvInfo(uv).toLowerCase()} today (index ${uv}) — sunscreen and shade are a good idea if you're heading outdoors.`;
      else if (uv >= 3) p2 += `UV is ${uvInfo(uv).toLowerCase()} (index ${uv}), so light sun protection is enough for most of the day.`;
      else p2 += `UV is low (index ${uv}), so sun exposure isn't a major concern today.`;
    }

    return `
      <div class="wxb-analysis">
        <h4>${icon("sparkle", 13)} AI Analysis of the weather</h4>
        <p>${p1}</p>
        <p>${p2}</p>
      </div>
    `;
  }
})();
