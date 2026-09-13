const API_URL = 'http://localhost:5000/api/orders';

export const ordersApi = {
  async getByTable(table_number) {
  const params = new URLSearchParams({ table: table_number, payment_status: 'pending' });
  const res = await fetch(`${API_URL}?${params}`);
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json();
},
async payMultiple(orderIds, paymentData) {
  const res = await fetch(`${API_URL}/bulk-payment`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order_ids: orderIds, ...paymentData }),
  });
  if (!res.ok) throw new Error('Failed to submit payment');
  return res.json();
},
  async getAll(filters = {}) {
    const params = new URLSearchParams(filters);
    const res = await fetch(`${API_URL}?${params}`);
    if (!res.ok) throw new Error('Failed to fetch orders');
    return res.json();
  },
  async create(data) {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create order');
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
  async updatePaymentStatus(id, payment_status) {
    const res = await fetch(`${API_URL}/${id}/payment-status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_status }),
    });
    if (!res.ok) throw new Error('Failed to update payment status');
    return res.json();
  },
  async getById(id) {
  const res = await fetch(`${API_URL}/${id}`);
  if (!res.ok) throw new Error('Failed to fetch order');
  return res.json();
},
};