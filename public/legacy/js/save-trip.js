// public/legacy/js/save-trip.js
//
// Hooks into the original report.html AI Planner flow — reads the same
// sessionStorage payload report.js reads (`ecoTripReport`) and saves it to
// Firestore's `trips` collection, tagged with the logged-in user's uid, so
// it shows up in My Trips on /my-account. Runs independently of report.js
// (doesn't touch its internals) to keep this additive and low-risk.
//
// If no one's logged in, it does nothing — the trip still displays normally
// via report.js, it just won't be saved until the user logs in.

(function () {
  if (!window.firebase || !window.ECV_FIREBASE_CONFIG) return;

  const raw = sessionStorage.getItem("ecoTripReport");
  if (!raw) return; // nothing generated this session

  if (!firebase.apps.length) {
    firebase.initializeApp(window.ECV_FIREBASE_CONFIG);
  }

  // Cheap hash of the payload so reloading/revisiting report.html with the
  // SAME generated plan doesn't create duplicate Firestore documents, while
  // a genuinely new plan (different content) still saves as a new trip.
  function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return String(hash);
  }
  const savedKey = "ecoTripReport_saved_" + hashString(raw);
  if (sessionStorage.getItem(savedKey)) return; // already saved this exact plan

  firebase.auth().onAuthStateChanged(function (user) {
    if (!user) return; // not logged in — skip silently, don't block the report from displaying

    try {
      const data = JSON.parse(raw);
      const fd = data.formData || {};
      const trip = fd.trip || {};
      const destination = data.destination || trip.destination || "Your Destination";
      const title = `${destination} Trip`;

      firebase
        .firestore()
        .collection("trips")
        .add({
          userId: user.uid,
          title,
          destination,
          startDate: trip.travelDate || null,
          endDate: trip.returnDate || null,
          totalBudget: (fd.budget && fd.budget.budget) || null,
          // Structured fields left empty here — the original AI Planner
          // output is markdown, not the card-shaped JSON the React planner
          // produces. Full fidelity is preserved via rawMarkdown/formData
          // below instead. TripDetail on /my-account renders rawMarkdown
          // as a fallback when these are empty, so nothing is lost.
          budgetBreakdown: [],
          dayWiseItinerary: [],
          hotelSuggestions: [],
          activityCards: [],
          feedCards: [],
          images: [],
          rawMarkdown: data.markdown || "",
          formData: fd,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        })
        .then(function () {
          sessionStorage.setItem(savedKey, "1");
        })
        .catch(function (err) {
          console.error("[EcoVillage] Failed to save trip to Firestore:", err);
        });
    } catch (err) {
      console.error("[EcoVillage] Failed to parse/save trip report:", err);
    }
  });
})();
