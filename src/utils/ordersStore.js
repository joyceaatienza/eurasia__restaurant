const STORAGE_KEY = "eurasia_orders";

export function getOrders() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addOrder(order) {
  const current = getOrders();
  const newOrder = {
    id: String(current.length + 1).padStart(2, "0"),
    status: "Waiting",
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