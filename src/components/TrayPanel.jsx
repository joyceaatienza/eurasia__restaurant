import React from "react";
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

const FONT = "'Prata', serif";
const INK = "#1d080f";
const FINALIZED_KEY = 'eurasia_finalized';

export default function TrayPanel() {
  const navigate = useNavigate();
  const {
    cart,
    isTrayOpen,
    closeTray,
    updateQty,
    updateNote,
    removeItem,
  } = useCart();

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const service = Math.round(subtotal * 0.05);
  const total = subtotal + service;

  const handleFinalizeOrder = () => {
    if (cart.length === 0) {
      alert("Your tray is empty.");
      return;
    }
    // Mark the tray as ready so the Order page will show it
    localStorage.setItem(FINALIZED_KEY, 'true');
    closeTray();
    navigate('/payment');
  };

  return (
    <>
      {isTrayOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={closeTray} />

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
                </div>
              )}
            </div>

            {/* Summary + Finalize Order */}
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
                  Choose your mode of payment and discount on the next step.
                </p>

                <button
                  onClick={handleFinalizeOrder}
                  className="w-full bg-[#296c39] text-white py-4 rounded-full flex items-center justify-center gap-2 hover:bg-[#1f5129] transition"
                >
                  Finalize Order <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}