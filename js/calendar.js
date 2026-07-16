/* ============================================================
   calendar.js
   Drives the AI Smart Travel Calendar section:
   - Sample event data (swap for a real API/CMS whenever ready)
   - FullCalendar rendering with color-coded event types
   - Hover tooltips + click -> /api/calendar-ai
   - Loading experience (typing dots + progress bar)
   - Collapsible AI result cards with GSAP animation
   - Action buttons: PDF, Share, Regenerate, Plan Another, Book, Ask More
   ============================================================ */

(function () {
  'use strict';

  // ------------------------------------------------------------
  // 1. SAMPLE EVENT DATA
  // Replace this with data fetched from your own CMS/API whenever
  // you're ready — the rest of the code only depends on this shape.
  // ------------------------------------------------------------
  const EVENT_TYPE_COLORS = {
    Festival: 'var(--clr-festival)',
    Holiday: 'var(--clr-holiday)',
    'Best Travel Date': 'var(--clr-besttravel)',
    'Wildlife Season': 'var(--clr-wildlife)',
    'Adventure Season': 'var(--clr-adventure)',
    'Photography Season': 'var(--clr-photography)',
    'Nature Season': 'var(--clr-nature)',
    'Harvest Season': 'var(--clr-harvest)',
    'Eco Tourism Event': 'var(--clr-ecotourism)',
  };

  // Resolve CSS variables to real hex/rgb for FullCalendar (it needs literal colors).
  function resolveColor(cssVar) {
    const varName = cssVar.replace('var(', '').replace(')', '');
    return getComputedStyle(document.getElementById('ai-travel-calendar'))
      .getPropertyValue(varName).trim();
  }

  const today = new Date();
  function dateOffset(days) {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }

  const ATC_EVENTS = [
    { date: dateOffset(3), name: 'Nabanna Harvest Festival', type: 'Harvest Season', location: 'Purulia Village Cluster', description: 'A traditional post-harvest celebration with folk music and feasts.' },
    { date: dateOffset(6), name: 'Tribal Heritage Fair', type: 'Festival', location: 'Ayodhya Hills', description: 'Celebration of indigenous crafts, dance, and cuisine.' },
    { date: dateOffset(9), name: 'Republic Observance Day', type: 'Holiday', location: 'EcoVillage Central', description: 'Local public holiday with community gatherings.' },
    { date: dateOffset(12), name: 'Perfect Weather Window', type: 'Best Travel Date', location: 'Sundarban Fringe Villages', description: 'Cool, dry conditions ideal for exploring on foot.' },
    { date: dateOffset(15), name: 'Elephant Corridor Watch', type: 'Wildlife Season', location: 'Dalma Wildlife Corridor', description: 'Peak season for spotting migrating elephant herds.' },
    { date: dateOffset(18), name: 'River Rafting Window Opens', type: 'Adventure Season', location: 'Kangsabati River', description: 'Water levels ideal for guided rafting expeditions.' },
    { date: dateOffset(22), name: 'Golden Mist Mornings', type: 'Photography Season', location: 'Ayodhya Hills Viewpoint', description: 'Low-lying fog creates ideal golden-hour conditions.' },
    { date: dateOffset(26), name: 'Sal Forest Bloom', type: 'Nature Season', location: 'Baghmundi Forest Range', description: 'Sal forests in full bloom with vivid wildflower undergrowth.' },
    { date: dateOffset(30), name: 'Community Eco Market Day', type: 'Eco Tourism Event', location: 'EcoVillage Trails Hub', description: 'Zero-waste local market featuring village cooperatives.' },
    { date: dateOffset(34), name: 'Tusu Parab', type: 'Festival', location: 'Purulia District', description: 'Folk festival marking the end of the harvest season, known for its songs.' },
    { date: dateOffset(40), name: 'Migratory Bird Peak', type: 'Wildlife Season', location: 'Ajodhya Reservoir', description: 'Best window to observe migratory waterfowl.' },
  ];

  // ------------------------------------------------------------
  // 2. SIDEBAR POPULATION
  // ------------------------------------------------------------
  function formatDatePretty(iso) {
    return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, {
      month: 'short', day: 'numeric',
    });
  }

  function populateSidebar() {
    const festivals = ATC_EVENTS.filter(e => e.type === 'Festival' || e.type === 'Harvest Season');
    const generalEvents = ATC_EVENTS.filter(e => e.type === 'Eco Tourism Event' || e.type === 'Holiday');
    const bestSeasons = ATC_EVENTS.filter(e => ['Best Travel Date', 'Adventure Season', 'Nature Season'].includes(e.type));

    const festivalsEl = document.getElementById('atc-upcoming-festivals');
    festivalsEl.innerHTML = festivals.map(e =>
      `<li><strong>${formatDatePretty(e.date)}</strong> — ${e.name}<br><small>${e.location}</small></li>`
    ).join('') || '<li>No festivals in range.</li>';

    const eventsEl = document.getElementById('atc-upcoming-events');
    eventsEl.innerHTML = generalEvents.map(e =>
      `<li><strong>${formatDatePretty(e.date)}</strong> — ${e.name}<br><small>${e.location}</small></li>`
    ).join('') || '<li>No events in range.</li>';

    const seasonsEl = document.getElementById('atc-best-seasons');
    seasonsEl.innerHTML = bestSeasons.map(e =>
      `<li><strong>${e.type}</strong> — ${e.location}<br><small>from ${formatDatePretty(e.date)}</small></li>`
    ).join('') || '<li>No season data.</li>';

    const newsEl = document.getElementById('atc-recent-news');
    const newsSample = [
      { headline: 'New eco-trail opens near Ayodhya Hills', tag: 'Trails' },
      { headline: 'Forest dept. announces safari season update', tag: 'Wildlife' },
      { headline: 'District advisory: road repairs on NH-18', tag: 'Advisory' },
      { headline: 'Village cooperatives launch organic food stalls', tag: 'Local' },
    ];
    newsEl.innerHTML = newsSample.map(n =>
      `<li><strong>${n.tag}</strong> — ${n.headline}</li>`
    ).join('');
  }

  // ------------------------------------------------------------
  // 3. FULLCALENDAR SETUP
  // ------------------------------------------------------------
  let calendarInstance;

  function initCalendar() {
    const calEl = document.getElementById('atc-fullcalendar');

    calendarInstance = new FullCalendar.Calendar(calEl, {
      initialView: 'dayGridMonth',
      height: 'auto',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,dayGridWeek',
      },
      events: ATC_EVENTS.map(e => ({
        title: e.name,
        start: e.date,
        backgroundColor: resolveColor(EVENT_TYPE_COLORS[e.type]),
        borderColor: resolveColor(EVENT_TYPE_COLORS[e.type]),
        extendedProps: { type: e.type, location: e.location, description: e.description },
      })),
      eventDidMount(info) {
        // Simple native tooltip: Name / Location / Short description
        const { type, location, description } = info.event.extendedProps;
        info.el.setAttribute(
          'title',
          `${info.event.title}\nType: ${type}\nLocation: ${location}\n${description}`
        );
        info.el.style.cursor = 'pointer';
        info.el.style.borderRadius = '6px';
      },
      eventClick(info) {
        const { type, location } = info.event.extendedProps;
        const dateStr = info.event.startStr;
        handleDateSelection({
          date: dateStr,
          eventName: info.event.title,
          location,
          eventType: type,
        });
      },
    });

    calendarInstance.render();
  }

  // ------------------------------------------------------------
  // 4. AI REQUEST + LOADING EXPERIENCE
  // ------------------------------------------------------------
  const els = {
    empty: document.getElementById('atc-result-empty'),
    loading: document.getElementById('atc-loading'),
    loadingTitle: document.getElementById('atc-loading-title'),
    progressFill: document.getElementById('atc-progress-fill'),
    resultHeader: document.getElementById('atc-result-header'),
    resultTitleText: document.getElementById('atc-result-title-text'),
    resultSubtitle: document.getElementById('atc-result-subtitle'),
    cardsGrid: document.getElementById('atc-cards-grid'),
    askMore: document.getElementById('atc-ask-more'),
  };

  let lastSelection = null; // remembered for Regenerate / Ask AI More
  let progressTimer = null;

  function startLoadingUI(eventName) {
    els.empty.style.display = 'none';
    els.resultHeader.classList.remove('active');
    els.cardsGrid.classList.remove('active');
    els.cardsGrid.innerHTML = '';
    els.askMore.classList.remove('active');

    els.loading.classList.add('active');
    els.loadingTitle.textContent = `Planning your trip for "${eventName}"…`;
    els.progressFill.style.width = '0%';

    let progress = 0;
    clearInterval(progressTimer);
    progressTimer = setInterval(() => {
      // Ease toward 90% while waiting; final jump to 100% happens on response.
      progress += (90 - progress) * 0.08 + 1;
      if (progress > 90) progress = 90;
      els.progressFill.style.width = progress + '%';
    }, 220);
  }

  function stopLoadingUI() {
    clearInterval(progressTimer);
    els.progressFill.style.width = '100%';
    setTimeout(() => {
      els.loading.classList.remove('active');
    }, 250);
  }

  async function handleDateSelection(selection) {
    lastSelection = selection;
    startLoadingUI(selection.eventName);

    try {
      const response = await fetch('/api/calendar-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selection),
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'AI request failed.');
      }

      stopLoadingUI();
      renderResult(selection, payload.data);
    } catch (err) {
      stopLoadingUI();
      els.loading.classList.remove('active');
      els.empty.style.display = 'block';
      els.empty.innerHTML = `<span>⚠️</span> Couldn't generate your travel report: ${err.message}. Please try again.`;
    }
  }

  // ------------------------------------------------------------
  // 5. RENDERING THE AI RESULT AS COLLAPSIBLE CARDS
  // ------------------------------------------------------------
  const CARD_DEFS = [
    { key: 'festivalGuide', icon: '📅', title: 'Festival Guide' },
    { key: 'itinerary', icon: '🧭', title: 'Smart Itinerary Generator' },
    { key: 'budget', icon: '💰', title: 'Budget Estimator' },
    { key: 'weather', icon: '🌦', title: 'Weather Summary' },
    { key: 'news', icon: '📰', title: 'Latest News' },
    { key: 'transport', icon: '🚆', title: 'Transport Advisor' },
    { key: 'photography', icon: '📸', title: 'Photography Guide' },
    { key: 'food', icon: '🍛', title: 'Food Guide' },
    { key: 'shopping', icon: '🛍', title: 'Local Shopping Guide' },
    { key: 'sustainability', icon: '🌱', title: 'Sustainable Tourism Tips' },
    { key: 'hiddenGems', icon: '🗺', title: 'Hidden Gems' },
    { key: 'nearbyEvents', icon: '🎉', title: 'Nearby Events' },
  ];

  function labelize(camel) {
    return camel.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
  }

  function renderFieldValue(value) {
    if (Array.isArray(value)) {
      return '<ul>' + value.map(item => {
        if (typeof item === 'object' && item !== null) {
          return '<li>' + Object.values(item).join(' — ') + '</li>';
        }
        return `<li>${item}</li>`;
      }).join('') + '</ul>';
    }
    if (typeof value === 'object' && value !== null) {
      return renderObjectAsList(value);
    }
    return `<dd>${value}</dd>`;
  }

  function renderObjectAsList(obj) {
    let html = '<dl>';
    for (const [key, value] of Object.entries(obj)) {
      if (key === 'day') continue; // used as label instead
      if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
        html += `<dt>${labelize(key)}</dt>${renderFieldValue(value)}`;
      } else {
        html += `<dt>${labelize(key)}</dt><dd>${value}</dd>`;
      }
    }
    html += '</dl>';
    return html;
  }

  function renderCardBody(key, data) {
    if (key === 'itinerary' && data.days) {
      let html = `<dl><dt>Trip Summary</dt><dd>${data.tripSummary || ''}</dd></dl>`;
      data.days.forEach(day => {
        html += `<dl><dt>Day ${day.day}</dt>
          <dd><strong>Morning:</strong> ${day.morning}</dd>
          <dd><strong>Afternoon:</strong> ${day.afternoon}</dd>
          <dd><strong>Evening:</strong> ${day.evening}</dd>
          <dd><strong>Night:</strong> ${day.night}</dd></dl>`;
      });
      if (data.mapSuggestions) {
        html += `<dl><dt>Map Suggestions</dt>${renderObjectAsList(data.mapSuggestions)}</dl>`;
      }
      return html;
    }

    if (Array.isArray(data)) {
      return renderFieldValue(data);
    }

    return renderObjectAsList(data);
  }

  function renderResult(selection, data) {
    els.resultTitleText.textContent = `${selection.eventName} — ${selection.location}`;
    els.resultSubtitle.textContent = `AI-generated report for ${new Date(selection.date + 'T00:00:00').toLocaleDateString()}`;
    els.resultHeader.classList.add('active');

    els.cardsGrid.innerHTML = '';

    CARD_DEFS.forEach(def => {
      const sectionData = data[def.key];
      if (!sectionData) return;

      const card = document.createElement('div');
      card.className = 'atc-card';
      card.innerHTML = `
        <button class="atc-card-head" type="button">
          <span><span class="atc-icon">${def.icon}</span>${def.title}</span>
          <span class="atc-chevron">▾</span>
        </button>
        <div class="atc-card-body">
          <div class="atc-card-body-inner">${renderCardBody(def.key, sectionData)}</div>
        </div>
      `;
      els.cardsGrid.appendChild(card);

      const head = card.querySelector('.atc-card-head');
      const body = card.querySelector('.atc-card-body');
      head.addEventListener('click', () => toggleCard(card, body));
    });

    els.cardsGrid.classList.add('active');

    // Staggered reveal with GSAP
    const cards = els.cardsGrid.querySelectorAll('.atc-card');
    gsap.fromTo(cards,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out' }
    );

    // Auto-open the first card (Festival Guide) for immediate value
    const firstCard = els.cardsGrid.querySelector('.atc-card');
    if (firstCard) {
      toggleCard(firstCard, firstCard.querySelector('.atc-card-body'));
    }
  }

  function toggleCard(card, body) {
    const isOpen = card.classList.contains('open');
    if (isOpen) {
      gsap.to(body, { maxHeight: 0, duration: 0.35, ease: 'power2.inOut' });
      card.classList.remove('open');
    } else {
      card.classList.add('open');
      // measure natural height then animate to it
      const inner = body.querySelector('.atc-card-body-inner');
      gsap.set(body, { maxHeight: 'none' });
      const targetHeight = inner.offsetHeight;
      gsap.fromTo(body, { maxHeight: 0 }, { maxHeight: targetHeight, duration: 0.4, ease: 'power2.out' });
    }
  }

  // ------------------------------------------------------------
  // 6. ACTION BUTTONS
  // ------------------------------------------------------------
  function initActionButtons() {
    document.getElementById('atc-btn-regenerate').addEventListener('click', () => {
      if (lastSelection) handleDateSelection(lastSelection);
    });

    document.getElementById('atc-btn-another').addEventListener('click', () => {
      els.resultHeader.classList.remove('active');
      els.cardsGrid.classList.remove('active');
      els.cardsGrid.innerHTML = '';
      els.askMore.classList.remove('active');
      els.empty.style.display = 'block';
      els.empty.innerHTML = '<span>🗓️</span>Select any marked date on the calendar to generate your AI travel report.';
    });

    document.getElementById('atc-btn-book').addEventListener('click', () => {
      // Wire this up to your actual booking flow / listing page.
      window.location.href = '#book-eco-stay';
    });

    document.getElementById('atc-btn-share').addEventListener('click', async () => {
      const shareText = lastSelection
        ? `Check out my AI-planned trip to ${lastSelection.location} for ${lastSelection.eventName}!`
        : 'Check out this trip I planned with EcoVillage Trails!';
      if (navigator.share) {
        try {
          await navigator.share({ title: 'My EcoVillage Trip', text: shareText, url: window.location.href });
        } catch (e) { /* user cancelled share — no action needed */ }
      } else {
        await navigator.clipboard.writeText(`${shareText} ${window.location.href}`);
        alert('Trip link copied to clipboard!');
      }
    });

    document.getElementById('atc-btn-pdf').addEventListener('click', () => {
      if (!window.jspdf) {
        alert('PDF library not loaded. Add the jsPDF CDN script to use this feature.');
        return;
      }
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      const title = els.resultTitleText.textContent;
      doc.setFontSize(16);
      doc.text(title, 14, 18);
      doc.setFontSize(10);

      let y = 30;
      els.cardsGrid.querySelectorAll('.atc-card').forEach(card => {
        const heading = card.querySelector('.atc-card-head').textContent.trim();
        const bodyText = card.querySelector('.atc-card-body-inner').innerText.trim();
        doc.setFont(undefined, 'bold');
        doc.text(heading, 14, y);
        y += 6;
        doc.setFont(undefined, 'normal');
        const lines = doc.splitTextToSize(bodyText, 180);
        doc.text(lines, 14, y);
        y += lines.length * 5 + 8;
        if (y > 270) { doc.addPage(); y = 20; }
      });

      doc.save('ecovillage-trip-plan.pdf');
    });

    document.getElementById('atc-btn-ask').addEventListener('click', () => {
      els.askMore.classList.toggle('active');
    });

    document.getElementById('atc-btn-ask-send').addEventListener('click', submitFollowUp);
    document.getElementById('atc-ask-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submitFollowUp();
    });
  }

  async function submitFollowUp() {
    const input = document.getElementById('atc-ask-input');
    const question = input.value.trim();
    if (!question || !lastSelection) return;

    input.disabled = true;
    startLoadingUI(`Follow-up: ${question}`);

    try {
      const response = await fetch('/api/calendar-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...lastSelection,
          eventName: `${lastSelection.eventName} — follow-up question: ${question}`,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Request failed.');

      stopLoadingUI();
      renderResult(lastSelection, payload.data);
      input.value = '';
    } catch (err) {
      stopLoadingUI();
      alert(`Couldn't get an answer: ${err.message}`);
    } finally {
      input.disabled = false;
    }
  }

  // ------------------------------------------------------------
  // 7. INIT
  // ------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', () => {
    populateSidebar();
    initCalendar();
    initActionButtons();
  });
})();
