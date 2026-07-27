import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UploadCloud, 
  Wallet, 
  Smartphone, 
  CreditCard, 
  Landmark, 
  CheckCircle2, 
  ArrowLeft, 
  ShieldCheck, 
  Receipt,
  ShoppingBag
} from 'lucide-react';
import heroImage from '../assets/bgHero.jpg';

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', icon: Wallet },
  { id: 'gcash', label: 'GCash', icon: Smartphone },
  { id: 'paymaya', label: 'PayMaya', icon: CreditCard },
  { id: 'bank', label: 'Bank Transfer', icon: Landmark },
];

const CART_STORAGE_KEY = 'eurasia_cart';
const PAYMENT_METHOD_KEY = 'eurasia_payment_method';

function Payment() {
  const navigate = useNavigate();
  const [method, setMethod] = useState('cash');
  const [discount, setDiscount] = useState(null); // 'pwd' | 'senior' | null
  const [receiptFile, setReceiptFile] = useState(null);
  const [discountIdFile, setDiscountIdFile] = useState(null);
  const [orderItems, setOrderItems] = useState([]);

  // Load cart items dynamically from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      try {
        setOrderItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to load cart items:", e);
      }
    }

    const savedMethod = localStorage.getItem(PAYMENT_METHOD_KEY);
    if (savedMethod) {
      setMethod(savedMethod);
    }
  }, []);

  // Calculation based on cart content and Eurasia's structure (Service Fee instead of VAT)
  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const serviceFee = Math.round(subtotal * 0.05 * 100) / 100; // Estimated service charge rate
  const discountRate = discount ? 0.20 : 0;
  const discountAmount = Math.round(subtotal * discountRate);
  const total = subtotal + serviceFee - discountAmount;

  const handleReceiptChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setReceiptFile(file);
  };

  const handleDiscountIdChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setDiscountIdFile(file);
  };

  const handlePayNow = () => {
    if (discount && !discountIdFile) {
      alert(`Please upload a photo of your ${discount.toUpperCase()} ID for verification.`);
      return;
    }

    if (method !== 'cash' && !receiptFile) {
      alert('Please upload your payment receipt screenshot before proceeding.');
      return;
    }

    // Clear cart state after successful checkout
    localStorage.removeItem(CART_STORAGE_KEY);
    localStorage.removeItem(PAYMENT_METHOD_KEY);
    setOrderItems([]);
    
    alert("Payment submitted successfully! Thank you for dining with Eurasia San Jose.");
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#1d080f] font-sans">
      {/* Header Banner */}
      <div className="relative h-48 md:h-56 overflow-hidden">
        <img src={heroImage} alt="Eurasia Banner" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/40 backdrop-brightness-75" />
        <div className="relative max-w-3xl mx-auto h-full flex flex-col justify-between px-6 py-6 text-white">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-xs font-medium tracking-wider uppercase hover:opacity-80 w-fit cursor-pointer"
          >
            <ArrowLeft size={16} /> Back to Menu
          </button>
          <div>
            <h1 className="font-['Prata'],serif text-2xl md:text-3xl font-bold tracking-wide">
              Eurasia San Jose
            </h1>
            <p className="text-xs md:text-sm text-neutral-200 mt-1">
              Banay Banay San Jose Batangas &bull; Request for Payment
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8">
        {orderItems.length === 0 ? (
          /* Empty Cart State */
          <div className="bg-white rounded-2xl border border-neutral-200/80 p-12 text-center shadow-xs">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4 text-neutral-400">
              <ShoppingBag size={28} />
            </div>
            <h2 className="font-['Prata'],serif text-xl font-bold mb-2">Your Tray is Empty</h2>
            <p className="text-sm text-neutral-500 max-w-sm mx-auto mb-6">
              There are no items ready for checkout. Please add dishes from our menu first.
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-[#1d080f] text-white text-sm font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition cursor-pointer"
            >
              Browse Menu
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            
            {/* Step 1: Select Payment Method */}
            <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-xs">
              <h2 className="text-xs font-bold text-[#b38548] uppercase tracking-wider mb-4">
                1. Select Payment Method
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {PAYMENT_METHODS.map(({ id, label, icon: Icon }) => {
                  const isSelected = method === id;
                  return (
                    <button
                      key={id}
                      onClick={() => setMethod(id)}
                      className={`flex flex-col items-center gap-2.5 p-3.5 rounded-xl text-xs font-medium transition-all border cursor-pointer ${
                        isSelected
                          ? 'bg-[#1d080f] text-white border-[#1d080f] shadow-sm'
                          : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                      }`}
                    >
                      <Icon size={20} className={isSelected ? 'text-white' : 'text-neutral-600'} />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Discounts & ID Verification Upload */}
            <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-xs">
              <h2 className="text-xs font-bold text-[#b38548] uppercase tracking-wider mb-4">
                2. Select Discount (Optional)
              </h2>
              
              <div className="grid sm:grid-cols-2 gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setDiscount(discount === 'pwd' ? null : 'pwd');
                    setDiscountIdFile(null);
                  }}
                  className={`flex items-center justify-between p-3.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                    discount === 'pwd'
                      ? 'border-[#1d080f] bg-[#1d080f]/5 text-[#1d080f]'
                      : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <ShieldCheck size={16} /> PWD Discount (20%)
                  </span>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    discount === 'pwd' ? 'border-[#1d080f] bg-[#1d080f]' : 'border-neutral-300'
                  }`}>
                    {discount === 'pwd' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDiscount(discount === 'senior' ? null : 'senior');
                    setDiscountIdFile(null);
                  }}
                  className={`flex items-center justify-between p-3.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                    discount === 'senior'
                      ? 'border-[#1d080f] bg-[#1d080f]/5 text-[#1d080f]'
                      : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <ShieldCheck size={16} /> Senior Citizen (20%)
                  </span>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    discount === 'senior' ? 'border-[#1d080f] bg-[#1d080f]' : 'border-neutral-300'
                  }`}>
                    {discount === 'senior' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </button>
              </div>

              {/* Upload Discount ID Photo Box */}
              {discount && (
                <div className="mt-4 p-4 bg-[#faf8f5] rounded-xl border border-dashed border-amber-800/30">
                  <label className="flex flex-col items-center justify-center gap-2 cursor-pointer text-center">
                    <UploadCloud size={24} className="text-[#b38548]" />
                    <div className="text-xs">
                      <span className="font-semibold text-[#1d080f]">
                        Upload Picture of {discount === 'pwd' ? 'PWD ID' : 'Senior Citizen ID'}
                      </span>
                      <p className="text-neutral-500 mt-0.5">Attach ID photo to prove customer discount eligibility</p>
                    </div>
                    {discountIdFile ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full mt-1">
                        <CheckCircle2 size={14} /> {discountIdFile.name}
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-700 font-medium bg-amber-50 px-2.5 py-0.5 rounded">
                        ID Photo Required
                      </span>
                    )}
                    <input type="file" accept="image/*" hidden onChange={handleDiscountIdChange} />
                  </label>
                </div>
              )}
            </div>

            {/* Step 3: Receipt Screenshot Upload for Non-Cash */}
            {method !== 'cash' && (
              <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-xs">
                <h2 className="text-xs font-bold text-[#b38548] uppercase tracking-wider mb-2">
                  3. Upload Payment Receipt
                </h2>
                <p className="text-xs text-neutral-500 mb-4">
                  Attach a screenshot of your successful transaction via {PAYMENT_METHODS.find(m => m.id === method)?.label}.
                </p>

                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-neutral-300 rounded-xl py-6 px-4 text-center cursor-pointer hover:bg-neutral-50 transition">
                  <UploadCloud size={28} className="text-neutral-400" />
                  <div className="text-xs font-medium text-neutral-700">
                    {receiptFile ? (
                      <span className="text-emerald-700 flex items-center gap-1.5">
                        <CheckCircle2 size={16} /> {receiptFile.name}
                      </span>
                    ) : (
                      <span>Drop payment screenshot here or <span className="text-[#1d080f] underline">browse</span></span>
                    )}
                  </div>
                  <input type="file" accept="image/*" hidden onChange={handleReceiptChange} />
                </label>
              </div>
            )}

            {/* Step 4: Receipt Breakdown */}
            <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-xs font-mono">
              
              {/* Receipt Header */}
              <div className="border-b border-dashed border-neutral-300 pb-3 mb-4 text-xs">
                <div className="flex justify-between items-center font-bold text-neutral-800 font-sans">
                  <span>EURASIA RESTAURANT</span>
                  <Receipt size={18} className="text-neutral-400" />
                </div>
              </div>

              {/* Order Items List */}
              <div className="divide-y divide-neutral-100 max-h-64 overflow-y-auto pr-1">
                {orderItems.map((item, i) => (
                  <div key={i} className="py-2 flex justify-between items-center text-xs">
                    <span className="text-neutral-800">
                      {item.name.toUpperCase()} x{item.qty}
                    </span>
                    <span className="font-semibold text-neutral-800">
                      ₱ {(item.price * item.qty).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>

              {/* Eurasia Receipt Breakdown (Subtotal + Service Fee - Discount = Total) */}
              <div className="mt-4 pt-4 border-t border-dashed border-neutral-300 space-y-2 text-xs">
                <div className="flex justify-between text-neutral-600">
                  <span>SUBTOTAL</span>
                  <span>₱ {subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                
                <div className="flex justify-between text-neutral-600">
                  <span>SERVICE</span>
                  <span>₱ {serviceFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>

                {discount && (
                  <div className="flex justify-between text-red-600 font-semibold">
                    <span>DISCOUNT ({discount === 'pwd' ? 'PWD' : 'SENIOR'})</span>
                    <span>- ₱ {discountAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                <div className="flex justify-between items-baseline text-base font-bold text-[#1d080f] pt-3 border-t border-neutral-800">
                  <span>TOTAL</span>
                  <span>₱ {total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-8 font-sans">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="flex-1 border border-neutral-300 text-neutral-700 text-sm font-medium py-3 rounded-xl hover:bg-neutral-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePayNow}
                  className="flex-1 bg-[#2e5a2e] hover:bg-[#244724] text-white text-sm font-bold py-3 rounded-xl shadow-sm transition cursor-pointer"
                >
                  Pay Now &bull; ₱ {total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </button>
              </div>

            </div>

          </div>
        )}
      </div>
    </div>
  );
}

export default Payment;