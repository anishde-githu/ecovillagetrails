# EcoVillage Trails

A community tourism site (static frontend + Vercel serverless AI/API functions + an optional standalone Express/MongoDB backend for the partner-listing system).

<!-- Redeploy trigger: 2026-07-10T08:35:00Z - minor update to force Vercel rebuild -->

## ⚠️ Rotate your secrets before you deploy this

The original zip you uploaded had real, working credentials committed inside it:

- `GROQ_API_KEY` (Groq)
- `MONGODB_URI` (full MongoDB Atlas username/password)
- `JWT_SECRET`
- `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET`
- `ADMIN_EMAIL` / `ADMIN_PASSWORD`
- `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID`
- A live Vercel OIDC token in `.env.local`

All of these have already been in a zip file that passed through at least one upload, so treat them as **compromised**. Please:

1. Rotate/regenerate every key above at its source (Groq console, MongoDB Atlas, Cloudinary, Telegram BotFather) — don't just delete the file.
2. Change the admin password.
3. Never commit `.env` / `.env.local` again — they're now in `.gitignore`.

None of these files are included in this cleaned copy — I've replaced them with `.env.example` templates (see below) so you can drop your **new** keys in locally and in your Vercel/Render project settings instead.

## What I changed

- **Removed**: the duplicated nested folder (`EcoVillageTrails_clean/EcoVillageTrails_clean/…`), `.git/` history inside `backend/`, `.vercel/` cache, all `.env`/`.env.local` files, and a stray `backend/EcoTrails2026Secure.txt` that had the admin password in plain text.
- **Flattened the structure**: `frontend/*.html` pages now live at the project root alongside `index.html`, so every page shares one `css/` and one `js/` folder instead of two inconsistent ones.
- **Separated markup from code**: `index.html`, `report.html`, `listing.html`, `admin-dashboard.html`, and `partner-dashboard.html` each had a large inline `<style>` block and inline `<script>` block. Each is now its own file (e.g. `css/style.css` + `js/main.js` for the homepage).
- **Fixed a broken navbar**: `index.html` had a stray `<a>List Your Business</a>` link sitting inside `<head>` (outside the navbar, so it never rendered). It's now a proper nav item and a highlighted button in the navbar, and I added matching "List Your Business" links to `report.html` and `listing.html` so partners can find it from any page.
- **Fixed dead CSS links**: `index.html` linked to `css/style.css` and `css/ai-chat.css`, neither of which existed (the site was silently 404ing on load). `style.css` now exists with the real styles; the unused `ai-chat.css` reference was removed since no chat-widget markup uses it.
- **Renamed video files** with spaces (`Tirthan Valley.mp4`, `Ziro Valley.mp4`) to URL-safe lowercase names and updated the references.
- **Deduplicated** the two identical copies of `partner-auth.html`.

## Known gap I did not fix

`index.html` references about 20 destination videos (`gokarna.mp4`, `maravanthe.mp4`, `mawlynnong.mp4`, `spiti.mp4`, etc.) that were never in the `assets/` folder — only 10 of the ~30 referenced videos exist. These `<video>` tags will just show blank/broken in the browser. I didn't fabricate placeholder videos; you'll need to add the real files to `assets/` (matching the lowercase-hyphenated filenames used in `index.html`) or remove those destination cards.

## Structure

```
EcoVillageTrails/
├── index.html, report.html, listing.html,
│   partner-auth.html, partner-dashboard.html, admin-dashboard.html
├── css/            → one stylesheet per page + shared partners/live-updates styles
├── js/             → one script per page + shared partners-api.js, live-updates.js
├── assets/         → destination videos
├── data/           → liveUpdates.json (cache used by /api/live-updates)
├── api/            → Vercel serverless functions (chat.js, gemini.js, live-updates.js)
├── vercel.json     → cron + function config for the api/ folder
├── package.json    → deps for the api/ functions
├── .env.example    → copy to .env.local, fill in real keys, also add them in Vercel settings
└── backend/        → optional standalone Express + MongoDB API for partner
                       signup/login/listings (deploy separately, e.g. on Render —
                       Vercel serverless functions don't run a persistent Express app)
    ├── src/
    ├── scripts/createAdmin.js
    └── .env.example
```

## Deploying the frontend + api/ to Vercel

1. Add `GROQ_API_KEY`, `GEMINI_API_KEY`, and `CRON_SECRET` (see `.env.example`) as Environment Variables in your Vercel project settings.
2. Deploy the project root (it's a static site + `api/` serverless functions — no build step needed).
3. `backend/` is a separate Node/Express + MongoDB app that partner-auth/listing/admin pages call via `API_BASE` in `js/partners-api.js` (currently `http://localhost:5000`). Deploy it separately (Render, Railway, etc.) and update `window.ECOVILLAGE_API_BASE` accordingly, or set it before the other scripts load.
