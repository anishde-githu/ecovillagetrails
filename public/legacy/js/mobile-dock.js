// public/legacy/js/mobile-dock.js
//
// Site-wide MOBILE-ONLY navigation. On phone-width screens (<=640px) this
// replaces the entire top navbar with a bottom "Dock" — icons magnify as a
// finger drags near them, echoing the macOS/ReactBits Dock component. On
// tablet/desktop this script does nothing (the existing top navbar and
// hamburger menu are untouched — see css/style.css's 980px breakpoint).
//
// Self-contained by design: works identically on every legacy page (index,
// place, book, listing, report, partner-auth, partner-dashboard,
// admin-dashboard) without needing each page's own JS/markup touched.
// Reuses the same Firebase project as auth-nav.js to show "Account" as
// Login vs My Account — but degrades gracefully to "Login" on pages that
// haven't loaded the Firebase compat SDK.

(function () {
  const ICONS = {
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
    sparkle: '<path d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6z"/>',
    cloud: '<path d="M7 16a4 4 0 0 1 .3-8 5 5 0 0 1 9.5 1.6A3.5 3.5 0 0 1 16 16H7z"/>',
    user: '<circle cx="12" cy="8.5" r="3.6"/><path d="M4.5 20c1-4.2 4-6.4 7.5-6.4S18.5 15.8 19.5 20"/>',
    chat: '<path d="M4 5h16v11H8l-4 4V5z"/>',
  };

  // Task 9 spec: Home | AI Planner | Weather | My Account | Ask AI.
  // Weather and Ask AI trigger the existing widgets in place when they're
  // present on the current page (no reload); otherwise they hop to the
  // homepage with a hash that auto-opens the widget once it lands there
  // (see the matching hash checks added to weather.js and main.js).
  const ITEMS = [
    { key: "home", label: "Home", icon: "home", href: "/legacy/index.html" },
    { key: "plan", label: "AI Planner", icon: "sparkle", href: "/legacy/index.html#planner" },
    { key: "weather", label: "Weather", icon: "cloud", action: "weather" },
    { key: "account", label: "My Account", icon: "user", href: "/login" },
    { key: "ask-ai", label: "Ask AI", icon: "chat", action: "ask-ai" },
  ];

  function build() {
    const dock = document.createElement("nav");
    dock.className = "ecv-dock";
    dock.setAttribute("aria-label", "Mobile navigation");

    ITEMS.forEach((item) => {
      const el = document.createElement(item.action ? "button" : "a");
      el.className = "ecv-dock-item";
      if (item.action) {
        el.type = "button";
        el.addEventListener("click", () => handleAction(item.action));
      } else {
        el.href = item.href;
      }
      el.dataset.key = item.key;
      el.innerHTML = `
        <span class="ecv-dock-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${ICONS[item.icon]}</svg>
        </span>
        <span class="ecv-dock-label">${item.label}</span>
      `;
      dock.appendChild(el);
    });

    document.body.appendChild(dock);
    markActive(dock);
    wireMagnify(dock);
    wireAccountLink(dock);
  }

  function handleAction(action) {
    if (action === "weather") {
      const btn = document.getElementById("navWeatherBtn");
      if (btn && btn.style.display !== "none") {
        btn.click();
      } else {
        location.href = "/legacy/index.html#openWeather";
      }
    } else if (action === "ask-ai") {
      const toggle = document.getElementById("askAiToggle");
      if (toggle) {
        toggle.click();
      } else {
        location.href = "/legacy/index.html#openAskAI";
      }
    }
  }

  function markActive(dock) {
    const path = location.pathname.replace(/\/index\.html$/, "/").toLowerCase();
    dock.querySelectorAll(".ecv-dock-item[href]").forEach((el) => {
      const href = el.getAttribute("href").split("#")[0].replace(/\/index\.html$/, "/").toLowerCase();
      if (href && path.endsWith(href.replace(/^\/legacy/, "").replace(/^\//, "/"))) {
        el.classList.add("is-active");
      }
    });
    // Simple fallback: mark Home active only on the homepage itself.
    if (path === "/legacy/" || path === "/legacy/index.html" || path === "/") {
      const home = dock.querySelector('[data-key="home"]');
      if (home) home.classList.add("is-active");
    }
  }

  // Touch/mouse-proximity magnification, ported from the ReactBits Dock
  // concept: each icon scales up based on how close the pointer is to its
  // center, tapering off smoothly — works with both touchmove (phones) and
  // mousemove (for anyone testing on a touchpad/trackpad in a narrow window).
  function wireMagnify(dock) {
    const items = Array.from(dock.querySelectorAll(".ecv-dock-item"));
    const MAX_SCALE = 1.35;
    const FALLOFF = 70; // px

    function apply(clientX) {
      items.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const center = rect.left + rect.width / 2;
        const dist = Math.abs(clientX - center);
        const scale = dist > FALLOFF ? 1 : 1 + (MAX_SCALE - 1) * (1 - dist / FALLOFF);
        el.style.transform = `translateY(${scale > 1 ? -(scale - 1) * 18 : 0}px) scale(${scale})`;
      });
    }
    function reset() {
      items.forEach((el) => (el.style.transform = ""));
    }

    dock.addEventListener("touchmove", (e) => apply(e.touches[0].clientX), { passive: true });
    dock.addEventListener("touchend", reset);
    dock.addEventListener("touchcancel", reset);
    dock.addEventListener("mousemove", (e) => apply(e.clientX));
    dock.addEventListener("mouseleave", reset);
  }

  function wireAccountLink(dock) {
    const accountEl = dock.querySelector('[data-key="account"]');
    if (!accountEl || !window.firebase || !firebase.apps || !firebase.apps.length) return;
    try {
      firebase.auth().onAuthStateChanged((user) => {
        if (user) {
          accountEl.href = "/my-account";
          accountEl.querySelector(".ecv-dock-label").textContent = "My Account";
        } else {
          accountEl.href = "/login";
          accountEl.querySelector(".ecv-dock-label").textContent = "Login";
        }
      });
    } catch (err) {
      // Firebase not fully initialized on this page yet — leave default /login link.
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
