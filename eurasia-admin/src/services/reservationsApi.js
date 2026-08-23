const API_URL = 'http://localhost:5000/api/reservations';

export const reservationsApi = {
  async getAll(filters = {}) {
    const params = new URLSearchParams(filters);
    const res = await fetch(`${API_URL}?${params}`);
    if (!res.ok) throw new Error('Failed to fetch reservations');
    return res.json();
  },
  async updateStatus(id, status) {
    const res = await fetch(`${API_URL}/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update status');
    return res.json();
  },
};