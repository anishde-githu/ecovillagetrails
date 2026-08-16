/* ---------- AI Planner wizard engine (merged from repo.html) ---------- */
(function () {

 // ---- CONFIG: all chip-group options live here so nothing
 // is hand-typed as repetitive HTML, and so it's easy to add
 // / remove an option later in one place. ----
 const CHIP_OPTIONS = {
 ageGroup: ["Under 18", "18-25", "26-35", "36-50", "51-65", "65+"],
 transport: ["Flight", "Train", "Car", "Bus"],
 budget: ["Economy", "Standard", "Luxury", "Premium"],
 accommodation: ["Homestay", "Eco Cottage", "Eco Resort", "Tree House", "Camping"],
 food: ["Vegetarian", "Vegan", "Non-Vegetarian", "Jain", "Gluten Free", "No Preference"],
 accessibility: ["Wheelchair Friendly", "Elder Friendly", "Child Friendly", "None"],
 fitness: ["Easy", "Moderate", "Adventure"],
 activities: [
 "Village Walk", "Wildlife Safari", "Bird Watching", "Trekking", "Cycling",
 "Camping", "Boating", "Fishing", "Organic Farming", "Cooking Class",
 "Pottery", "Handicrafts", "Photography", "Tribal Dance", "Bonfire",
 "Stargazing", "Nature Trails", "Forest Exploration", "River Activities", "Local Markets",
 "Heritage Walk", "Waterfall Visit", "River Rafting", "Rock Climbing", "Zip-lining",
 "Temple / Monastery Visit", "Spa & Wellness", "Adventure Sports", "Cave Exploration", "Hot Air Ballooning"
 ],
 weather: ["Cool", "Warm", "Rainy", "No Preference"],
 schedule: ["Relaxed", "Balanced", "Packed"],
 photography: ["Sunrise", "Sunset", "Wildlife", "Village Life", "Landscapes", "Festivals", "Night Sky", "Architecture", "Coastline"],
 travelInterests: ["Culture", "Wildlife", "Heritage", "Agriculture", "Local Cuisine", "History", "Festivals", "Handicrafts", "Forest", "Rivers", "Adventure", "Wellness & Relaxation", "Spirituality", "Coastal & Beaches", "Mountains & Hills"]
 };

 const STEP_LABELS = ["Traveller", "Trip", "Budget & Stay", "Activities", "Interests", "AI Questions"];
 const TOTAL_STEPS = 6;
 let currentStep = 1;

 // single source of truth for everything the AI report needs
 const travellerData = {
 personal: {},
 trip: {},
 budget: {},
 activities: [],
 interests: {},
 aiQuestions: {}
 };

 // ---------- RENDER CHIP GROUPS ----------
 function renderChips() {
 document.querySelectorAll(".chip-group").forEach(group => {
 const field = group.getAttribute("data-chip-field");
 const mode = group.getAttribute("data-mode"); // single | multi
 const options = CHIP_OPTIONS[field] || [];

 options.forEach(opt => {
 const chip = document.createElement("div");
 chip.className = "chip";
 chip.textContent = opt;
 chip.setAttribute("data-value", opt);

 chip.addEventListener("click", () => {
 if (mode === "single") {
 group.querySelectorAll(".chip").forEach(c => c.classList.remove("selected"));
 chip.classList.add("selected");
 } else {
 chip.classList.toggle("selected");
 }
 clearFieldError(group.closest(".field"));
 });

 group.appendChild(chip);
 });
 });
 }

 function getChipValue(field) {
 const group = document.querySelector(`.chip-group[data-chip-field="${field}"]`);
 if (!group) return null;
 const selected = group.querySelectorAll(".chip.selected");
 if (group.getAttribute("data-mode") === "multi") {
 return Array.from(selected).map(c => c.getAttribute("data-value"));
 }
 return selected.length ? selected[0].getAttribute("data-value") : "";
 }

 // ---------- PROGRESS BAR ----------
 function renderProgressSteps() {
 const wrap = document.getElementById("progressSteps");
 wrap.innerHTML = "";
 STEP_LABELS.forEach((label, i) => {
 const stepNum = i + 1;
 const pill = document.createElement("div");
 pill.className = "wizard-step-pill";
 pill.setAttribute("data-pill", stepNum);
 pill.innerHTML = `<span class="num">${stepNum}</span><span class="label-text">${label}</span>`;
 wrap.appendChild(pill);
 });
 updateProgress();
 }

 function updateProgress() {
 const fill = document.getElementById("progressFill");
 fill.style.width = ((currentStep - 1) / (TOTAL_STEPS - 1)) * 83.4 + 16.6 + "%";

 document.querySelectorAll(".wizard-step-pill").forEach(pill => {
 const num = parseInt(pill.getAttribute("data-pill"), 10);
 pill.classList.remove("active", "done");
 if (num === currentStep) pill.classList.add("active");
 else if (num < currentStep) pill.classList.add("done");
 });
 }

 // ---------- FIELD ERROR HELPERS ----------
 function setFieldError(fieldEl) {
 if (fieldEl) fieldEl.classList.add("error");
 }
 function clearFieldError(fieldEl) {
 if (fieldEl) fieldEl.classList.remove("error");
 }

 // ---------- VALIDATION PER STEP ----------
 function validateStep(step) {
 let valid = true;

 function checkInput(id) {
 const el = document.getElementById(id);
 const wrap = el.closest(".field");
 if (!el.value || !el.value.trim()) {
 setFieldError(wrap);
 valid = false;
 } else {
 clearFieldError(wrap);
 }
 }

 function checkChip(field) {
 const group = document.querySelector(`.chip-group[data-chip-field="${field}"]`);
 const wrap = group.closest(".field");
 const val = getChipValue(field);
 const empty = Array.isArray(val) ? val.length === 0 : !val;
 if (empty) {
 setFieldError(wrap);
 valid = false;
 } else {
 clearFieldError(wrap);
 }
 }

 if (step === 1) {
 ["fullName", "mobile", "nationality"].forEach(checkInput);
 const emailEl = document.getElementById("email");
 const emailWrap = emailEl.closest(".field");
 const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value.trim());
 if (!emailOk) { setFieldError(emailWrap); valid = false; } else { clearFieldError(emailWrap); }
 checkChip("ageGroup");
 }

 if (step === 2) {
 ["destination", "startingCity", "travelDate", "returnDate", "days", "travellers"].forEach(checkInput);
 checkChip("transport");
 const start = document.getElementById("travelDate").value;
 const end = document.getElementById("returnDate").value;
 const returnWrap = document.getElementById("returnDate").closest(".field");
 if (start && end && new Date(end) < new Date(start)) {
 setFieldError(returnWrap);
 valid = false;
 }
 }

 if (step === 3) {
 checkChip("budget");
 checkChip("accommodation");
 checkChip("food");
 checkChip("fitness");
 }

 if (step === 4) {
 checkChip("activities");
 }

 if (step === 5) {
 checkChip("weather");
 checkChip("schedule");
 }

 if (step === 6) {
 ["q1", "q2"].forEach(checkInput);
 }

 return valid;
 }

 // ---------- COLLECT ALL DATA (reusable, no manual field-by-field reading elsewhere) ----------
 function collectData() {
 travellerData.personal = {
 fullName: document.getElementById("fullName").value.trim(),
 email: document.getElementById("email").value.trim(),
 mobile: document.getElementById("mobile").value.trim(),
 ageGroup: getChipValue("ageGroup"),
 nationality: document.getElementById("nationality").value.trim()
 };

 travellerData.trip = {
 destination: document.getElementById("destination").value.trim(),
 startingCity: document.getElementById("startingCity").value.trim(),
 travelDate: document.getElementById("travelDate").value,
 returnDate: document.getElementById("returnDate").value,
 days: document.getElementById("days").value,
 travellers: document.getElementById("travellers").value,
 adults: document.getElementById("adults").value || "0",
 children: document.getElementById("children").value || "0",
 seniors: document.getElementById("seniors").value || "0",
 transport: getChipValue("transport")
 };

 travellerData.budget = {
 budget: getChipValue("budget"),
 accommodation: getChipValue("accommodation"),
 food: getChipValue("food"),
 accessibility: getChipValue("accessibility"),
 fitness: getChipValue("fitness")
 };

 travellerData.activities = getChipValue("activities");

 travellerData.interests = {
 ecoInterest: document.getElementById("ecoInterest").value,
 weather: getChipValue("weather"),
 schedule: getChipValue("schedule"),
 photography: getChipValue("photography"),
 travelInterests: getChipValue("travelInterests")
 };

 travellerData.aiQuestions = {
 idealVacation: document.getElementById("q1").value.trim(),
 topExperience: document.getElementById("q2").value.trim(),
 visitedBefore: document.getElementById("q3").value.trim(),
 avoid: document.getElementById("q4").value.trim(),
 specialRequests: document.getElementById("q5").value.trim()
 };

 return travellerData;
 }

 // ---------- STEP NAVIGATION ----------
 function showStep(step) {
 document.querySelectorAll(".wizard-step").forEach(s => s.classList.remove("active"));
 const target = document.querySelector(`.wizard-step[data-step="${step}"]`);
 if (target) target.classList.add("active");

 document.getElementById("prevBtn").disabled = (step === 1);
 document.getElementById("nextBtn").style.display = (step < TOTAL_STEPS) ? "block" : "none";
 document.getElementById("generateBtn").style.display = (step === TOTAL_STEPS) ? "block" : "none";

 if (step <= TOTAL_STEPS) updateProgress();
 }

 document.getElementById("nextBtn").addEventListener("click", () => {
 if (!validateStep(currentStep)) return;
 if (currentStep < TOTAL_STEPS) {
 currentStep++;
 showStep(currentStep);
 document.getElementById("plannerWizard").scrollIntoView({ behavior: "smooth", block: "start" });
 }
 });

 document.getElementById("prevBtn").addEventListener("click", () => {
 if (currentStep > 1) {
 currentStep--;
 showStep(currentStep);
 document.getElementById("plannerWizard").scrollIntoView({ behavior: "smooth", block: "start" });
 }
 });

 document.getElementById("generateBtn").addEventListener("click", () => {
 if (!validateStep(currentStep)) return;
 generateAIPlan();
 });

 document.getElementById("restartBtn").addEventListener("click", () => {
 document.getElementById("plannerForm").reset();
 document.querySelectorAll(".chip.selected").forEach(c => c.classList.remove("selected"));
 document.getElementById("ecoInterestValue").textContent = "3";
 document.getElementById("ecoInterest").value = 3;
 document.getElementById("aiResult").style.display = "none";
 document.getElementById("restartBtn").style.display = "none";
 document.getElementById("wizardNav").style.display = "flex";
 currentStep = 1;
 showStep(currentStep);
 });

 // eco interest slider live value
 document.getElementById("ecoInterest").addEventListener("input", (e) => {
 document.getElementById("ecoInterestValue").textContent = e.target.value;
 });

 // ---------- MARKDOWN -> STYLED REPORT (matches report.html palette) ----------
 function escapeHtml(str) {
 return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
 }

 function mdInlineToHtml(text) {
 let safe = escapeHtml(text);
 safe = safe.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
 safe = safe.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
 return safe;
 }

 // Converts a block of non-heading lines into paragraphs / lists / sub-headings
 function blocksToHtml(linesArr) {
 let html = "";
 let listBuffer = [];

 function flushList() {
 if (listBuffer.length) {
 html += "<ul>" + listBuffer.map(li => `<li>${mdInlineToHtml(li)}</li>`).join("") + "</ul>";
 listBuffer = [];
 }
 }

 linesArr.forEach(rawLine => {
 const line = rawLine.trim();
 if (!line) { flushList(); return; }

 if (/^[-*]\s+/.test(line)) {
 listBuffer.push(line.replace(/^[-*]\s+/, ""));
 } else if (/^#{1,6}\s+/.test(line)) {
 flushList();
 html += `<h3>${mdInlineToHtml(line.replace(/^#{1,6}\s+/, ""))}</h3>`;
 } else {
 flushList();
 html += `<p>${mdInlineToHtml(line)}</p>`;
 }
 });

 flushList();
 return html;
 }

 // Splits the AI's "## Heading" markdown into styled .report-section cards
 function renderReport(markdown, destinationLabel) {
 const lines = markdown.split(/\r?\n/);
 let sectionsHtml = "";
 let sectionIndex = 0;
 let currentTitle = null;
 let buffer = [];

 function flushSection() {
 if (!currentTitle && buffer.every(l => !l.trim())) return;
 sectionIndex++;
 const bodyHtml = blocksToHtml(buffer);
 sectionsHtml += `
 <div class="report-section">
 ${currentTitle ? `<div class="eyebrow">Section ${String(sectionIndex).padStart(2, "0")}</div><h2 class="section-title">${mdInlineToHtml(currentTitle)}</h2>` : ""}
 ${bodyHtml}
 </div>`;
 buffer = [];
 }

 lines.forEach(line => {
 const h2Match = line.match(/^##\s+(.*)/);
 if (h2Match) {
 flushSection();
 currentTitle = h2Match[1].trim();
 } else {
 buffer.push(line);
 }
 });
 flushSection();

 return `
 <div class="eco-report">
 <div class="report-header">
 <div class="eyebrow"> AI Generated Report</div>
 <h1>Your Personalized Travel Report</h1>
 ${destinationLabel ? `<p>Crafted for your trip to ${escapeHtml(destinationLabel)}</p>` : ""}
 </div>
 ${sectionsHtml}
 </div>`;
 }

 // ---------- GENERATE REPORT (calls existing /api/chat + Groq) ----------
 async function generateAIPlan() {
 const data = collectData();

 // move into the "result" view
 document.querySelectorAll(".wizard-step").forEach(s => s.classList.remove("active"));
 document.getElementById("resultStep").classList.add("active");
 document.getElementById("wizardNav").style.display = "none";

 const loading = document.getElementById("wizardLoading");
 const resultBox = document.getElementById("aiResult");
 const restartBtn = document.getElementById("restartBtn");

 loading.style.display = "block";
 resultBox.style.display = "none";
 restartBtn.style.display = "none";

 try {
 const response = await fetch("/api/chat", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ formData: data })
 });

 const result = await response.json();

 loading.style.display = "none";
 resultBox.style.display = "block";
 restartBtn.style.display = "block";

 if (result.success) {
 sessionStorage.setItem("ecoTripReport", JSON.stringify({
 destination: data.trip.destination,
 markdown: result.reply,
 formData: data
 }));
 window.location.href = "report.html";
 return;
 } else {
 resultBox.innerHTML = " Unable to generate plan. Please try again.";
 }
 } catch (error) {
 console.error(error);
 loading.style.display = "none";
 resultBox.style.display = "block";
 restartBtn.style.display = "block";
 resultBox.innerHTML = " Server error. Please try again later.";
 }
 }

 // ---------- INIT ----------
 renderChips();
 renderProgressSteps();
 showStep(currentStep);

})();

