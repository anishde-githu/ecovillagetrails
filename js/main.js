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
          <div class="eyebrow">✨ AI Generated Report</div>
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
      const response = await fetch("/api/chat.js", {
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
        resultBox.innerHTML = "⚠ Unable to generate plan. Please try again.";
      }
    } catch (error) {
      console.error(error);
      loading.style.display = "none";
      resultBox.style.display = "block";
      restartBtn.style.display = "block";
      resultBox.innerHTML = "❌ Server error. Please try again later.";
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
const API_BASE = (window.ECOVILLAGE_API_BASE || 'https://ecovillagetrails-3.onrender.com').replace(/\/$/, '');

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
    ,
  mechuka:{title:"Mechuka",grad:"linear-gradient(135deg,#1c5f78,#2a8fae 70%)",tag:"Snow & Tibetan Culture",
    desc:"Tucked against the Tibetan border, Mechuka's snow-capped peaks and wooden Monpa villages make it one of Arunachal's most photogenic, least-crowded valleys.",
    tags:["Samten Yongcha Monastery","Siyom River","Best Season: Oct–Apr"]},
  tirthan:{title:"Tirthan Valley",grad:"linear-gradient(135deg,#0f5c3d,#1f8a5a 70%)",tag:"Rivers & Trout Fishing",
    desc:"A quiet gateway to the Great Himalayan National Park, where crystal-clear rivers, trout fishing spots and forest hikes replace Himachal's more touristy trails.",
    tags:["Great Himalayan NP","Trout Fishing","Best Season: Mar–Jun & Sep–Nov"]},
  ziro:{title:"Ziro Valley",grad:"linear-gradient(135deg,#7bc97e,#1f8a5a 70%)",tag:"Rice Fields & Apatani Culture",
    desc:"A UNESCO-tentative valley of wet-rice terraces and pine forests, home to the indigenous Apatani community and the annual Ziro Music Festival.",
    tags:["Apatani Villages","Ziro Music Festival","Pine Forests"]},
  munsiyari:{title:"Munsiyari",grad:"linear-gradient(135deg,#1c5f78,#0f5c3d 70%)",tag:"Himalayan Viewpoint",
    desc:"One of the finest Himalayan viewpoints in Uttarakhand, and the base camp for glacier treks into the Panchachuli and Milam ranges.",
    tags:["Panchachuli Glacier","Milam Trek","Base Camp"]},
  gokarna:{title:"Gokarna",grad:"linear-gradient(135deg,#2a8fae,#9adde8 70%)",tag:"Quiet Beach Trekking",
    desc:"A laid-back alternative to Goa, with cliffside beach-hopping trails linking quiet coves, cafés and a temple town that still feels local.",
    tags:["Beach Trekking","Om Beach","Cafés"]},
  maravanthe:{title:"Maravanthe Beach",grad:"linear-gradient(135deg,#1c5f78,#9adde8 70%)",tag:"Sea Meets River",
    desc:"A stretch of national highway runs with the Arabian Sea on one side and the Souparnika river on the other — best seen at sunrise or sunset.",
    tags:["Coastal Highway","Sunrise Views","Souparnika River"]},
  agatti:{title:"Agatti Island",grad:"linear-gradient(135deg,#7bc97e,#9adde8 70%)",tag:"Coral Reefs & Lagoons",
    desc:"Part of the Lakshadweep archipelago, Agatti's turquoise lagoons and coral reefs make it one of India's best under-the-radar diving destinations.",
    tags:["Snorkeling","Coral Reefs","Lagoon Views"]},
  mandarmani:{title:"Mandarmani",grad:"linear-gradient(135deg,#9adde8,#2a8fae 70%)",tag:"Long Sandy Beach",
    desc:"Bengal's longest drivable beach, with far fewer crowds than Digha or Puri, and a coastline that stretches uninterrupted for kilometers.",
    tags:["Beach Drives","Sunrise Point"]},
  mawlynnong:{title:"Mawlynnong",grad:"linear-gradient(135deg,#0f5c3d,#7bc97e 70%)",tag:"Cleanest Village",
    desc:"Often called Asia's cleanest village, Mawlynnong is known for its living root bridges and community-led upkeep of its forest paths.",
    tags:["Living Root Bridges","Sky View Point"]},
  dzukou:{title:"Dzukou Valley",grad:"linear-gradient(135deg,#1f8a5a,#f0ad2e 70%)",tag:"Seasonal Wildflowers",
    desc:"Straddling the Nagaland-Manipur border, Dzukou's rolling green hills burst into seasonal wildflower blooms, drawing trekkers each summer.",
    tags:["Wildflower Trek","Rolling Hills"]},
  keibul:{title:"Keibul Lamjao National Park",grad:"linear-gradient(135deg,#0f5c3d,#2a8fae 70%)",tag:"World's Only Floating Park",
    desc:"A unique floating ecosystem of phumdis (compressed vegetation) on Loktak Lake, and the last natural refuge of the endangered Sangai deer.",
    tags:["Sangai Deer","Loktak Lake","Floating Phumdis"]},
  majuli:{title:"Majuli",grad:"linear-gradient(135deg,#1c5f78,#7bc97e 70%)",tag:"River Island Culture",
    desc:"One of the world's largest inhabited river islands, Majuli is the heart of Assamese Vaishnavite culture, dotted with centuries-old satras (monasteries).",
    tags:["Satras","Mask Making","Assamese Culture"]},
  mandu:{title:"Mandu",grad:"linear-gradient(135deg,#9c4a26,#e1672e 70%)",tag:"Afghan Architecture",
    desc:"A hilltop fort city in Madhya Pradesh blending Afghan-influenced architecture with romantic ruins overlooking the Malwa plateau.",
    tags:["Jahaz Mahal","Afghan Forts","Malwa Plateau"]},
  chettinad:{title:"Chettinad",grad:"linear-gradient(135deg,#b9810f,#e1672e 70%)",tag:"Mansions & Cuisine",
    desc:"A cluster of Tamil Nadu towns famous for their grand Chettiar mansions, Athangudi tile work, and some of India's most flavorful regional cuisine.",
    tags:["Chettiar Mansions","Athangudi Tiles","Chettinad Cuisine"]},
  orchha:{title:"Orchha",grad:"linear-gradient(135deg,#9c4a26,#f0ad2e 70%)",tag:"Palaces & Cenotaphs",
    desc:"A riverside town of Bundela-era palaces, temples and chhatris (cenotaphs) along the Betwa river, quieter than nearby Khajuraho.",
    tags:["Betwa River","Bundela Palaces","Riverside Cenotaphs"]},
  lepakshi:{title:"Lepakshi Temple",grad:"linear-gradient(135deg,#e1672e,#f0ad2e 70%)",tag:"Hanging Pillar",
    desc:"A Vijayanagara-era temple famous for its intricately carved pillars and one that appears to hang without touching the ground.",
    tags:["Hanging Pillar","Vijayanagara Carvings"]},
  yumthang:{title:"Yumthang Valley",grad:"linear-gradient(135deg,#2a8fae,#f8d27a 70%)",tag:"Valley of Flowers of the East",
    desc:"A high-altitude Sikkim valley that blooms with rhododendrons each spring, earning it the nickname 'Valley of Flowers of the East.'",
    tags:["Rhododendron Bloom","Hot Springs"]},
  kalpa:{title:"Kalpa",grad:"linear-gradient(135deg,#1c5f78,#f8d27a 70%)",tag:"Kinnaur Kailash Views",
    desc:"A quiet Himachal village facing the Kinnaur Kailash range, once a favorite retreat of the last Dalai Lama's family in exile.",
    tags:["Kinnaur Kailash","Apple Orchards"]},
  tawang:{title:"Tawang",grad:"linear-gradient(135deg,#0f5c3d,#f8d27a 70%)",tag:"Monastery & Mountain Passes",
    desc:"Home to one of the largest Buddhist monasteries in India, Tawang sits amid high mountain passes, alpine lakes and Monpa culture.",
    tags:["Tawang Monastery","Sela Pass","Alpine Lakes"]},
  chitkul:{title:"Chitkul",grad:"linear-gradient(135deg,#9adde8,#f8d27a 70%)",tag:"Last Village on the Border",
    desc:"The last inhabited Indian village along the old Hindustan-Tibet road, with wooden houses, apple orchards and views toward the border.",
    tags:["Indo-Tibet Border","Baspa River"]},
  spiti:{title:"Spiti Valley",grad:"linear-gradient(135deg,#52645b,#9adde8 70%)",tag:"Cold Desert Moonscape",
    desc:"A high-altitude cold desert in Himachal Pradesh, dotted with ancient monasteries and some of the highest motorable villages on earth.",
    tags:["Key Monastery","Highest Villages","Cold Desert"]},
  khonoma:{title:"Khonoma",grad:"linear-gradient(135deg,#0f5c3d,#1c5f78 70%)",tag:"India's First Green Village",
    desc:"A Naga village known for pioneering community conservation, terraced farming and the proud Angami warrior heritage still visible in its gates and forts.",
    tags:["Green Village","Terraced Farms","Angami Heritage"]},
  gandikota:{title:"Gandikota",grad:"linear-gradient(135deg,#9c4a26,#f0ad2e 70%)",tag:"Grand Canyon of India",
    desc:"A dramatic gorge carved by the Pennar river through red sandstone cliffs, earning Gandikota its nickname as India's Grand Canyon.",
    tags:["Pennar Gorge","Gandikota Fort"]},
  patan:{title:"Patan",grad:"linear-gradient(135deg,#b9810f,#7bc97e 70%)",tag:"Rani ki Vav Stepwell",
    desc:"Home to Rani ki Vav, an elaborately carved subterranean stepwell and UNESCO World Heritage Site, alongside Patan's centuries-old Patola weaving tradition.",
    tags:["Rani ki Vav","Patola Weaving","UNESCO Site"]},
  bomdila:{title:"Bomdila",grad:"linear-gradient(135deg,#1c5f78,#7bc97e 70%)",tag:"Monasteries & Apple Orchards",
    desc:"A quiet Arunachal hill town of Buddhist monasteries and apple orchards, with sweeping views across the eastern Himalayan range.",
    tags:["Bomdila Monastery","Apple Orchards","Himalayan Views"]},
  chopta:{title:"Chopta",grad:"linear-gradient(135deg,#0f5c3d,#f8d27a 70%)",tag:"Mini Switzerland",
    desc:"Known as Uttarakhand's 'mini Switzerland,' Chopta's alpine meadows are the trailhead for the Tungnath and Chandrashila treks.",
    tags:["Tungnath Trek","Chandrashila Peak","Alpine Meadows"]}
};

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
    const res = await fetch(`${API_BASE}/api/listings/hotels`);
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
      const res = await fetch(`${API_BASE}/api/bookings`, {
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
// MOBILE MENU
function toggleMenu(){
const nav=document.getElementById('navLinks');
if(nav.style.display==="flex"){
nav.style.display="none";
}else{
nav.style.display="flex";
nav.style.flexDirection="column";
nav.style.position="absolute";
nav.style.top="60px";
nav.style.right="20px";
nav.style.background="white";
padding="10px";
borderRadius="10px";
}
}

// WHATSAPP FUNCTION
function sendWhatsApp(){
let name=document.getElementById("name").value;
let phone=document.getElementById("phone").value;
let msg=document.getElementById("msg").value;

let url="https://wa.me/919007155435?text="
+"Name: "+name+"%0a"
+"Phone: "+phone+"%0a"
+"Message: "+msg;

window.open(url,"_blank");
}
async function generateAIPlan() {

  const resultBox = document.getElementById("aiResult");
  resultBox.style.display = "block";
  resultBox.innerHTML = "⏳ Generating your perfect travel plan...";

  // Collect form data
  const formData = {
    name: document.querySelectorAll(".planner input")[0].value,
    people: document.querySelectorAll(".planner input")[1].value,
    destination: document.querySelectorAll(".planner input")[2].value,
    dates: document.querySelectorAll(".planner input")[3].value,
    budget: document.querySelector(".planner select").value,
    places: document.querySelector(".planner textarea").value
  };

  try {

    const response = await fetch("/api/chat.js", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        formData: formData
      })
    });

    const data = await response.json();

    if (data.success) {
      resultBox.innerHTML = data.reply;
    } else {
      resultBox.innerHTML = "⚠ Unable to generate plan. Try again.";
    }

  } catch (error) {
    console.error(error);
    resultBox.innerHTML = "❌ Server error. Please try again later.";
  }
}

// Close the Ask AI modal when clicking the dark backdrop
document.addEventListener("DOMContentLoaded", function () {
  const overlay = document.getElementById("luModalOverlay");
  if (overlay) {
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) luCloseModal();
    });
  }
});
