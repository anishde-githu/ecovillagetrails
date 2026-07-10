/* =====================================================================
   js/homepage-listings.js
   Renders the 3 partner sections on index.html:
   #listings-hotel, #listings-agent, #listings-guide
   Each links a card to listing.html?id=... on click.
   Depends on js/partners-api.js being loaded first (for Api, CATEGORY_*).
   ===================================================================== */

(function () {
  const SECTIONS = [
    { category: 'hotel', gridId: 'listings-hotel', emptyText: 'No hotels listed yet — check back soon!' },
    { category: 'agent', gridId: 'listings-agent', emptyText: 'No travel agents listed yet — check back soon!' },
    { category: 'guide', gridId: 'listings-guide', emptyText: 'No local guides listed yet — check back soon!' },
  ];

  document.addEventListener('DOMContentLoaded', () => {
    SECTIONS.forEach(loadSection);
  });

  async function loadSection({ category, gridId, emptyText }) {
    const grid = document.getElementById(gridId);
    if (!grid) return; // section not present on this page, skip quietly

    grid.innerHTML = skeletonCards(3);

    try {
      const { listings } = await Api.listListings(category);
      if (!listings.length) {
        grid.innerHTML = `<p class="pl-empty">${emptyText}</p>`;
        return;
      }
      grid.innerHTML = listings.map(cardHtml).join('');
    } catch (err) {
      console.error(`Failed to load ${category} listings:`, err);
      grid.innerHTML = `<p class="pl-empty">Couldn't load listings right now.</p>`;
    }
  }

  function cardHtml(listing) {
    const cover = listing.images && listing.images[listing.coverImageIndex || 0];
    const imgUrl = cover ? cover.url : '';
    const priceFrom = listing.offerings && listing.offerings.length
      ? Math.min(...listing.offerings.map(o => o.price))
      : null;

    return `
      <a class="pl-card" href="listing.html?id=${listing._id}">
        <div class="pl-card-img" style="${imgUrl ? `background-image:url('${imgUrl}')` : ''}">
          ${!imgUrl ? `<span class="pl-card-icon">${CATEGORY_ICONS[listing.category]}</span>` : ''}
        </div>
        <div class="pl-card-body">
          <span class="pl-card-tag">${CATEGORY_ICONS[listing.category]} ${escapeHtml(listing.region)}</span>
          <h3>${escapeHtml(listing.name)}</h3>
          <p>${escapeHtml(listing.tagline || '')}</p>
          <div class="pl-card-foot">
            ${listing.reviewCount ? `<span>⭐ ${listing.avgRating} (${listing.reviewCount})</span>` : '<span></span>'}
            ${priceFrom !== null ? `<strong>From ₹${priceFrom}</strong>` : ''}
          </div>
        </div>
      </a>
    `;
  }

  function skeletonCards(n) {
    return Array.from({ length: n }).map(() => `
      <div class="pl-card pl-skeleton">
        <div class="pl-card-img"></div>
        <div class="pl-card-body">
          <div class="pl-skel-line short"></div>
          <div class="pl-skel-line"></div>
          <div class="pl-skel-line"></div>
        </div>
      </div>
    `).join('');
  }

  function escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
})();
