// public/legacy/js/firebase-config.js
//
// The static legacy pages (index.html etc.) have no build step, so they can't
// read the Next.js app's .env.local like the React pages do. Fill in the SAME
// values you put in ecovillage-nextjs/.env.local here so the nav bar's
// Login/My Account state stays in sync across both the static site and the
// React app (they're the same Firebase project either way).

window.ECV_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCHkzAdkIJaHhThh_t23YEeg_2ov5buV_g",
  authDomain: "eco-village-trails.firebaseapp.com",
  projectId: "eco-village-trails",
  storageBucket: "eco-village-trails.firebasestorage.app",
  messagingSenderId: "619894359188",
  appId: "1:619894359188:web:1e77b765f1184100ce2081",
};
