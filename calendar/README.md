# AI Smart Travel Calendar — Integration Guide

## Files in this package

```
public/calendar.html         → the <section> markup, drop into your existing page
public/css/calendar.css      → scoped glassmorphism styling
public/js/calendar.js        → FullCalendar setup, AI calls, GSAP, buttons
backend/calendarRoutes.js    → Express router (POST /api/calendar-ai)
backend/calendarController.js→ builds the Groq prompt, parses the JSON response
backend/groqService.js       → raw Groq API client
backend/server-integration.md→ step-by-step wiring instructions for your server.js
.env.example                 → copy to .env and add your real Groq key
```

## Quick start

1. **Backend**: follow `backend/server-integration.md` — install `groq-sdk`,
   `dotenv`, `cors`, copy the three backend files into your `backend/` folder,
   mount the router, add your `GROQ_API_KEY` to `.env`.

2. **Frontend**: copy `calendar.css` and `calendar.js` into your existing
   `css/` and `js/` folders. Paste the `<section id="ai-travel-calendar">`
   block from `calendar.html` into wherever you want it on the page.

3. **CDN dependencies** — add once, ideally in your page's `<head>`:
   ```html
   <link href="https://cdn.jsdelivr.net/npm/fullcalendar@6.1.11/index.global.min.css" rel="stylesheet">
   <script src="https://cdn.jsdelivr.net/npm/fullcalendar@6.1.11/index.global.min.js"></script>
   <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
   <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
   ```

4. Load a page containing the section, click any colored date on the
   calendar, and the AI report panel below will populate with all 12
   collapsible sections (Festival Guide, Itinerary, Budget, Weather, News,
   Transport, Photography, Food, Shopping, Sustainability, Hidden Gems,
   Nearby Events).

## Notes

- **Sample event data** lives at the top of `calendar.js` (`ATC_EVENTS`).
  Swap it for a real API/CMS call whenever you're ready — everything else
  keys off that same shape (`date`, `name`, `type`, `location`, `description`).
- **Ask AI More** re-sends the last selected date with your typed question
  appended, and re-renders the cards with the new answer.
- **Generate PDF** requires the jsPDF CDN script above; it exports the
  currently open report's headings + text.
- **Share Trip** uses the native Web Share API on mobile/supported browsers,
  and falls back to copying a link to the clipboard.
- The Groq system prompt (in `calendarController.js`) enforces a strict JSON
  contract — if you want to add/remove a section, update both the prompt's
  JSON schema and the `CARD_DEFS` array in `calendar.js` together.
