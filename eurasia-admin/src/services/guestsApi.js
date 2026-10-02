const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/guests';

export const guestsApi = {
  async getToday() {
    const res = await fetch(`${API_URL}/today`);
    if (!res.ok) throw new Error('Failed to fetch guest counts');
    return res.json();
  },

    async getCounts(start, end) {
    const res = await fetch(`${API_URL}/counts?start=${start}&end=${end}`);
    if (!res.ok) throw new Error('Failed to fetch guest counts');
    return res.json();
  },

  async addWalkIn(guest_count) {
    const res = await fetch(`${API_URL}/walk-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guest_count }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to record walk-in guests');
    }
    return res.json();
  },
};