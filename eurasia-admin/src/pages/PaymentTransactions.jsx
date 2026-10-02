import React, { useState, useEffect, useCallback } from "react";
import { X, Check, Ban, Eye } from "lucide-react";
import StaffHeader from "../components/StaffHeader";
import { ordersApi } from "../services/ordersApi";
import { reservationsApi } from "../services/reservationsApi";

const POLL_MS = 10000;
const STATUS_LABEL = { pending: "Pending", verified: "Completed", failed: "Failed" };

function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="text-xs text-gray-500 font-[Prata] mb-2">{label}</div>
      <div
        className="text-2xl font-[Prata] text-[#1d080f]"
        style={{ WebkitTextStroke: "0.6px #1d080f" }}
      >
        {value}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    Completed: "bg-[#d1e7dd] text-[#0f5132]",
    Pending: "bg-[#f5e79e] text-[#5e5113]",
    Failed: "bg-[#f8d7da] text-[#842029]",
  };
  return (
    <span className={`text-xs font-[Prata] px-3 py-1 rounded-lg ${styles[status] || styles.Pending}`}>
      {status}
    </span>
  );
}

function ImageViewer({ src, onClose }) {
  if (!src) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-6"
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-white/80 hover:text-white transition"
      >
        <X size={26} />
      </button>
      <img
        src={src}
        alt="Receipt"
        onClick={(e) => e.stopPropagation()}
        className="max-w-full max-h-full object-contain rounded-lg"
      />
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Order payment modal                                               */
/* ---------------------------------------------------------------- */
function ValidateModal({ transaction, busy, onClose, onConfirm, onFail }) {
  if (!transaction) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-xl p-7 max-w-sm w-full font-[Prata] max-h-[85vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600"
        >
          <X size={18} />
        </button>

        <h3
          className="text-xl text-[#1d080f] mb-1"
          style={{ WebkitTextStroke: "0.5px #1d080f" }}
        >
          Validate Payment
        </h3>
        <p className="text-xs text-gray-500 mb-5">Verify and confirm the payment.</p>

        <div className="space-y-3 text-sm mb-5">
          <div className="flex justify-between">
            <span className="text-gray-500">Customer</span>
            <span className="text-[#1d080f]">{transaction.customer}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Order #</span>
            <span className="text-[#1d080f]">{transaction.displayNo}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Payment Method</span>
            <span className="text-[#1d080f] capitalize">{transaction.method || "—"}</span>
          </div>
          {transaction.discount && (
            <div className="flex justify-between">
              <span className="text-gray-500">Discount</span>
              <span className="text-[#1d080f] capitalize">
                {transaction.discount}
                {transaction.discountAmount
                  ? ` (- Php. ${Number(transaction.discountAmount).toLocaleString()})`
                  : ""}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">Amount</span>
            <span className="text-[#1d080f]">Php. {transaction.amount.toLocaleString()}</span>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">Proof of Payment</p>
          {transaction.receiptImage ? (
            <a href={transaction.receiptImage} target="_blank" rel="noreferrer">
              <img
                src={transaction.receiptImage}
                alt="Payment receipt"
                className="w-full max-h-48 object-contain rounded-lg border border-gray-200 bg-gray-50"
              />
            </a>
          ) : (
            <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center text-xs text-gray-500">
              No proof of payment uploaded.
            </div>
          )}
        </div>

        {transaction.discountIdImage && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">Discount ID</p>
            <a href={transaction.discountIdImage} target="_blank" rel="noreferrer">
              <img
                src={transaction.discountIdImage}
                alt="Discount ID"
                className="w-full max-h-40 object-contain rounded-lg border border-gray-200 bg-gray-50"
              />
            </a>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <button
            onClick={onClose}
            disabled={busy}
            className="w-full py-2.5 rounded-lg bg-white text-[#1d080f] text-sm border border-gray-300 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={() => onFail(transaction.id)}
            disabled={busy}
            className="w-full py-2.5 rounded-lg bg-[#f8d7da] text-[#842029] text-sm hover:bg-[#f1c1c6] transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Ban size={15} /> Mark as Failed
          </button>
          <button
            onClick={() => onConfirm(transaction.id)}
            disabled={busy}
            className="w-full py-2.5 rounded-lg bg-[#1d080f] text-white text-sm hover:bg-[#3a1420] transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check size={15} /> {busy ? "Saving..." : "Confirm Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Reservation downpayment modal                                     */
/* ---------------------------------------------------------------- */
function DownpaymentModal({ reservation, busy, onClose, onConfirm, onFail }) {
  const [proof, setProof] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Cash downpayments have no uploaded proof to fetch
    if (!reservation || reservation.isCash) {
      setProof(null);
      return;
    }
    setLoading(true);
    reservationsApi.getById(reservation.id)
      .then((full) => setProof(full.payment_proof || null))
      .catch((err) => console.error("Failed to load proof:", err))
      .finally(() => setLoading(false));
  }, [reservation]);

  if (!reservation) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-xl p-7 max-w-sm w-full font-[Prata] max-h-[85vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600"
        >
          <X size={18} />
        </button>

        <h3
          className="text-xl text-[#1d080f] mb-1"
          style={{ WebkitTextStroke: "0.5px #1d080f" }}
        >
          {reservation.isCash ? "Cash Downpayment" : "Verify Downpayment"}
        </h3>
        <p className="text-xs text-gray-500 mb-5">
          Once verified, the front desk can confirm this reservation.
        </p>

        <div className="space-y-3 text-sm mb-5">
          <div className="flex justify-between">
            <span className="text-gray-500">Guest</span>
            <span className="text-[#1d080f]">{reservation.guestName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Reservation</span>
            <span className="text-[#1d080f] capitalize">
              {reservation.type === "event" ? "Event" : "Table"} · {reservation.pax} pax
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Date &amp; Time</span>
            <span className="text-[#1d080f]">{reservation.date} · {reservation.time}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Payment Method</span>
            <span className="text-[#1d080f] capitalize">{reservation.method || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Amount</span>
            <span className="text-[#1d080f]">Php. {reservation.amount.toLocaleString()}</span>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">
            {reservation.isCash ? "Cash Payment" : "Proof of Payment"}
          </p>
          {reservation.isCash ? (
            <div className="bg-[#f7f5f0] rounded-lg p-4 text-xs text-gray-600 leading-relaxed">
              The guest is paying in cash at the restaurant. Only mark this as received once you
              have the Php. {reservation.amount.toLocaleString()} in hand.
            </div>
          ) : loading ? (
            <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center text-xs text-gray-500">
              Loading proof...
            </div>
          ) : proof ? (
            <a href={proof} target="_blank" rel="noreferrer">
              <img
                src={proof}
                alt="Proof of payment"
                className="w-full max-h-48 object-contain rounded-lg border border-gray-200 bg-gray-50"
              />
            </a>
          ) : (
            <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center text-xs text-gray-500">
              No proof of payment uploaded.
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={onClose}
            disabled={busy}
            className="w-full py-2.5 rounded-lg bg-white text-[#1d080f] text-sm border border-gray-300 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={() => onFail(reservation.id)}
            disabled={busy}
            className="w-full py-2.5 rounded-lg bg-[#f8d7da] text-[#842029] text-sm hover:bg-[#f1c1c6] transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Ban size={15} /> Mark as Failed
          </button>
          <button
            onClick={() => onConfirm(reservation.id)}
            disabled={busy}
            className="w-full py-2.5 rounded-lg bg-[#1d080f] text-white text-sm hover:bg-[#3a1420] transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check size={15} />{" "}
            {busy ? "Saving..." : reservation.isCash ? "Mark as Received" : "Verify Downpayment"}
          </button>
        </div>
      </div>
    </div>
  );
}

// The list no longer carries the photos — only has_receipt (1 or 0).
// The photo itself is loaded with ordersApi.getById when someone opens it.
function normalizeTransaction(o) {
  const createdAt = new Date(o.created_at);
  return {
    id: o.id,
    dailyNumber: o.daily_number,
    createdAt,
    customer: o.customer_name || "Guest",
    method: o.payment_method,
    amount: Number(o.total),
    status: STATUS_LABEL[o.payment_status] || "Pending",
    discount: o.discount_type,
    discountAmount: o.discount_amount,
    hasReceipt: Boolean(Number(o.has_receipt)),
    date: createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    time: createdAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
  };
}

// Reservation dates arrive as UTC timestamps, so read them back as local parts
function normalizeDownpayment(r) {
  const resDate = new Date(r.reservation_date);
  const rawTime = r.reservation_time instanceof Date
    ? r.reservation_time.toTimeString().slice(0, 5)
    : String(r.reservation_time || "").slice(0, 5);
  const [h, m] = rawTime.split(":").map(Number);
  const period = h >= 12 ? "pm" : "am";
  const hour12 = h % 12 === 0 ? 12 : h % 12;

  return {
    id: r.id,
    guestName: r.guest_name,
    type: r.reservation_type,
    pax: r.party_size,
    method: r.payment_method,
    amount: Number(r.downpayment_amount || 0),
    status: STATUS_LABEL[r.payment_status] || "Pending",
    hasProof: Boolean(r.has_payment_proof ?? r.payment_proof),
    // Cash is handed over at the counter, so there's no upload to check
    isCash: (r.payment_method || "").toLowerCase() === "cash",
    createdAt: new Date(r.created_at),
    date: isNaN(resDate.getTime())
      ? "—"
      : resDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    time: isNaN(h) ? "—" : `${hour12}:${String(m).padStart(2, "0")} ${period}`,
  };
}

// Uses the daily_number stored in the database (matches Kitchen and customer History).
// Falls back to a computed per-day number for older orders that have no daily_number yet.
function assignDailyNumbers(list) {
  const needsFallback = list.some((t) => t.dailyNumber == null);
  if (!needsFallback) {
    return list.map((t) => ({ ...t, displayNo: t.dailyNumber }));
  }

  const byTime = [...list].sort((a, b) => a.createdAt - b.createdAt);
  const numberMap = {};
  byTime.forEach((t, index) => {
    numberMap[t.id] = index + 1;
  });
  return list.map((t) => ({
    ...t,
    displayNo: t.dailyNumber != null ? t.dailyNumber : numberMap[t.id],
  }));
}

export default function PaymentTransactions({ embedded = false }) {
  const [transactions, setTransactions] = useState([]);
  const [downpayments, setDownpayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalTx, setModalTx] = useState(null);
  const [modalDp, setModalDp] = useState(null);
  const [viewerImage, setViewerImage] = useState(null);
  const [toast, setToast] = useState({ message: "", tone: "success" });
  const [view, setView] = useState("pending");
  // Which row is loading its photo, and whether a Confirm/Fail is being saved
  const [loadingId, setLoadingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(() => {
    return Promise.all([
      ordersApi.getAll({ today_only: "true" }),
      reservationsApi.getAll(),
    ])
      .then(([orderData, reservationData]) => {
        setTransactions(assignDailyNumbers(orderData.map(normalizeTransaction)));
        setDownpayments(
          reservationData
            .filter((r) => Number(r.downpayment_amount) > 0)
            .map(normalizeDownpayment)
        );
      })
      .catch((err) => console.error("Failed to load payments:", err));
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchAll().finally(() => setLoading(false));
  }, [fetchAll]);

  // Payment proofs arrive while the cashier is on this screen
  useEffect(() => {
    const interval = setInterval(fetchAll, POLL_MS);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const showToast = (message, tone = "success") => {
    setToast({ message, tone });
    setTimeout(() => setToast({ message: "", tone }), 3000);
  };
  const showError = (message) => showToast(message, "error");

  const pendingTransactions = transactions.filter((t) => t.status === "Pending");
  const pendingDownpayments = downpayments.filter((d) => d.status === "Pending");

  const pendingCount = pendingTransactions.length + pendingDownpayments.length;
  const completedCount =
    transactions.filter((t) => t.status === "Completed").length +
    downpayments.filter((d) => d.status === "Completed").length;

  const historyTransactions = [...transactions]
    .filter((t) => t.status === "Completed" || t.status === "Failed")
    .sort((a, b) => b.createdAt - a.createdAt);

  // The list endpoint leaves out the images to stay light, so pull the full order on demand
  const openVerify = async (t) => {
    setLoadingId(t.id);
    try {
      const full = await ordersApi.getById(t.id);
      setModalTx({
        ...t,
        method: full.payment_method,
        discount: full.discount_type,
        discountAmount: full.discount_amount,
        receiptImage: full.receipt_image,
        discountIdImage: full.discount_id_image,
      });
    } catch (err) {
      console.error(err);
      showError("Failed to load payment details. Please try again.");
    } finally {
      setLoadingId(null);
    }
  };

  // "View" in the Receipt column: load just this order's photo and show it full screen
  const viewReceipt = async (t) => {
    setLoadingId(t.id);
    try {
      const full = await ordersApi.getById(t.id);
      if (full.receipt_image) {
        setViewerImage(full.receipt_image);
      } else {
        showError("No receipt found for this order.");
      }
    } catch (err) {
      console.error(err);
      showError("Failed to load the receipt. Please try again.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleConfirm = async (id) => {
    const tx = transactions.find((t) => t.id === id);
    setSaving(true);
    try {
      await ordersApi.updatePaymentStatus(id, "verified");
      setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, status: "Completed" } : t)));
      setModalTx(null);
      showToast(`Payment #${tx?.displayNo ?? id} confirmed successfully`);
    } catch (err) {
      console.error(err);
      showError("Failed to confirm payment. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleFail = async (id) => {
    const tx = transactions.find((t) => t.id === id);
    setSaving(true);
    try {
      await ordersApi.updatePaymentStatus(id, "failed");
      setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, status: "Failed" } : t)));
      setModalTx(null);
      showToast(`Payment #${tx?.displayNo ?? id} marked as failed`);
    } catch (err) {
      console.error(err);
      showError("Failed to update payment. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDownpayment = async (id, status) => {
    const dp = downpayments.find((d) => d.id === id);
    setSaving(true);
    try {
      await reservationsApi.updatePaymentStatus(id, status);
      setDownpayments((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: STATUS_LABEL[status] } : d))
      );
      setModalDp(null);
      showToast(
        status === "verified"
          ? `Downpayment for ${dp?.guestName ?? "guest"} verified`
          : `Downpayment for ${dp?.guestName ?? "guest"} marked as failed`
      );
    } catch (err) {
      console.error(err);
      showError("Failed to update downpayment. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const cellClass = "px-6 py-4 align-top text-left";

  const viewButtonClass =
    "inline-flex items-center gap-1.5 text-xs font-[Prata] px-3 py-1.5 rounded-lg border border-gray-200 text-[#1d080f] hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-wait";

  const tabs = embedded
    ? [
        { key: "pending", label: "Orders" },
        { key: "downpayments", label: "Downpayments" },
      ]
    : [
        { key: "pending", label: "Orders" },
        { key: "downpayments", label: "Downpayments" },
        { key: "history", label: "History" },
      ];

  return (
    <div className="min-h-screen bg-[#f0eff3] font-[Prata] text-[#1d080f] text-left">
      {!embedded && <StaffHeader role="Cashier" />}

      <main className="max-w-[1400px] mx-auto" style={{ padding: 28 }}>
        <h1
          className="text-[#1d080f] text-left"
          style={{ marginTop: 0, marginBottom: "20px", fontSize: 39, WebkitTextStroke: "0.4px #1d080f" }}
        >
          Payment Transactions
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
          <StatCard label="Pending Payments" value={pendingCount} />
          <StatCard label="Today's Orders" value={transactions.length} />
          <StatCard label="Completed Payments" value={completedCount} />
        </div>

        <div className="flex gap-1.5 bg-white p-1 rounded-lg w-fit mb-6 shadow-sm border border-gray-100">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setView(t.key)}
              className={`px-4 py-2 rounded-md text-sm font-[Prata] transition flex items-center gap-2 ${
                view === t.key ? "bg-[#1d080f] text-white" : "text-[#1d080f] hover:bg-gray-50"
              }`}
            >
              {t.label}
              {t.key === "downpayments" && pendingDownpayments.length > 0 && (
                <span className="bg-[#f5e79e] text-[#5e5113] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {pendingDownpayments.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="bg-white rounded-xl p-12 text-center text-gray-400 font-[Prata] text-sm shadow-sm border border-gray-100">
            Loading transactions...
          </div>
        ) : (
          <>
            {view === "pending" && (
              pendingTransactions.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center text-gray-400 font-[Prata] text-sm shadow-sm border border-gray-100">
                  No pending order payments.
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
                  <table className="w-full text-left" style={{ minWidth: 800 }}>
                    <thead>
                      <tr className="text-xs text-gray-500 border-b border-gray-100">
                        {["Order #", "Customer", "Method", "Amount", "Receipt", "Status", "Date & Time"].map((h) => (
                          <th key={h} className="px-6 py-4 font-[Prata] font-normal text-left">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pendingTransactions.map((t) => (
                        <tr key={t.id} className="border-b border-gray-100 last:border-0 text-sm">
                          <td className={cellClass} style={{ WebkitTextStroke: "0.3px #1d080f" }}>{t.displayNo}</td>
                          <td className={cellClass}>{t.customer}</td>
                          <td className={`${cellClass} capitalize`}>
                            {t.method || <span className="text-gray-400">—</span>}
                          </td>
                          <td className={cellClass}>Php. {t.amount.toLocaleString()}</td>
                          <td className={cellClass}>
                            {t.hasReceipt ? (
                              <button
                                onClick={() => viewReceipt(t)}
                                disabled={loadingId === t.id}
                                className={viewButtonClass}
                              >
                                <Eye size={14} />
                                {loadingId === t.id ? "Loading..." : "View"}
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                          <td className={cellClass}>
                            {t.hasReceipt ? (
                              <button
                                onClick={() => openVerify(t)}
                                disabled={loadingId === t.id}
                                className="text-xs font-[Prata] px-3 py-1.5 rounded-lg bg-[#f5e79e] text-[#5e5113] hover:opacity-80 transition disabled:opacity-50 disabled:cursor-wait"
                              >
                                {loadingId === t.id ? "Loading..." : "Verify Payment"}
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400 italic">Awaiting payment</span>
                            )}
                          </td>
                          <td className={`${cellClass} text-gray-500`}>
                            {t.date}<br />{t.time}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {view === "downpayments" && (
              pendingDownpayments.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center text-gray-400 font-[Prata] text-sm shadow-sm border border-gray-100">
                  No downpayments waiting for verification.
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
                  <table className="w-full text-left" style={{ minWidth: 800 }}>
                    <thead>
                      <tr className="text-xs text-gray-500 border-b border-gray-100">
                        {["Guest", "Reservation", "Pax", "Method", "Amount", "Status", "Date & Time"].map((h) => (
                          <th key={h} className="px-6 py-4 font-[Prata] font-normal text-left">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pendingDownpayments.map((d) => (
                        <tr key={d.id} className="border-b border-gray-100 last:border-0 text-sm">
                          <td className={cellClass} style={{ WebkitTextStroke: "0.3px #1d080f" }}>{d.guestName}</td>
                          <td className={cellClass}>
                            <span className={`text-xs font-[Prata] px-3 py-1 rounded-lg ${
                              d.type === "event"
                                ? "bg-[#fdf3df] text-[#9c7a1f]"
                                : "bg-[#e5f0e6] text-[#296c39]"
                            }`}>
                              {d.type === "event" ? "Event" : "Table"}
                            </span>
                          </td>
                          <td className={cellClass}>{d.pax}</td>
                          <td className={`${cellClass} capitalize`}>
                            {d.method || <span className="text-gray-400">—</span>}
                          </td>
                          <td className={cellClass}>Php. {d.amount.toLocaleString()}</td>
                          <td className={cellClass}>
                            {d.isCash || d.hasProof ? (
                              <button
                                onClick={() => setModalDp(d)}
                                className="text-xs font-[Prata] px-3 py-1.5 rounded-lg bg-[#f5e79e] text-[#5e5113] hover:opacity-80 transition"
                              >
                                {d.isCash ? "Mark as Received" : "Verify Downpayment"}
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400 italic">No proof uploaded</span>
                            )}
                          </td>
                          <td className={`${cellClass} text-gray-500`}>
                            {d.date}<br />{d.time}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {view === "history" && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
                {historyTransactions.length === 0 ? (
                  <div className="p-12 text-center text-gray-400 font-[Prata] text-sm">
                    No payment history yet.
                  </div>
                ) : (
                  <table className="w-full text-left" style={{ minWidth: 800 }}>
                    <thead>
                      <tr className="text-xs text-gray-500 border-b border-gray-100">
                        {["Order #", "Customer", "Method", "Amount", "Receipt", "Status", "Date & Time"].map((h) => (
                          <th key={h} className="px-6 py-4 font-[Prata] font-normal text-left">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {historyTransactions.map((t) => (
                        <tr key={t.id} className="border-b border-gray-100 last:border-0 text-sm">
                          <td className={cellClass} style={{ WebkitTextStroke: "0.3px #1d080f" }}>{t.displayNo}</td>
                          <td className={cellClass}>{t.customer}</td>
                          <td className={`${cellClass} capitalize`}>
                            {t.method || <span className="text-gray-400">—</span>}
                          </td>
                          <td className={cellClass}>Php. {t.amount.toLocaleString()}</td>
                          <td className={cellClass}>
                            {t.hasReceipt ? (
                              <button
                                onClick={() => openVerify(t)}
                                disabled={loadingId === t.id}
                                className={viewButtonClass}
                              >
                                <Eye size={14} />
                                {loadingId === t.id ? "Loading..." : "View"}
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                          <td className={cellClass}>
                            {t.hasReceipt ? (
                              <button onClick={() => openVerify(t)} className="hover:opacity-80 transition">
                                <StatusBadge status={t.status} />
                              </button>
                            ) : (
                              <StatusBadge status={t.status} />
                            )}
                          </td>
                          <td className={`${cellClass} text-gray-500`}>
                            {t.date}<br />{t.time}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </>
        )}
      </main>

      <ValidateModal
        transaction={modalTx}
        busy={saving}
        onClose={() => setModalTx(null)}
        onConfirm={handleConfirm}
        onFail={handleFail}
      />

      <DownpaymentModal
        reservation={modalDp}
        busy={saving}
        onClose={() => setModalDp(null)}
        onConfirm={(id) => handleDownpayment(id, "verified")}
        onFail={(id) => handleDownpayment(id, "failed")}
      />

      <ImageViewer src={viewerImage} onClose={() => setViewerImage(null)} />

      {toast.message && (
        <div
          className="font-[Prata]"
          style={{
            position: "fixed",
            bottom: 28,
            right: 28,
            background: toast.tone === "error" ? "#c0392b" : "#1d080f",
            color: "#fff",
            padding: "14px 20px",
            borderRadius: 10,
            boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
            fontSize: 13.5,
            display: "flex",
            alignItems: "center",
            gap: 10,
            zIndex: 300,
            maxWidth: 340,
          }}
        >
          <span
            style={{
              background: toast.tone === "error" ? "rgba(255,255,255,0.25)" : "#296c39",
              borderRadius: "50%",
              width: 20,
              height: 20,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
            }}
          >
            {toast.tone === "error" ? "!" : "✓"}
          </span>
          {toast.message}
        </div>
      )}
    </div>
  );
}