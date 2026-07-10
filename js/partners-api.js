/* =====================================================================
   js/partners-api.js
   Shared API client used by partner-auth.html, partner-dashboard.html,
   admin-dashboard.html, and listing.html.
   ===================================================================== */

const API_BASE = (window.ECOVILLAGE_API_BASE || 'https://ecovillage-backend.onrender.com').replace(/\/$/, '');

const Auth = {
  getToken() { return localStorage.getItem('ev_token'); },
  getUser() {
    try { return JSON.parse(localStorage.getItem('ev_user') || 'null'); }
    catch { return null; }
  },
  setSession(token, user) {
    localStorage.setItem('ev_token', token);
    localStorage.setItem('ev_user', JSON.stringify(user));
  },
  clearSession() {
    localStorage.removeItem('ev_token');
    localStorage.removeItem('ev_user');
  },
  isLoggedIn() { return !!this.getToken(); },
};

async function apiRequest(path, { method = 'GET', body, isForm = false } = {}) {
  const headers = {};
  const token = Auth.getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isForm && body) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });

  let data;
  try { data = await res.json(); } catch { data = {}; }

  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

const Api = {
  // auth
  signup: (payload) => apiRequest('/api/auth/signup', { method: 'POST', body: payload }),
  login: (payload) => apiRequest('/api/auth/login', { method: 'POST', body: payload }),
  me: () => apiRequest('/api/auth/me'),

  // public
  listListings: (category) => apiRequest(`/api/listings${category ? `?category=${category}` : ''}`),
  getListing: (id) => apiRequest(`/api/listings/${id}`),
  getListingReviews: (id) => apiRequest(`/api/listings/${id}/reviews`),
  submitReview: (id, payload) => apiRequest(`/api/listings/${id}/reviews`, { method: 'POST', body: payload }),
  submitBooking: (payload) => apiRequest('/api/bookings', { method: 'POST', body: payload }),

  // partner
  myListings: () => apiRequest('/api/partner/listings'),
  createListing: (payload) => apiRequest('/api/partner/listings', { method: 'POST', body: payload }),
  updateListing: (id, payload) => apiRequest(`/api/partner/listings/${id}`, { method: 'PUT', body: payload }),
  deleteListing: (id) => apiRequest(`/api/partner/listings/${id}`, { method: 'DELETE' }),
  uploadImages: (id, formData) => apiRequest(`/api/partner/listings/${id}/images`, { method: 'POST', body: formData, isForm: true }),
  deleteImage: (id, publicId) => apiRequest(`/api/partner/listings/${id}/images`, { method: 'DELETE', body: { publicId } }),
  myBookings: () => apiRequest('/api/partner/bookings'),
  updateBookingStatus: (id, status) => apiRequest(`/api/partner/bookings/${id}/status`, { method: 'PUT', body: { status } }),

  // admin
  adminListings: (params = '') => apiRequest(`/api/admin/listings${params}`),
  adminApprove: (id) => apiRequest(`/api/admin/listings/${id}/approve`, { method: 'PUT' }),
  adminReject: (id, reason) => apiRequest(`/api/admin/listings/${id}/reject`, { method: 'PUT', body: { reason } }),
  adminPartners: (params = '') => apiRequest(`/api/admin/partners${params}`),
};

const CATEGORY_LABELS = { hotel: 'Hotel', agent: 'Travel Agent', guide: 'Local Guide' };
const CATEGORY_ICONS = { hotel: '🏨', agent: '🧳', guide: '🧭' };
