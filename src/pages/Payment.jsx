import React, { useState } from 'react';
import { UploadCloud } from 'lucide-react';
import heroImage from '../assets/bgHero.jpg'
import logo from '../assets/logoword.png'

const ORDER_ITEMS = [
  { qty: 1, name: "Tom Ka Ghai - less spicy", price: 288 },
  { qty: 1, name: "Salpicao", price: 690 },
  { qty: 1, name: "Tutto Mare", price: 578 },
  { qty: 2, name: "Strawberry Yogurt Smoothie", price: 200 },
];

const PAYMENT_METHODS = ["Cash", "GCash", "Paymaya", "Bank Transfer"];

function Payment() {
  const [method, setMethod] = useState("Cash");
  const [discount, setDiscount] = useState(null); // 'pwd' | 'senior' | null
  const [fileName, setFileName] = useState("");

  const subtotal = ORDER_ITEMS.reduce((sum, item) => sum + item.price * item.qty, 0);
  const vat = Math.round(subtotal * 0.12);
  const discountRate = discount ? 0.20 : 0;
  const discountAmount = Math.round(subtotal * discountRate);
  const total = subtotal + vat - discountAmount;

  const cycleMethod = () => {
    const idx = PAYMENT_METHODS.indexOf(method);
    setMethod(PAYMENT_METHODS[(idx + 1) % PAYMENT_METHODS.length]);
  };

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (f) setFileName(f.name);
  };

  return (
    <div className="bg-white text-[#1d080f]">
      {/* Hero Header */}
      <div className="relative h-64 md:h-60 overflow-hidden shrink-0">
        <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-white/40" />
        <div className="relative flex h-full items-start justify-center px-4 pt-16 md:pt-20">
          <img src={logo} alt="Eurasia Restaurant" className="h-20 w-auto md:h-36" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 md:px-0 py-10">
        {/* Breadcrumb */}
        <div className="text-xs md:text-sm text-neutral-500 mb-6 font-[Prata]">
          Order Details &rarr; Tray &rarr; <b className="text-[#1d080f]">Payment</b> &rarr; Confirmation
        </div>

        <div className="border border-neutral-200 rounded-lg overflow-hidden">
          {/* Payment method row */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-200">
            <div>
              <div className="text-xs text-neutral-400 tracking-wide">PAYING WITH</div>
              <div className="font-[Prata] text-lg mt-1">💸 {method}</div>
            </div>
            <button
              onClick={cycleMethod}
              className="text-sm underline hover:text-amber-700 cursor-pointer"
            >
              Change
            </button>
          </div>

          <div className="px-6 py-6">
            <h3 className="font-[Prata] text-lg mb-4">Order Summary</h3>

            {ORDER_ITEMS.map((item, i) => (
              <div key={i} className="flex justify-between text-sm text-neutral-500 py-1">
                <span>- ({item.qty}) {item.name}</span>
                <span>₱ {(item.price * item.qty).toLocaleString()}</span>
              </div>
            ))}

            <div className="flex justify-between text-sm mt-3 pt-3 border-t border-neutral-200">
              <span>Subtotal</span>
              <span>₱ {subtotal.toLocaleString()}</span>
            </div>

            <div className="flex justify-between text-sm py-1">
              <span>VAT (12%)</span>
              <span>₱ {vat.toLocaleString()}</span>
            </div>

            {discount && (
              <div className="flex justify-between text-sm py-1 text-red-600">
                <span>Discount ({discount === "pwd" ? "PWD" : "Senior Citizen"})</span>
                <span>- ₱ {discountAmount.toLocaleString()}</span>
              </div>
            )}

            <div className="flex justify-between font-[Prata] text-base font-bold mt-2 pt-2 border-t border-neutral-200">
              <span>Total</span>
              <span>₱ {total.toLocaleString()}</span>
            </div>

            {/* Discount selection */}
            <div className="mt-6">
              <h3 className="font-[Prata] text-sm mb-3">Select Discount (Optional)</h3>

              <div
                onClick={() => setDiscount(discount === "pwd" ? null : "pwd")}
                className="flex items-center gap-2 text-sm py-1.5 cursor-pointer"
              >
                <div
                  className={`w-4 h-4 rounded-full border ${
                    discount === "pwd"
                      ? "bg-[#1d080f] border-[#1d080f]"
                      : "border-neutral-300"
                  }`}
                />
                PWD
              </div>

              <div
                onClick={() => setDiscount(discount === "senior" ? null : "senior")}
                className="flex items-center gap-2 text-sm py-1.5 cursor-pointer"
              >
                <div
                  className={`w-4 h-4 rounded-full border ${
                    discount === "senior"
                      ? "bg-[#1d080f] border-[#1d080f]"
                      : "border-neutral-300"
                  }`}
                />
                Senior Citizen
              </div>
            </div>

            {/* Receipt upload (only for non-cash methods) */}
            {method !== "Cash" && (
              <label className="mt-6 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-neutral-300 rounded-lg py-8 px-4 text-center text-sm text-neutral-500 cursor-pointer hover:bg-neutral-50 transition">
                <UploadCloud size={30} />
                <span>{fileName ? fileName : "Drop your payment receipt here or browse"}</span>
                <input type="file" hidden onChange={handleFile} accept="image/*" />
              </label>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-8">
              <button className="flex-1 border border-neutral-300 rounded-md py-2.5 text-sm hover:bg-neutral-100">
                Cancel
              </button>
              <button className="flex-1 bg-[#1d080f] text-white rounded-md py-2.5 text-sm hover:opacity-90">
                Pay Now &mdash; ₱ {total.toLocaleString()}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Payment;