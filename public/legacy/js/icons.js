/* =====================================================================
   js/icons.js
   Small shared library of inline SVG icons (stroke-based, currentColor)
   used across the site in place of emoji. Usage:
     Icons.get('leaf', 16)  -> returns an <svg> string
   ===================================================================== */

(function (global) {
  const PATHS = {
    // people / planner
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>',
    route: '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7"/>',
    wallet: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/><circle cx="16.5" cy="14.5" r="1"/>',
    activity: '<path d="M13 3 L7 14h5l-1 7 7-11h-5z"/>',
    heart: '<path d="M12 20s-7-4.35-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 5c-2.5 4.65-9.5 9-9.5 9z"/>',
    chat: '<path d="M4 5h16v11H8l-4 4V5z"/>',

    // calendar sidebar
    "calendar-star": '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M8 2v6M16 2v6"/><path d="M12 13l1 2 2 .3-1.5 1.5.4 2-1.9-1-1.9 1 .4-2L9 15.3l2-.3z"/>',
    "calendar-check": '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M8 2v6M16 2v6"/><path d="M9 15l2 2 4-4"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
    sparkle: '<path d="M12 2l1.8 5.6L19 9l-5.2 1.4L12 16l-1.8-5.6L5 9l5.2-1.4z"/><path d="M19 15l.7 2.1L22 18l-2.3.9L19 21l-.7-2.1L16 18l2.3-.9z"/>',
    "cloud-sun": '<circle cx="8" cy="8" r="2.5"/><path d="M8 2.5v1.5M8 12v1.5M2.5 8H4M12 8h1.5M4.2 4.2l1 1M10.8 4.2l-1 1"/><path d="M9 19a4 4 0 0 1 .3-8 5 5 0 0 1 9.5 1.6A3.5 3.5 0 0 1 18 19H9z"/>',
    newspaper: '<rect x="3" y="5" width="13" height="15" rx="1"/><path d="M6 9h7M6 12h7M6 15h4"/><path d="M16 8h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H8"/>',

    // news categories
    compass: '<circle cx="12" cy="12" r="9"/><path d="M15 9l-2 6-6 2 2-6z"/>',
    cloud: '<path d="M7 18a4 4 0 0 1 .3-8 5 5 0 0 1 9.5 1.6A3.5 3.5 0 0 1 16 18H7z"/>',
    alert: '<path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17h.01"/>',
    leaf: '<path d="M20 4C10 4 4 10 4 18c0 1 0 2 1 2 8 0 14-6 14-14 0-1 0-2 1-2z"/><path d="M9 15c4-1 7-4 8-8"/>',
    paw: '<circle cx="7" cy="8" r="2"/><circle cx="12" cy="6" r="2"/><circle cx="17" cy="8" r="2"/><path d="M7 14c0-2 2-3 5-3s5 1 5 3-2 5-5 5-5-3-5-5z"/>',
    tree: '<path d="M12 3l5 7h-3l4 6h-4v5h-4v-5H6l4-6H7z"/>',
    train: '<rect x="5" y="4" width="14" height="12" rx="3"/><path d="M5 12h14M9 20l-2 2M15 20l2 2"/><circle cx="9" cy="14" r="0.6"/><circle cx="15" cy="14" r="0.6"/>',
    bed: '<path d="M3 18v-6a2 2 0 0 1 2-2h5v4"/><path d="M3 18h18v-3a2 2 0 0 0-2-2h-8"/><path d="M3 18v3M21 15v6"/><circle cx="7" cy="10" r="1.4"/>',
    landmark: '<path d="M4 21h16M5 21V10M19 21V10M3 10l9-6 9 6M9 21v-7M15 21v-7"/>',

    // hidden gems categories
    mountain: '<path d="M3 20l6-11 4 6 3-4 5 9z"/>',
    wave: '<path d="M2 15c2-2 4-2 6 0s4 2 6 0 4-2 6 0 4-2 6 0"/><path d="M2 20c2-2 4-2 6 0s4 2 6 0 4-2 6 0 4-2 6 0"/>',
    forest: '<path d="M8 3l4 6H9l4 6H9l4 7"/><path d="M16 7l3 5h-2.2l3 5H16"/>',
    monument: '<path d="M12 2l7 5H5z"/><path d="M6 10v9M10 10v9M14 10v9M18 10v9M4 21h16"/>',
    snow: '<path d="M12 3v18M4.5 7.5l15 9M19.5 7.5l-15 9"/>',
    discover: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',

    // partners / listings
    building: '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 8h1M14 8h1M9 12h1M14 12h1M9 16h1M14 16h1"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    "map-pin": '<path d="M12 21s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="9" r="2.3"/>',

    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    arrow: '<path d="M9 18l6-6-6-6"/>',
    "external-link": '<path d="M14 4h6v6"/><path d="M20 4L10 14"/><path d="M19 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6"/>',

    // weather broadcast
    "cloud-rain": '<path d="M7 16a4 4 0 0 1 .3-8 5 5 0 0 1 9.5 1.6A3.5 3.5 0 0 1 16 16H7z"/><path d="M8 19l-1 2M12 19l-1 2M16 19l-1 2"/>',
    "cloud-moon": '<path d="M9 16a4 4 0 0 1 .3-8 5 5 0 0 1 9.5 1.6A3.5 3.5 0 0 1 18 16H9z"/><path d="M6.5 5.2A3.6 3.6 0 1 0 9.8 9.9"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    droplet: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
    wind: '<path d="M3 8h11a2.5 2.5 0 1 0-2.4-3.2"/><path d="M3 12h15a2.5 2.5 0 1 1-2.4 3.2"/><path d="M3 16h8a2 2 0 1 1-1.8 2.8"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
    thermometer: '<path d="M12 3a2 2 0 0 0-2 2v9.5a4 4 0 1 0 4 0V5a2 2 0 0 0-2-2z"/><path d="M12 15V8"/>',
    gauge: '<circle cx="12" cy="13" r="8"/><path d="M12 13l3.5-3.5M9 6.5l.5.9M15 6.5l-.5.9"/>',
    sunrise: '<path d="M12 3v4M5 11h14M6.5 6.5l1.4 1.4M17.5 6.5l-1.4 1.4"/><path d="M5 15a7 7 0 0 1 14 0"/><path d="M3 19h18"/>',
    sunset: '<path d="M12 4v4M5 11h14M6.5 6.5l1.4 1.4M17.5 6.5l-1.4 1.4"/><path d="M5 15a7 7 0 0 1 14 0"/><path d="M3 19h18"/>',
    map: '<path d="M9 3 3 5v16l6-2 6 2 6-2V3l-6 2-6-2z"/><path d="M9 3v16M15 5v16"/>',
  };

  function get(name, size) {
    size = size || 16;
    const inner = PATHS[name] || PATHS.sparkle;
    return (
      '<svg class="icon icon-' + name + '" viewBox="0 0 24 24" width="' + size +
      '" height="' + size +
      '" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      inner + "</svg>"
    );
  }

  function hydrate(root) {
    (root || document).querySelectorAll("[data-icon]").forEach((el) => {
      const name = el.getAttribute("data-icon");
      const size = Number(el.getAttribute("data-icon-size")) || 18;
      el.innerHTML = get(name, size);
      el.classList.add("h-icon-ready");
    });
  }

  global.Icons = { get: get, PATHS: PATHS, hydrate: hydrate };
  document.addEventListener("DOMContentLoaded", () => hydrate(document));
})(window);
