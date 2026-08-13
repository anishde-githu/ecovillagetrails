# EcoVillage Trails — Setup

## 1. Install dependencies

```bash
npm install
```

(This installs `next`, `react`, `firebase`, `groq-sdk`, and `lucide-react` —
all already listed in `package.json`.)

## 2. Create a Firebase project

1. Go to https://console.firebase.google.com → **Add project** → name it (e.g. `ecovillage-trails`).
2. Inside the project, click the **Web (</>)** icon to register a web app → copy the config object shown (you'll need it for step 4).

## 3. Enable the services this app uses

- **Authentication** → Sign-in method → enable **Email/Password** and **Google**.
- **Firestore Database** → Create database → start in **production mode** (real rules are provided in `firestore.rules`, not test-mode open rules).
- **Storage** → Get started → also production mode.

## 4. Environment variables

Create `.env.local` in your project root (Next.js auto-loads this):

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Server-side only, used by app/api/* (ported from your original Vercel
# functions — powers the AI Planner, live news feed, and place-info lookups
# on the real homepage at /legacy/index.html and /legacy/report.html)
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-120b
CRON_SECRET=pick_a_random_secret
```

Get the Firebase values from **Project settings → General → Your apps → SDK setup and configuration**.
Get a Groq key from https://console.groq.com.

`NEXT_PUBLIC_*` vars are safe to expose client-side (required for Firebase web config).
`GROQ_API_KEY` and `CRON_SECRET` are server-only and never sent to the browser.

**Also fill in `public/legacy/js/firebase-config.js`** with the same Firebase
values — the static legacy pages (`index.html` etc.) have no build step, so
they can't read `.env.local`. That file is how the nav bar's Login/My Account
state stays in sync between the static pages and the React pages.

`.env.local` is already gitignored — do not commit it. For deployment
(Vercel etc.), add the same variables in your hosting provider's Environment
Variables settings.

## 5. Deploy the security rules

Install the Firebase CLI once:

```bash
npm install -g firebase-tools
firebase login
firebase init firestore storage   # point it at firestore.rules and storage.rules from this project
firebase deploy --only firestore:rules,storage:rules
```

(Or paste the contents of `firestore.rules` / `storage.rules` directly into
Firebase Console → Firestore → Rules / Storage → Rules and click Publish.)

## 6. Run it

```bash
npm run dev
```

`http://localhost:3000` redirects to `/legacy/index.html` — your real
original homepage, served as-is. `/login`, `/signup`, `/my-account` are the
new React/Firebase pages.

## 7. The separate Express/MongoDB backend

Partner signup, listings, admin dashboard, and bookings (`listing.html`,
`partner-auth.html`, `partner-dashboard.html`, `admin-dashboard.html`) still
call your original Express + MongoDB backend — that was never part of this
migration and needs to run separately, same as before. It lives in
`../legacy-static-site/backend/`. See that folder's own README for how to
run/deploy it.

## 8. Wire up AI trip saving (for trips generated via the new React pages)

Wherever your AI Calendar/Planner finishes generating a plan (client
component, after the API call resolves):

```jsx
import { saveTripToFirebase } from "@/utils/saveTripToFirebase";
import { useAuth } from "@/lib/AuthContext";

const { user } = useAuth();
// ... after AI response arrives as `aiOutput`:
if (user) {
  await saveTripToFirebase(user.uid, aiOutput);
}
```

Not yet wired into the original `report.html`/`calendar.js` wizard flow —
see the top-level `README.md` for what that would take.

## Notes on the security model

- `posts` are public-read (community feed is meant to be seen by everyone),
  but only the authenticated author can create/edit/delete their own post —
  `userId` is checked against `request.auth.uid` server-side, not trusted
  from the client.
- `trips` are private — only the owning user can read or write their own
  trips.
- Storage uploads are scoped to `profile-pictures/{uid}/...` and
  `posts/{uid}/...` — a user can only write into their own folder, enforced
  by the rules, not just the UI.
