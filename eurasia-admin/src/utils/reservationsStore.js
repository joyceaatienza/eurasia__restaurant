// Temporary "database" using localStorage, until a real backend/API exists.
// To swap in a real backend later, replace the function bodies below with
// fetch() calls — nothing in Reservations.jsx needs to change.

const STORAGE_KEY = "eurasia_reservations";

function iso(date) {
  return date.toISOString().slice(0, 10);
}

function seedData() {
  const today = new Date();
  const inTwoDays = new Date(today);
  inTwoDays.setDate(inTwoDays.getDate() + 2);

  const seed = [
    { id: "seed-1", type: "table", date: iso(today), time: "11:15", name: "John Doe", table: "T7", pax: 7, phone: "0900 000 0000", email: "johndoe@gmail.com", status: "Completed" },
    { id: "seed-2", type: "table", date: iso(today), time: "11:15", name: "Jane Smith", table: "T11", pax: 4, phone: "0900 000 0000", email: "jane@gmail.com", status: "Arrived" },
    { id: "seed-3", type: "table", date: iso(today), time: "13:30", name: "Juan Dela Cruz", table: "T4", pax: 4, phone: "0900 000 0000", email: "juan@gmail.com", status: "Pending" },
    {
      id: "seed-4",
      type: "event",
      date: iso(inTwoDays),
      time: "11:30",
      endTime: "14:00",
      eventTitle: "18th Birthday",
      location: "Main Dining",
      name: "Event Booking",
      pax: 20,
      phone: "",
      email: "",
      status: "Pending",
    },
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
    type: "table",
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