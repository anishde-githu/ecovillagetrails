if (!Auth.isLoggedIn() || Auth.getUser().role !== 'admin') window.location.href = 'partner-auth.html';
  document.getElementById('whoami').textContent = Auth.getUser().name;

  document.getElementById('logoutLink').addEventListener('click', (e) => {
    e.preventDefault(); Auth.clearSession(); window.location.href = 'partner-auth.html';
  });

  const alertBox = document.getElementById('alertBox');
  function showAlert(msg, type = 'error') { alertBox.textContent = msg; alertBox.className = `p-alert show ${type}`; }

  let currentStatus = 'pending';
  let currentCategory = '';

  document.querySelectorAll('#statusChips .p-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#statusChips .p-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentStatus = chip.dataset.status;
      loadListings();
    });
  });
  document.querySelectorAll('#categoryChips .p-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#categoryChips .p-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentCategory = chip.dataset.category;
      loadListings();
    });
  });

  function escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  async function loadListings() {
    const container = document.getElementById('listingsContainer');
    container.innerHTML = '<p class="p-empty">Loading...</p>';
    const params = new URLSearchParams();
    if (currentStatus) params.set('status', currentStatus);
    if (currentCategory) params.set('category', currentCategory);

    try {
      const { listings } = await Api.adminListings(`?${params.toString()}`);
      if (!listings.length) { container.innerHTML = '<p class="p-empty">No listings here.</p>'; return; }

      container.innerHTML = listings.map(l => `
        <div class="admin-listing" data-id="${l._id}">
          <div style="flex:1;min-width:260px;">
            <span class="p-badge ${l.status}">${CATEGORY_ICONS[l.category]} ${CATEGORY_LABELS[l.category]} · ${l.status}</span>
            <h3 style="margin:8px 0 2px;">${escapeHtml(l.name)}</h3>
            <p style="color:var(--ink-soft);font-size:.86rem;margin:0;">${escapeHtml(l.tagline || '')} — ${escapeHtml(l.region)}</p>
            <p style="font-size:.85rem;margin:8px 0;">${escapeHtml(l.description).slice(0, 200)}${l.description.length > 200 ? '…' : ''}</p>
            <p style="font-size:.8rem;color:var(--ink-soft);">By ${escapeHtml(l.owner?.name || 'unknown')} (${escapeHtml(l.owner?.email || '')})${l.owner?.phone ? ' · ' + escapeHtml(l.owner.phone) : ''}</p>
            ${l.offerings?.length ? `<p class="admin-offerings">${l.offerings.map(o => `${escapeHtml(o.name)}: ₹${o.price} ${escapeHtml(o.unit)}`).join(' · ')}</p>` : ''}
            <div class="admin-thumb-row">${(l.images || []).map(img => `<img src="${img.url}" alt="">`).join('')}</div>
            ${l.status === 'rejected' && l.rejectionReason ? `<p class="p-reject-note">Reason: ${escapeHtml(l.rejectionReason)}</p>` : ''}
          </div>
          <div class="p-listing-actions">
            ${l.status !== 'approved' ? `<button class="p-btn p-btn-primary approve-btn">Approve</button>` : ''}
            ${l.status !== 'rejected' ? `<button class="p-btn p-btn-danger reject-btn">Reject</button>` : ''}
          </div>
        </div>
      `).join('');

      container.querySelectorAll('.approve-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const id = e.target.closest('.admin-listing').dataset.id;
          try { await Api.adminApprove(id); loadListings(); }
          catch (err) { showAlert(err.message); }
        });
      });
      container.querySelectorAll('.reject-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const id = e.target.closest('.admin-listing').dataset.id;
          const reason = prompt('Reason for rejection (shown to the partner):', 'Did not meet listing guidelines.');
          if (reason === null) return;
          try { await Api.adminReject(id, reason); loadListings(); }
          catch (err) { showAlert(err.message); }
        });
      });
    } catch (err) {
      container.innerHTML = `<p class="p-empty">${escapeHtml(err.message)}</p>`;
    }
  }

  loadListings();