/* ============================================================
 API CONFIG
============================================================ */
const MAIN_API_BASE = (window.ECOVILLAGE_API_BASE || 'https://ecovillagetrails-3.onrender.com').replace(/\/$/, '');

/* ---------- static destination info (unchanged - these are regional
 guides, not bookable listings, so they stay hardcoded) ---------- */
const destinationData = {
 purulia:{title:"Purulia",grad:"linear-gradient(135deg,#7a5a2e,#c9612e 60%,#e1672e)",tag:"Red Earth & Chhau Masks",
 desc:"Rolling laterite hills and Sal forests surround villages where Chhau dance troupes rehearse year-round. Stay through the Tusu harvest festival to see the masks come alive.",
 tags:["Ajodhya Hills","Chhau Dance Villages","Garpanchakot Fort","Murguma Lake"]},
 andul:{title:"Andul",grad:"linear-gradient(135deg,#2a8fae,#1c5f78 70%)",tag:"Heritage by the River",
 desc:"An easy day from Kolkata, Andul's faded zamindar mansions and riverside ghats make for a slow, reflective village walk through Bengal's colonial-era past.",
 tags:["Andul Rajbari","Riverside Ghats","Heritage Walks","Handloom Weaving"]},
 sundarbans:{title:"Sundarbans Villages",grad:"linear-gradient(135deg,#0f5c3d,#1f8a5a 70%)",tag:"Where Mangroves Meet Mankind",
 desc:"Reachable only by boat, these stilt villages sit at the edge of the world's largest mangrove forest. Mornings begin with honey collectors heading into the delta.",
 tags:["Mangrove Boat Safaris","Honey Collector Trails","Bird Watching","Tiger Reserve Buffer"]},
 bishnupur:{title:"Bishnupur",grad:"linear-gradient(135deg,#9c4a26,#e1672e 70%)",tag:"Terracotta Temple Town",
 desc:"Home to centuries-old terracotta temples, Baluchari silk weaving and the Bishnupur gharana of classical music — a town where craft and culture share the same street.",
 tags:["Terracotta Temples","Baluchari Weaving","Dokra Craft","Mukutmanipur Dam"]},
 shantiniketan:{title:"Shantiniketan Region",grad:"linear-gradient(135deg,#b9810f,#f0ad2e 70%)",tag:"Tagore's Open-Air Classroom",
 desc:"Red Khoai soil, open-air classrooms and Baul minstrels surround Visva-Bharati. Santal hamlets nearby keep their own music and harvest traditions alive.",
 tags:["Visva-Bharati Campus","Khoai Sonajhuri Forest","Baul Music Villages","Santal Hamlets"]}
};

