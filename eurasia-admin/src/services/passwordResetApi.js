const API_URL = 'http://localhost:5000/api/password-reset';

export const passwordResetApi = {
  async requestReset(email) {
    const res = await fetch(`${API_URL}/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send reset link');
    return data;
  },

  async verifyToken(token) {
    const res = await fetch(`${API_URL}/verify/${token}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Invalid or expired link');
    return data;
  },

  async resetPassword(token, password) {
    const res = await fetch(`${API_URL}/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to reset password');
    return data;
  },
};