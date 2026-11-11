const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/reservations';

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

  // The cashier verifying or rejecting a downpayment.
  // failure_reason is optional — it's only sent when marking it as failed.
  async updatePaymentStatus(id, payment_status, failure_reason = null) {
    const res = await fetch(`${API_URL}/${id}/payment`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_status, failure_reason }),
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

  // A note the guest sees while their booking is pending (null clears it)
  async updateRemarks(id, remarks) {
    const res = await fetch(`${API_URL}/${id}/remarks`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ remarks }),
    });
    return handleResponse(res, 'Failed to save the remark');
  },

  // Times the front desk has closed off on a date (an event, or fully booked)
  async getBlockedSlots(date) {
    const res = await fetch(`${API_URL}/blocked?date=${encodeURIComponent(date)}`);
    return handleResponse(res, 'Failed to load blocked times');
  },

  async addBlockedSlot(slot) {
    const res = await fetch(`${API_URL}/blocked`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slot),
    });
    return handleResponse(res, 'Failed to block this time');
  },

  async deleteBlockedSlot(id) {
    const res = await fetch(`${API_URL}/blocked/${id}`, { method: 'DELETE' });
    return handleResponse(res, 'Failed to remove the blocked time');
  },
};