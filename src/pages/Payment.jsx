import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  UploadCloud,
  CheckCircle2,
  ShieldCheck,
  Receipt,
  ShoppingBag,
  History,
  X,
  Check,
  ArrowLeft,
  ChevronDown
} from 'lucide-react';
import heroImage from '../assets/bgHero.jpg';
import { ordersApi } from '../services/ordersApi';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { readCachedOrders } from '../hooks/CustomerNotif';

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash' },
  { id: 'gcash', label: 'GCash' },
  { id: 'paymaya', label: 'PayMaya' },
  { id: 'bank', label: 'Bank Transfer' },
];

// The online half of a split payment
const ONLINE_METHODS = PAYMENT_METHODS.filter((m) => m.id !== 'cash');

const peso = (n) =>
  `₱ ${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Senior Citizens and PWDs get the same statutory discount, so they share one option
const SENIOR_PWD = 'senior_pwd';

const CART_STORAGE_KEY = 'eurasia_cart';
const BUY_NOW_KEY = 'eurasia_buy_now';
const FINALIZED_KEY = 'eurasia_finalized';

const HISTORY_POLL_MS = 5000;

// The "Ready to Serve" pop-up stays on screen for 8 seconds
const READY_DISPLAY_MS = 8000;
// Orders that already popped up, so a refresh doesn't show them again
const READY_POPPED_KEY = 'eurasia_ready_popup_shown';

function getPoppedOrders() {
  try {
    return JSON.parse(localStorage.getItem(READY_POPPED_KEY)) || [];
  } catch {
    return [];
  }
}

function markOrderPopped(id) {
  const list = Array.from(new Set([...getPoppedOrders(), id]));
  try {
    localStorage.setItem(READY_POPPED_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to save popped orders:', e);
  }
}

const FOOD_STEPS = ['pending', 'preparing', 'ready'];
const FOOD_STEP_LABELS = {
  pending: 'Received',
  preparing: 'Preparing',
  ready: 'Ready to Serve',
};

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

// A split payment has two proofs, but an order stores one receipt image —
// so both photos are stacked into one picture, each with a label showing
// what it is and how much. The cashier sees both without any backend change.
async function combineProofs(parts) {
  const images = await Promise.all(parts.map((p) => loadImageFile(p.file)));
  const width = Math.min(800, Math.max(...images.map((img) => img.naturalWidth)));
  const LABEL_H = 52;

  const scaled = images.map((img) => ({
    img,
    h: Math.round(img.naturalHeight * (width / img.naturalWidth)),
  }));
  const height = scaled.reduce((sum, s) => sum + LABEL_H + s.h, 0);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  let y = 0;
  scaled.forEach(({ img, h }, i) => {
    ctx.fillStyle = '#1d080f';
    ctx.fillRect(0, y, width, LABEL_H);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(parts[i].label, 16, y + LABEL_H / 2);
    y += LABEL_H;
    ctx.drawImage(img, 0, y, width, h);
    y += h;
  });

  return canvas.toDataURL('image/jpeg', 0.85);
}

function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/* Shows the picked photo so the customer can catch a wrong file before submitting */
/* Shows the picked photo — tap it to view it full size and make sure it's the right one */
function ImagePreview({ file, previewUrl, onRemove, label }) {
  const [zoomed, setZoomed] = useState(false);

  // While the full-size view is open: lock the page behind it and let Esc close it
  useEffect(() => {
    if (!zoomed) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setZoomed(false);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [zoomed]);

  if (!previewUrl) return null;

  return (
    <div className="mt-3">
      <div className="relative rounded-xl overflow-hidden border border-neutral-200 bg-neutral-50">
        <button
          type="button"
          onClick={() => setZoomed(true)}
          title="Tap to view full size"
          className="block w-full cursor-zoom-in"
        >
          <img
            src={previewUrl}
            alt={label}
            className="w-full max-h-56 object-contain"
          />
          <span className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs font-semibold px-3 py-1 rounded-full pointer-events-none">
            Tap to view full size
          </span>
        </button>
        <button
          type="button"
          onClick={onRemove}
          title="Remove this photo"
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>
      <p className="mt-2 text-xs text-neutral-700 text-center">
        {file?.name} — tap the upload box above to choose a different one.
      </p>

      {/* Full-size view */}
      {zoomed && (
        <div
          onClick={() => setZoomed(false)}
          className="fixed inset-0 z-[160] bg-black/85 flex flex-col items-center justify-center p-4 cursor-zoom-out"
        >
          <button
            type="button"
            onClick={() => setZoomed(false)}
            aria-label="Close"
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25 transition cursor-pointer"
          >
            <X size={22} />
          </button>
          <img
            src={previewUrl}
            alt={label}
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl cursor-default"
          />
          <p className="mt-3 text-sm text-white/80 text-center">
            {file?.name} · Tap anywhere outside the photo to close
          </p>
        </div>
      )}
    </div>
  );
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
  let payClass = 'bg-neutral-200 text-neutral-700';
  if (paid) {
    payLabel = 'Payment verified';
    payClass = 'bg-emerald-100 text-emerald-800';
  } else if (settled) {
    payLabel = 'Awaiting verification';
    payClass = 'bg-amber-100 text-amber-900';
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-1">
        <span className="font-[Prata] text-base text-[#1d080f]">
          {order.customer_name || '—'}
        </span>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${payClass}`}>
          {payLabel}
        </span>
      </div>
      <p className="text-xs text-neutral-700 mb-1" style={{ textAlign: 'left' }}>
        Order #{orderNo}
        {order.table_number ? ` · Table ${order.table_number}` : ''}
      </p>
      <div className="text-xs text-neutral-700 mb-4 space-y-0.5" style={{ textAlign: 'left' }}>
        <p>Ordered: {formatDateTime(order.created_at)}</p>
        {paid && order.verified_at && (
          <p className="text-emerald-800 font-medium">Payment verified: {formatDateTime(order.verified_at)}</p>
        )}
      </div>

      {cancelled ? (
        <div className="bg-red-100 text-red-800 text-sm font-medium rounded-lg px-3 py-2 text-center mb-3">
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
                      i <= currentStep ? 'bg-[#2e5a2e]' : 'bg-neutral-300'
                    }`}
                  />
                )}
                <span
                  className={`relative z-10 w-4 h-4 rounded-full border-2 transition-colors duration-500 ${
                    done ? 'bg-[#2e5a2e] border-[#2e5a2e]' : 'bg-white border-neutral-400'
                  }`}
                />
                <span
                  className={`mt-1.5 text-xs text-center transition-colors duration-500 ${
                    done ? 'text-[#2e5a2e] font-bold' : 'text-neutral-600 font-medium'
                  }`}
                >
                  {FOOD_STEP_LABELS[step]}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="border-t border-dashed border-neutral-300 pt-3 space-y-1">
        {items.map((it, idx) => {
          const isDone = Boolean(it.checked);
          return (
            <div key={idx} className="flex justify-between items-center text-sm">
              <span
                className={`flex items-center gap-1.5 ${
                  isDone ? 'line-through text-neutral-500' : 'text-neutral-800'
                }`}
              >
                {isDone ? <Check size={13} className="text-[#2e5a2e] shrink-0" /> : null}
                {(it.item_name || it.name || '').toString()} ×{it.quantity || it.qty}
              </span>
              <span className={isDone ? 'line-through text-neutral-500' : 'text-neutral-800'}>
                ₱{' '}
                {(Number(it.price) * Number(it.quantity || it.qty)).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          );
        })}
        <div className="flex justify-between text-base font-bold text-[#1d080f] pt-2">
          <span>Total</span>
          <span>₱ {total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>
    </div>
  );
}

/* Compact card for an order the kitchen is still working on */
function ActiveOrderCard({ order }) {
  const status = (order.status || 'pending').toLowerCase();
  const currentStep = FOOD_STEPS.indexOf(status);
  const orderNo = order.daily_number ?? order.id;
  const items = order.items || [];

  return (
    <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-xs text-left">
      <div className="flex items-center justify-between mb-1">
        <span className="font-[Prata] text-base text-[#1d080f]">Order #{orderNo}</span>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900">
          {FOOD_STEP_LABELS[status] || 'Received'}
        </span>
      </div>
      <p className="text-xs text-neutral-700 mb-4">
        Ordered: {formatDateTime(order.created_at)}
      </p>

      <div className="flex items-center justify-between mb-4">
        {FOOD_STEPS.map((step, i) => {
          const done = i <= currentStep;
          return (
            <div key={step} className="flex-1 flex flex-col items-center relative">
              {i > 0 && (
                <span
                  className={`absolute top-2 right-1/2 w-full h-0.5 z-0 transition-colors duration-500 ${
                    i <= currentStep ? 'bg-[#2e5a2e]' : 'bg-neutral-300'
                  }`}
                />
              )}
              <span
                className={`relative z-10 w-4 h-4 rounded-full border-2 transition-colors duration-500 ${
                  done ? 'bg-[#2e5a2e] border-[#2e5a2e]' : 'bg-white border-neutral-400'
                }`}
              />
              <span
                className={`mt-1.5 text-xs text-center transition-colors duration-500 ${
                  done ? 'text-[#2e5a2e] font-bold' : 'text-neutral-600 font-medium'
                }`}
              >
                {FOOD_STEP_LABELS[step]}
              </span>
            </div>
          );
        })}
      </div>

      <div className="border-t border-dashed border-neutral-300 pt-3 space-y-1">
        {items.map((it, idx) => (
          <div key={idx} className="flex justify-between items-center text-sm">
            <span className="flex items-center gap-1.5 text-neutral-800">
              {it.checked ? <Check size={13} className="text-[#2e5a2e] shrink-0" /> : null}
              {(it.item_name || '').toString()} ×{it.quantity}
            </span>
            <span className="text-neutral-800">
              ₱ {(Number(it.price) * Number(it.quantity)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Payment() {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { clearCart } = useCart();

  // 'loading' | 'order' | 'empty' | 'settle'
  const [screen, setScreen] = useState('loading');

  // --- Order screen state ---
  const [orderItems, setOrderItems] = useState([]);
  const [isBuyNow, setIsBuyNow] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [justOrdered, setJustOrdered] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [openNotes, setOpenNotes] = useState({});

  // --- Settle screen state ---
  const [unpaidOrders, setUnpaidOrders] = useState([]);
  const [settleLoading, setSettleLoading] = useState(false);
  const [method, setMethod] = useState('');
  // 'single' = one method for the whole bill; 'split' = part cash, part online
  const [payMode, setPayMode] = useState('single');
  const [onlineMethod, setOnlineMethod] = useState('');
  const [onlineAmount, setOnlineAmount] = useState('');
  const [cashReceiptFile, setCashReceiptFile] = useState(null);
  const [cashReceiptPreview, setCashReceiptPreview] = useState('');
  const [hasDiscount, setHasDiscount] = useState(false);
  const [discountIdFile, setDiscountIdFile] = useState(null);
  const [discountIdPreview, setDiscountIdPreview] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState('');
  const [settling, setSettling] = useState(false);
  const [justSettled, setJustSettled] = useState(false);

  const [toast, setToast] = useState({ message: '', tone: 'success' });

  const showToast = (message, tone = 'success') => {
    setToast({ message, tone });
    setTimeout(() => setToast({ message: '', tone }), 5000);
  };
  const showError = (message) => showToast(message, 'error');

  // --- History modal state ---
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyOrders, setHistoryOrders] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  // --- Active orders (still in the kitchen) ---
  const [activeOrders, setActiveOrders] = useState([]);
  // --- "Ready to Serve" pop-up ---
  const [readyPopup, setReadyPopup] = useState(null);

  // --- Jumping to an order from a notification ---
  const location = useLocation();
  const [highlightId, setHighlightId] = useState(null);
  const highlightRef = useRef(null);
  // The customer's orders from the last fetch, reused so a tap doesn't wait on a second request
  const [myOrders, setMyOrders] = useState(() => readCachedOrders());
  const [pendingOrderId, setPendingOrderId] = useState(null);

  // A notification tap lands here with the order it's about
  useEffect(() => {
    const target = location.state?.highlight;
    if (!target || target.type !== 'order') return;
    setPendingOrderId(target.id);
    // Clear it so a refresh doesn't jump again
    navigate(location.pathname, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  // As soon as the orders are on hand, jump to the one that was tapped
  useEffect(() => {
    if (pendingOrderId == null || !myOrders) return;
    const order = myOrders.find((o) => String(o.id) === String(pendingOrderId));
    setPendingOrderId(null);

    if (!order) {
      showError('That order could no longer be found.');
      return;
    }

    const stillCooking = ['pending', 'preparing'].includes((order.status || '').toLowerCase());
    if (stillCooking) {
      // It's in the tracker on the landing screen
      setActiveOrders(
        myOrders.filter((o) => ['pending', 'preparing'].includes((o.status || '').toLowerCase()))
      );
      setScreen('empty');
    } else {
      // Finished orders live in Order History
      setHistoryOrders(
        myOrders.filter((o) => !['pending', 'preparing'].includes((o.status || '').toLowerCase()))
      );
      setHistoryLoading(false);
      setHistoryOpen(true);
    }
    setHighlightId(order.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingOrderId, myOrders]);

  // Scroll to the highlighted order right away, then fade the highlight after 4 seconds
  useEffect(() => {
    if (!highlightId) return;
    const frame = requestAnimationFrame(() => {
      highlightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    const clear = setTimeout(() => setHighlightId(null), 4000);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(clear);
    };
  }, [highlightId]);

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

    // Only show the tray if the customer finalized it from the tray panel
    const finalized = localStorage.getItem(FINALIZED_KEY) === 'true';
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (finalized && savedCart) {
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

  // Pull the orders the kitchen is still working on, and keep them live
  const fetchActiveOrders = useCallback(async () => {
    if (!isAuthenticated) {
      setActiveOrders([]);
      return;
    }
    try {
      const mine = await ordersApi.getMine();
      setMyOrders(mine);
      setActiveOrders(
        mine.filter((o) => ['pending', 'preparing'].includes((o.status || '').toLowerCase()))
      );

      // Once the kitchen marks an order as ready, pop up "Ready to Serve" (once per order)
      const popped = getPoppedOrders();
      const newlyReady = mine.find(
        (o) =>
          (o.status || '').toLowerCase() === 'ready' &&
          !o.receipt_image &&
          !popped.includes(o.id)
      );
      if (newlyReady) {
        setReadyPopup((current) => {
          if (current) return current; // let the one on screen finish first
          markOrderPopped(newlyReady.id);
          return newlyReady;
        });
      }
    } catch (err) {
      console.error('Failed to load active orders:', err);
    }
  }, [isAuthenticated]);

  // Hide the pop-up after 8 seconds
  useEffect(() => {
    if (!readyPopup) return;
    const timer = setTimeout(() => setReadyPopup(null), READY_DISPLAY_MS);
    return () => clearTimeout(timer);
  }, [readyPopup]);

  useEffect(() => {
    fetchActiveOrders();
  }, [fetchActiveOrders, justOrdered]);

  useEffect(() => {
    if (screen !== 'empty') return;
    const interval = setInterval(() => {
      fetchActiveOrders().catch((e) => console.error('Active order poll failed:', e));
    }, HISTORY_POLL_MS);
    return () => clearInterval(interval);
  }, [screen, fetchActiveOrders]);

  // Preview URLs are object URLs, so release them when the photo changes or the page unmounts
  useEffect(() => {
    return () => {
      if (receiptPreview) URL.revokeObjectURL(receiptPreview);
    };
  }, [receiptPreview]);

  useEffect(() => {
    return () => {
      if (discountIdPreview) URL.revokeObjectURL(discountIdPreview);
    };
  }, [discountIdPreview]);

  useEffect(() => {
    return () => {
      if (cashReceiptPreview) URL.revokeObjectURL(cashReceiptPreview);
    };
  }, [cashReceiptPreview]);

  // Lock page scroll while a modal is open
  useEffect(() => {
    if (historyOpen || showCancelConfirm) {
      const previous = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = previous; };
    }
  }, [historyOpen, showCancelConfirm]);

  // ---------------- Order totals ----------------
  const orderSubtotal = orderItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const orderServiceFee = Math.round(orderSubtotal * 0.05 * 100) / 100;
  const orderTotal = orderSubtotal + orderServiceFee;

  // ---------------- Settle totals ----------------
  const settleItems = unpaidOrders.flatMap((o) =>
    (o.items || []).map((it) => ({ ...it, orderId: o.id }))
  );

  const settleSubtotal = unpaidOrders.reduce((sum, o) => sum + Number(o.subtotal || 0), 0);
  const settleDiscountAmount = hasDiscount ? Math.round(settleSubtotal * 0.20) : 0;
  const settleServiceFee = Math.round((settleSubtotal - settleDiscountAmount) * 0.05 * 100) / 100;
  const settleFinalTotal = settleSubtotal - settleDiscountAmount + settleServiceFee;
  const isSplit = payMode === 'split';
  const isCash = !isSplit && method === 'cash';
  const settleMethodLabel = PAYMENT_METHODS.find((m) => m.id === method)?.label || '';

  // Split payment: the customer types the online part, cash covers the rest
  const onlineLabel = ONLINE_METHODS.find((m) => m.id === onlineMethod)?.label || 'Online';
  const splitOnline = Math.round(Number(onlineAmount || 0) * 100) / 100;
  const splitCash = Math.round((settleFinalTotal - splitOnline) * 100) / 100;
  const splitAmountValid = splitOnline > 0 && splitOnline < settleFinalTotal;

  const updateItemNote = (index, note) => {
    setOrderItems((prev) => {
      const next = prev.map((it, i) => (i === index ? { ...it, note } : it));
      // Keep the saved tray in sync so the note survives a refresh
      const key = isBuyNow ? BUY_NOW_KEY : CART_STORAGE_KEY;
      try {
        localStorage.setItem(key, JSON.stringify(isBuyNow ? next[0] : next));
      } catch (e) {
        console.error('Failed to save note:', e);
      }
      return next;
    });
  };

  const clearTray = () => {
    localStorage.removeItem(BUY_NOW_KEY);
    localStorage.removeItem(FINALIZED_KEY);
    clearCart();
    setOrderItems([]);
  };

  // ---------------- Place Order ----------------
  const handlePlaceOrder = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      setPlacing(true);

      const payload = {
        customer_name: user.full_name,
        table_number: null,
        payment_method: null,
        discount_type: null,
        discount_id_image: null,
        subtotal: orderSubtotal,
        service_fee: orderServiceFee,
        discount_amount: 0,
        total: orderTotal,
        items: orderItems.map((item) => ({
          menu_item_id: item.id,
          item_name: item.name,
          price: item.price,
          quantity: item.qty,
          note: item.note || null,
        })),
      };

      await ordersApi.create(payload);

      if (isBuyNow) {
        localStorage.removeItem(BUY_NOW_KEY);
      } else {
        clearCart();
        localStorage.removeItem(FINALIZED_KEY);
      }

      setOrderItems([]);
      setJustOrdered(true);
      setScreen('empty');

      showToast("Order sent to the kitchen! Settle your bill after your meal.");
    } catch (err) {
      console.error(err);
      showError(err.message || "Sorry, something went wrong while placing your order. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  // ---------------- Settle Bill ----------------
  const openSettle = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setScreen('settle');
    setSettleLoading(true);
    setJustSettled(false);

    try {
      const mine = await ordersApi.getMine();
      const unpaid = mine.filter(
        (o) => !o.receipt_image && o.status !== 'cancelled'
      );
      setUnpaidOrders(unpaid);
    } catch (err) {
      console.error('Failed to load unpaid orders:', err);
      setUnpaidOrders([]);
      
  // "Settle Bill Now" from the unpaid-balance notice lands here
  useEffect(() => {
    const wantsSettle =
      location.state?.openSettle || location.state?.highlight?.type === 'settle';
    if (!wantsSettle || !isAuthenticated) return;
    navigate(location.pathname, { replace: true, state: null });
    openSettle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, isAuthenticated]);
    } finally {
      setSettleLoading(false);
    }
  };

  const handleSubmitPayment = async () => {
    if (isSplit) {
      if (!onlineMethod) {
        showError('Please choose how you paid the online part.');
        return;
      }
      if (!splitAmountValid) {
        showError(`Enter an online amount between ₱ 1 and ${peso(settleFinalTotal - 1)}. The rest is paid in cash.`);
        return;
      }
    } else if (!method) {
      showError('Please select how you paid.');
      return;
    }

    if (hasDiscount && !discountIdFile) {
      showError('Please upload a photo of your Senior Citizen or PWD ID for verification.');
      return;
    }

    if (isSplit) {
      if (!receiptFile) {
        showError(`Please upload a screenshot of your ${onlineLabel} payment.`);
        return;
      }
      if (!cashReceiptFile) {
        showError('Please upload a photo of the cash receipt given by your server.');
        return;
      }
    } else if (!receiptFile) {
      showError(isCash
        ? 'Please upload a photo of the receipt given by your server.'
        : 'Please upload a screenshot of your payment.');
      return;
    }

    try {
      setSettling(true);

      // Split payments send both photos as one labelled picture
      const receiptBase64 = isSplit
        ? await combineProofs([
            { file: receiptFile, label: `${onlineLabel} payment: ${peso(splitOnline)}` },
            { file: cashReceiptFile, label: `Cash payment: ${peso(splitCash)}` },
          ])
        : await fileToBase64(receiptFile);
      const discountIdBase64 = hasDiscount && discountIdFile ? await fileToBase64(discountIdFile) : null;
      const orderIds = unpaidOrders.map((o) => o.id);

      await ordersApi.payMultiple(orderIds, {
        receipt_image: receiptBase64,
        // e.g. "cash+gcash" so the cashier can tell it was split
        payment_method: isSplit ? `cash+${onlineMethod}` : method,
        discount_type: hasDiscount ? SENIOR_PWD : null,
        discount_id_image: discountIdBase64,
        discount_amount: settleDiscountAmount,
      });

      setUnpaidOrders([]);
      clearReceipt();
      clearCashReceipt();
      setMethod('');
      setPayMode('single');
      setOnlineMethod('');
      setOnlineAmount('');
      setHasDiscount(false);
      clearDiscountId();
      setJustSettled(true);

      showToast("Payment proof submitted! The cashier will verify it shortly.");
    } catch (err) {
      console.error(err);
      showError("Sorry, something went wrong while submitting your payment. Please try again.");
    } finally {
      setSettling(false);
    }
  };

  // History only shows orders the kitchen has finished — anything still cooking
  // lives on the landing screen instead
  const fetchHistory = useCallback(async () => {
    const mine = await ordersApi.getMine();
    setHistoryOrders(
      mine.filter((o) => !['pending', 'preparing'].includes((o.status || '').toLowerCase()))
    );
  }, []);

  const openHistory = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

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
    if (!file) return;
    if (receiptPreview) URL.revokeObjectURL(receiptPreview);
    setReceiptFile(file);
    setReceiptPreview(URL.createObjectURL(file));
  };

  const clearReceipt = () => {
    if (receiptPreview) URL.revokeObjectURL(receiptPreview);
    setReceiptFile(null);
    setReceiptPreview('');
  };

  const handleCashReceiptChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (cashReceiptPreview) URL.revokeObjectURL(cashReceiptPreview);
    setCashReceiptFile(file);
    setCashReceiptPreview(URL.createObjectURL(file));
  };

  const clearCashReceipt = () => {
    if (cashReceiptPreview) URL.revokeObjectURL(cashReceiptPreview);
    setCashReceiptFile(null);
    setCashReceiptPreview('');
  };

  const handleDiscountIdChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (discountIdPreview) URL.revokeObjectURL(discountIdPreview);
    setDiscountIdFile(file);
    setDiscountIdPreview(URL.createObjectURL(file));
  };

  const clearDiscountId = () => {
    if (discountIdPreview) URL.revokeObjectURL(discountIdPreview);
    setDiscountIdFile(null);
    setDiscountIdPreview('');
  };

  const heroTitle = screen === 'settle' ? 'Settle your bill' : 'Finalize your Culinary Selection';

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#1d080f] font-sans">
      <div className="relative h-64 overflow-hidden shrink-0 md:h-60">
        <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-white/40" />
        <div className="relative flex h-full items-start justify-center px-4 pt-10 md:pt-14">
          <h1
            className="font-[Prata] font-bold text-xs md:text-xs text-[#1d080f]"
            style={{ WebkitTextStroke: '0.7px #1d080f', letterSpacing: '1.5px' }}
          >
            {heroTitle}
          </h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8">

        {authLoading ? (
          <div className="bg-white rounded-2xl border border-neutral-200/80 p-12 text-center shadow-xs">
            <p className="text-sm text-neutral-700">Loading...</p>
          </div>
        ) : !isAuthenticated ? (
          <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs p-12 text-center">
            <p className="font-[Prata] text-lg text-[#1d080f] mb-2">Log in to place an order</p>
            <p className="text-sm text-neutral-700 font-[Prata] mb-8">
              You need an account to order from our kitchen and settle your bill.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button
                onClick={() => navigate('/login')}
                className="bg-[#1d080f] text-white font-[Prata] font-bold px-10 py-3 rounded-full hover:opacity-90 transition"
              >
                Login
              </button>
              <button
                onClick={() => navigate('/register')}
                className="border border-[#1d080f] text-[#1d080f] font-[Prata] font-bold px-10 py-3 rounded-full hover:bg-[#1d080f] hover:text-white transition"
              >
                Create Account
              </button>
            </div>
          </div>
        ) : (
        <>

        {/* ---------------- EMPTY / LANDING ---------------- */}
        {screen === 'empty' && (
          <div className="grid gap-6">

          {activeOrders.length > 0 && (
            <div className="grid gap-4">
              <h3 className="font-[Prata] text-base text-[#1d080f]">In the Kitchen</h3>
              {activeOrders.map((o) => (
                <div
                  key={o.id}
                  ref={o.id === highlightId ? highlightRef : null}
                  className={`rounded-2xl transition-shadow duration-500 ${
                    o.id === highlightId ? 'ring-4 ring-[#f2c14e]/70' : ''
                  }`}
                >
                  <ActiveOrderCard order={o} />
                </div>
              ))}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-neutral-200/80 p-12 text-center shadow-xs">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${justOrdered ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-600'}`}>
              {justOrdered ? <CheckCircle2 size={28} /> : <ShoppingBag size={28} />}
            </div>
            <h2 className="font-['Prata'],serif text-xl font-bold mb-3">
              {justOrdered ? 'Order Sent to Kitchen!' : 'Your Tray is Empty'}
            </h2>
            <p className="text-sm text-neutral-700 mx-auto mb-6 text-center leading-relaxed">
              {justOrdered
                ? 'Your food is being prepared. Enjoy your meal, then call your server to settle the bill and upload your proof of payment here.'
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
          </div>
        )}

        {/* ---------------- ORDER SCREEN ---------------- */}
        {screen === 'order' && orderItems.length > 0 && (
          <div className="grid gap-6">

            <div className="bg-white rounded-2xl shadow-sm p-8 border border-neutral-200/80">
              <h2 className="text-center font-[Prata] text-amber-800 tracking-wide text-sm mb-4">
                NAME
              </h2>
              <div className="max-w-xs mx-auto">
                <div className="w-full text-center bg-neutral-100 rounded-md px-4 py-3.5 font-[Prata] text-[#1d080f]">
                  {user?.full_name}
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-300 rounded-xl p-5 text-sm text-amber-900 leading-relaxed text-left">
              <p className="font-[Prata] font-bold text-amber-900 mb-2">How payment works</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Tap <strong>Order Now</strong> to send your order to the kitchen.</li>
                <li>No need to pay yet. Payment comes after your meal.</li>
                <li>When you're done eating, call your server to settle the bill.</li>
                <li>
                  Come back to this page, tap <strong>Settle Bill</strong>, and upload your proof of payment.
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-xs font-mono">
              <div className="border-b border-dashed border-neutral-300 pb-3 mb-4 text-base">
                <div className="flex justify-between items-center font-bold text-neutral-900 font-[Prata]">
                  <span>Eurasia Restaurant</span>
                  <Receipt size={18} className="text-neutral-600" />
                </div>
              </div>

              <div className="divide-y divide-neutral-200 max-h-80 overflow-y-auto pr-1">
                {orderItems.map((item, i) => (
                  <div key={i} className="py-2.5">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-neutral-900">
                        {(item.name || '').toString().toUpperCase()} x{item.qty}
                      </span>
                      <span className="font-semibold text-neutral-900">
                        ₱ {(item.price * item.qty).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="mt-1.5 font-sans" style={{ textAlign: 'left' }}>
                      {openNotes[i] || item.note ? (
                        <div>
                          <input
                            type="text"
                            value={item.note || ''}
                            onChange={(e) => updateItemNote(i, e.target.value)}
                            placeholder="e.g. less spicy, no onions"
                            className="w-full bg-[#faf8f5] border border-neutral-300 rounded-md px-3 py-2 text-sm text-[#1d080f] placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-[#1d080f]"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              updateItemNote(i, '');
                              setOpenNotes((prev) => ({ ...prev, [i]: false }));
                            }}
                            className="mt-1 text-xs text-[#c0392b] font-medium hover:opacity-70 transition"
                          >
                            Remove note
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setOpenNotes((prev) => ({ ...prev, [i]: true }))}
                          className="text-xs text-[#8a6228] font-semibold hover:text-[#1d080f] transition"
                        >
                          + Add note
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-dashed border-neutral-300 space-y-2 text-sm">
                <div className="flex justify-between text-neutral-800">
                  <span>Subtotal</span>
                  <span>₱ {orderSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-neutral-800">
                  <span>Service (5%)</span>
                  <span>₱ {orderServiceFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-baseline text-base font-bold text-[#1d080f] pt-3 border-t border-neutral-800">
                  <span>TOTAL</span>
                  <span>₱ {orderTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="flex gap-3 mt-8 font-sans">
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(true)}
                  className="flex-1 border border-neutral-400 text-neutral-800 text-sm font-medium py-3 rounded-xl hover:bg-neutral-50 transition cursor-pointer"
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
              className="flex items-center gap-1.5 text-sm text-neutral-700 hover:text-[#1d080f] transition cursor-pointer w-fit"
            >
              <ArrowLeft size={16} /> Back
            </button>

            {settleLoading ? (
              <div className="bg-white rounded-2xl border border-neutral-200/80 p-12 text-center shadow-xs">
                <p className="text-sm text-neutral-700">Loading your bill…</p>
              </div>
            ) : justSettled ? (
              <div className="bg-white rounded-2xl border border-neutral-200/80 p-12 text-center shadow-xs">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={28} />
                </div>
                <h2 className="font-['Prata'],serif text-xl font-bold mb-3">Proof Submitted!</h2>
                <p className="text-sm text-neutral-700 mb-6 leading-relaxed">
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
                <div className="w-16 h-16 bg-neutral-100 text-neutral-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Receipt size={28} />
                </div>
                <h2 className="font-['Prata'],serif text-xl font-bold mb-3">No Bill to Settle</h2>
                <p className="text-sm text-neutral-700 mb-6 leading-relaxed">
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
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-sm text-amber-900 font-[Prata] text-center">
                  Found {unpaidOrders.length} unpaid order{unpaidOrders.length !== 1 ? 's' : ''} for {user?.full_name || '—'}. Review the bill below.
                </div>

                <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-xs">
                  <h4 className="text-[16px] font-bold text-[#8a6228] uppercase tracking-wider mb-4">
                    1. Mode of Payment
                  </h4>

                  {/* One method, or split between cash and an online method */}
                  <div className="grid grid-cols-2 gap-2 mb-4 bg-neutral-100 p-1 rounded-xl">
                    {[
                      { id: 'single', label: 'One payment' },
                      { id: 'split', label: 'Split (Cash + Online)' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setPayMode(opt.id)}
                        className={`py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer ${
                          payMode === opt.id
                            ? 'bg-[#1d080f] text-white shadow-sm'
                            : 'text-neutral-700 hover:bg-white'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {!isSplit ? (
                    <>
                      <div className="relative">
                        <select
                          value={method}
                          onChange={(e) => setMethod(e.target.value)}
                          className={`w-full bg-white border border-neutral-300 rounded-xl px-4 py-3.5 text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-[#1d080f] ${method ? 'text-[#1d080f]' : 'text-neutral-600'}`}
                        >
                          <option value="" disabled className="text-neutral-600">Mode of Payment *</option>
                          {PAYMENT_METHODS.map(({ id, label }) => (
                            <option key={id} value={id} className="text-[#1d080f]">{label}</option>
                          ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-600" />
                      </div>
                      {!method && (
                        <p className="text-sm text-red-700 mt-2 font-medium">Please select how you paid.</p>
                      )}
                    </>
                  ) : (
                    <div className="space-y-4 text-left">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Online part paid through *</label>
                        <div className="relative">
                          <select
                            value={onlineMethod}
                            onChange={(e) => setOnlineMethod(e.target.value)}
                            className={`w-full bg-white border border-neutral-300 rounded-xl px-4 py-3.5 text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-[#1d080f] ${onlineMethod ? 'text-[#1d080f]' : 'text-neutral-600'}`}
                          >
                            <option value="" disabled className="text-neutral-600">Choose GCash, PayMaya or Bank Transfer</option>
                            {ONLINE_METHODS.map(({ id, label }) => (
                              <option key={id} value={id} className="text-[#1d080f]">{label}</option>
                            ))}
                          </select>
                          <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-600" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                            {onlineLabel} amount *
                          </label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-neutral-600">₱</span>
                            <input
                              type="number"
                              inputMode="decimal"
                              min="1"
                              step="0.01"
                              value={onlineAmount}
                              onChange={(e) => setOnlineAmount(e.target.value)}
                              placeholder="0.00"
                              className="w-full bg-white border border-neutral-300 rounded-xl pl-8 pr-3 py-3.5 text-sm text-[#1d080f] focus:outline-none focus:ring-1 focus:ring-[#1d080f]"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Cash amount</label>
                          <div className="w-full bg-neutral-100 rounded-xl px-4 py-3.5 text-sm text-[#1d080f] font-semibold">
                            {splitAmountValid ? peso(splitCash) : '—'}
                          </div>
                        </div>
                      </div>

                      {onlineAmount !== '' && !splitAmountValid ? (
                        <p className="text-sm text-red-700 font-medium">
                          The online amount must be more than ₱ 0 and less than the total of {peso(settleFinalTotal)}.
                        </p>
                      ) : (
                        <p className="text-xs text-neutral-600">
                          Enter what you paid online. The rest of the {peso(settleFinalTotal)} total is paid in cash.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-xs">
                  <h4 className="text-[16px] font-bold text-[#8a6228] uppercase tracking-wider mb-4">
                    2. Discount (Optional)
                  </h4>

                  <label
                    className={`flex items-center gap-3 p-3.5 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                      hasDiscount
                        ? 'border-[#1d080f] bg-[#1d080f]/5 text-[#1d080f]'
                        : 'border-neutral-300 text-neutral-800 hover:bg-neutral-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={hasDiscount}
                      onChange={(e) => {
                        setHasDiscount(e.target.checked);
                        clearDiscountId();
                      }}
                      className="w-4 h-4 shrink-0 accent-[#1d080f] cursor-pointer"
                    />
                    <span className="flex items-center gap-2">
                      <ShieldCheck size={16} /> Senior Citizen / PWD Discount (20%)
                    </span>
                  </label>

                  {hasDiscount && (
                    <div className="mt-4 p-4 bg-[#faf8f5] rounded-xl border border-dashed border-amber-800/40">
                      <label className="flex flex-col items-center justify-center gap-2 cursor-pointer text-center">
                        <UploadCloud size={24} className="text-[#8a6228]" />
                        <div className="text-sm">
                          <span className="font-semibold text-[#1d080f]">
                            Upload Picture of Senior Citizen or PWD ID
                          </span>
                          <p className="text-neutral-700 mt-0.5 text-xs">Attach ID photo to prove discount eligibility</p>
                        </div>
                        {!discountIdFile && (
                          <span className="text-xs text-amber-900 font-semibold bg-amber-100 px-2.5 py-1 rounded">
                            ID Photo Required
                          </span>
                        )}
                        <input type="file" accept="image/*" hidden onChange={handleDiscountIdChange} />
                      </label>

                      <ImagePreview
                        file={discountIdFile}
                        previewUrl={discountIdPreview}
                        onRemove={clearDiscountId}
                        label="Senior Citizen or PWD ID preview"
                      />
                    </div>
                  )}
                </div>

                {!isSplit ? (
                  <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-xs">
                    <h4 className="text-[16px] font-bold text-[#8a6228] uppercase tracking-wider mb-2">
                      3. {isCash ? 'Upload Receipt from Cashier' : 'Upload Proof of Payment'}
                    </h4>
                    <p className="text-sm text-neutral-700 mb-4 leading-relaxed">
                      {!method
                        ? 'Select how you paid above, then attach your proof of payment.'
                        : isCash
                        ? 'Take a photo of the receipt handed to you by your server and attach it here.'
                        : `Attach a screenshot of your successful ${settleMethodLabel} transaction.`}
                    </p>

                    <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-neutral-400 rounded-xl py-6 px-4 text-center cursor-pointer hover:bg-neutral-50 transition">
                      <UploadCloud size={28} className="text-neutral-600" />
                      <div className="text-sm font-medium text-neutral-800">
                        {receiptFile ? (
                          <span className="text-emerald-800 flex items-center gap-1.5 font-semibold">
                            <CheckCircle2 size={16} /> Photo attached — check it below
                          </span>
                        ) : (
                          <span>
                            {isCash ? 'Drop receipt photo here or ' : 'Drop payment screenshot here or '}
                            <span className="text-[#1d080f] underline font-semibold">browse</span>
                          </span>
                        )}
                      </div>
                      <input type="file" accept="image/*" hidden onChange={handleReceiptChange} />
                    </label>

                    <ImagePreview
                      file={receiptFile}
                      previewUrl={receiptPreview}
                      onRemove={clearReceipt}
                      label="Proof of payment preview"
                    />
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-xs">
                    <h4 className="text-[16px] font-bold text-[#8a6228] uppercase tracking-wider mb-2">
                      3. Upload Both Proofs of Payment
                    </h4>
                    <p className="text-sm text-neutral-700 mb-4 leading-relaxed">
                      Attach a screenshot of your {onlineLabel} payment and a photo of the cash receipt from your server.
                    </p>

                    <div className="grid gap-5">
                      {/* Online proof */}
                      <div>
                        <p className="text-sm font-semibold text-[#1d080f] mb-2 text-left">
                          a. {onlineLabel} screenshot{splitAmountValid ? ` (${peso(splitOnline)})` : ''}
                        </p>
                        <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-neutral-400 rounded-xl py-6 px-4 text-center cursor-pointer hover:bg-neutral-50 transition">
                          <UploadCloud size={28} className="text-neutral-600" />
                          <div className="text-sm font-medium text-neutral-800">
                            {receiptFile ? (
                              <span className="text-emerald-800 flex items-center gap-1.5 font-semibold">
                                <CheckCircle2 size={16} /> Screenshot attached — check it below
                              </span>
                            ) : (
                              <span>
                                Drop payment screenshot here or{' '}
                                <span className="text-[#1d080f] underline font-semibold">browse</span>
                              </span>
                            )}
                          </div>
                          <input type="file" accept="image/*" hidden onChange={handleReceiptChange} />
                        </label>
                        <ImagePreview
                          file={receiptFile}
                          previewUrl={receiptPreview}
                          onRemove={clearReceipt}
                          label="Online payment screenshot preview"
                        />
                      </div>

                      {/* Cash proof */}
                      <div>
                        <p className="text-sm font-semibold text-[#1d080f] mb-2 text-left">
                          b. Cash receipt from your server{splitAmountValid ? ` (${peso(splitCash)})` : ''}
                        </p>
                        <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-neutral-400 rounded-xl py-6 px-4 text-center cursor-pointer hover:bg-neutral-50 transition">
                          <UploadCloud size={28} className="text-neutral-600" />
                          <div className="text-sm font-medium text-neutral-800">
                            {cashReceiptFile ? (
                              <span className="text-emerald-800 flex items-center gap-1.5 font-semibold">
                                <CheckCircle2 size={16} /> Receipt attached — check it below
                              </span>
                            ) : (
                              <span>
                                Drop receipt photo here or{' '}
                                <span className="text-[#1d080f] underline font-semibold">browse</span>
                              </span>
                            )}
                          </div>
                          <input type="file" accept="image/*" hidden onChange={handleCashReceiptChange} />
                        </label>
                        <ImagePreview
                          file={cashReceiptFile}
                          previewUrl={cashReceiptPreview}
                          onRemove={clearCashReceipt}
                          label="Cash receipt preview"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-xs font-mono">
                  <div className="border-b border-dashed border-neutral-300 pb-3 mb-4 text-base">
                    <div className="flex justify-between items-center font-bold text-neutral-900 font-[Prata]">
                      <span>Eurasia Restaurant</span>
                      <Receipt size={18} className="text-neutral-600" />
                    </div>
                  </div>

                  <div className="divide-y divide-neutral-200 max-h-64 overflow-y-auto pr-1">
                    {settleItems.map((item, i) => (
                      <div key={i} className="py-2 flex justify-between items-center text-sm">
                        <span className="text-neutral-900">
                          {(item.item_name || '').toString().toUpperCase()} x{item.quantity}
                        </span>
                        <span className="font-semibold text-neutral-900">
                          ₱ {(Number(item.price) * Number(item.quantity)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-dashed border-neutral-300 space-y-2 text-sm">
                    <div className="flex justify-between text-neutral-800">
                      <span>Subtotal</span>
                      <span>₱ {settleSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                    {hasDiscount && (
                      <div className="flex justify-between text-red-700 font-semibold">
                        <span>DISCOUNT (SENIOR/PWD)</span>
                        <span>- ₱ {settleDiscountAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-neutral-800">
                      <span>Service (5%)</span>
                      <span>₱ {settleServiceFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-baseline text-base font-bold text-[#1d080f] pt-3 border-t border-neutral-800">
                      <span>TOTAL</span>
                      <span>₱ {settleFinalTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                    {isSplit && splitAmountValid && (
                      <div className="pt-2 space-y-1 text-neutral-800">
                        <div className="flex justify-between">
                          <span>PAID VIA {onlineLabel.toUpperCase()}</span>
                          <span>{peso(splitOnline)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>PAID IN CASH</span>
                          <span>{peso(splitCash)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 mt-8 font-sans">
                    <button
                      type="button"
                      onClick={() => setScreen('empty')}
                      className="flex-1 border border-neutral-400 text-neutral-800 text-sm font-medium py-3 rounded-xl hover:bg-neutral-50 transition cursor-pointer"
                    >
                      Pay Later
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmitPayment}
                      disabled={settling}
                      className="flex-1 bg-[#2e5a2e] hover:bg-[#244724] text-white text-sm font-bold py-3 rounded-xl shadow-sm transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {settling ? 'Submitting...' : `Submit Payment Proof • ₱ ${settleFinalTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        </>
        )}
      </div>

      {showCancelConfirm && (
        <div
          onClick={() => setShowCancelConfirm(false)}
          className="fixed inset-0 z-[130] flex items-center justify-center bg-black/30 px-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl"
          >
            <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
              <X size={26} className="text-red-600" />
            </div>
            <h3 className="font-[Prata] text-lg text-[#1d080f] mb-2">Cancel this order?</h3>
            <p className="text-sm text-neutral-700 mb-6 leading-relaxed">
              Your items will be removed from the tray. You can always browse the menu again.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 border border-neutral-400 text-neutral-800 text-sm font-medium py-3 rounded-xl hover:bg-neutral-50 transition cursor-pointer"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={() => {
                  clearTray();
                  setShowCancelConfirm(false);
                  setScreen('empty');
                }}
                className="flex-1 bg-[#c0392b] text-white text-sm font-bold py-3 rounded-xl hover:opacity-90 transition cursor-pointer"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {historyOpen && (
        <div
          className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/30 sm:p-4"
          onClick={() => setHistoryOpen(false)}
        >
          <div
            className="bg-[#faf8f5] w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[85vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
              <h3 className="font-[Prata] text-lg text-[#1d080f] flex items-center gap-2">
                <History size={18} className="text-[#8a6228]" /> Order History
              </h3>
              <button
                onClick={() => setHistoryOpen(false)}
                className="text-neutral-700 hover:text-[#1d080f] cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-5 space-y-4">
              {historyLoading ? (
                <p className="text-center text-sm text-neutral-700 py-8">Loading your orders…</p>
              ) : historyOrders.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-14 h-14 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-3 text-neutral-600">
                    <History size={24} />
                  </div>
                  <p className="text-sm text-neutral-700 leading-relaxed">
                    No orders yet. Once you place an order, you can track its status here.
                  </p>
                </div>
              ) : (
                historyOrders.map((o) => (
                  <div
                    key={o.id}
                    ref={o.id === highlightId ? highlightRef : null}
                    className={`rounded-2xl transition-shadow duration-500 ${
                      o.id === highlightId ? 'ring-4 ring-[#f2c14e]/70' : ''
                    }`}
                  >
                    <OrderHistoryCard order={o} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------------- READY TO SERVE POP-UP ---------------- */}
      {readyPopup && (
        <div
          key={readyPopup.id}
          className="fixed top-[96px] left-4 right-4 md:left-auto md:right-6 md:w-[360px] z-[150] ready-popup-in"
        >
          <style>{`
            @keyframes readyPopupIn { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes readyPopupBar { from { width: 100%; } to { width: 0%; } }
            .ready-popup-in { animation: readyPopupIn 0.3s ease-out; }
          `}</style>

          <div className="bg-white rounded-2xl shadow-2xl border-2 border-[#2e5a2e] overflow-hidden text-left">
            <div className="flex items-start gap-3 p-4">
              <span className="shrink-0 w-11 h-11 rounded-full bg-[#2e5a2e] text-white flex items-center justify-center">
                <CheckCircle2 size={22} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-[Prata] text-lg text-[#2e5a2e] leading-tight">Ready to Serve!</p>
                <p className="text-sm text-neutral-800 mt-0.5">
                  Order #{readyPopup.daily_number ?? readyPopup.id}
                </p>
                <p className="text-xs text-neutral-600 mt-1">
                  Your food will be brought to your table shortly.
                </p>
              </div>
              <button
                onClick={() => setReadyPopup(null)}
                aria-label="Close"
                className="shrink-0 text-neutral-500 hover:text-[#1d080f] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Shrinks over the 8 seconds so the customer sees it's about to go */}
            <div className="h-1 bg-emerald-100">
              <div
                className="h-full bg-[#2e5a2e]"
                style={{ animation: `readyPopupBar ${READY_DISPLAY_MS}ms linear forwards` }}
              />
            </div>
          </div>
        </div>
      )}

      {toast.message && (
        <div
          style={{
            position: "fixed",
            bottom: 28,
            right: 28,
            background: toast.tone === 'error' ? "#c0392b" : "#2e5a2e",
            color: "#fff",
            padding: "16px 20px",
            borderRadius: 14,
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            zIndex: 140,
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
            {toast.tone === 'error' ? <X size={20} /> : <CheckCircle2 size={20} />}
          </span>
          <div>
            <div className="text-sm font-bold leading-tight">
              {toast.tone === 'error' ? 'Please check' : 'Success'}
            </div>
            <div className="text-xs text-white/95 leading-snug mt-0.5">{toast.message}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Payment;