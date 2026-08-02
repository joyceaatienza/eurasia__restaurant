import React, { useState } from 'react';
import StaffHeader from "../components/StaffHeader";

// Sample Order Data matching the screenshot layout
const INITIAL_ORDERS = [
  {
    id: '01',
    customer: 'John Doe',
    table: 'Table 2',
    time: '12:47pm',
    status: 'Preparing',
    total: 1756,
    items: [
      { id: 1, qty: 1, name: 'Tom Ka Ghai', note: 'less spicy', price: 288, checked: false },
      { id: 2, qty: 1, name: 'Salpicao', note: '', price: 690, checked: false },
      { id: 3, qty: 1, name: 'Tutto Mare', note: '', price: 578, checked: false },
      { id: 4, qty: 2, name: 'Strawberry Yogurt Smoothie', note: '', price: 200, checked: false },
    ],
  },
  {
    id: '02',
    customer: 'Jane Smith',
    table: 'Table 8',
    time: '1:34pm',
    status: 'Waiting',
    total: 1756,
    items: [
      { id: 1, qty: 1, name: 'Tom Ka Ghai', note: 'less spicy', price: 288, checked: false },
      { id: 2, qty: 1, name: 'Salpicao', note: '', price: 690, checked: false },
      { id: 3, qty: 1, name: 'Tutto Mare', note: '', price: 578, checked: false },
      { id: 4, qty: 2, name: 'Strawberry Yogurt Smoothie', note: '', price: 200, checked: false },
    ],
  },
  {
    id: '03',
    customer: 'Juan Dela Cruz',
    table: 'Table 5',
    time: '1:45pm',
    status: 'Waiting',
    total: 1756,
    items: [
      { id: 1, qty: 1, name: 'Tom Ka Ghai', note: 'less spicy', price: 288, checked: false },
      { id: 2, qty: 1, name: 'Salpicao', note: '', price: 690, checked: false },
      { id: 3, qty: 1, name: 'Tutto Mare', note: '', price: 578, checked: false },
      { id: 4, qty: 2, name: 'Strawberry Yogurt Smoothie', note: '', price: 200, checked: false },
    ],
  },
];

export default function OrderQueue() {
  const [orders, setOrders] = useState(INITIAL_ORDERS);

  const handleToggleItem = (orderId, itemId) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        return {
          ...order,
          items: order.items.map((item) =>
            item.id === itemId ? { ...item, checked: !item.checked } : item
          ),
        };
      })
    );
  };

  const handleStatusChange = (orderId) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        if (order.status === 'Waiting') return { ...order, status: 'Preparing' };
        if (order.status === 'Preparing') return { ...order, status: 'Ready' };
        return order;
      })
    );
  };

  return (
    <div className="min-h-screen bg-[#f0eff3] font-[Prata] text-[#1d080f] text-left">
      <StaffHeader />

      <main className="max-w-[1400px] mx-auto px-8" style={{ paddingTop: "16px", paddingBottom: "32px" }}>
        <h1
          className="font-[Prata] text-2xl text-[#1d080f] text-left"
          style={{ marginTop: 0, marginBottom: "16px", WebkitTextStroke: "0.8px #1d080f" }}
        >
          Order Queue
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between text-left"
            >
              <div>
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-3">
                    <h2
                      className="font-[Prata] text-2xl text-[#1d080f]"
                      style={{ WebkitTextStroke: "0.7px #1d080f" }}
                    >
                      Order {order.id}
                    </h2>
                    {order.status === 'Preparing' && (
                      <span className="bg-[#f5e79e] text-[#5e5113] text-xs font-[Prata] px-3 py-1 rounded-md">
                        Preparing
                      </span>
                    )}
                    {order.status === 'Waiting' && (
                      <span className="bg-[#e2e2e2] text-[#555] text-xs font-[Prata] px-3 py-1 rounded-md">
                        Waiting
                      </span>
                    )}
                    {order.status === 'Ready' && (
                      <span className="bg-[#d1e7dd] text-[#0f5132] text-xs font-[Prata] px-3 py-1 rounded-md">
                        Ready
                      </span>
                    )}
                  </div>
                  <div
                    className="font-[Prata] text-xl text-[#1d080f]"
                    style={{ WebkitTextStroke: "0.5px #1d080f" }}
                  >
                    Php. {order.total.toLocaleString()}
                  </div>
                </div>

                <div className="text-xs text-gray-600 mb-4 space-y-0.5 font-[Prata]">
                  <p>{order.customer} | {order.table}</p>
                  <p className="text-gray-500">{order.time}</p>
                </div>

                <div className="space-y-2 mb-6 my-4">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleToggleItem(order.id, item.id)}
                      className="flex justify-between items-center text-sm cursor-pointer hover:bg-gray-50 p-1 rounded transition font-[Prata]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600">
                          [{item.checked ? 'X' : ' '}]
                        </span>
                        <span className={item.checked ? 'line-through text-gray-400' : 'text-[#1d080f]'}>
                          ({item.qty}) {item.name} {item.note && <span className="text-gray-600">- {item.note}</span>}
                        </span>
                      </div>
                      <span className="text-xs text-gray-800 tabular-nums">
                        Php. {item.price}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-2">
                {order.status === 'Preparing' && (
                  <button
  onClick={() => handleStatusChange(order.id)}
  className="w-full py-2.5 rounded-lg bg-[#296c39] text-white font-[Prata] text-sm hover:bg-[#1f5129] transition"
>
  Mark as Ready
</button>
                )}
                {order.status === 'Waiting' && (
                  <button
                    onClick={() => handleStatusChange(order.id)}
                    className="w-full py-2.5 rounded-lg bg-[#1d080f] text-white font-[Prata] text-sm hover:bg-[#3a1420] transition"
                  >
                    Start Preparing
                  </button>
                )}
                {order.status === 'Ready' && (
                  <button
  disabled
  className="w-full py-2.5 rounded-lg bg-[#e0e0e0] text-[#888888] font-[Prata] text-sm cursor-default"
>
  Order Completed
</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}