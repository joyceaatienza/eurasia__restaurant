import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { X, Check, Ban, Eye, ArrowUpDown, Search } from "lucide-react";
import StaffHeader from "../components/StaffHeader";
import { ordersApi } from "../services/ordersApi";
import { reservationsApi } from "../services/reservationsApi";

const POLL_MS = 8000;
const HIGHLIGHT_MS = 4000;
const STATUS_LABEL = { pending: "Pending", verified: "Completed", failed: "Failed" };

// Reservations in these states are done, so their downpayments leave the Cashier list
const CLOSED_RESERVATION_STATUSES = ["completed", "cancelled", "no_show"];

const MOBILE_QUERY = "(max-width: 767px)";

// Lets the standalone page size itself; inside the Owner shell the prop wins
function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-100">
      <div className="text-xs text-gray-600 font-[Prata] mb-2">{label}</div>
      <div
        className="text-xl sm:text-2xl font-[Prata] text-[#1d080f]"
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
    <span className={`text-xs font-[Prata] px-3 py-1 rounded-lg whitespace-nowrap ${styles[status] || styles.Pending}`}>
      {status}
    </span>
  );
}

function ImageViewer({ src, onClose }) {
  if (!src) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 sm:p-6"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white/80 hover:text-white transition"
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
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4 py-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-xl p-5 sm:p-7 max-w-sm w-full font-[Prata] max-h-[88vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 text-gray-500 hover:text-gray-700"
        >
          <X size={18} />
        </button>

        <h3
          className="text-lg sm:text-xl text-[#1d080f] mb-1 pr-8"
          style={{ WebkitTextStroke: "0.5px #1d080f" }}
        >
          Validate Payment
        </h3>
        <p className="text-xs text-gray-600 mb-5">Verify and confirm the payment.</p>

        <div className="space-y-3 text-sm mb-5">
          <div className="flex justify-between gap-3">
            <span className="text-gray-600 shrink-0">Customer</span>
            <span className="text-[#1d080f] text-right">{transaction.customer}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-gray-600 shrink-0">Order #</span>
            <span className="text-[#1d080f] text-right">{transaction.displayNo}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-gray-600 shrink-0">Payment Method</span>
            <span className="text-[#1d080f] capitalize text-right">{transaction.method || "—"}</span>
          </div>
          {transaction.discount && (
            <div className="flex justify-between gap-3">
              <span className="text-gray-600 shrink-0">Discount</span>
              <span className="text-[#1d080f] capitalize text-right">
                {transaction.discount}
                {transaction.discountAmount
                  ? ` (- Php. ${Number(transaction.discountAmount).toLocaleString()})`
                  : ""}
              </span>
            </div>
          )}
          <div className="flex justify-between gap-3">
            <span className="text-gray-600 shrink-0">Amount</span>
            <span className="text-[#1d080f] text-right">Php. {transaction.amount.toLocaleString()}</span>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-xs text-gray-600 mb-2">Proof of Payment</p>
          {transaction.receiptImage ? (
            <a href={transaction.receiptImage} target="_blank" rel="noreferrer">
              <img
                src={transaction.receiptImage}
                alt="Payment receipt"
                className="w-full max-h-48 object-contain rounded-lg border border-gray-200 bg-gray-50"
              />
            </a>
          ) : (
            <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center text-xs text-gray-600">
              No proof of payment uploaded.
            </div>
          )}
        </div>

        {transaction.discountIdImage && (
          <div className="mb-4">
            <p className="text-xs text-gray-600 mb-2">Discount ID</p>
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
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4 py-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-xl p-5 sm:p-7 max-w-sm w-full font-[Prata] max-h-[88vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 text-gray-500 hover:text-gray-700"
        >
          <X size={18} />
        </button>

        <h3
          className="text-lg sm:text-xl text-[#1d080f] mb-1 pr-8"
          style={{ WebkitTextStroke: "0.5px #1d080f" }}
        >
          {reservation.isCash ? "Cash Downpayment" : "Verify Downpayment"}
        </h3>
        <p className="text-xs text-gray-600 mb-5">
          Once verified, the front desk can confirm this reservation.
        </p>

        <div className="space-y-3 text-sm mb-5">
          <div className="flex justify-between gap-3">
            <span className="text-gray-600 shrink-0">Guest</span>
            <span className="text-[#1d080f] text-right">{reservation.guestName}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-gray-600 shrink-0">Reservation</span>
            <span className="text-[#1d080f] capitalize text-right">
              {reservation.type === "event" ? "Event" : "Table"} · {reservation.pax} pax
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-gray-600 shrink-0">Date &amp; Time</span>
            <span className="text-[#1d080f] text-right">{reservation.date} · {reservation.time}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-gray-600 shrink-0">Booked On</span>
            <span className="text-[#1d080f] text-right">{reservation.booked}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-gray-600 shrink-0">Payment Method</span>
            <span className="text-[#1d080f] capitalize text-right">{reservation.method || "—"}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-gray-600 shrink-0">Amount</span>
            <span className="text-[#1d080f] text-right">Php. {reservation.amount.toLocaleString()}</span>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-xs text-gray-600 mb-2">
            {reservation.isCash ? "Cash Payment" : "Proof of Payment"}
          </p>
          {reservation.isCash ? (
            <div className="bg-[#f7f5f0] rounded-lg p-4 text-xs text-gray-700 leading-relaxed">
              The guest is paying in cash at the restaurant. Only mark this as received once you
              have the Php. {reservation.amount.toLocaleString()} in hand.
            </div>
          ) : loading ? (
            <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center text-xs text-gray-600">
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
            <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center text-xs text-gray-600">
              No proof of payment uploaded.
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
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
  const validDate = !isNaN(resDate.getTime());
  const createdAt = new Date(r.created_at);

  return {
    id: r.id,
    guestName: r.guest_name,
    contact: r.contact_number || "",
    email: r.email || "",
    type: r.reservation_type,
    pax: r.party_size,
    method: r.payment_method,
    amount: Number(r.downpayment_amount || 0),
    status: STATUS_LABEL[String(r.payment_status || "").toLowerCase()] || "Pending",
    reservationStatus: String(r.status || "").toLowerCase(),
    hasProof: Boolean(r.has_payment_proof ?? r.payment_proof),
    // Cash is handed over at the counter, so there's no upload to check
    isCash: (r.payment_method || "").toLowerCase() === "cash",
    createdAt,
    // The reservation day (midnight) — used to drop reservations that already passed
    resDay: validDate ? new Date(resDate.getFullYear(), resDate.getMonth(), resDate.getDate()) : null,
    // The reservation day and time together — used when sorting by reservation date
    resDateTime: validDate
      ? new Date(resDate.getFullYear(), resDate.getMonth(), resDate.getDate(), isNaN(h) ? 0 : h, isNaN(m) ? 0 : m)
      : null,
    date: validDate
      ? resDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "—",
    time: isNaN(h) ? "—" : `${hour12}:${String(m).padStart(2, "0")} ${period}`,
    booked: isNaN(createdAt.getTime())
      ? "—"
      : createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
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

/* ---------------------------------------------------------------- */
/* Search                                                            */
/* ---------------------------------------------------------------- */
// Orders match on customer name or order number ("12" or "#12")
function orderMatches(t, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const num = q.replace(/^#/, "");
  return (
    (t.customer || "").toLowerCase().includes(q) ||
    String(t.displayNo ?? "") === num
  );
}

// Downpayments match on guest name, email, or contact number (digits only,
// so "0917 123" finds "09171234567")
function downpaymentMatches(d, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const digits = q.replace(/\D/g, "");
  return (
    (d.guestName || "").toLowerCase().includes(q) ||
    (d.email || "").toLowerCase().includes(q) ||
    (digits.length >= 3 && (d.contact || "").replace(/\D/g, "").includes(digits))
  );
}

/* ---------------------------------------------------------------- */
/* Phone cards — a seven-column table is unusable at 375px, so each  */
/* row becomes a card with its action as a full-width button         */
/* ---------------------------------------------------------------- */
function PaymentCard({ t, highlighted, cardRef, loadingId, onView, onVerify, showStatusOnly }) {
  return (
    <div
      ref={cardRef}
      className={`bg-white rounded-xl p-4 shadow-sm transition-colors duration-500 ${
        highlighted ? "border-2 border-[#f2c14e] bg-[#fff8e1]" : "border border-gray-100"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <span
          className="font-[Prata] text-base text-[#1d080f]"
          style={{ WebkitTextStroke: "0.3px #1d080f" }}
        >
          Order #{t.displayNo}
        </span>
        <span className="font-[Prata] text-base text-[#1d080f] whitespace-nowrap">
          Php. {t.amount.toLocaleString()}
        </span>
      </div>

      <div className="text-sm text-[#1d080f] mb-1">{t.customer}</div>
      <div className="text-xs text-gray-600 mb-3">
        <span className="capitalize">{t.method || "—"}</span> · {t.date} · {t.time}
      </div>

      <div className="flex gap-2">
        {t.hasReceipt && (
          <button
            onClick={() => onView(t)}
            disabled={loadingId === t.id}
            className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-[Prata] py-2.5 rounded-lg border border-gray-300 text-[#1d080f] hover:bg-gray-50 transition disabled:opacity-50"
          >
            <Eye size={14} />
            {loadingId === t.id ? "Loading..." : "View"}
          </button>
        )}

        {showStatusOnly ? (
          <div className="flex-1 flex items-center justify-center">
            <StatusBadge status={t.status} />
          </div>
        ) : t.hasReceipt ? (
          <button
            onClick={() => onVerify(t)}
            disabled={loadingId === t.id}
            className="flex-[2] text-xs font-[Prata] py-2.5 rounded-lg bg-[#f5e79e] text-[#5e5113] hover:opacity-80 transition disabled:opacity-50"
          >
            {loadingId === t.id ? "Loading..." : "Verify Payment"}
          </button>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs text-gray-500 italic">
            Awaiting payment
          </div>
        )}
      </div>
    </div>
  );
}

function DownpaymentCard({ d, highlighted, cardRef, onOpen, showStatusOnly }) {
  return (
    <div
      ref={cardRef}
      className={`bg-white rounded-xl p-4 shadow-sm transition-colors duration-500 ${
        highlighted ? "border-2 border-[#f2c14e] bg-[#fff8e1]" : "border border-gray-100"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <span
          className="font-[Prata] text-base text-[#1d080f]"
          style={{ WebkitTextStroke: "0.3px #1d080f" }}
        >
          {d.guestName}
        </span>
        <span className="font-[Prata] text-base text-[#1d080f] whitespace-nowrap">
          Php. {d.amount.toLocaleString()}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <span
          className={`text-xs font-[Prata] px-2.5 py-1 rounded-lg ${
            d.type === "event"
              ? "bg-[#fdf3df] text-[#9c7a1f]"
              : "bg-[#e5f0e6] text-[#296c39]"
          }`}
        >
          {d.type === "event" ? "Event" : "Table"}
        </span>
        <span className="text-xs text-gray-700">{d.pax} pax</span>
      </div>

      <div className="text-xs text-gray-600 mb-1">
        <span className="capitalize">{d.method || "—"}</span> · {d.date} · {d.time}
      </div>
      <div className="text-[11px] text-gray-500 mb-3">Booked {d.booked}</div>

      {showStatusOnly ? (
        <div className="flex justify-center">
          <StatusBadge status={d.status} />
        </div>
      ) : d.isCash || d.hasProof ? (
        <button
          onClick={() => onOpen(d)}
          className="w-full text-xs font-[Prata] py-2.5 rounded-lg bg-[#f5e79e] text-[#5e5113] hover:opacity-80 transition"
        >
          {d.isCash ? "Mark as Received" : "Verify Downpayment"}
        </button>
      ) : (
        <div className="text-center text-xs text-gray-500 italic py-2">No proof uploaded</div>
      )}
    </div>
  );
}

export default function PaymentTransactions({
  embedded = false,
  highlightTarget = null,
  isMobile: isMobileProp,
  // The Owner's History page shows just the History view from here,
  // so it matches what the cashier sees
  historyOnly = false,
}) {
  const location = useLocation();
  const detectedMobile = useMediaQuery(MOBILE_QUERY);
  const isMobile = isMobileProp ?? detectedMobile;

  const [transactions, setTransactions] = useState([]);
  const [downpayments, setDownpayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalTx, setModalTx] = useState(null);
  const [modalDp, setModalDp] = useState(null);
  const [viewerImage, setViewerImage] = useState(null);
  const [toast, setToast] = useState({ message: "", tone: "success" });
  const [view, setView] = useState(historyOnly ? "history" : "pending");
  // Which row is loading its photo, and whether a Confirm/Fail is being saved
  const [loadingId, setLoadingId] = useState(null);
  const [saving, setSaving] = useState(false);
  // A notification click asks this page to surface one row
  const [highlight, setHighlight] = useState(null);
  const highlightRef = useRef(null);
  // Downpayment sorting: by the day it was booked or the reservation day, newest or oldest first
  const [dpSortBy, setDpSortBy] = useState("created");
  const [dpNewestFirst, setDpNewestFirst] = useState(true);
  // Search covers every order and every downpayment, whatever tab is open
  const [search, setSearch] = useState("");
  const isSearching = search.trim().length > 0;
  // History keeps every payment from every day, so all orders load separately
  // (only while History or a search needs them — the main tabs stay on today)
  const [allOrders, setAllOrders] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  // Which list History shows: order payments or downpayments
  const [historyType, setHistoryType] = useState("orders");

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

  // Every order from every day, for History and search
  const loadHistory = useCallback((showSpinner = false) => {
    if (showSpinner) setHistoryLoading(true);
    return ordersApi.getAll()
      .then((data) => {
        setAllOrders(assignDailyNumbers(data.map(normalizeTransaction)));
        setHistoryLoaded(true);
      })
      .catch((err) => console.error("Failed to load payment history:", err))
      .finally(() => { if (showSpinner) setHistoryLoading(false); });
  }, []);

  const needsHistory = view === "history" || isSearching;
  useEffect(() => {
    if (!needsHistory) return;
    loadHistory(!historyLoaded);
    const interval = setInterval(() => loadHistory(), POLL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsHistory, loadHistory]);

  // Jump to the right tab and flag the row the notification pointed at. The
  // target arrives as a prop inside the Owner shell, or through router state
  // on the standalone page.
  useEffect(() => {
    if (historyOnly) return;
    const target = highlightTarget || location.state?.highlight;
    if (!target) return;
    if (target.type === "payment") {
      setView("pending");
      setHighlight({ kind: "payment", id: target.id });
    } else if (target.type === "downpayment") {
      setView("downpayments");
      setHighlight({ kind: "downpayment", id: target.id });
    } else {
      return;
    }
    const timer = setTimeout(() => setHighlight(null), HIGHLIGHT_MS);
    return () => clearTimeout(timer);
  }, [highlightTarget, location.state]);

  // Scroll the highlighted row into view once it renders
  useEffect(() => {
    if (highlight && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlight, transactions, downpayments]);

  const showToast = (message, tone = "success") => {
    setToast({ message, tone });
    setTimeout(() => setToast({ message: "", tone }), 3000);
  };
  const showError = (message) => showToast(message, "error");

  const pendingTransactions = transactions.filter((t) => t.status === "Pending");

  // Downpayments only matter while the reservation is still ahead: anything
  // completed, cancelled, no-show, or dated before today drops off this page
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const activeDownpayments = downpayments.filter(
    (d) =>
      !CLOSED_RESERVATION_STATUSES.includes(d.reservationStatus) &&
      (!d.resDay || d.resDay >= today)
  );

  const dpSortValue = (d) =>
    dpSortBy === "reservation"
      ? d.resDateTime?.getTime() ?? 0
      : d.createdAt?.getTime() ?? 0;

  const pendingDownpayments = activeDownpayments
    .filter((d) => d.status === "Pending")
    .sort((a, b) => {
      const diff = dpSortValue(b) - dpSortValue(a);
      return dpNewestFirst ? diff : -diff;
    });

  const pendingCount = pendingTransactions.length + pendingDownpayments.length;
  const completedCount =
    transactions.filter((t) => t.status === "Completed").length +
    downpayments.filter((d) => d.status === "Completed").length;

  // Until every day's orders arrive, today's stand in so nothing looks empty
  const orderSource = historyLoaded ? allOrders : transactions;

  // Every verified or failed order payment from every day, newest first
  const historyTransactions = [...orderSource]
    .filter((t) => t.status === "Completed" || t.status === "Failed")
    .sort((a, b) => b.createdAt - a.createdAt);

  // Every downpayment the cashier has already acted on, newest booking first
  const historyDownpayments = downpayments
    .filter((d) => d.status === "Completed" || d.status === "Failed")
    .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));

  const orderResults = isSearching
    ? orderSource.filter((t) => orderMatches(t, search)).sort((a, b) => b.createdAt - a.createdAt)
    : [];
  // Newest booking first, so the one the guest just made is on top
  const downpaymentResults = isSearching
    ? downpayments
        .filter((d) => downpaymentMatches(d, search))
        .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0))
    : [];
  // A downpayment can still be acted on only while it's pending and the reservation is ahead
  const isActiveDownpayment = (d) => activeDownpayments.includes(d) && d.status === "Pending";

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
    const tx = transactions.find((t) => t.id === id) || allOrders.find((t) => t.id === id);
    setSaving(true);
    try {
      await ordersApi.updatePaymentStatus(id, "verified");
      setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, status: "Completed" } : t)));
      setAllOrders((prev) => prev.map((t) => (t.id === id ? { ...t, status: "Completed" } : t)));
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
    const tx = transactions.find((t) => t.id === id) || allOrders.find((t) => t.id === id);
    setSaving(true);
    try {
      await ordersApi.updatePaymentStatus(id, "failed");
      setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, status: "Failed" } : t)));
      setAllOrders((prev) => prev.map((t) => (t.id === id ? { ...t, status: "Failed" } : t)));
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
    "inline-flex items-center gap-1.5 text-xs font-[Prata] px-3 py-1.5 rounded-lg border border-gray-300 text-[#1d080f] hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-wait";

  // A highlighted row gets an amber wash so the eye lands on it immediately
  const rowClass = (kind, id) =>
    highlight && highlight.kind === kind && highlight.id === id
      ? "border-b border-gray-100 last:border-0 text-sm bg-[#fff8e1] transition-colors duration-500"
      : "border-b border-gray-100 last:border-0 text-sm transition-colors duration-500";

  const isHighlighted = (kind, id) =>
    Boolean(highlight && highlight.kind === kind && highlight.id === id);

  const rowRef = (kind, id) => (isHighlighted(kind, id) ? highlightRef : null);

  const emptyClass =
    "bg-white rounded-xl p-8 sm:p-12 text-center text-gray-500 font-[Prata] text-sm shadow-sm border border-gray-100";

  // Inside the Owner shell, History lives on the Owner's own History page
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
    <div className={`${historyOnly ? "" : "min-h-screen bg-[#f0eff3]"} font-[Prata] text-[#1d080f] text-left`}>
      {!embedded && <StaffHeader role="Cashier" />}

      <main className="max-w-[1400px] mx-auto" style={{ padding: historyOnly ? 0 : isMobile ? 16 : 28 }}>
        {!historyOnly && (
        <>
        <h1
          className="text-[#1d080f] text-left"
          style={{
            marginTop: 0,
            marginBottom: "20px",
            fontSize: "clamp(24px, 6vw, 39px)",
            lineHeight: 1.15,
            WebkitTextStroke: "0.4px #1d080f",
          }}
        >
          Payment Transactions
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5 mb-5 sm:mb-6">
          <StatCard label="Pending Payments" value={pendingCount} />
          <StatCard label="Today's Orders" value={transactions.length} />
          <StatCard label="Completed Payments" value={completedCount} />
        </div>
        </>
        )}

        {/* Search by customer, order number, or the guest behind a downpayment */}
        <div className="relative w-full sm:max-w-md mb-4">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setSearch("")}
            placeholder="Search customer, order #, or guest contact"
            className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-10 py-2.5 text-sm font-[Prata] text-[#1d080f] shadow-sm focus:outline-none focus:ring-1 focus:ring-[#1d080f]"
          />
          {isSearching && (
            <button
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#1d080f] p-1"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* The tab strip scrolls sideways rather than wrapping on a phone */}
        {!isSearching && !historyOnly && (
        <div className="overflow-x-auto mb-5 sm:mb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-1.5 bg-white p-1 rounded-lg w-fit shadow-sm border border-gray-100">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setView(t.key)}
                className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-[Prata] transition flex items-center gap-2 whitespace-nowrap ${
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
        </div>
        )}

        {/* Downpayment sorting: which date to go by, and which way */}
        {view === "downpayments" && !loading && !isSearching && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
            <span className="text-xs text-gray-600">Sort by</span>
            <div className="flex gap-1 bg-white p-1 rounded-lg shadow-sm border border-gray-100">
              {[
                { key: "created", label: "Date Booked" },
                { key: "reservation", label: "Reservation Date" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setDpSortBy(opt.key)}
                  className={`px-3 py-1.5 rounded-md text-xs font-[Prata] transition whitespace-nowrap ${
                    dpSortBy === opt.key ? "bg-[#1d080f] text-white" : "text-[#1d080f] hover:bg-gray-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setDpNewestFirst((prev) => !prev)}
              className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-[Prata] text-[#1d080f] shadow-sm hover:bg-gray-50 transition whitespace-nowrap"
            >
              {dpNewestFirst ? "Newest first" : "Oldest first"}
              <ArrowUpDown size={14} />
            </button>
          </div>
        )}

        {loading ? (
          <div className={emptyClass}>Loading transactions...</div>
        ) : isSearching ? (
          <div className="grid gap-6">
            {/* ---------- Order payments ---------- */}
            <section>
              <h2 className="text-base text-[#1d080f] mb-3" style={{ WebkitTextStroke: "0.3px #1d080f" }}>
                Order Payments{" "}
                <span className="text-xs text-gray-500">
                  {historyLoaded ? "(all dates)" : "(today — loading older orders...)"} · {orderResults.length}
                </span>
              </h2>
              {orderResults.length === 0 ? (
                <div className={emptyClass}>No orders match "{search.trim()}".</div>
              ) : isMobile ? (
                <div className="grid gap-3">
                  {orderResults.map((t) => (
                    <PaymentCard
                      key={t.id}
                      t={t}
                      highlighted={false}
                      cardRef={null}
                      loadingId={loadingId}
                      onView={viewReceipt}
                      onVerify={openVerify}
                      showStatusOnly={t.status !== "Pending"}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
                  <table className="w-full text-left" style={{ minWidth: 800 }}>
                    <thead>
                      <tr className="text-xs text-gray-600 border-b border-gray-100">
                        {["Order #", "Customer", "Method", "Amount", "Receipt", "Status", "Date & Time"].map((h) => (
                          <th key={h} className="px-6 py-4 font-[Prata] font-normal text-left whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {orderResults.map((t) => (
                        <tr key={t.id} className="border-b border-gray-100 last:border-0 text-sm">
                          <td className={cellClass} style={{ WebkitTextStroke: "0.3px #1d080f" }}>{t.displayNo}</td>
                          <td className={cellClass}>{t.customer}</td>
                          <td className={`${cellClass} capitalize`}>
                            {t.method || <span className="text-gray-500">—</span>}
                          </td>
                          <td className={`${cellClass} whitespace-nowrap`}>Php. {t.amount.toLocaleString()}</td>
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
                              <span className="text-xs text-gray-500">—</span>
                            )}
                          </td>
                          <td className={cellClass}>
                            {t.status !== "Pending" ? (
                              <StatusBadge status={t.status} />
                            ) : t.hasReceipt ? (
                              <button
                                onClick={() => openVerify(t)}
                                disabled={loadingId === t.id}
                                className="text-xs font-[Prata] px-3 py-1.5 rounded-lg bg-[#f5e79e] text-[#5e5113] hover:opacity-80 transition disabled:opacity-50 disabled:cursor-wait whitespace-nowrap"
                              >
                                {loadingId === t.id ? "Loading..." : "Verify Payment"}
                              </button>
                            ) : (
                              <span className="text-xs text-gray-500 italic">Awaiting payment</span>
                            )}
                          </td>
                          <td className={`${cellClass} text-gray-600 whitespace-nowrap`}>
                            {t.date}<br />{t.time}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* ---------- Downpayments (every date) ---------- */}
            <section>
              <h2 className="text-base text-[#1d080f] mb-3" style={{ WebkitTextStroke: "0.3px #1d080f" }}>
                Downpayments <span className="text-xs text-gray-500">(all dates) · {downpaymentResults.length}</span>
              </h2>
              {downpaymentResults.length === 0 ? (
                <div className={emptyClass}>No downpayments match "{search.trim()}".</div>
              ) : isMobile ? (
                <div className="grid gap-3">
                  {downpaymentResults.map((d) => (
                    <DownpaymentCard
                      key={d.id}
                      d={d}
                      highlighted={false}
                      cardRef={null}
                      onOpen={setModalDp}
                      showStatusOnly={!isActiveDownpayment(d)}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
                  <table className="w-full text-left" style={{ minWidth: 1000 }}>
                    <thead>
                      <tr className="text-xs text-gray-600 border-b border-gray-100">
                        {["Guest", "Contact", "Reservation", "Pax", "Method", "Amount", "Status", "Reservation Date", "Booked On"].map((h) => (
                          <th key={h} className="px-6 py-4 font-[Prata] font-normal text-left whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {downpaymentResults.map((d) => (
                        <tr key={d.id} className="border-b border-gray-100 last:border-0 text-sm">
                          <td className={cellClass} style={{ WebkitTextStroke: "0.3px #1d080f" }}>{d.guestName}</td>
                          <td className={`${cellClass} text-gray-600`}>
                            <div className="whitespace-nowrap">{d.contact || "—"}</div>
                            {d.email && <div className="text-xs">{d.email}</div>}
                          </td>
                          <td className={cellClass}>
                            <span className={`text-xs font-[Prata] px-3 py-1 rounded-lg whitespace-nowrap ${
                              d.type === "event"
                                ? "bg-[#fdf3df] text-[#9c7a1f]"
                                : "bg-[#e5f0e6] text-[#296c39]"
                            }`}>
                              {d.type === "event" ? "Event" : "Table"}
                            </span>
                          </td>
                          <td className={cellClass}>{d.pax}</td>
                          <td className={`${cellClass} capitalize`}>
                            {d.method || <span className="text-gray-500">—</span>}
                          </td>
                          <td className={`${cellClass} whitespace-nowrap`}>Php. {d.amount.toLocaleString()}</td>
                          <td className={cellClass}>
                            {!isActiveDownpayment(d) ? (
                              <StatusBadge status={d.status} />
                            ) : d.isCash || d.hasProof ? (
                              <button
                                onClick={() => setModalDp(d)}
                                className="text-xs font-[Prata] px-3 py-1.5 rounded-lg bg-[#f5e79e] text-[#5e5113] hover:opacity-80 transition whitespace-nowrap"
                              >
                                {d.isCash ? "Mark as Received" : "Verify Downpayment"}
                              </button>
                            ) : (
                              <span className="text-xs text-gray-500 italic">No proof uploaded</span>
                            )}
                          </td>
                          <td className={`${cellClass} text-gray-600 whitespace-nowrap`}>
                            {d.date}<br />{d.time}
                          </td>
                          <td className={`${cellClass} text-gray-600 whitespace-nowrap`}>{d.booked}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        ) : (
          <>
            {view === "pending" && (
              pendingTransactions.length === 0 ? (
                <div className={emptyClass}>No pending order payments.</div>
              ) : isMobile ? (
                <div className="grid gap-3">
                  {pendingTransactions.map((t) => (
                    <PaymentCard
                      key={t.id}
                      t={t}
                      highlighted={isHighlighted("payment", t.id)}
                      cardRef={rowRef("payment", t.id)}
                      loadingId={loadingId}
                      onView={viewReceipt}
                      onVerify={openVerify}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
                  <table className="w-full text-left" style={{ minWidth: 800 }}>
                    <thead>
                      <tr className="text-xs text-gray-600 border-b border-gray-100">
                        {["Order #", "Customer", "Method", "Amount", "Receipt", "Status", "Date & Time"].map((h) => (
                          <th key={h} className="px-6 py-4 font-[Prata] font-normal text-left whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pendingTransactions.map((t) => (
                        <tr key={t.id} ref={rowRef("payment", t.id)} className={rowClass("payment", t.id)}>
                          <td className={cellClass} style={{ WebkitTextStroke: "0.3px #1d080f" }}>{t.displayNo}</td>
                          <td className={cellClass}>{t.customer}</td>
                          <td className={`${cellClass} capitalize`}>
                            {t.method || <span className="text-gray-500">—</span>}
                          </td>
                          <td className={`${cellClass} whitespace-nowrap`}>Php. {t.amount.toLocaleString()}</td>
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
                              <span className="text-xs text-gray-500">—</span>
                            )}
                          </td>
                          <td className={cellClass}>
                            {t.hasReceipt ? (
                              <button
                                onClick={() => openVerify(t)}
                                disabled={loadingId === t.id}
                                className="text-xs font-[Prata] px-3 py-1.5 rounded-lg bg-[#f5e79e] text-[#5e5113] hover:opacity-80 transition disabled:opacity-50 disabled:cursor-wait whitespace-nowrap"
                              >
                                {loadingId === t.id ? "Loading..." : "Verify Payment"}
                              </button>
                            ) : (
                              <span className="text-xs text-gray-500 italic">Awaiting payment</span>
                            )}
                          </td>
                          <td className={`${cellClass} text-gray-600 whitespace-nowrap`}>
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
                <div className={emptyClass}>No downpayments waiting for verification.</div>
              ) : isMobile ? (
                <div className="grid gap-3">
                  {pendingDownpayments.map((d) => (
                    <DownpaymentCard
                      key={d.id}
                      d={d}
                      highlighted={isHighlighted("downpayment", d.id)}
                      cardRef={rowRef("downpayment", d.id)}
                      onOpen={setModalDp}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
                  <table className="w-full text-left" style={{ minWidth: 900 }}>
                    <thead>
                      <tr className="text-xs text-gray-600 border-b border-gray-100">
                        {["Guest", "Reservation", "Pax", "Method", "Amount", "Status", "Reservation Date", "Booked On"].map((h) => (
                          <th key={h} className="px-6 py-4 font-[Prata] font-normal text-left whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pendingDownpayments.map((d) => (
                        <tr key={d.id} ref={rowRef("downpayment", d.id)} className={rowClass("downpayment", d.id)}>
                          <td className={cellClass} style={{ WebkitTextStroke: "0.3px #1d080f" }}>{d.guestName}</td>
                          <td className={cellClass}>
                            <span className={`text-xs font-[Prata] px-3 py-1 rounded-lg whitespace-nowrap ${
                              d.type === "event"
                                ? "bg-[#fdf3df] text-[#9c7a1f]"
                                : "bg-[#e5f0e6] text-[#296c39]"
                            }`}>
                              {d.type === "event" ? "Event" : "Table"}
                            </span>
                          </td>
                          <td className={cellClass}>{d.pax}</td>
                          <td className={`${cellClass} capitalize`}>
                            {d.method || <span className="text-gray-500">—</span>}
                          </td>
                          <td className={`${cellClass} whitespace-nowrap`}>Php. {d.amount.toLocaleString()}</td>
                          <td className={cellClass}>
                            {d.isCash || d.hasProof ? (
                              <button
                                onClick={() => setModalDp(d)}
                                className="text-xs font-[Prata] px-3 py-1.5 rounded-lg bg-[#f5e79e] text-[#5e5113] hover:opacity-80 transition whitespace-nowrap"
                              >
                                {d.isCash ? "Mark as Received" : "Verify Downpayment"}
                              </button>
                            ) : (
                              <span className="text-xs text-gray-500 italic">No proof uploaded</span>
                            )}
                          </td>
                          <td className={`${cellClass} text-gray-600 whitespace-nowrap`}>
                            {d.date}<br />{d.time}
                          </td>
                          <td className={`${cellClass} text-gray-600 whitespace-nowrap`}>
                            {d.booked}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {view === "history" && (
              historyLoading && historyTransactions.length === 0 && historyType === "orders" ? (
                <div className={emptyClass}>Loading payment history...</div>
              ) : (
              <div className="grid gap-6">
                {/* Choose which history to look at */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <span className="text-xs text-gray-600">Show</span>
                  <div className="flex gap-1 bg-white p-1 rounded-lg shadow-sm border border-gray-100">
                    {[
                      { key: "orders", label: "Order Payments", count: historyTransactions.length },
                      { key: "downpayments", label: "Downpayments", count: historyDownpayments.length },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => setHistoryType(opt.key)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-[Prata] transition whitespace-nowrap ${
                          historyType === opt.key ? "bg-[#1d080f] text-white" : "text-[#1d080f] hover:bg-gray-50"
                        }`}
                      >
                        {opt.label}
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            historyType === opt.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {opt.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ---------- Order payments (every day) ---------- */}
                {historyType === "orders" && (
                <section>
                  <h2 className="text-base text-[#1d080f] mb-3" style={{ WebkitTextStroke: "0.3px #1d080f" }}>
                    Order Payments{" "}
                    <span className="text-xs text-gray-500">
                      {historyLoaded ? "(all dates)" : "(today — loading older orders...)"} · {historyTransactions.length}
                    </span>
                  </h2>
                  {historyTransactions.length === 0 ? (
                    <div className={emptyClass}>No payment history yet.</div>
                  ) : isMobile ? (
                    <div className="grid gap-3">
                      {historyTransactions.map((t) => (
                        <PaymentCard
                          key={t.id}
                          t={t}
                          highlighted={false}
                          cardRef={null}
                          loadingId={loadingId}
                          onView={viewReceipt}
                          onVerify={openVerify}
                          showStatusOnly
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
                      <table className="w-full text-left" style={{ minWidth: 800 }}>
                        <thead>
                          <tr className="text-xs text-gray-600 border-b border-gray-100">
                            {["Order #", "Customer", "Method", "Amount", "Receipt", "Status", "Date & Time"].map((h) => (
                              <th key={h} className="px-6 py-4 font-[Prata] font-normal text-left whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {historyTransactions.map((t) => (
                            <tr key={t.id} className="border-b border-gray-100 last:border-0 text-sm">
                              <td className={cellClass} style={{ WebkitTextStroke: "0.3px #1d080f" }}>{t.displayNo}</td>
                              <td className={cellClass}>{t.customer}</td>
                              <td className={`${cellClass} capitalize`}>
                                {t.method || <span className="text-gray-500">—</span>}
                              </td>
                              <td className={`${cellClass} whitespace-nowrap`}>Php. {t.amount.toLocaleString()}</td>
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
                                  <span className="text-xs text-gray-500">—</span>
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
                              <td className={`${cellClass} text-gray-600 whitespace-nowrap`}>
                                {t.date}<br />{t.time}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
                )}

                {/* ---------- Downpayments already verified or failed ---------- */}
                {historyType === "downpayments" && (
                <section>
                  <h2 className="text-base text-[#1d080f] mb-3" style={{ WebkitTextStroke: "0.3px #1d080f" }}>
                    Downpayments <span className="text-xs text-gray-500">(all dates) · {historyDownpayments.length}</span>
                  </h2>
                  {historyDownpayments.length === 0 ? (
                    <div className={emptyClass}>No downpayment history yet.</div>
                  ) : isMobile ? (
                    <div className="grid gap-3">
                      {historyDownpayments.map((d) => (
                        <DownpaymentCard
                          key={d.id}
                          d={d}
                          highlighted={false}
                          cardRef={null}
                          onOpen={setModalDp}
                          showStatusOnly
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
                      <table className="w-full text-left" style={{ minWidth: 900 }}>
                        <thead>
                          <tr className="text-xs text-gray-600 border-b border-gray-100">
                            {["Guest", "Reservation", "Pax", "Method", "Amount", "Status", "Reservation Date", "Booked On"].map((h) => (
                              <th key={h} className="px-6 py-4 font-[Prata] font-normal text-left whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {historyDownpayments.map((d) => (
                            <tr key={d.id} className="border-b border-gray-100 last:border-0 text-sm">
                              <td className={cellClass} style={{ WebkitTextStroke: "0.3px #1d080f" }}>{d.guestName}</td>
                              <td className={cellClass}>
                                <span className={`text-xs font-[Prata] px-3 py-1 rounded-lg whitespace-nowrap ${
                                  d.type === "event"
                                    ? "bg-[#fdf3df] text-[#9c7a1f]"
                                    : "bg-[#e5f0e6] text-[#296c39]"
                                }`}>
                                  {d.type === "event" ? "Event" : "Table"}
                                </span>
                              </td>
                              <td className={cellClass}>{d.pax}</td>
                              <td className={`${cellClass} capitalize`}>
                                {d.method || <span className="text-gray-500">—</span>}
                              </td>
                              <td className={`${cellClass} whitespace-nowrap`}>Php. {d.amount.toLocaleString()}</td>
                              <td className={cellClass}>
                                <StatusBadge status={d.status} />
                              </td>
                              <td className={`${cellClass} text-gray-600 whitespace-nowrap`}>
                                {d.date}<br />{d.time}
                              </td>
                              <td className={`${cellClass} text-gray-600 whitespace-nowrap`}>{d.booked}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
                )}
              </div>
              )
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
            bottom: 20,
            right: 20,
            left: isMobile ? 20 : "auto",
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
            maxWidth: isMobile ? "none" : 340,
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