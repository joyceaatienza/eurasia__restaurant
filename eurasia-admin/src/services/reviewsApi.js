const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/reviews';

export const reviewsApi = {
  async getAll() {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error('Failed to fetch reviews');
    return res.json();
  },
};