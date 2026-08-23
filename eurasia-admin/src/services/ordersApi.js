const API_URL = 'http://localhost:5000/api/orders';

export const ordersApi = {
  async getAll(filters = {}) {
    const params = new URLSearchParams(filters);
    const res = await fetch(`${API_URL}?${params}`);
    if (!res.ok) throw new Error('Failed to fetch orders');
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
  async toggleItem(itemId) {
    const res = await fetch(`${API_URL}/items/${itemId}/toggle`, {
      method: 'PATCH',
    });
    if (!res.ok) throw new Error('Failed to toggle item');
    return res.json();
  },
  async updatePaymentStatus(id, payment_status) {
    const res = await fetch(`${API_URL}/${id}/payment-status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_status }),
    });
    if (!res.ok) throw new Error('Failed to update payment status');
    return res.json();
  },
  async updateTable(id, table_number) {
    const res = await fetch(`${API_URL}/${id}/table`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table_number }),
    });
    if (!res.ok) throw new Error('Failed to update table');
    return res.json();
  },
};