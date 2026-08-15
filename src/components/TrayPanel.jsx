import React, { useState } from "react";
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "../context/CartContext";
import { addOrder } from "../utils/ordersStore";

const FONT = "'Prata', serif";
const INK = "#1d080f";

export default function TrayPanel() {
  const {
    cart,
    isTrayOpen,
    closeTray,
    updateQty,
    updateNote,
    removeItem,
    clearCart,
    trayIconRef,
  } = useCart();

  const [tableNumber, setTableNumber] = useState("");
  const [placing, setPlacing] = useState(false);

  if (!isTrayOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const service = Math.round(subtotal * 0.05);
  const total = subtotal + service;

  const handlePlaceOrder = () => {
    if (!tableNumber) {
      alert("Please enter your table number.");
      return;
    }
    if (cart.length === 0) {
      alert("Your tray is empty.");
      return;
    }

    setPlacing(true);

    addOrder({
      customer: "Guest",
      table: tableNumber,
      total,
      items: cart.map((item) => ({
        name: item.name,
        qty: item.qty,
        price: item.price,
        note: item.note || "",
      })),
    });

    clearCart();
    setTableNumber("");
    setPlacing(false);
    closeTray();

    alert("Order placed! Your food is on its way to the kitchen. You can pay after your meal.");
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={closeTray} />

      <div className="relative bg-[#f0eff3] w-full max-w-md h-full flex flex-col shadow-xl" style={{ fontFamily: FONT }}>
        {/* Header */}
        <div className="bg-white flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-[#1d080f] flex items-center justify-center">
              <ShoppingBag size={18} color="#fff" />
            </div>
            <div>
              <div className="text-lg" style={{ color: INK }}>My Tray</div>
              <div className="text-xs text-gray-400">{cart.length} item{cart.length !== 1 ? "s" : ""} selected</div>
            </div>
          </div>
          <button onClick={closeTray} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {cart.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-12">Your tray is empty.</p>
          ) : (
            <div className="flex flex-col gap-5">
              {cart.map((item) => (
                <div key={item.id} className="bg-white rounded-xl p-4">
                  <div className="flex gap-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <span className="text-sm" style={{ color: INK }}>{item.name}</span>
                        <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-500">
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <div className="text-xs text-gray-400 mb-3">Php. {item.price} each</div>

                      <div className="inline-flex items-center gap-3 bg-[#1d080f] text-white rounded-full px-3 py-1.5">
                        <button onClick={() => updateQty(item.id, -1)}>
                          <Minus size={14} />
                        </button>
                        <span className="text-sm w-4 text-center">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)}>
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <input
                    type="text"
                    placeholder="Special instructions (e.g. less spicy, no onions)..."
                    value={item.note || ""}
                    onChange={(e) => updateNote(item.id, e.target.value)}
                    className="w-full mt-3 bg-[#f7f5f0] rounded-md px-3 py-2 text-xs placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#1d080f]"
                    style={{ color: INK }}
                  />
                </div>
              ))}

              {/* Table Number */}
              <div className="bg-white rounded-xl p-5">
                <div className="text-center text-amber-700 text-xs tracking-wide mb-4">
                  ENTER YOUR TABLE NUMBER
                </div>
                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="e.g. T7"
                  className="w-full text-center bg-[#f7f5f0] rounded-md px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#1d080f]"
                  style={{ color: INK }}
                />
                {!tableNumber && (
                  <p className="text-xs text-red-500 text-center mt-2">
                    Please enter your table number.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Summary + Place Order */}
        {cart.length > 0 && (
          <div className="bg-white px-6 py-5 border-t border-gray-100">
            <div className="flex justify-between text-sm mb-1" style={{ color: INK }}>
              <span>Subtotal</span>
              <span>Php. {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm mb-3 text-gray-500">
              <span>Service (5%)</span>
              <span>Php. {service.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center border-t border-dashed border-gray-200 pt-3 mb-4">
              <span className="text-sm" style={{ color: INK }}>Total Amount</span>
              <span className="text-2xl font-bold" style={{ color: INK }}>Php. {total.toLocaleString()}</span>
            </div>

            <p className="text-xs text-gray-400 text-center mb-4">
              Payment will be collected after your meal.
            </p>

            <button
              onClick={handlePlaceOrder}
              disabled={placing || !tableNumber}
              className="w-full bg-[#296c39] text-white py-4 rounded-full flex items-center justify-center gap-2 hover:bg-[#1f5129] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Place Order <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}