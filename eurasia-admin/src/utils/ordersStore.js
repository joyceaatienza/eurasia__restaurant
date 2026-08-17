const STORAGE_KEY = "eurasia_orders";

function seedData() {
  const seed = [
    {
      id: "01",
      customer: "John Doe",
      table: "Table 2",
      status: "Preparing",
      date: "June 8, 2026",
      time: "12:47pm",
      total: 1756,
      items: [
        { id: 1, qty: 1, name: "Tom Ka Ghai - less spicy", price: 288, checked: false },
        { id: 2, qty: 1, name: "Salpicao", price: 690, checked: false },
        { id: 3, qty: 1, name: "Tutto Mare", price: 578, checked: false },
        { id: 4, qty: 2, name: "Strawberry Yogurt Smoothie", price: 200, checked: false },
      ],
    },
    {
      id: "02",
      customer: "Jane Smith",
      table: "Table 8",
      status: "Waiting",
      date: "June 8, 2026",
      time: "1:34pm",
      total: 1178,
      items: [
        { id: 1, qty: 1, name: "Baked Salmon", price: 755, checked: false },
        { id: 2, qty: 1, name: "Margherita", price: 578, checked: false },
      ],
    },
    {
      id: "03",
      customer: "Juan Dela Cruz",
      table: "Table 5",
      status: "Waiting",
      date: "June 8, 2026",
      time: "1:45pm",
      total: 876,
      items: [
        { id: 1, qty: 1, name: "Texas BBQ Ribs", price: 876, checked: false },
      ],
    },
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  return seed;
}

export function getOrders() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedData();
    return JSON.parse(raw);
  } catch {
    return seedData();
  }
}

export function addOrder(order) {
  const current = getOrders();
  const newOrder = {
    id: String(current.length + 1).padStart(2, "0"),
    status: "Waiting",
    date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }).toLowerCase(),
    ...order,
    items: order.items.map((item, i) => ({ id: i + 1, checked: false, ...item })),
  };
  const updated = [...current, newOrder];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function updateOrder(id, updater) {
  const current = getOrders();
  const updated = current.map((o) => (o.id === id ? { ...o, ...updater(o) } : o));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function toggleOrderItem(orderId, itemId) {
  return updateOrder(orderId, (order) => ({
    items: order.items.map((item) =>
      item.id === itemId ? { ...item, checked: !item.checked } : item
    ),
  }));
}

export function setOrderStatus(orderId, status) {
  return updateOrder(orderId, () => ({ status }));
}