// NOTE: the "Hidden Gems" destinations (Mechuka, Tirthan Valley, Gokarna,
// Mawlynnong, Spiti, etc.) used to be hand-written here. They're now
// data-driven from data/destinations.json and their descriptions are
// generated on demand by /api/place-info — see js/destinations.js.

// A small palette to cycle through for hotel card art, since real hotels
// don't have a hand-picked gradient the way the hardcoded demo cards did.
const stayGradients = [
 "linear-gradient(135deg,#f0ad2e,#e1672e)",
 "linear-gradient(135deg,#2a8fae,#7bc97e)",
 "linear-gradient(135deg,#0f5c3d,#2a8fae)",
 "linear-gradient(135deg,#9c4a26,#e1672e)",
 "linear-gradient(135deg,#1c5f78,#7bc97e)"
];

let hotelsCache = []; // hotels currently rendered in the grid, looked up by id when opening a modal

/* ---------- render the real eco-stay grid from the API ---------- */
async function loadStays(){
 const grid = document.getElementById('stayGrid');
 try{
 const res = await fetch(`${MAIN_API_BASE}/api/listings/hotels`);
 if(!res.ok) throw new Error('Failed to load stays');
 const data = await res.json();
 hotelsCache = data.hotels || [];

 if(hotelsCache.length === 0){
 grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:60px 20px; color:var(--ink-soft);">
 No eco-stays are listed yet — check back soon.
 </div>`;
 return;
 }

 grid.innerHTML = hotelsCache.map((hotel, idx) => renderStayCard(hotel, idx)).join('');

 // Wire up the Book Now buttons we just inserted
 grid.querySelectorAll('[data-hotel-id]').forEach(btn=>{
 btn.addEventListener('click', ()=>{
 openBookingModal(btn.getAttribute('data-hotel-id'));
 });
 });
 }catch(err){
 grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:60px 20px; color:var(--ink-soft);">
 Couldn't load eco-stays right now. Is the server running?
 </div>`;
 console.error(err);
 }
}

function renderStayCard(hotel, idx){
 const grad = stayGradients[idx % stayGradients.length];
 const rating = hotel.avgRating > 0 ? hotel.avgRating.toFixed(1) : 'New';
 const ratingLabel = hotel.avgRating > 0 ? `${rating} Eco-Rating` : 'New listing';
 const totalGuests = (hotel.rooms || []).reduce((sum, r) => sum + (r.maxGuests || 0), 0) || '—';
 const roomCount = (hotel.rooms || []).length;
 const amenityChips = (hotel.amenities || []).slice(0, 3).map(a => `<span>${escapeHtml(a)}</span>`).join('');
 const ownerInitial = hotel.owner && hotel.owner.name ? hotel.owner.name.charAt(0).toUpperCase() : 'H';
 const ownerName = hotel.owner && hotel.owner.name ? escapeHtml(hotel.owner.name) : 'Host';
 const thumbUrl = (hotel.images && hotel.images[0]) ? hotel.images[0].url : null;

 return `
 <div class="stay-card reveal">
 <div class="stay-art" style="${thumbUrl ? `background-image:url('${thumbUrl}'); background-size:cover; background-position:center;` : `background:${grad};`}">
 <div class="stay-rating">
 <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C7 2 3 7 3 13c0 5 4 9 9 9s9-4 9-9c0-1-3-11-9-11z"/></svg>
 ${ratingLabel}
 </div>
 </div>
 <div class="stay-body">
 <h3>${escapeHtml(hotel.name)}</h3>
 <div class="stay-meta">
 <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="7" r="4"/><path d="M2 21v-2a7 7 0 0 1 14 0v2"/></svg>${totalGuests} Guests</span>
 <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="9" width="18" height="11" rx="2"/><path d="M9 9V7a3 3 0 0 1 6 0v2"/></svg>${roomCount} Room${roomCount === 1 ? '' : 's'}</span>
 </div>
 <div class="stay-amenities">${amenityChips}</div>
 <div class="stay-host">
 <div class="stay-host-ava" style="background:var(--green);">${ownerInitial}</div>
 <div class="stay-host-info"><b>Hosted by ${ownerName}</b><span>${escapeHtml(hotel.region)}</span></div>
 </div>
 <button class="btn btn-primary btn-block" data-hotel-id="${hotel._id}">Book Now</button>
 </div>
 </div>
 `;
}

function escapeHtml(str){
 const div = document.createElement('div');
 div.textContent = str || '';
 return div.innerHTML;
}

/* ---------- destination info modal (unchanged behavior, static data) ---------- */
function renderDestinationModal(key){
 const d = destinationData[key];
 if(!d) return;
 const tagsHtml = d.tags.map(t=>`<span>${t}</span>`).join("");
 const pdfHref = d.pdf || `assets/pdfs/${key}.pdf`;
 const webHref = d.web || `#`;
 document.getElementById('modalContent').innerHTML = `
 <div class="modal-art" style="background:${d.grad}">
 <video autoplay muted loop playsinline class="modal-video">
 <source src="assets/${key}.mp4" type="video/mp4">
 </video>
 </div>
 <span class="eyebrow green" style="margin-bottom:6px;">${d.tag}</span>
 <h3>${d.title}</h3>
 <p>${d.desc}</p>
 <div class="modal-tags">${tagsHtml}</div>
 <div class="modal-actions">
 <a class="modal-btn-pdf" href="${pdfHref}" target="_blank" rel="noopener">
 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
 View Full PDF
 </a>
 <a class="modal-btn-web" href="${webHref}" target="_blank" rel="noopener">
 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z"/></svg>
 View More on Web
 </a>
 </div>
 `;
}

/* ---------- booking modal (real data + real API call + WhatsApp confirm) ---------- */
function openBookingModal(hotelId){
 const hotel = hotelsCache.find(h => h._id === hotelId);
 if(!hotel) return;

 const amenityTags = (hotel.amenities || []).map(a => `<span>${escapeHtml(a)}</span>`).join("");
 const roomOptions = (hotel.rooms || []).map(r =>
 `<option value="${r._id}">${escapeHtml(r.name)} — ₹${r.pricePerNight}/night (up to ${r.maxGuests} guests)</option>`
 ).join("");

 document.getElementById('modalContent').innerHTML = `
 <div class="modal-art" style="background:linear-gradient(135deg,#1f8a5a,#0f5c3d)"></div>
 <span class="eyebrow green" style="margin-bottom:6px;">${escapeHtml(hotel.region)} · Hosted by ${hotel.owner ? escapeHtml(hotel.owner.name) : 'Host'}</span>
 <h3>${escapeHtml(hotel.name)}</h3>
 <p>${escapeHtml(hotel.description)}</p>
 <div class="modal-tags">${amenityTags}</div>
 <form class="modal-form" id="bookingForm">
 <input type="text" id="bf-name" placeholder="Your name" required>
 <input type="email" id="bf-email" placeholder="Email address" required>
 <input type="tel" id="bf-phone" placeholder="Phone number" required>
 ${roomOptions ? `<select id="bf-room" required>
 <option value="" disabled selected>Choose a room</option>${roomOptions}
 </select>` : ''}
 <div style="display:flex; gap:10px;">
 <input type="date" id="bf-checkin" required style="flex:1;">
 <input type="date" id="bf-checkout" required style="flex:1;">
 </div>
 <input type="number" id="bf-guests" placeholder="Number of guests" min="1" value="1" required>
 <button type="submit" class="btn btn-primary btn-block">Send Booking Request</button>
 </form>
 <div class="modal-success" id="modalSuccess">
 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>
 <span id="modalSuccessText">Request sent!</span>
 </div>
 <div id="whatsappConfirmRow" style="display:none; margin-top:14px;"></div>
 `;

 document.getElementById('bookingForm').addEventListener('submit', async (e)=>{
 e.preventDefault();
 const submitBtn = e.target.querySelector('button[type=submit]');
 submitBtn.disabled = true;
 submitBtn.textContent = 'Sending…';

 const payload = {
 hotelId: hotel._id,
 roomId: document.getElementById('bf-room') ? document.getElementById('bf-room').value : undefined,
 guestName: document.getElementById('bf-name').value.trim(),
 guestEmail: document.getElementById('bf-email').value.trim(),
 guestPhone: document.getElementById('bf-phone').value.trim(),
 checkIn: document.getElementById('bf-checkin').value,
 checkOut: document.getElementById('bf-checkout').value,
 guests: Number(document.getElementById('bf-guests').value) || 1,
 };

 try{
 const res = await fetch(`${MAIN_API_BASE}/api/bookings`, {
 method:'POST',
 headers:{'Content-Type':'application/json'},
 body: JSON.stringify(payload)
 });
 const data = await res.json();
 if(!res.ok) throw new Error(data.error || 'Could not send booking request.');

 document.getElementById('bookingForm').style.display='none';
 document.getElementById('modalSuccess').classList.add('show');

 // Build a WhatsApp click-to-chat link pre-filled with the booking details,
 // sent to the hotel's WhatsApp number. No backend/API needed for this part.
 if(hotel.whatsapp){
 const waNumber = hotel.whatsapp.replace(/[^\d]/g, ''); // wa.me needs digits only
 const message = encodeURIComponent(
 `Hi! I just sent a booking request on EcoVillage Trails for ${hotel.name}.\n` +
 `Name: ${payload.guestName}\n` +
 `Dates: ${payload.checkIn} to ${payload.checkOut}\n` +
 `Guests: ${payload.guests}\n` +
 `Could you confirm availability?`
 );
 const waLink = `https://wa.me/${waNumber}?text=${message}`;
 document.getElementById('whatsappConfirmRow').innerHTML =
 `<a href="${waLink}" target="_blank" rel="noopener" class="btn btn-block" style="background:#25D366; color:#fff;">
 Confirm via WhatsApp
 </a>`;
 document.getElementById('whatsappConfirmRow').style.display = '';
 }
 }catch(err){
 submitBtn.disabled = false;
 submitBtn.textContent = 'Send Booking Request';
 alert(err.message);
 }
 });
}

/* ---------- Ask AI widget ---------- */
(function () {
 const floating = document.getElementById('askAiFloating');
 const toggle = document.getElementById('askAiToggle');
 const panel = document.getElementById('askAiPanel');
 const close = document.getElementById('askAiClose');
 const form = document.getElementById('askAiForm');
 const input = document.getElementById('askAiInput');
 const messages = document.getElementById('askAiMessages');
 const reportContext = sessionStorage.getItem('ecoTripReport');

 function setOpen(open) {
 if (!floating || !toggle || !panel) return;
 floating.classList.toggle('open', open);
 toggle.setAttribute('aria-expanded', String(open));
 if (open) input?.focus();
 }

 function addBubble(text, isUser) {
 if (!messages) return;
 const bubble = document.createElement('div');
 bubble.className = `ask-ai-bubble ${isUser ? 'ask-ai-bubble-user' : 'ask-ai-bubble-bot'}`;
 bubble.textContent = text;
 messages.appendChild(bubble);
 messages.scrollTop = messages.scrollHeight;
 }

 if (toggle) toggle.addEventListener('click', () => setOpen(!floating.classList.contains('open')));
 if (close) close.addEventListener('click', () => setOpen(false));
 if (form) {
 form.addEventListener('submit', async (e) => {
 e.preventDefault();
 const q = input?.value?.trim();
 if (!q) return;
 addBubble(q, true);
 input.value = '';
 try {
 const payload = {
 message: q,
 formData: reportContext ? JSON.parse(reportContext).formData : null,
 };
 const res = await fetch('/api/chat', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(payload),
 });
 const data = await res.json();
 if (data.success) addBubble(data.reply.replace(/\n/g, '\n'), false);
 else addBubble('I could not answer that right now. Please try again.', false);
 } catch (err) {
 addBubble('The AI assistant is temporarily unavailable.', false);
 }
 });
 }
 document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
})();

