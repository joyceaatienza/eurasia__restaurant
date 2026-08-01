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

  // Toggle checklist items inside an order
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

  // Handle order action button click
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
    <div className="min-h-screen bg-[#f0eff3] font-sans text-[#201417]">
      {/* 1. Added StaffHeader tag here */}
      <StaffHeader />

      {/* MAIN CONTAINER */}
      <main className="max-w-[1400px] mx-auto p-8">
        <h1 className="font-serif text-3xl font-bold mb-6 text-[#201417]">Order Queue</h1>

        {/* ORDERS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between"
            >
              <div>
                {/* Order Header Info */}
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-3">
                    <h2 className="font-serif text-2xl font-extrabold text-[#201417]">
                      Order {order.id}
                    </h2>
                    {/* Status Badge */}
                    {order.status === 'Preparing' && (
                      <span className="bg-[#f5e79e] text-[#5e5113] text-xs font-semibold px-3 py-1 rounded-md">
                        Preparing
                      </span>
                    )}
                    {order.status === 'Waiting' && (
                      <span className="bg-[#e2e2e2] text-[#555] text-xs font-semibold px-3 py-1 rounded-md">
                        Waiting
                      </span>
                    )}
                    {order.status === 'Ready' && (
                      <span className="bg-[#d1e7dd] text-[#0f5132] text-xs font-semibold px-3 py-1 rounded-md">
                        Ready
                      </span>
                    )}
                  </div>
                  {/* Total Price */}
                  <div className="font-serif text-xl font-bold text-[#201417]">
                    Php. {order.total.toLocaleString()}
                  </div>
                </div>

                {/* Customer Details */}
                <div className="text-xs text-gray-600 mb-4 space-y-0.5">
                  <p className="font-medium">{order.customer} | {order.table}</p>
                  <p className="text-gray-500">{order.time}</p>
                </div>

                {/* Items Checklist */}
                <div className="space-y-2 mb-6 my-4">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleToggleItem(order.id, item.id)}
                      className="flex justify-between items-center text-sm cursor-pointer hover:bg-gray-50 p-1 rounded transition"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-gray-600">
                          [{item.checked ? 'X' : ' '}]
                        </span>
                        <span className={`font-serif ${item.checked ? 'line-through text-gray-400' : 'text-[#201417]'}`}>
                          ({item.qty}) {item.name} {item.note && <span className="font-sans text-gray-600">- {item.note}</span>}
                        </span>
                      </div>
                      <span className="font-serif text-xs text-gray-800 tabular-nums">
                        Php. {item.price}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-2">
                {order.status === 'Preparing' && (
                  <button
                    onClick={() => handleStatusChange(order.id)}
                    className="w-full py-2.5 rounded-lg bg-[#e0e0e0] text-[#888888] font-serif text-sm font-semibold hover:bg-gray-300 transition"
                  >
                    Mark as Ready
                  </button>
                )}
                {order.status === 'Waiting' && (
                  <button
                    onClick={() => handleStatusChange(order.id)}
                    className="w-full py-2.5 rounded-lg bg-[#18050e] text-white font-serif text-sm font-semibold hover:bg-[#2d0d18] transition"
                  >
                    Start Preparing
                  </button>
                )}
                {order.status === 'Ready' && (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-lg bg-green-100 text-green-700 font-serif text-sm font-semibold cursor-default"
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