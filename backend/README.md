# EcoVillage Trails — Backend

API server for EcoVillage Trails. Supports **three kinds of partners** —
Hotel Owners, Travel Agents, and Local Guides — each of whom can sign up,
create one listing, upload photos, and get it live once you approve it.

- Partner signup/login (JWT-based), role = `owner` | `agent` | `guide`
- Partners manage their own listing (info + up to 8 images)
- **Every new/edited listing needs your approval before it's public**
- **Instant Telegram message to your phone** the moment someone submits a listing
- Public API for the site to pull real listings by category
- Booking/enquiry requests + guest reviews

## 1. Accounts you need (all free)

### MongoDB Atlas (database)
Same as before — see your `.env`'s `MONGODB_URI`.

### Cloudinary (image hosting)
Same as before — see your `.env`'s `CLOUDINARY_*` vars.

### Telegram Bot (new — instant notifications)
Takes ~2 minutes, no paid service, no app to install:
1. Open Telegram, message **@BotFather**, send `/newbot`, follow the prompts.
   It gives you a token like `123456:ABC-DEF...` → put this in `.env` as `TELEGRAM_BOT_TOKEN`.
2. Message **@userinfobot** (any message) — it replies with your numeric chat ID → put this in `.env` as `TELEGRAM_CHAT_ID`.
3. **Important:** open a chat with your own new bot and send it any message first (e.g. "hi"). Bots can't message you until you've messaged them at least once.

## 2. Environment variables

`.env` now includes, in addition to what you already had:
```
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
```
If you leave these blank, the app still works — it just skips the notification and logs a warning.

## 3. Install & run locally

```bash
npm install
node scripts/createAdmin.js   # creates your one admin account, run once
npm run dev                   # starts the server with auto-reload
```

Test it's alive: http://localhost:5000/api/health → `{"status":"ok"}`

## 4. Data model change: Hotel → Listing

The old hotel-only model is now a generalized **Listing** with a `category`
field: `hotel`, `agent`, or `guide`. Each user role can only manage listings
in its matching category (`owner`→hotel, `agent`→agent, `guide`→guide).
`rooms` became `offerings` (generic: room / tour package / guided service),
each with `name`, `price`, `unit` (e.g. "per night", "per package", "per day").

## 5. API overview

| Method | Route | Who | What |
|---|---|---|---|
| POST | `/api/auth/signup` | anyone | body needs `role`: `owner`\|`agent`\|`guide` |
| POST | `/api/auth/login` | anyone | Any role login |
| GET | `/api/auth/me` | logged in | Get current user |
| GET | `/api/listings?category=hotel` | public | List approved listings by category |
| GET | `/api/listings/:id` | public | One approved listing |
| GET/POST | `/api/listings/:id/reviews` | public | Reviews |
| POST | `/api/bookings` | public | Submit a booking/enquiry (body: `listingId`) |
| GET/POST/PUT/DELETE | `/api/partner/listings...` | owner/agent/guide | Manage own listing |
| POST/DELETE | `/api/partner/listings/:id/images` | owner/agent/guide | Upload/remove photos |
| GET/PUT | `/api/partner/bookings...` | owner/agent/guide | View/update bookings |
| GET/PUT | `/api/admin/listings...` | admin | Approve/reject (any category) |
| GET | `/api/admin/partners?role=guide` | admin | List all partner accounts |

All `partner`/`admin` routes require header: `Authorization: Bearer <token>`.

## 6. Frontend pages that use this API

- `partner-auth.html` — signup (with role picker) / login
- `partner-dashboard.html` — partner creates/edits their listing, uploads images, sees status
- `admin-dashboard.html` — you approve/reject pending listings (login with your admin account)
- `listing.html?id=...` — public listing detail page, linked from homepage cards
- Homepage sections (Hotels & Stays / Travel Agents / Local Guides) fetch `/api/listings?category=...`

## 7. What's next

- Real email sending for booking confirmations (Telegram now covers moderation alerts)
- Deploy backend to Render + keep MongoDB Atlas + Cloudinary as-is
- Update `CLIENT_ORIGINS` in `.env` to your deployed frontend URL once live
