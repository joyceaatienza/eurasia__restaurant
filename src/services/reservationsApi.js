const API_URL = 'http://localhost:5000/api/reservations';

function authHeaders() {
  const token = localStorage.getItem('eurasia_customer_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const reservationsApi = {
  async getAll(filters = {}) {
    const params = new URLSearchParams(filters);
    const res = await fetch(`${API_URL}?${params}`);
    if (!res.ok) throw new Error('Failed to fetch reservations');
    return res.json();
  },

  async getMine() {
    const res = await fetch(`${API_URL}/mine`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch your reservations');
    return res.json();
  },

  async create(data) {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create reservation');
    }
    return res.json();
  },

  async updateStatus(id, status) {
    const res = await fetch(`${API_URL}/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update status');
    return res.json();
  },
};