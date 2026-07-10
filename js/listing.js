const params = new URLSearchParams(window.location.search);
  const listingId = params.get('id');
  const content = document.getElementById('content');

  function escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  async function init() {
    if (!listingId) { content.innerHTML = '<p class="p-empty">No listing specified.</p>'; return; }
    try {
      const [{ listing }, { reviews }] = await Promise.all([
        Api.getListing(listingId),
        Api.getListingReviews(listingId).catch(() => ({ reviews: [] })),
      ]);
      render(listing, reviews);
    } catch (err) {
      content.innerHTML = `<p class="p-empty">${escapeHtml(err.message)}</p>`;
    }
  }

  function render(listing, reviews) {
    document.title = `${listing.name} — EcoVillage Trails`;
    const images = listing.images && listing.images.length ? listing.images : [{ url: '' }];
    const coverIdx = listing.coverImageIndex || 0;

    content.innerHTML = `
      <div class="l-hero" id="heroImg">${images[coverIdx].url ? `<img src="${images[coverIdx].url}" alt="${escapeHtml(listing.name)}">` : ''}</div>
      ${images.length > 1 ? `<div class="l-thumbs">${images.map((img, i) => `<img src="${img.url}" class="${i === coverIdx ? 'active' : ''}" data-idx="${i}">`).join('')}</div>` : ''}

      <div class="l-grid">
        <div>
          <span class="p-badge approved">${CATEGORY_ICONS[listing.category]} ${CATEGORY_LABELS[listing.category]}</span>
          <h1 style="font-size:2rem;margin:12px 0 4px;">${escapeHtml(listing.name)}</h1>
          <p style="color:var(--ink-soft);">${escapeHtml(listing.tagline || '')} — 📍 ${escapeHtml(listing.region)}</p>
          ${listing.reviewCount ? `<p style="margin-top:8px;">⭐ ${listing.avgRating} (${listing.reviewCount} review${listing.reviewCount > 1 ? 's' : ''})</p>` : ''}

          <p style="margin:20px 0;line-height:1.7;">${escapeHtml(listing.description)}</p>

          ${listing.amenities?.length ? `<div class="l-amenities">${listing.amenities.map(a => `<span>${escapeHtml(a)}</span>`).join('')}</div>` : ''}

          <h2 style="font-size:1.2rem;margin:28px 0 10px;">${listing.category === 'hotel' ? 'Rooms' : listing.category === 'agent' ? 'Packages' : 'Experiences'}</h2>
          <div class="p-card" style="padding:20px 24px;">
            ${(listing.offerings || []).map(o => `
              <div class="l-offering">
                <span>${escapeHtml(o.name)}</span>
                <strong>₹${o.price} <span style="font-weight:400;color:var(--ink-soft);font-size:.85rem;">${escapeHtml(o.unit)}</span></strong>
              </div>
            `).join('') || '<p class="p-empty">No offerings listed yet.</p>'}
          </div>

          <h2 style="font-size:1.2rem;margin:28px 0 10px;">Reviews</h2>
          <div id="reviewsList">
            ${reviews.length ? reviews.map(r => `
              <div class="l-review">
                <strong>${escapeHtml(r.guestName)}</strong> — ⭐ ${r.rating}/5
                <p style="margin:4px 0 0;color:var(--ink-soft);">${escapeHtml(r.comment || '')}</p>
              </div>
            `).join('') : '<p class="p-empty">No reviews yet — be the first!</p>'}
          </div>
          <button class="p-btn p-btn-ghost" id="showReviewFormBtn" style="margin-top:12px;">Write a review</button>
          <form id="reviewForm" style="display:none;margin-top:16px;">
            <div class="p-row">
              <div class="p-field"><label>Your name</label><input id="rvName" required></div>
              <div class="p-field"><label>Your email</label><input id="rvEmail" type="email" required></div>
            </div>
            <div class="p-field"><label>Rating (1-5)</label><input id="rvRating" type="number" min="1" max="5" required></div>
            <div class="p-field"><label>Comment</label><textarea id="rvComment" rows="3"></textarea></div>
            <button type="submit" class="p-btn p-btn-primary">Submit review</button>
          </form>
        </div>

        <div class="p-card">
          <h2 style="font-size:1.2rem;margin-bottom:14px;">Enquire / Book</h2>
          <div id="bookingAlert" class="p-alert"></div>
          <form id="bookingForm">
            <div class="p-field"><label>Your name</label><input id="bkName" required></div>
            <div class="p-field"><label>Email</label><input id="bkEmail" type="email" required></div>
            <div class="p-field"><label>Phone</label><input id="bkPhone"></div>
            <div class="p-row">
              <div class="p-field"><label>From</label><input id="bkCheckIn" type="date" required></div>
              <div class="p-field"><label>To</label><input id="bkCheckOut" type="date" required></div>
            </div>
            <div class="p-field"><label>Guests</label><input id="bkGuests" type="number" min="1" value="2"></div>
            <div class="p-field"><label>Notes</label><textarea id="bkNotes" rows="2"></textarea></div>
            <button type="submit" class="p-btn p-btn-primary p-btn-block" id="bookBtn">Send request</button>
          </form>
          ${listing.contactPhone || listing.contactEmail ? `
            <p style="margin-top:16px;font-size:.85rem;color:var(--ink-soft);">
              Or contact directly: ${listing.contactPhone ? escapeHtml(listing.contactPhone) : ''} ${listing.contactEmail ? escapeHtml(listing.contactEmail) : ''}
            </p>` : ''}
        </div>
      </div>
    `;

    // thumbnail swap
    content.querySelectorAll('.l-thumbs img').forEach(t => {
      t.addEventListener('click', () => {
        content.querySelectorAll('.l-thumbs img').forEach(x => x.classList.remove('active'));
        t.classList.add('active');
        document.getElementById('heroImg').innerHTML = `<img src="${images[t.dataset.idx].url}" alt="">`;
      });
    });

    // review form toggle
    document.getElementById('showReviewFormBtn').addEventListener('click', () => {
      document.getElementById('reviewForm').style.display = 'block';
    });
    document.getElementById('reviewForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await Api.submitReview(listing._id, {
          guestName: document.getElementById('rvName').value.trim(),
          guestEmail: document.getElementById('rvEmail').value.trim(),
          rating: Number(document.getElementById('rvRating').value),
          comment: document.getElementById('rvComment').value.trim(),
        });
        location.reload();
      } catch (err) { alert(err.message); }
    });

    // booking form
    document.getElementById('bookingForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('bookBtn');
      const alertBox = document.getElementById('bookingAlert');
      btn.disabled = true; btn.innerHTML = '<span class="p-spinner"></span> Sending...';
      try {
        await Api.submitBooking({
          listingId: listing._id,
          guestName: document.getElementById('bkName').value.trim(),
          guestEmail: document.getElementById('bkEmail').value.trim(),
          guestPhone: document.getElementById('bkPhone').value.trim(),
          checkIn: document.getElementById('bkCheckIn').value,
          checkOut: document.getElementById('bkCheckOut').value,
          guests: Number(document.getElementById('bkGuests').value) || 1,
          notes: document.getElementById('bkNotes').value.trim(),
        });
        alertBox.textContent = 'Request sent! The partner will get back to you soon.';
        alertBox.className = 'p-alert show success';
        e.target.reset();
      } catch (err) {
        alertBox.textContent = err.message;
        alertBox.className = 'p-alert show error';
      } finally {
        btn.disabled = false; btn.textContent = 'Send request';
      }
    });
  }

  init();
