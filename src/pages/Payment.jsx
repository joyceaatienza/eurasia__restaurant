import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  Wallet,
  Smartphone,
  CreditCard,
  Landmark,
  CheckCircle2,
  ShieldCheck,
  Receipt,
  ShoppingBag,
  History,
  X,
  Check,
  ArrowLeft
} from 'lucide-react';
import heroImage from '../assets/bgHero.jpg';
import { ordersApi } from '../services/ordersApi';

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', icon: Wallet },
  { id: 'gcash', label: 'GCash', icon: Smartphone },
  { id: 'paymaya', label: 'PayMaya', icon: CreditCard },
  { id: 'bank', label: 'Bank Transfer', icon: Landmark },
];

const CART_STORAGE_KEY = 'eurasia_cart';
const BUY_NOW_KEY = 'eurasia_buy_now';
const MY_ORDERS_KEY = 'eurasia_my_pending_orders';
const MY_ORDER_HISTORY_KEY = 'eurasia_my_order_history';

const HISTORY_POLL_MS = 5000;

const FOOD_STEPS = ['pending', 'preparing', 'ready'];
const FOOD_STEP_LABELS = {
  pending: 'Received',
  preparing: 'Preparing',
  ready: 'Ready',
};

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function addToStoredIds(key, ids) {
  if (!ids || ids.length === 0) return;
  try {
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    const merged = Array.from(new Set([...existing, ...ids.filter((id) => id != null)]));
    localStorage.setItem(key, JSON.stringify(merged));
  } catch (e) {
    console.error(`Failed to update ${key}:`, e);
  }
}

function removeFromStoredIds(key, ids) {
  try {
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    const remaining = existing.filter((id) => !ids.includes(id));
    localStorage.setItem(key, JSON.stringify(remaining));
  } catch (e) {
    console.error(`Failed to prune ${key}:`, e);
  }
}

