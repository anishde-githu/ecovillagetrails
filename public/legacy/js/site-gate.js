// public/legacy/js/site-gate.js
//
// Mandatory login gate: shown full-screen, on top of everything, ONLY once
// Firebase has confirmed the visitor is signed out. Blocks interaction with
// the site underneath until the visitor logs in (or signs up). On
// successful auth, the gate animates away (fade + scale), revealing the
// already-loaded homepage underneath.
//
// Uses the Firebase compat SDK (same as auth-nav.js / community-feed.js) so
// this needs no build step. Reuses the existing hero video as the
// background and a green glassmorphism panel for the form, matching the
// site's visual language.

(function () {
  if (!window.firebase || !window.ECV_FIREBASE_CONFIG) return;

  if (!firebase.apps.length) {
    firebase.initializeApp(window.ECV_FIREBASE_CONFIG);
  }

  const auth = firebase.auth();
  let gate = null;

  // IMPORTANT: we don't build/insert the gate until Firebase has told us
  // the visitor is actually signed out. onAuthStateChanged's first callback
  // can take a beat to fire while it restores a persisted session —
  // inserting the gate eagerly on every page load and hiding it afterwards
  // (the old behavior) caused a visible "flash" of the login screen on
  // every reload, even for already-logged-in visitors. Waiting for the
  // first callback means logged-in visitors never see the gate at all, and
  // logged-out visitors see it appear exactly once, with no flash-then-hide.
  auth.onAuthStateChanged((user) => {
    if (user) {
      if (gate) hideGate();
    } else if (!gate) {
      buildGate();
    }
  });

  function buildGate() {
    gate = document.createElement("div");
    gate.id = "ecvSiteGate";
    gate.innerHTML = `
      <video class="ecv-gate-video" src="/legacy/assets/coverved.mp4" autoplay muted loop playsinline></video>
      <div class="ecv-gate-scrim"></div>
      <div class="ecv-gate-panel">
        <div class="ecv-gate-brand">
          <h1>🌿 EcoVillage<br>Trails</h1>
          <p>Real villages. Real families. Real impact — every stay here directly
             supports the communities you visit, not a hotel chain.</p>
          <ul class="ecv-gate-points">
            <li>🌱 12+ partner villages across Bengal &amp; beyond</li>
            <li>🏡 340+ host families welcoming travellers</li>
            <li>♻️ 100% renewable-powered stays</li>
          </ul>
        </div>
        <div class="ecv-gate-form-wrap">
          <h2 id="ecvGateTitle">Log in to continue</h2>
          <p id="ecvGateSubtitle">One account gets you the AI planner, your saved trips, and the community feed.</p>

          <button type="button" id="ecvGateGoogleBtn" class="ecv-gate-google-btn">
            <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 01-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 009 18z"/><path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 013.68 9c0-.59.1-1.17.27-1.7V4.97H.96A9 9 0 000 9c0 1.45.35 2.83.96 4.03l2.99-2.33z"/><path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A8.6 8.6 0 009 0 9 9 0 00.96 4.97l2.99 2.33C4.66 5.17 6.65 3.58 9 3.58z"/></svg>
            Continue with Google
          </button>

          <div class="ecv-gate-divider"><span>or</span></div>

          <form id="ecvGateForm">
            <div id="ecvGateNameWrap" style="display:none;">
              <input type="text" id="ecvGateName" placeholder="Full name" autocomplete="name">
            </div>
            <input type="email" id="ecvGateEmail" placeholder="Email address" required autocomplete="email">
            <input type="password" id="ecvGatePassword" placeholder="Password" required autocomplete="current-password" minlength="6">
            <p id="ecvGateError" class="ecv-gate-error"></p>
            <button type="submit" id="ecvGateSubmitBtn" class="ecv-gate-submit-btn">Log in</button>
          </form>

          <p class="ecv-gate-toggle">
            <span id="ecvGateToggleText">New here?</span>
            <button type="button" id="ecvGateToggleBtn">Create an account</button>
          </p>
        </div>
      </div>
    `;

    if (!document.getElementById("ecvSiteGateStyle")) {
      const style = document.createElement("style");
      style.id = "ecvSiteGateStyle";
      style.textContent = `
        #ecvSiteGate{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;overflow:hidden;transition:opacity .6s ease, transform .6s ease;}
        #ecvSiteGate.ecv-gate-hidden{opacity:0;transform:scale(1.04);pointer-events:none;}
        .ecv-gate-video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
        .ecv-gate-scrim{position:absolute;inset:0;background:linear-gradient(135deg,rgba(6,40,30,0.75),rgba(6,60,40,0.55));}
        .ecv-gate-panel{position:relative;z-index:1;width:min(920px,92vw);max-height:88vh;overflow:auto;display:grid;grid-template-columns:1fr 1fr;background:rgba(255,255,255,0.10);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);border:1px solid rgba(255,255,255,0.25);border-radius:24px;box-shadow:0 20px 60px rgba(0,0,0,0.35);}
        @media (max-width:760px){.ecv-gate-panel{grid-template-columns:1fr;}}
        .ecv-gate-brand{padding:40px 36px;color:#fff;display:flex;flex-direction:column;justify-content:center;border-right:1px solid rgba(255,255,255,0.15);}
        @media (max-width:760px){.ecv-gate-brand{border-right:none;border-bottom:1px solid rgba(255,255,255,0.15);padding:32px 28px;}}
        .ecv-gate-brand h1{font-size:32px;line-height:1.15;margin:0 0 14px;font-weight:800;}
        .ecv-gate-brand p{font-size:14px;line-height:1.6;opacity:0.9;margin:0 0 18px;}
        .ecv-gate-points{list-style:none;padding:0;margin:0;font-size:13.5px;line-height:2;opacity:0.95;}
        .ecv-gate-form-wrap{padding:40px 36px;display:flex;flex-direction:column;justify-content:center;}
        @media (max-width:760px){.ecv-gate-form-wrap{padding:28px;}}
        .ecv-gate-form-wrap h2{color:#fff;font-size:22px;margin:0 0 6px;font-weight:700;}
        .ecv-gate-form-wrap > p{color:rgba(255,255,255,0.75);font-size:13px;margin:0 0 20px;}
        .ecv-gate-google-btn{width:100%;display:flex;align-items:center;justify-content:center;gap:10px;background:rgba(255,255,255,0.92);border:none;border-radius:12px;padding:12px;font-weight:600;font-size:14px;cursor:pointer;color:#1f2937;}
        .ecv-gate-divider{display:flex;align-items:center;gap:10px;margin:18px 0;color:rgba(255,255,255,0.6);font-size:12px;text-transform:uppercase;letter-spacing:.05em;}
        .ecv-gate-divider::before,.ecv-gate-divider::after{content:"";flex:1;height:1px;background:rgba(255,255,255,0.25);}
        #ecvGateForm{display:flex;flex-direction:column;gap:12px;}
        #ecvGateForm input{width:100%;padding:12px 14px;border-radius:12px;border:1px solid rgba(255,255,255,0.3);background:rgba(255,255,255,0.12);color:#fff;font-size:14px;outline:none;}
        #ecvGateForm input::placeholder{color:rgba(255,255,255,0.65);}
        #ecvGateForm input:focus{border-color:#6ee7b7;background:rgba(255,255,255,0.18);}
        .ecv-gate-error{color:#fecaca;font-size:12.5px;margin:0;min-height:16px;}
        .ecv-gate-submit-btn{background:#059669;color:#fff;border:none;border-radius:12px;padding:12px;font-weight:700;font-size:14px;cursor:pointer;margin-top:4px;}
        .ecv-gate-submit-btn:disabled{opacity:0.6;cursor:default;}
        .ecv-gate-toggle{margin-top:16px;color:rgba(255,255,255,0.75);font-size:13px;text-align:center;}
        .ecv-gate-toggle button{background:none;border:none;color:#6ee7b7;font-weight:600;cursor:pointer;font-size:13px;padding:0;margin-left:4px;}
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(gate);
    document.body.style.overflow = "hidden"; // block scrolling the page behind the gate

    let mode = "login"; // or "signup"

    const nameWrap = gate.querySelector("#ecvGateNameWrap");
    const nameInput = gate.querySelector("#ecvGateName");
    const emailInput = gate.querySelector("#ecvGateEmail");
    const passwordInput = gate.querySelector("#ecvGatePassword");
    const errorEl = gate.querySelector("#ecvGateError");
    const submitBtn = gate.querySelector("#ecvGateSubmitBtn");
    const titleEl = gate.querySelector("#ecvGateTitle");
    const subtitleEl = gate.querySelector("#ecvGateSubtitle");
    const toggleTextEl = gate.querySelector("#ecvGateToggleText");
    const toggleBtn = gate.querySelector("#ecvGateToggleBtn");
    const form = gate.querySelector("#ecvGateForm");
    const googleBtn = gate.querySelector("#ecvGateGoogleBtn");

    function setMode(next) {
      mode = next;
      const isSignup = mode === "signup";
      nameWrap.style.display = isSignup ? "block" : "none";
      nameInput.required = isSignup;
      titleEl.textContent = isSignup ? "Create your account" : "Log in to continue";
      subtitleEl.textContent =
        "One account gets you the AI planner, your saved trips, and the community feed.";
      submitBtn.textContent = isSignup ? "Create account" : "Log in";
      toggleTextEl.textContent = isSignup ? "Already have an account?" : "New here?";
      toggleBtn.textContent = isSignup ? "Log in" : "Create an account";
      errorEl.textContent = "";
    }

    toggleBtn.addEventListener("click", () => setMode(mode === "login" ? "signup" : "login"));

    function friendlyError(code) {
      const map = {
        "auth/invalid-credential": "Incorrect email or password.",
        "auth/email-already-in-use": "An account already exists with this email.",
        "auth/weak-password": "Password should be at least 6 characters.",
        "auth/popup-closed-by-user": "Google sign-in was cancelled.",
        "auth/configuration-not-found": "Sign-in isn't set up yet — contact the site owner.",
      };
      return (map[code] || "Something went wrong. Please try again.") + (code ? ` (${code})` : "");
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      errorEl.textContent = "";
      submitBtn.disabled = true;
      try {
        if (mode === "signup") {
          const cred = await auth.createUserWithEmailAndPassword(emailInput.value, passwordInput.value);
          await cred.user.updateProfile({ displayName: nameInput.value });
          await firebase.firestore().collection("users").doc(cred.user.uid).set({
            name: nameInput.value,
            email: emailInput.value,
            photoURL: "",
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          });
        } else {
          await auth.signInWithEmailAndPassword(emailInput.value, passwordInput.value);
        }
        // The onAuthStateChanged listener above handles closing the gate.
      } catch (err) {
        console.error("[EcoVillage gate] auth error:", err);
        errorEl.textContent = friendlyError(err.code);
        submitBtn.disabled = false;
      }
    });

    googleBtn.addEventListener("click", async () => {
      errorEl.textContent = "";
      try {
        const provider = new firebase.auth.GoogleAuthProvider();
        await auth.signInWithPopup(provider);
      } catch (err) {
        console.error("[EcoVillage gate] google error:", err);
        errorEl.textContent = friendlyError(err.code);
      }
    });
  }

  function hideGate() {
    if (!gate) return;
    gate.classList.add("ecv-gate-hidden");
    document.body.style.overflow = "";
    const toRemove = gate;
    gate = null;
    setTimeout(() => toRemove.remove(), 650); // matches the CSS transition duration
  }
})();