/* ---------- modal open/close wiring ---------- */
const overlay = document.getElementById('modalOverlay');

// Destination "View Details" buttons still use data-modal-trigger with static keys
document.querySelectorAll('[data-modal-trigger]').forEach(btn=>{
 const key = btn.getAttribute('data-modal-trigger');
 if(destinationData[key]){
 btn.addEventListener('click', ()=>{
 renderDestinationModal(key);
 overlay.classList.add('open');
 });
 }
});

document.getElementById('modalClose').addEventListener('click', ()=>overlay.classList.remove('open'));
overlay.addEventListener('click', e=>{ if(e.target === overlay) overlay.classList.remove('open'); });

// Kick off loading the real eco-stay listings
loadStays();

/* ---------- nav ---------- */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', ()=>{
 navbar.classList.toggle('scrolled', window.scrollY > 40);
});
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
navToggle.addEventListener('click', ()=> navLinks.classList.toggle('open'));
navLinks.querySelectorAll('a').forEach(a=> a.addEventListener('click', ()=> navLinks.classList.remove('open')));

/* ---------- hero heading split-text reveal (ReactBits-style SplitText, ported to vanilla JS) ---------- */
(function(){
 const heading = document.querySelector('.hero-text h1');
 if(!heading) return;

 // Flatten the heading into a single sequence of characters, remembering
 // which ones came from inside <em> (so they get the gradient treatment) —
 // avoids nesting cloned elements, which was fragile and produced a stray
 // floating character. Collapses whitespace runs (including the source
 // HTML's newlines/indentation) down to single spaces first.
 const parts = [];
 heading.childNodes.forEach(node=>{
  const isEm = node.nodeType === Node.ELEMENT_NODE && node.tagName === 'EM';
  const text = (node.textContent || '').replace(/\s+/g, ' ');
  Array.from(text).forEach(ch=> parts.push({ch, em:isEm}));
 });
 while(parts.length && parts[0].ch === ' ') parts.shift();
 while(parts.length && parts[parts.length-1].ch === ' ') parts.pop();

 heading.innerHTML = '';
 parts.forEach((p, i)=>{
  const span = document.createElement('span');
  span.className = 'ecv-split-char' + (p.em ? ' ecv-split-em' : '');
  span.textContent = p.ch === ' ' ? '\u00A0' : p.ch;
  span.style.transitionDelay = (i * 26) + 'ms';
  heading.appendChild(span);
 });

 const splitIO = new IntersectionObserver((entries)=>{
  entries.forEach(en=>{
   if(en.isIntersecting){
    heading.classList.add('ecv-split-visible');
    splitIO.unobserve(en.target);
   }
  });
 },{threshold:0.1});
 splitIO.observe(heading);
})();