function OrderHistoryCard({ order }) {
  const status = (order.status || 'pending').toLowerCase();
  const cancelled = status === 'cancelled';
  const settled = Boolean(order.receipt_image);
  const paid = ['verified', 'completed'].includes(
    (order.payment_status || '').toLowerCase()
  );
  const currentStep = FOOD_STEPS.indexOf(status);
  const orderNo = order.daily_number ?? order.id;

  const items = order.items || [];
  const total = Number(
    order.total ??
      Number(order.subtotal || 0) +
        Number(order.service_fee || 0) -
        Number(order.discount_amount || 0)
  );

  let payLabel = 'Unpaid';
  let payClass = 'bg-neutral-100 text-neutral-500';
  if (paid) {
    payLabel = 'Payment verified';
    payClass = 'bg-emerald-50 text-emerald-700';
  } else if (settled) {
    payLabel = 'Awaiting verification';
    payClass = 'bg-amber-50 text-amber-700';
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-1">
        <span className="font-[Prata] text-sm text-[#1d080f]">
          Table {order.table_number || '—'}
        </span>
        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${payClass}`}>
          {payLabel}
        </span>
      </div>
      <p className="text-[11px] text-neutral-400 mb-4">Order #{orderNo}</p>

      {cancelled ? (
        <div className="bg-red-50 text-red-600 text-xs font-medium rounded-lg px-3 py-2 text-center mb-3">
          This order was cancelled.
        </div>
      ) : (
        <div className="flex items-center justify-between mb-4">
          {FOOD_STEPS.map((step, i) => {
            const done = i <= currentStep;
            return (
              <div key={step} className="flex-1 flex flex-col items-center relative">
                {i > 0 && (
                  <span
                    className={`absolute top-2 right-1/2 w-full h-0.5 z-0 transition-colors duration-500 ${
                      i <= currentStep ? 'bg-[#2e5a2e]' : 'bg-neutral-200'
                    }`}
                  />
                )}
                <span
                  className={`relative z-10 w-4 h-4 rounded-full border-2 transition-colors duration-500 ${
                    done ? 'bg-[#2e5a2e] border-[#2e5a2e]' : 'bg-white border-neutral-300'
                  }`}
                />
                <span
                  className={`mt-1.5 text-[10px] transition-colors duration-500 ${
                    done ? 'text-[#2e5a2e] font-semibold' : 'text-neutral-400'
                  }`}
                >
                  {FOOD_STEP_LABELS[step]}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="border-t border-dashed border-neutral-200 pt-3 space-y-1">
        {items.map((it, idx) => {
          const isDone = Boolean(it.checked);
          return (
            <div key={idx} className="flex justify-between items-center text-xs">
              <span
                className={`flex items-center gap-1.5 ${
                  isDone ? 'line-through text-neutral-400' : 'text-neutral-600'
                }`}
              >
                {isDone && <Check size={12} className="text-[#2e5a2e] shrink-0" />}
                {(it.item_name || it.name || '').toString()} ×{it.quantity || it.qty}
              </span>
              <span className={isDone ? 'line-through text-neutral-400' : 'text-neutral-600'}>
                ₱{' '}
                {(Number(it.price) * Number(it.quantity || it.qty)).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          );
        })}
        <div className="flex justify-between text-sm font-bold text-[#1d080f] pt-2">
          <span>Total</span>
          <span>₱ {total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>
    </div>
  );
}

function Payment() {
  const navigate = useNavigate();

  // 'loading' | 'order' | 'empty' | 'settle'
  const [screen, setScreen] = useState('loading');

  // --- Order screen state ---
  const [tableNumber, setTableNumber] = useState("");
  const [orderItems, setOrderItems] = useState([]);
  const [isBuyNow, setIsBuyNow] = useState(false);
  const [method, setMethod] = useState('cash');
  const [discount, setDiscount] = useState(null);
  const [discountIdFile, setDiscountIdFile] = useState(null);
  const [placing, setPlacing] = useState(false);
  const [justOrdered, setJustOrdered] = useState(false);

  // --- Settle screen state ---
  const [unpaidOrders, setUnpaidOrders] = useState([]);
  const [settleLoading, setSettleLoading] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);
  const [settling, setSettling] = useState(false);
  const [justSettled, setJustSettled] = useState(false);

  const [toast, setToast] = useState("");

  // --- History modal state ---
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyOrders, setHistoryOrders] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Load cart or buy-now item on mount
  useEffect(() => {
    const buyNowRaw = localStorage.getItem(BUY_NOW_KEY);
    if (buyNowRaw) {
      try {
        setOrderItems([JSON.parse(buyNowRaw)]);
        setIsBuyNow(true);
        setScreen('order');
        return;
      } catch (e) {
        console.error("Failed to load buy-now item:", e);
      }
    }

    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        if (parsed.length > 0) {
          setOrderItems(parsed);
          setScreen('order');
          return;
        }
      } catch (e) {
        console.error("Failed to load cart items:", e);
      }
    }

    setScreen('empty');
  }, []);

  // ---------------- Order totals ----------------
  const orderSubtotal = orderItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const orderServiceFee = Math.round(orderSubtotal * 0.05 * 100) / 100;
  const orderDiscountAmount = discount ? Math.round(orderSubtotal * 0.20) : 0;
  const orderTotal = orderSubtotal + orderServiceFee - orderDiscountAmount;

  // ---------------- Settle totals ----------------
  const settleTotal = unpaidOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const settleItems = unpaidOrders.flatMap((o) =>
    (o.items || []).map((it) => ({ ...it, orderId: o.id }))
  );
  const settleMethod = unpaidOrders[0]?.payment_method || 'cash';
  const isCash = settleMethod === 'cash';
  const settleMethodLabel =
    PAYMENT_METHODS.find((m) => m.id === settleMethod)?.label || settleMethod;

  // ---------------- Place Order ----------------
  const handlePlaceOrder = async () => {
    if (!tableNumber.trim()) {
      alert("Please enter your table number before proceeding.");
      return;
    }

    if (discount && !discountIdFile) {
      alert(`Please upload a photo of your ${discount.toUpperCase()} ID for verification.`);
      return;
    }

    try {
      setPlacing(true);

      const discountIdBase64 = discountIdFile ? await fileToBase64(discountIdFile) : null;

      const payload = {
        table_number: tableNumber.trim(),
        payment_method: method,
        discount_type: discount || null,
        discount_id_image: discountIdBase64,
        subtotal: orderSubtotal,
        service_fee: orderServiceFee,
        discount_amount: orderDiscountAmount,
        total: orderTotal,
        items: orderItems.map((item) => ({
          menu_item_id: item.id,
          item_name: item.name,
          price: item.price,
          quantity: item.qty,
          note: item.note || null,
        })),
      };

      const created = await ordersApi.create(payload);
      const newId =
        created?.id ??
        created?.order?.id ??
        created?.orderId ??
        created?.insertId;

      // Remember this order so Settle Bill and History can find it later
      addToStoredIds(MY_ORDERS_KEY, [newId]);
      addToStoredIds(MY_ORDER_HISTORY_KEY, [newId]);

      if (isBuyNow) {
        localStorage.removeItem(BUY_NOW_KEY);
      } else {
        localStorage.removeItem(CART_STORAGE_KEY);
      }

      setOrderItems([]);
      setDiscount(null);
      setDiscountIdFile(null);
      setJustOrdered(true);
      setScreen('empty');

      setToast("Order sent to the kitchen! Settle your bill after your meal.");
      setTimeout(() => setToast(""), 5000);
    } catch (err) {
      console.error(err);
      alert("Sorry, something went wrong while placing your order. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  // ---------------- Settle Bill ----------------
  const openSettle = async () => {
    setScreen('settle');
    setSettleLoading(true);
    setJustSettled(false);

    try {
      const ids = JSON.parse(localStorage.getItem(MY_ORDERS_KEY) || '[]');
      if (ids.length === 0) {
        setUnpaidOrders([]);
        return;
      }

      const results = await Promise.all(
        ids.map((id) => ordersApi.getById(id).catch(() => null))
      );

      // Unpaid = no receipt uploaded yet and not cancelled
      const unpaid = results.filter(
        (o) => o && !o.receipt_image && o.status !== 'cancelled'
      );

      // Drop anything already settled or gone from the saved list
      const stillUnpaidIds = unpaid.map((o) => o.id);
      const settledIds = ids.filter((id) => !stillUnpaidIds.includes(id));
      if (settledIds.length > 0) removeFromStoredIds(MY_ORDERS_KEY, settledIds);

      setUnpaidOrders(unpaid);
      if (unpaid.length > 0) setTableNumber(unpaid[0].table_number || "");
    } catch (err) {
      console.error('Failed to load unpaid orders:', err);
      setUnpaidOrders([]);
    } finally {
      setSettleLoading(false);
    }
  };

  const handleSubmitPayment = async () => {
    if (!receiptFile) {
      alert(isCash
        ? 'Please upload a photo of the receipt given by the cashier.'
        : 'Please upload a screenshot of your payment.');
      return;
    }

    try {
      setSettling(true);

      const receiptBase64 = await fileToBase64(receiptFile);
      const orderIds = unpaidOrders.map((o) => o.id);

      await ordersApi.payMultiple(orderIds, {
        receipt_image: receiptBase64,
      });

      removeFromStoredIds(MY_ORDERS_KEY, orderIds);
      addToStoredIds(MY_ORDER_HISTORY_KEY, orderIds);

      setUnpaidOrders([]);
      setReceiptFile(null);
      setJustSettled(true);

      setToast("Payment submitted! The cashier will verify it shortly.");
      setTimeout(() => setToast(""), 5000);
    } catch (err) {
      console.error(err);
      alert("Sorry, something went wrong while submitting your payment. Please try again.");
    } finally {
      setSettling(false);
    }
  };

  // ---------------- History ----------------
  const fetchHistory = useCallback(async () => {
    const ids = JSON.parse(localStorage.getItem(MY_ORDER_HISTORY_KEY) || '[]');
    if (ids.length === 0) {
      setHistoryOrders([]);
      return;
    }
    const results = await Promise.all(
      ids.map((id) => ordersApi.getById(id).catch(() => null))
    );
    const valid = results.filter(Boolean);
    valid.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    setHistoryOrders(valid);
  }, []);

  const openHistory = async () => {
    setHistoryOpen(true);
    setHistoryLoading(true);
    try {
      await fetchHistory();
    } catch (e) {
      console.error('Failed to load order history:', e);
      setHistoryOrders([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Auto-refresh the History while it's open, so kitchen updates appear live
  useEffect(() => {
    if (!historyOpen) return;
    const interval = setInterval(() => {
      fetchHistory().catch((e) => console.error('History poll failed:', e));
    }, HISTORY_POLL_MS);
    return () => clearInterval(interval);
  }, [historyOpen, fetchHistory]);

  const handleReceiptChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setReceiptFile(file);
  };

  const handleDiscountIdChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setDiscountIdFile(file);
  };

  const heroTitle = screen === 'settle' ? 'Settle your bill' : 'Place your order';

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#1d080f] font-sans">
      <div className="relative h-64 overflow-hidden shrink-0 md:h-60">
        <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-white/40" />
        <div className="relative flex h-full items-start justify-center px-4 pt-10 md:pt-14">
          <h1
            className="font-[Prata] font-bold text-xs md:text-xs text-[#1d080f]"
            style={{ WebkitTextStroke: '0.7px #1d080f' }}
          >
            {heroTitle}
          </h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8">

        {/* ---------------- EMPTY / LANDING ---------------- */}
        {screen === 'empty' && (
          <div className="bg-white rounded-2xl border border-neutral-200/80 p-12 text-center shadow-xs">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${justOrdered ? 'bg-emerald-50 text-emerald-600' : 'bg-neutral-100 text-neutral-400'}`}>
              {justOrdered ? <CheckCircle2 size={28} /> : <ShoppingBag size={28} />}
            </div>
            <h2 className="font-['Prata'],serif text-xl font-bold mb-3">
              {justOrdered ? 'Order Sent to Kitchen!' : 'Your Tray is Empty'}
            </h2>
            <p className="text-sm text-neutral-500 mx-auto mb-6 text-center">
              {justOrdered
                ? 'Your food is being prepared. Enjoy your meal, then settle your bill at the counter and upload your receipt here.'
                : 'There are no items ready to order. Browse the menu, or settle a bill from an earlier order.'}
            </p>
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={() => navigate('/menu')}
                className="bg-[#1d080f] text-white text-sm font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition cursor-pointer w-full max-w-xs"
              >
                Browse Menu
              </button>
              <button
                onClick={openSettle}
                className="flex items-center justify-center gap-2 bg-[#2e5a2e] text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-[#244724] transition cursor-pointer w-full max-w-xs"
              >
                <Receipt size={16} /> Settle Bill
              </button>
              <button
                onClick={openHistory}
                className="flex items-center justify-center gap-2 border border-[#1d080f] text-[#1d080f] text-sm font-semibold px-6 py-3 rounded-xl hover:bg-[#1d080f]/5 transition cursor-pointer w-full max-w-xs"
              >
                <History size={16} /> View Order History
              </button>
            </div>
          </div>
        )}

        {/* ---------------- ORDER SCREEN ---------------- */}
        {screen === 'order' && orderItems.length > 0 && (
          <div className="grid gap-6">

            <div className="bg-white rounded-2xl shadow-sm p-8 border border-neutral-200/80">
              <h2 className="text-center font-[Prata] text-amber-700 tracking-wide text-sm mb-4">
                ENTER YOUR TABLE NUMBER
              </h2>
              <div className="max-w-xs mx-auto">
                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="e.g. T7"
                  className="w-full text-center bg-[#f7f5f0] rounded-md px-4 py-3.5 font-[Prata] text-[#1d080f] placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-[#1d080f]"
                />
                {!tableNumber && (
                  <p className="text-xs text-red-500 font-[Prata] text-center mt-2">
                    Please enter your table number.
                  </p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-xs">
              <h4 className="text-[16px] font-bold text-[#b38548] uppercase tracking-wider mb-4">
                1. Select Payment Method
              </h4>
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

            <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-xs">
              <h4 className="text-[16px] font-bold text-[#b38548] uppercase tracking-wider mb-4">
                2. Select Discount (Optional)
              </h4>

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

              {discount && (
                <div className="mt-4 p-4 bg-[#faf8f5] rounded-xl border border-dashed border-amber-800/30">
                  <label className="flex flex-col items-center justify-center gap-2 cursor-pointer text-center">
                    <UploadCloud size={24} className="text-[#b38548]" />
                    <div className="text-xs">
                      <span className="font-semibold text-[#1d080f]">
                        Upload Picture of {discount === 'pwd' ? 'PWD ID' : 'Senior Citizen ID'}
                      </span>
                      <p className="text-neutral-500 mt-0.5">Attach ID photo to prove discount eligibility</p>
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

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 text-center">
              Payment comes later — after your meal, pay at the counter and upload the receipt under Settle Bill.
            </div>

            <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-xs font-mono">
              <div className="border-b border-dashed border-neutral-300 pb-3 mb-4 text-base">
                <div className="flex justify-between items-center font-bold text-neutral-800 font-[Prata]">
                  <span>Eurasia Restaurant</span>
                  <Receipt size={18} className="text-neutral-400" />
                </div>
              </div>

              <div className="divide-y divide-neutral-100 max-h-64 overflow-y-auto pr-1">
                {orderItems.map((item, i) => (
                  <div key={i} className="py-2 flex justify-between items-center text-xs">
                    <span className="text-neutral-800">
                      {(item.name || '').toString().toUpperCase()} x{item.qty}
                    </span>
                    <span className="font-semibold text-neutral-800">
                      ₱ {(item.price * item.qty).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-dashed border-neutral-300 space-y-2 text-xs">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal</span>
                  <span>₱ {orderSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Service</span>
                  <span>₱ {orderServiceFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                {discount && (
                  <div className="flex justify-between text-red-600 font-semibold">
                    <span>DISCOUNT ({discount === 'pwd' ? 'PWD' : 'SENIOR'})</span>
                    <span>- ₱ {orderDiscountAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline text-base font-bold text-[#1d080f] pt-3 border-t border-neutral-800">
                  <span>TOTAL</span>
                  <span>₱ {orderTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="flex gap-3 mt-8 font-sans">
                <button
                  type="button"
                  onClick={() => navigate('/menu')}
                  className="flex-1 border border-neutral-300 text-neutral-700 text-sm font-medium py-3 rounded-xl hover:bg-neutral-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={placing}
                  className="flex-1 bg-[#2e5a2e] hover:bg-[#244724] text-white text-sm font-bold py-3 rounded-xl shadow-sm transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {placing ? 'Sending...' : 'Order Now'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ---------------- SETTLE BILL SCREEN ---------------- */}
        {screen === 'settle' && (
          <div className="grid gap-6">

            <button
              onClick={() => { setScreen('empty'); setJustOrdered(false); }}
              className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-[#1d080f] transition cursor-pointer w-fit"
            >
              <ArrowLeft size={16} /> Back
            </button>

            {settleLoading ? (
              <div className="bg-white rounded-2xl border border-neutral-200/80 p-12 text-center shadow-xs">
                <p className="text-sm text-neutral-500">Loading your bill…</p>
              </div>
            ) : justSettled ? (
              <div className="bg-white rounded-2xl border border-neutral-200/80 p-12 text-center shadow-xs">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={28} />
                </div>
                <h2 className="font-['Prata'],serif text-xl font-bold mb-3">Payment Submitted!</h2>
                <p className="text-sm text-neutral-500 mb-6">
                  Thank you for dining with Eurasia San Jose. The cashier will verify your payment shortly — you can track it in History.
                </p>
                <button
                  onClick={openHistory}
                  className="flex items-center justify-center gap-2 border border-[#1d080f] text-[#1d080f] text-sm font-semibold px-6 py-3 rounded-xl hover:bg-[#1d080f]/5 transition cursor-pointer w-full max-w-xs mx-auto"
                >
                  <History size={16} /> View Order History
                </button>
              </div>
            ) : unpaidOrders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-neutral-200/80 p-12 text-center shadow-xs">
                <div className="w-16 h-16 bg-neutral-100 text-neutral-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Receipt size={28} />
                </div>
                <h2 className="font-['Prata'],serif text-xl font-bold mb-3">No Bill to Settle</h2>
                <p className="text-sm text-neutral-500 mb-6">
                  You have no unpaid orders right now. Place an order first, then come back here after your meal.
                </p>
                <button
                  onClick={() => navigate('/menu')}
                  className="bg-[#1d080f] text-white text-sm font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition cursor-pointer w-full max-w-xs mx-auto"
                >
                  Browse Menu
                </button>
              </div>
            ) : (
              <>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 font-[Prata] text-center">
                  Found {unpaidOrders.length} unpaid order{unpaidOrders.length !== 1 ? 's' : ''} for Table {tableNumber || '—'}. Review the bill below.
                </div>

                <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-xs">
                  <h4 className="text-[16px] font-bold text-[#b38548] uppercase tracking-wider mb-2">
                    {isCash ? 'Upload Receipt from Cashier' : 'Upload Payment Receipt'}
                  </h4>
                  <p className="text-xs text-neutral-500 mb-4">
                    You chose <span className="font-semibold text-[#1d080f]">{settleMethodLabel}</span> when you ordered.{' '}
                    {isCash
                      ? 'After paying at the counter, take a photo of the receipt handed to you by the cashier and attach it here.'
                      : 'Attach a screenshot of your successful transaction.'}
                  </p>

                  <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-neutral-300 rounded-xl py-6 px-4 text-center cursor-pointer hover:bg-neutral-50 transition">
                    <UploadCloud size={28} className="text-neutral-400" />
                    <div className="text-xs font-medium text-neutral-700">
                      {receiptFile ? (
                        <span className="text-emerald-700 flex items-center gap-1.5">
                          <CheckCircle2 size={16} /> {receiptFile.name}
                        </span>
                      ) : (
                        <span>
                          {isCash ? 'Drop receipt photo here or ' : 'Drop payment screenshot here or '}
                          <span className="text-[#1d080f] underline">browse</span>
                        </span>
                      )}
                    </div>
                    <input type="file" accept="image/*" hidden onChange={handleReceiptChange} />
                  </label>
                </div>

                <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-xs font-mono">
                  <div className="border-b border-dashed border-neutral-300 pb-3 mb-4 text-base">
                    <div className="flex justify-between items-center font-bold text-neutral-800 font-[Prata]">
                      <span>Eurasia Restaurant</span>
                      <Receipt size={18} className="text-neutral-400" />
                    </div>
                  </div>

                  <div className="divide-y divide-neutral-100 max-h-64 overflow-y-auto pr-1">
                    {settleItems.map((item, i) => (
                      <div key={i} className="py-2 flex justify-between items-center text-xs">
                        <span className="text-neutral-800">
                          {(item.item_name || '').toString().toUpperCase()} x{item.quantity}
                        </span>
                        <span className="font-semibold text-neutral-800">
                          ₱ {(Number(item.price) * Number(item.quantity)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-dashed border-neutral-300 space-y-2 text-xs">
                    {unpaidOrders.map((o) => (
                      <div key={o.id} className="flex justify-between text-neutral-500 text-[11px]">
                        <span>Order #{o.daily_number ?? o.id}</span>
                        <span>₱ {Number(o.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-baseline text-base font-bold text-[#1d080f] pt-3 border-t border-neutral-800">
                      <span>TOTAL</span>
                      <span>₱ {settleTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-8 font-sans">
                    <button
                      type="button"
                      onClick={() => setScreen('empty')}
                      className="flex-1 border border-neutral-300 text-neutral-700 text-sm font-medium py-3 rounded-xl hover:bg-neutral-50 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmitPayment}
                      disabled={settling}
                      className="flex-1 bg-[#2e5a2e] hover:bg-[#244724] text-white text-sm font-bold py-3 rounded-xl shadow-sm transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {settling ? 'Submitting...' : `Submit Payment • ₱ ${settleTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {historyOpen && (
        <div
          className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm sm:p-4"
          onClick={() => setHistoryOpen(false)}
        >
          <div
            className="bg-[#faf8f5] w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[85vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
              <h3 className="font-[Prata] text-lg text-[#1d080f] flex items-center gap-2">
                <History size={18} className="text-[#b38548]" /> Order History
              </h3>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-[10px] text-neutral-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
                <button
                  onClick={() => setHistoryOpen(false)}
                  className="text-neutral-500 hover:text-[#1d080f] cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto px-6 py-5 space-y-4">
              {historyLoading ? (
                <p className="text-center text-sm text-neutral-500 py-8">Loading your orders…</p>
              ) : historyOrders.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-14 h-14 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-3 text-neutral-400">
                    <History size={24} />
                  </div>
                  <p className="text-sm text-neutral-500">
                    No orders yet. Once you place an order, you can track its status here.
                  </p>
                </div>
              ) : (
                historyOrders.map((o) => <OrderHistoryCard key={o.id} order={o} />)
              )}
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 28,
            right: 28,
            background: "rgba(26, 122, 76, 0.6)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            color: "#fff",
            padding: "16px 20px",
            borderRadius: 14,
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            zIndex: 100,
            maxWidth: 340,
          }}
          className="font-sans"
        >
          <span
            style={{
              background: "rgba(255,255,255,0.2)",
              borderRadius: 10,
              width: 36,
              height: 36,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CheckCircle2 size={20} className="text-white" />
          </span>
          <div>
            <div className="text-sm font-bold leading-tight">Success</div>
            <div className="text-xs text-white/85 leading-snug mt-0.5">{toast}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Payment;