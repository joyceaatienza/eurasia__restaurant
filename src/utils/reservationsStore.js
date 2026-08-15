const STORAGE_KEY = "eurasia_reservations";

function seedData() {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const seed = [
    { id: "seed-1", date: today, time: "11:15", name: "John Doe", table: "T7", pax: 7, phone: "0900 000 0000", email: "johndoe@gmail.com", status: "Completed" },
    { id: "seed-2", date: today, time: "11:15", name: "Jane Smith", table: "T11", pax: 4, phone: "0900 000 0000", email: "jane@gmail.com", status: "Arrived" },
    { id: "seed-3", date: today, time: "13:30", name: "Juan Dela Cruz", table: "T4", pax: 4, phone: "0900 000 0000", email: "juan@gmail.com", status: "Pending" },
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  return seed;
}

export function getReservations() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedData();
    return JSON.parse(raw);
  } catch {
    return seedData();
  }
}

export function addReservation(reservation) {
  const current = getReservations();
  const newRes = {
    id: `res-${Date.now()}`,
    status: "Pending",
    ...reservation,
  };
  const updated = [...current, newRes];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function updateReservationStatus(id, status) {
  const current = getReservations();
  const updated = current.map((r) => (r.id === id ? { ...r, status } : r));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}