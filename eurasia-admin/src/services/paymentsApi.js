const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

export const paymentsApi = {
  getAll: async () => {
    const res = await fetch(`${API_URL}/payments`);
    return handleResponse(res);
  },

  getByOrderId: async (orderId) => {
    const res = await fetch(`${API_URL}/payments/order/${orderId}`);
    return handleResponse(res);
  },

  create: async (paymentData) => {
    const formData = new FormData();
    Object.entries(paymentData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) formData.append(key, value);
    });

    const res = await fetch(`${API_URL}/payments`, {
      method: "POST",
      body: formData, // multipart/form-data for discount_id_image
    });
    return handleResponse(res);
  },

  updateStatus: async (id, payment_status) => {
    const res = await fetch(`${API_URL}/payments/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payment_status }),
    });
    return handleResponse(res);
  },
};