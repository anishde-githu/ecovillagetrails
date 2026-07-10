if (!Auth.isLoggedIn()) window.location.href = 'partner-auth.html';
  const user = Auth.getUser();
  if (user.role === 'admin') window.location.href = 'admin-dashboard.html';

  const CATEGORY = { owner: 'hotel', agent: 'agent', guide: 'guide' }[user.role];
  const OFFERING_LABELS = {
    hotel: { title: 'Rooms', sub: 'Add each room type with its price per night.', name: 'Room name', unit: 'per night' },
    agent: { title: 'Tour packages', sub: 'Add each package you offer with its price.', name: 'Package name', unit: 'per package' },
    guide: { title: 'Guided experiences', sub: 'Add each experience you offer with its price.', name: 'Experience name', unit: 'per day' },
  }[CATEGORY];

  document.getElementById('whoami').textContent = `${user.name} · ${CATEGORY_LABELS[CATEGORY]}`;
  document.getElementById('offeringsLabel').textContent = OFFERING_LABELS.title;
  document.getElementById('offeringsSub').textContent = OFFERING_LABELS.sub;

  document.getElementById('logoutLink').addEventListener('click', (e) => {
    e.preventDefault(); Auth.clearSession(); window.location.href = 'partner-auth.html';
  });

  // tab switching
  document.querySelectorAll('.dash-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.dash-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.dash-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('panel-' + btn.dataset.panel).classList.add('active');
      if (btn.dataset.panel === 'bookings') loadBookings();
    });
  });

  const alertBox = document.getElementById('alertBox');
  function showAlert(msg, type = 'error') { alertBox.textContent = msg; alertBox.className = `p-alert show ${type}`; }
  function hideAlert() { alertBox.className = 'p-alert'; }

  let currentListing = null;

  function offeringRow(offering = {}) {
    const row = document.createElement('div');
    row.className = 'p-offering-row';
    row.innerHTML = `
      <input type="text" placeholder="${OFFERING_LABELS.name}" class="off-name" value="${offering.name || ''}">
      <input type="number" placeholder="Price (₹)" min="0" class="off-price" value="${offering.price ?? ''}">
      <input type="text" placeholder="${OFFERING_LABELS.unit}" class="off-unit" value="${offering.unit || OFFERING_LABELS.unit}">
      <button type="button" class="p-btn p-btn-danger" style="padding:8px 12px;">✕</button>
    `;
    row.querySelector('button').addEventListener('click', () => row.remove());
    return row;
  }

  document.getElementById('addOfferingBtn').addEventListener('click', () => {
    document.getElementById('offeringsList').appendChild(offeringRow());
  });

  function collectOfferings() {
    return [...document.querySelectorAll('#offeringsList .p-offering-row')].map(row => ({
      name: row.querySelector('.off-name').value.trim(),
      price: Number(row.querySelector('.off-price').value) || 0,
      unit: row.querySelector('.off-unit').value.trim() || OFFERING_LABELS.unit,
    })).filter(o => o.name);
  }

  function renderStatus(listing) {
    const badge = document.getElementById('statusBadge');
    const rejectNote = document.getElementById('rejectNote');
    if (!listing) { badge.innerHTML = ''; rejectNote.style.display = 'none'; return; }
    const map = { pending: ['pending', '⏳ Pending review'], approved: ['approved', '✅ Live on site'], rejected: ['rejected', '❌ Rejected'] };
    const [cls, label] = map[listing.status];
    badge.innerHTML = `<span class="p-badge ${cls}">${label}</span>`;
    if (listing.status === 'rejected' && listing.rejectionReason) {
      rejectNote.style.display = 'block';
      rejectNote.textContent = `Reason: ${listing.rejectionReason} — edit and re-save to submit again.`;
    } else {
      rejectNote.style.display = 'none';
    }
  }

  function fillForm(listing) {
    document.getElementById('fName').value = listing.name || '';
    document.getElementById('fTagline').value = listing.tagline || '';
    document.getElementById('fDescription').value = listing.description || '';
    document.getElementById('fRegion').value = listing.region || '';
    document.getElementById('fPhone').value = listing.contactPhone || '';
    document.getElementById('fEmail').value = listing.contactEmail || '';
    document.getElementById('fAmenities').value = (listing.amenities || []).join(', ');
    const list = document.getElementById('offeringsList');
    list.innerHTML = '';
    (listing.offerings && listing.offerings.length ? listing.offerings : [{}]).forEach(o => list.appendChild(offeringRow(o)));
    document.getElementById('deleteBtn').style.display = 'inline-flex';
    renderImageGrid(listing);
  }

  async function loadMyListing() {
    try {
      const { listings } = await Api.myListings();
      currentListing = listings[0] || null;
      if (currentListing) {
        document.getElementById('dashTitle').textContent = currentListing.name;
        document.getElementById('dashSub').textContent = `${CATEGORY_LABELS[CATEGORY]} listing`;
        fillForm(currentListing);
        renderStatus(currentListing);
      } else {
        document.getElementById('dashTitle').textContent = 'Create your listing';
        document.getElementById('dashSub').textContent = `Fill in your ${CATEGORY_LABELS[CATEGORY].toLowerCase()} details below.`;
        document.getElementById('offeringsList').appendChild(offeringRow());
      }
    } catch (err) {
      showAlert(err.message);
    }
  }

  document.getElementById('listingForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();
    const btn = document.getElementById('saveBtn');
    btn.disabled = true; btn.innerHTML = '<span class="p-spinner"></span> Saving...';

    const payload = {
      name: document.getElementById('fName').value.trim(),
      tagline: document.getElementById('fTagline').value.trim(),
      description: document.getElementById('fDescription').value.trim(),
      region: document.getElementById('fRegion').value.trim(),
      contactPhone: document.getElementById('fPhone').value.trim(),
      contactEmail: document.getElementById('fEmail').value.trim(),
      amenities: document.getElementById('fAmenities').value.split(',').map(s => s.trim()).filter(Boolean),
      offerings: collectOfferings(),
    };

    try {
      if (currentListing) {
        const { listing } = await Api.updateListing(currentListing._id, payload);
        currentListing = listing;
        showAlert('Saved — your changes are back in review.', 'success');
      } else {
        const { listing } = await Api.createListing(payload);
        currentListing = listing;
        showAlert('Listing created — submitted for review. We\'ll notify you once it\'s approved.', 'success');
      }
      document.getElementById('dashTitle').textContent = currentListing.name;
      renderStatus(currentListing);
      renderImageGrid(currentListing);
      document.getElementById('deleteBtn').style.display = 'inline-flex';
    } catch (err) {
      showAlert(err.message);
    } finally {
      btn.disabled = false; btn.textContent = 'Save & submit for review';
    }
  });

  document.getElementById('deleteBtn').addEventListener('click', async () => {
    if (!currentListing) return;
    if (!confirm('Delete this listing permanently? This cannot be undone.')) return;
    try {
      await Api.deleteListing(currentListing._id);
      window.location.reload();
    } catch (err) { showAlert(err.message); }
  });

  // ---- images ----
  function renderImageGrid(listing) {
    const grid = document.getElementById('imageGrid');
    grid.innerHTML = '';
    if (!listing || !listing.images || listing.images.length === 0) {
      grid.innerHTML = '<p class="p-empty" style="padding:20px;">No photos yet.</p>';
      return;
    }
    listing.images.forEach((img, i) => {
      const thumb = document.createElement('div');
      thumb.className = 'p-image-thumb' + (i === listing.coverImageIndex ? ' cover' : '');
      thumb.innerHTML = `
        <img src="${img.url}" alt="">
        ${i === listing.coverImageIndex ? '<span class="cover-tag">Cover</span>' : `<button class="set-cover-btn">Set as cover</button>`}
        <button class="remove-btn" title="Remove">✕</button>
      `;
      thumb.querySelector('.remove-btn').addEventListener('click', async () => {
        try {
          const { listing: updated } = await Api.deleteImage(currentListing._id, img.publicId);
          currentListing = updated;
          renderImageGrid(currentListing);
        } catch (err) { showAlert(err.message); }
      });
      const coverBtn = thumb.querySelector('.set-cover-btn');
      if (coverBtn) {
        coverBtn.addEventListener('click', async () => {
          try {
            const { listing: updated } = await Api.updateListing(currentListing._id, { coverImageIndex: i });
            currentListing = updated;
            renderImageGrid(currentListing);
          } catch (err) { showAlert(err.message); }
        });
      }
      grid.appendChild(thumb);
    });
  }

  document.getElementById('uploadBtn').addEventListener('click', async () => {
    if (!currentListing) { showAlert('Save your listing details first.'); return; }
    const files = document.getElementById('fileInput').files;
    if (!files.length) { showAlert('Choose at least one photo.'); return; }
    const btn = document.getElementById('uploadBtn');
    btn.disabled = true; btn.innerHTML = '<span class="p-spinner"></span> Uploading...';
    try {
      const formData = new FormData();
      [...files].forEach(f => formData.append('images', f));
      const { listing } = await Api.uploadImages(currentListing._id, formData);
      currentListing = listing;
      renderImageGrid(currentListing);
      document.getElementById('fileInput').value = '';
      showAlert('Photos uploaded.', 'success');
    } catch (err) {
      showAlert(err.message);
    } finally {
      btn.disabled = false; btn.textContent = 'Upload photos';
    }
  });

  // ---- bookings ----
  async function loadBookings() {
    const container = document.getElementById('bookingsList');
    container.innerHTML = '<p class="p-empty">Loading enquiries...</p>';
    try {
      const { bookings } = await Api.myBookings();
      if (!bookings.length) { container.innerHTML = '<p class="p-empty">No enquiries yet.</p>'; return; }
      container.innerHTML = bookings.map(b => `
        <div class="p-listing-card">
          <div class="p-listing-info">
            <h3>${escapeHtml(b.guestName)}</h3>
            <p>${escapeHtml(b.guestEmail)} ${b.guestPhone ? '· ' + escapeHtml(b.guestPhone) : ''}</p>
            <p>${new Date(b.checkIn).toLocaleDateString()} → ${new Date(b.checkOut).toLocaleDateString()} · ${b.guests} guest(s)</p>
            ${b.notes ? `<p>"${escapeHtml(b.notes)}"</p>` : ''}
            <span class="p-badge ${b.status === 'confirmed' ? 'approved' : b.status === 'declined' || b.status === 'cancelled' ? 'rejected' : 'pending'}">${b.status}</span>
          </div>
          ${b.status === 'pending' ? `
            <div class="p-listing-actions">
              <button class="p-btn p-btn-primary confirm-btn" data-id="${b._id}">Confirm</button>
              <button class="p-btn p-btn-danger decline-btn" data-id="${b._id}">Decline</button>
            </div>` : ''}
        </div>
      `).join('');
      container.querySelectorAll('.confirm-btn').forEach(btn => btn.addEventListener('click', () => setBookingStatus(btn.dataset.id, 'confirmed')));
      container.querySelectorAll('.decline-btn').forEach(btn => btn.addEventListener('click', () => setBookingStatus(btn.dataset.id, 'declined')));
    } catch (err) {
      container.innerHTML = `<p class="p-empty">${escapeHtml(err.message)}</p>`;
    }
  }

  async function setBookingStatus(id, status) {
    try { await Api.updateBookingStatus(id, status); loadBookings(); }
    catch (err) { showAlert(err.message); }
  }

  function escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  loadMyListing();
