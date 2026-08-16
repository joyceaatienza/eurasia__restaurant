const STORAGE_KEY = "eurasia_payments";

const INITIAL_TRANSACTIONS = [
  { id: "01", customer: "John Doe", table: "T7", method: "GCash", amount: 1756, date: "June 8, 2026", time: "2:06pm", status: "Completed" },
  { id: "02", customer: "Jane Smith", table: "T8", method: "GCash", amount: 1756, date: "June 8, 2026", time: "2:29pm", status: "Pending" },
  { id: "03", customer: "Juan Dela Cruz", table: "T5", method: "Bank Transfer", amount: 1756, date: "June 8, 2026", time: "2:40pm", status: "Pending" },
];

export function getPayments() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_TRANSACTIONS));
      return INITIAL_TRANSACTIONS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_TRANSACTIONS;
  }
}

export function setPaymentStatus(id, status) {
  const current = getPayments();
  const updated = current.map((t) => (t.id === id ? { ...t, status } : t));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function updatePaymentTable(id, table) {
  const current = getPayments();
  const updated = current.map((t) => (t.id === id ? { ...t, table } : t));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}