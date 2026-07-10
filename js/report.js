const raw = sessionStorage.getItem("ecoTripReport");

if (!raw) {
  document.getElementById("reportRoot").innerHTML = `
    <div class="empty-state">
      <p>No trip report found. Please generate one from the <a href="index.html#planner">AI Planner</a> first.</p>
    </div>`;
} else {
  render(JSON.parse(raw));
}

function escapeHtml(s){
  return (s || "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function nl2br(s){ return escapeHtml(s).replace(/\n/g,"<br>"); }

function splitSections(markdown) {
  const lines = (markdown || "").split(/\r?\n/);
  const sections = [];
  let current = { title: null, body: [] };
  lines.forEach(line => {
    const m = line.match(/^##\s+(.*)/);
    if (m) { sections.push(current); current = { title: m[1].trim(), body: [] }; }
    else current.body.push(line);
  });
  sections.push(current);
  return sections.map(s => ({ title: s.title, text: s.body.join("\n").trim() }));
}
function findSection(sections, patterns) {
  for (const p of patterns) {
    const found = sections.find(s => s.title && p.test(s.title));
    if (found) return found.text;
  }
  return null;
}
function extractListItems(text) {
  if (!text) return [];
  return text.split(/\r?\n/).map(l => l.trim())
    .filter(l => /^[-*•]\s+/.test(l) || /^\d+[.)]\s+/.test(l))
    .map(l => l.replace(/^[-*•]\s+/, "").replace(/^\d+[.)]\s+/, "").trim())
    .filter(Boolean);
}

function render(data) {
  const sections = splitSections(data.markdown);
  const fd = data.formData || {};
  const trip = fd.trip || {};
  const destination = data.destination || trip.destination || "Your Destination";
  const today = new Date();
  const startDate = trip.travelDate ? new Date(trip.travelDate) : null;
  const daysCount = parseInt(trip.days) || (extractDaySections(data.markdown).length) || 5;
  const countdown = startDate ? Math.max(0, Math.ceil((startDate - today) / 86400000)) : "—";

  const basicDesc = findSection(sections, [/overview/i, /tour plan/i, /itinerary summary/i, /summary/i])
    || sections.find(s => !s.title && s.text)?.text
    || `A ${daysCount}-day sustainable trip to ${destination}, tailored to your preferences.`;

  const artSectionText = findSection(sections, [/art\s*&?\s*architecture/i, /heritage/i, /monuments/i]);
  const artPlaces = extractListItems(artSectionText).length ? extractListItems(artSectionText) : defaultArtPlaces(destination);

  const guideText = findSection(sections, [/local guide/i, /local contact/i, /guide/i]);
  const foodText = findSection(sections, [/food/i, /cuisine/i, /dish/i, /eat/i]);
  const pricesText = findSection(sections, [/local price/i, /price guide/i, /cost guide/i, /budget/i]);
  const dayData = extractDaySections(data.markdown, daysCount);

  const mapQuery = encodeURIComponent(`${destination} tourist attractions`);
  const weatherQuery = encodeURIComponent(destination);

  document.getElementById("reportRoot").innerHTML = `

  <!-- ================= ZONE 1: DASHBOARD ================= -->
  <div class="zone1-banner">
    <svg class="deco" viewBox="0 0 1200 300" preserveAspectRatio="none">
      <path d="M0 220 Q300 150 600 210 T1200 190 V300 H0 Z" fill="#bfe0c9" opacity=".6"/>
      <path d="M0 260 Q300 210 600 250 T1200 240 V300 H0 Z" fill="#9ad19e" opacity=".7"/>
    </svg>
    <h1>My <em>Travel</em> Plan</h1>
    <p>Your personalized itinerary for ${escapeHtml(destination)}</p>
  </div>

  <div class="stat-row">
    <div class="stat-card"><div class="label">Today's Date</div><div class="value">${today.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}</div></div>
    <div class="stat-card"><div class="label">Trip Countdown</div><div class="value">${countdown}${countdown!=="—" ? " days left" : ""}</div></div>
    <div class="stat-card"><div class="label">Destination</div><div class="value">${escapeHtml(destination)}</div></div>
    <div class="stat-card"><div class="label">Travellers</div><div class="value">${escapeHtml(trip.travellers || "—")} people</div></div>
  </div>

  <div class="container">
    <div class="dash-grid">
      <div class="panel">
        <div class="panel-head">Trip Details</div>
        <div class="panel-body">
          <div class="kv-row"><span>Starting city</span><b>${escapeHtml(trip.startingCity || "—")}</b></div>
          <div class="kv-row"><span>Travel date</span><b>${escapeHtml(trip.travelDate || "—")}</b></div>
          <div class="kv-row"><span>Return date</span><b>${escapeHtml(trip.returnDate || "—")}</b></div>
          <div class="kv-row"><span>No. of days</span><b>${escapeHtml(String(daysCount))}</b></div>
          <div class="kv-row"><span>Transport</span><b>${escapeHtml(trip.transport || "—")}</b></div>
        </div>
      </div>
      <div class="panel">
        <div class="panel-head">Travellers</div>
        <div class="panel-body">
          <div class="kv-row"><span>Adults</span><b>${escapeHtml(trip.adults || "0")}</b></div>
          <div class="kv-row"><span>Children</span><b>${escapeHtml(trip.children || "0")}</b></div>
          <div class="kv-row"><span>Seniors</span><b>${escapeHtml(trip.seniors || "0")}</b></div>
          <div class="kv-row"><span>Budget tier</span><b>${escapeHtml((fd.budget && fd.budget.budget) || "—")}</b></div>
          <div class="kv-row"><span>Accommodation</span><b>${escapeHtml((fd.budget && fd.budget.accommodation) || "—")}</b></div>
        </div>
      </div>
    </div>

    <div class="dash-grid">
      <div class="panel">
        <div class="panel-head">Where a Typical Budget Goes</div>
        <div class="panel-body">
          <div class="donut-wrap">
            <div class="donut"></div>
            <div class="donut-legend">
              <div><span class="dot" style="background:var(--green-deep);"></span>Stay — 30%</div>
              <div><span class="dot" style="background:var(--green);"></span>Food — 25%</div>
              <div><span class="dot" style="background:var(--yellow);"></span>Transport — 20%</div>
              <div><span class="dot" style="background:var(--orange);"></span>Activities — 15%</div>
              <div><span class="dot" style="background:var(--green-light);"></span>Misc — 10%</div>
            </div>
          </div>
          <p style="font-size:.78rem;color:var(--ink-soft);margin-top:10px;">General guide — actual split depends on your bookings.</p>
        </div>
      </div>
      <div class="panel">
        <div class="panel-head">Estimated Category Guide</div>
        <div class="panel-body">
          <table class="budget-table">
            <tr><th>Category</th><th>Typical share</th></tr>
            <tr><td>Stay</td><td>30%</td></tr>
            <tr><td>Food</td><td>25%</td></tr>
            <tr><td>Transport</td><td>20%</td></tr>
            <tr><td>Activities</td><td>15%</td></tr>
            <tr><td>Misc / buffer</td><td>10%</td></tr>
          </table>
          <div class="bar-compare">
            <div class="bar-row"><span class="bar-label">Stay</span><div class="bar-track"><div class="bar-fill" style="width:30%;background:var(--green-deep);"></div></div></div>
            <div class="bar-row"><span class="bar-label">Food</span><div class="bar-track"><div class="bar-fill" style="width:25%;background:var(--green);"></div></div></div>
            <div class="bar-row"><span class="bar-label">Transport</span><div class="bar-track"><div class="bar-fill" style="width:20%;background:var(--yellow);"></div></div></div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ================= ZONE 2: ITINERARY ================= -->
  <div class="zone2-hero"><h2>Your Itinerary</h2></div>

  <div class="section-pad container">
    <div class="section-label">Day by Day</div>
    <div class="section-title2">${escapeHtml(destination)} — ${daysCount} Day Plan</div>
    <div class="day-row">
      ${dayData.map((d,i) => `
        <div class="day-card">
          <h3>Day ${i+1}</h3>
          <ul>${d.map(item => `<li><b>${escapeHtml(item.time)}</b> ${escapeHtml(item.text)}</li>`).join("")}</ul>
        </div>`).join("")}
    </div>

    <div class="info-grid3">
      <div class="info-card">
        <div class="head green">🧭 Local Guide</div>
        <div class="body">${guideText ? nl2br(guideText) : defaultGuideHtml(destination)}</div>
      </div>
      <div class="info-card">
        <div class="head orange">🍽 Food &amp; Cuisine</div>
        <div class="body">${foodText ? nl2br(foodText) : defaultFoodHtml(destination)}</div>
      </div>
      <div class="info-card clickable" onclick="window.open('https://wttr.in/${weatherQuery}','_blank')">
        <div class="head yellow">☀ Weather When You Reach</div>
        <div class="body">Tap this card to check live weather for ${escapeHtml(destination)} before you travel.</div>
      </div>
    </div>

    <div class="two-col">
      <div class="notes-card">
        <h4>📌 Helpful Notes</h4>
        <ul>
          <li>Carry a reusable water bottle — many eco-stays offer free filtered refills.</li>
          <li>Keep small cash on hand for local markets and homestays.</li>
          <li>Respect local customs, especially near religious and heritage sites.</li>
          <li>Check the weather card above the night before each travel day.</li>
        </ul>
      </div>
      <div class="stay-card">
        <h4>🏡 Suggested Stay</h4>
        <p style="color:var(--ink-soft);font-size:.9rem;line-height:1.6;">
          ${escapeHtml((fd.budget && fd.budget.accommodation) || "Eco-friendly homestay")} in ${escapeHtml(destination)},
          matched to a ${escapeHtml((fd.budget && fd.budget.budget) || "comfortable")} budget.
          Book directly from the Eco-Stay Catalog on the homepage.
        </p>
      </div>
    </div>
  </div>

  <!-- ================= ZONE 3: ACTIONS ================= -->
  <div class="zone3">
    <div class="container">
      <div class="section-label">Take Action</div>
      <h2>Explore &amp; Plan Further</h2>
      <div class="action-grid">
        <div class="action-card" onclick="window.open('https://www.google.com/maps/search/?api=1&query=${mapQuery}','_blank')">
          <div class="icon">🗺️</div><div class="title">Tour Map</div><div class="sub">Open in Google Maps</div>
        </div>
        <div class="action-card" onclick="window.open('https://wttr.in/${weatherQuery}','_blank')">
          <div class="icon">☀️</div><div class="title">Weather</div><div class="sub">Live forecast</div>
        </div>
        <div class="action-card" onclick="window.location.href='index.html#planner'">
          <div class="icon">💬</div><div class="title">Continue Chatting</div><div class="sub">Refine your plan</div>
        </div>
        <div class="action-card" onclick="downloadPdf()">
          <div class="icon">⬇️</div><div class="title">Generate PDF</div><div class="sub">Download this report</div>
        </div>
      </div>

      <div class="art-title">
        <div class="section-label">Art &amp; Architecture</div>
        <h2 style="font-size:1.5rem;">Places worth a closer look</h2>
        <ul class="art-list">${artPlaces.map(p=>`<li>${escapeHtml(p)}</li>`).join("")}</ul>
        <div class="art-grid">
          ${artPlaces.map(p => `
            <div class="art-btn" onclick="openPlaceDetail('${encodeURIComponent(p)}', '${encodeURIComponent(destination)}')">
              Tap to see the art &amp; architecture of<br><b>${escapeHtml(p)}</b>
            </div>`).join("")}
        </div>
      </div>

      <div class="bottom-actions">
        <button class="pill-btn chat" onclick="window.location.href='index.html#planner'">Continue chatting</button>
        <button class="pill-btn pdf" onclick="downloadPdf()">Generate PDF</button>
      </div>
    </div>
  </div>
  `;

  window._reportContext = { destination };
}

function defaultArtPlaces(destination){
  return [
    `${destination} Heritage Museum`,
    "Old Town Terracotta Temples",
    "Riverside Craft Village",
    "Colonial-era Market Square"
  ];
}
function defaultGuideHtml(destination){
  return `No specific guide was listed yet.<br>Ask the AI in chat for a recommended local guide and contact number for ${escapeHtml(destination)}.`;
}
function defaultFoodHtml(destination){
  return `<ul><li>Local thali / regional home-style meals</li><li>Street food near the main market</li><li>Seasonal fruit and local sweets</li></ul>
  <p style="margin-top:8px;">Ask the AI for specific must-try dishes in ${escapeHtml(destination)}.</p>`;
}

// Try to pull "Day 1 / Day 2..." blocks out of the markdown; otherwise return generic placeholders
function extractDaySections(markdown, fallbackCount){
  const text = markdown || "";
  const dayRegex = /day\s*(\d+)[:\-]?\s*([^\n]*)((?:\n(?!day\s*\d+).*)*)/gi;
  const days = [];
  let match;
  while ((match = dayRegex.exec(text)) !== null) {
    const items = match[3].split(/\r?\n/).map(l=>l.trim()).filter(Boolean).slice(0,5);
    days.push(items.length ? items.map(i => ({time:"", text:i})) : [{time:"", text: match[2] || "Explore & relax"}]);
  }
  if (days.length) return days;
  const n = fallbackCount || 3;
  return Array.from({length:n}, (_,i) => ([
    {time:"Morning", text: i===0 ? "Arrival & check-in" : "Guided village walk"},
    {time:"Afternoon", text: "Local sightseeing & activities"},
    {time:"Evening", text: "Community dinner & downtime"}
  ]));
}

async function openPlaceDetail(placeEnc, destinationEnc) {
  const place = decodeURIComponent(placeEnc);
  const destination = decodeURIComponent(destinationEnc);
  const overlay = document.getElementById("placeModalOverlay");
  const body = document.getElementById("placeModalBody");
  body.innerHTML = `<p class="modal-loading">Loading art &amp; architecture of ${escapeHtml(place)}…</p>`;
  overlay.classList.add("show");
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        formData: { aiQuestions: { specialRequests:
          `Give a short, vivid description (150-200 words) of the art and architecture found specifically at ${place}, near ${destination}. Focus only on art and architecture, no general travel tips.` } }
      })
    });
    const result = await res.json();
    body.innerHTML = `<h2>${escapeHtml(place)}</h2><p>${result.success ? nl2br(result.reply) : "Unable to load details right now. Please try again."}</p>`;
  } catch (e) {
    body.innerHTML = `<h2>${escapeHtml(place)}</h2><p>Server error — please try again later.</p>`;
  }
}
document.getElementById("placeModalClose").addEventListener("click", () => {
  document.getElementById("placeModalOverlay").classList.remove("show");
});

function downloadPdf() {
  const el = document.getElementById("reportRoot");
  html2pdf().from(el).set({
    filename: `${(window._reportContext?.destination || "trip")}-report.pdf`,
    margin: 8,
    html2canvas: { scale: 2 }
  }).save();
}
