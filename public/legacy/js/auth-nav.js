// public/legacy/js/auth-nav.js
//
// Swaps the nav's "Login" link for "My Account" (+ avatar) when the visitor
// is signed in, using the Firebase compat SDK — no build step required for
// this static page. Uses the same Firebase project as the Next.js app
// (config in firebase-config.js), so a login on either side is reflected on
// both.

(function () {
  if (!window.firebase || !window.ECV_FIREBASE_CONFIG) return;

  if (!firebase.apps.length) {
    firebase.initializeApp(window.ECV_FIREBASE_CONFIG);
  }

  const navItem = document.getElementById("ecvAuthNavItem");
  if (!navItem) return;

  firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
      const name = user.displayName || user.email || "My Account";
      navItem.innerHTML =
        '<a href="/my-account" style="display:flex;align-items:center;gap:6px;">' +
        (user.photoURL
          ? '<img src="' + user.photoURL + '" alt="" style="width:22px;height:22px;border-radius:50%;object-fit:cover;">'
          : "") +
        "My Account</a>";
    } else {
      navItem.innerHTML = '<a href="/login">Login</a>';
    }
  });
})();
