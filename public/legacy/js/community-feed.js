// public/legacy/js/community-feed.js
//
// Renders the "Community Experiences" carousel on the real homepage using
// the Firebase compat SDK (same pattern as auth-nav.js — no build step
// needed for this static page). Fetches the latest stories from the
// `posts` Firestore collection (written by the My Account > My Stories >
// Add Story wizard on the Next.js /my-account page) and displays them as a
// horizontal scrolling carousel with a click-to-expand modal that shows the
// full photo gallery, description, and (for stories from the wizard) the
// traveller's underlying Q&A answers.
//
// Older, simpler posts (single image, plain review, no `images`/`answers`)
// still render correctly — every extra field is optional.

(function () {
  if (!window.firebase || !window.ECV_FIREBASE_CONFIG) return;

  if (!firebase.apps.length) {
    firebase.initializeApp(window.ECV_FIREBASE_CONFIG);
  }

  const db = firebase.firestore();
  const track = document.getElementById("ecvCommunityTrack");
  const section = document.getElementById("community-experiences");
  const modal = document.getElementById("ecvPostModal");
  if (!track || !section) return;

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }

  function getImages(post) {
    return Array.isArray(post.images) && post.images.length ? post.images : [post.imageURL];
  }

  function renderCard(post) {
    const images = getImages(post);
    const card = document.createElement("button");
    card.type = "button";
    card.className = "ecv-post-card";
    card.innerHTML = `
      <div class="ecv-post-card-media">
        <img src="${escapeHtml(images[0])}" alt="${escapeHtml(post.location)}" loading="lazy">
        ${images.length > 1 ? `<span class="ecv-post-card-photocount">${images.length} photos</span>` : ""}
      </div>
      <div class="ecv-post-card-body">
        <div class="ecv-post-card-user">
          ${
            post.userPhoto
              ? `<img class="ecv-avatar" src="${escapeHtml(post.userPhoto)}" alt="">`
              : `<span class="ecv-avatar ecv-avatar-fallback"></span>`
          }
          <span class="ecv-post-card-name">${escapeHtml(post.userName || "Explorer")}</span>
        </div>
        <p class="ecv-post-card-location">
          📍 ${escapeHtml(post.location)}
          ${post.category ? `<span class="ecv-post-card-cat">${escapeHtml(post.category)}</span>` : ""}
        </p>
        <p class="ecv-post-card-review">${escapeHtml(post.review)}</p>
      </div>
    `;
    card.addEventListener("click", () => openModal(post));
    return card;
  }

  function qaRow(label, value) {
    if (!value) return "";
    return `
      <div class="ecv-post-modal-qa-row">
        <p>${escapeHtml(label)}</p>
        <p>${escapeHtml(value)}</p>
      </div>
    `;
  }

  function openModal(post) {
    if (!modal) return;
    const images = getImages(post);
    const answers = post.answers || null;

    const galleryHtml =
      images.length > 1
        ? `<div class="ecv-post-modal-gallery">${images
            .map((src) => `<img src="${escapeHtml(src)}" alt="${escapeHtml(post.location)}">`)
            .join("")}</div>
           <p class="ecv-post-modal-swipe-hint">Swipe for ${images.length} photos</p>`
        : `<img src="${escapeHtml(images[0])}" alt="${escapeHtml(post.location)}">`;

    const qaHtml = answers
      ? `
        <div class="ecv-post-modal-qa">
          <h4>In ${escapeHtml((post.userName || "their").split(" ")[0])} own words</h4>
          ${qaRow("When did they visit?", answers.whenVisited)}
          ${qaRow("Tips for future travellers", answers.tips)}
          ${qaRow("Best time to visit", answers.bestTime)}
          ${qaRow("Would they recommend it?", answers.recommend)}
        </div>
      `
      : "";

    modal.innerHTML = `
      <div class="ecv-post-modal-backdrop">
        <div class="ecv-post-modal-card">
          <button type="button" class="ecv-post-modal-close" aria-label="Close">&times;</button>
          ${galleryHtml}
          <div class="ecv-post-modal-body">
            <div class="ecv-post-card-user">
              ${
                post.userPhoto
                  ? `<img class="ecv-avatar" src="${escapeHtml(post.userPhoto)}" alt="">`
                  : `<span class="ecv-avatar ecv-avatar-fallback"></span>`
              }
              <span class="ecv-post-card-name">${escapeHtml(post.userName || "Explorer")}</span>
            </div>
            <div class="ecv-post-modal-meta">
              <span>📍 ${escapeHtml(post.location)}</span>
              ${post.category ? `<span class="ecv-post-card-cat">${escapeHtml(post.category)}</span>` : ""}
              ${post.usedAI ? `<span class="ecv-post-modal-ai-badge">✨ AI-assisted description</span>` : ""}
            </div>
            <p class="ecv-post-modal-review">${escapeHtml(post.review)}</p>
            ${qaHtml}
          </div>
        </div>
      </div>
    `;
    modal.style.display = "block";
    modal.querySelector(".ecv-post-modal-close").addEventListener("click", closeModal);
    modal.querySelector(".ecv-post-modal-backdrop").addEventListener("click", (e) => {
      if (e.target.classList.contains("ecv-post-modal-backdrop")) closeModal();
    });
  }

  function closeModal() {
    if (!modal) return;
    modal.style.display = "none";
    modal.innerHTML = "";
  }

  async function loadPosts() {
    try {
      const snap = await db
        .collection("posts")
        .orderBy("createdAt", "desc")
        .limit(12)
        .get();

      if (snap.empty) {
        section.style.display = "none"; // nothing posted yet — hide the section rather than show empty
        return;
      }

      track.innerHTML = "";
      snap.forEach((doc) => track.appendChild(renderCard(doc.data())));

      // Gentle auto-scroll loop, same behavior as before
      setInterval(() => {
        if (!track) return;
        const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 5;
        if (atEnd) track.scrollTo({ left: 0, behavior: "smooth" });
        else track.scrollBy({ left: 300, behavior: "smooth" });
      }, 3500);
    } catch (err) {
      console.error("Community feed failed to load:", err);
      section.style.display = "none";
    }
  }

  loadPosts();
})();
