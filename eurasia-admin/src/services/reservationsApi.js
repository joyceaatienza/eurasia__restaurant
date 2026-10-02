const API_URL = 'http://localhost:5000/api/reservations';

// Reads the error message sent by the backend (if any),
// so the browser console shows the real reason instead of a generic message
async function handleResponse(res, fallbackMessage) {
  let data = null;
  try {
    data = await res.json();
  } catch {
    // response had no JSON body
  }

  if (!res.ok) {
    const serverMessage = data?.error || data?.message;
    throw new Error(
      serverMessage
        ? `${fallbackMessage}: ${serverMessage}`
        : `${fallbackMessage} (HTTP ${res.status})`
    );
  }

  return data;
}

export const reservationsApi = {
  async getAll(filters = {}) {
    const params = new URLSearchParams(filters);
    const res = await fetch(`${API_URL}?${params}`);
    return handleResponse(res, 'Failed to fetch reservations');
  },

  // The full row, images included — used when opening a proof of payment
  async getById(id) {
    const res = await fetch(`${API_URL}/${id}`);
    return handleResponse(res, 'Failed to fetch reservation');
  },

  // The front desk verifying or rejecting a downpayment
  async updatePaymentStatus(id, payment_status) {
    const res = await fetch(`${API_URL}/${id}/payment`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_status }),
    });
    return handleResponse(res, 'Failed to update payment status');
  },

  async updateStatus(id, status) {
    const res = await fetch(`${API_URL}/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return handleResponse(res, 'Failed to update status');
  },
};