/* ---------- reveal on scroll ---------- */
const revealEls = document.querySelectorAll('.reveal');
const io = new IntersectionObserver((entries)=>{
 entries.forEach(en=>{
 if(en.isIntersecting){ en.target.classList.add('is-visible'); io.unobserve(en.target); }
 });
},{threshold:0.15});
revealEls.forEach(el=> io.observe(el));

/* ---------- counters ---------- */
const counters = document.querySelectorAll('.counted');
const counterIO = new IntersectionObserver((entries)=>{
 entries.forEach(en=>{
 if(en.isIntersecting){
 const el = en.target;
 const target = parseFloat(el.getAttribute('data-count'));
 const isDecimal = !Number.isInteger(target);
 let current = 0;
 const duration = 1400;
 const start = performance.now();
 function tick(now){
 const progress = Math.min((now-start)/duration,1);
 current = target * progress;
 el.textContent = isDecimal ? current.toFixed(1) : Math.floor(current).toLocaleString();
 if(progress < 1) requestAnimationFrame(tick);
 else el.textContent = isDecimal ? target.toFixed(1) : target.toLocaleString();
 }
 requestAnimationFrame(tick);
 counterIO.unobserve(el);
 }
 });
},{threshold:0.4});
counters.forEach(c=> counterIO.observe(c));

/* ---------- experience flip cards (touch) ---------- */
document.querySelectorAll('.exp-flip').forEach(card=>{
 card.addEventListener('click', ()=> card.classList.toggle('flipped'));
});

/* ---------- newsletter ---------- */
document.getElementById('newsForm').addEventListener('submit', e=>{
 e.preventDefault();
 document.getElementById('newsNote').textContent = "Thanks — you're on the list!";
});
// Close the Ask AI modal when clicking the dark backdrop
document.addEventListener("DOMContentLoaded", function () {
 const overlay = document.getElementById("luModalOverlay");
 if (overlay) {
 overlay.addEventListener("click", function (e) {
 if (e.target === overlay) luCloseModal();
 });
 }
});