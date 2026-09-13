import React, { useState, useEffect, useCallback } from "react";
import { X, Check, Ban } from "lucide-react";
import StaffHeader from "../components/StaffHeader";
import { ordersApi } from "../services/ordersApi";
import PaymentVerificationForm from "../components/PaymentVerificationForm";

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
    <span className={`text-xs font-[Prata] px-3 py-1 rounded-md ${styles[status] || styles.Pending}`}>
      {status}
    </span>
  );
}

function ValidateModal({ transaction, onClose, onConfirm, onFail, onUpdateTable }) {
  const [tableInput, setTableInput] = useState("");

  useEffect(() => {
    if (transaction) setTableInput(transaction.table || "");
  }, [transaction]);

  if (!transaction) return null;

  const handleTableBlur = () => {
    if (tableInput !== transaction.table) {
      onUpdateTable(transaction.id, tableInput);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-xl p-7 max-w-sm w-full font-[Prata]"
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
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Table</span>
            <input
              type="text"
              value={tableInput}
              onChange={(e) => setTableInput(e.target.value)}
              onBlur={handleTableBlur}
              placeholder="e.g. T7"
              className="text-[#1d080f] text-right border border-gray-300 rounded-md px-2 py-1 text-sm w-24 focus:outline-none focus:ring-1 focus:ring-[#1d080f]"
            />
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Order #</span>
            <span className="text-[#1d080f]">{transaction.displayNo}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Payment Method</span>
            <span className="text-[#1d080f]">{transaction.method}</span>
          </div>
          {transaction.discount && (
            <div className="flex justify-between">
              <span className="text-gray-500">Discount</span>
              <span className="text-[#1d080f] capitalize">{transaction.discount}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">Amount</span>
            <span className="text-[#1d080f]">Php. {transaction.amount.toLocaleString()}</span>
          </div>
        </div>

        {transaction.receiptImage ? (
          <a href={transaction.receiptImage} target="_blank" rel="noreferrer">
            <img
              src={transaction.receiptImage}
              alt="Payment receipt"
              className="w-full max-h-48 object-contain rounded-lg border border-gray-200 mb-4"
            />
          </a>
        ) : (
          <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center text-xs text-gray-500 mb-4">
            {transaction.method === "cash" || transaction.method === "Cash"
              ? "Cash payment — no receipt required."
              : "No proof of payment uploaded."}
          </div>
        )}

        {transaction.discountIdImage && (
          <a href={transaction.discountIdImage} target="_blank" rel="noreferrer">
            <img
              src={transaction.discountIdImage}
              alt="Discount ID"
              className="w-full max-h-40 object-contain rounded-lg border border-gray-200 mb-4"
            />
          </a>
        )}

        <div className="flex flex-col gap-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-lg bg-white text-[#1d080f] text-sm border border-gray-300 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => onFail(transaction.id)}
            className="w-full py-2.5 rounded-lg bg-[#f8d7da] text-[#842029] text-sm hover:bg-[#f1c1c6] transition flex items-center justify-center gap-2"
          >
            <Ban size={15} /> Mark as Failed
          </button>
          <button
            onClick={() => onConfirm(transaction.id)}
            className="w-full py-2.5 rounded-lg bg-[#1d080f] text-white text-sm hover:bg-[#3a1420] transition flex items-center justify-center gap-2"
          >
            <Check size={15} /> Confirm Payment
          </button>
        </div>
      </div>
    </div>
  );
}

const STATUS_LABEL = { pending: "Pending", verified: "Completed", failed: "Failed" };

function normalizeTransaction(o) {
  const createdAt = new Date(o.created_at);
  return {
    id: o.id,
    dailyNumber: o.daily_number,
    createdAt,
    customer: "Guest",
    table: o.table_number,
    method: o.payment_method,
    amount: Number(o.total),
    status: STATUS_LABEL[o.payment_status] || "Pending",
    discount: o.discount_type,
    receiptImage: o.receipt_image,
    discountIdImage: o.discount_id_image,
    date: createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    time: createdAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
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
  const [loading, setLoading] = useState(true);
  const [modalTx, setModalTx] = useState(null);
  const [toast, setToast] = useState("");
  const [view, setView] = useState("pending");

  const loadTransactions = useCallback(() => {
    setLoading(true);
    ordersApi.getAll({ today_only: 'true' })
      .then((data) => setTransactions(assignDailyNumbers(data.map(normalizeTransaction))))
      .catch((err) => console.error("Failed to load transactions:", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 2500);
  };

  const pendingCount = transactions.filter((t) => t.status === "Pending").length;
  const completedCount = transactions.filter((t) => t.status === "Completed").length;

  const historyTransactions = [...transactions]
    .filter((t) => t.status === "Completed" || t.status === "Failed")
    .sort((a, b) => (a.date + a.time < b.date + b.time ? 1 : -1));

  const handleConfirm = async (id) => {
    const tx = transactions.find((t) => t.id === id);
    try {
      await ordersApi.updatePaymentStatus(id, "verified");
      setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, status: "Completed" } : t)));
      setModalTx(null);
      showToast(`Payment #${tx?.displayNo ?? id} confirmed successfully`);
    } catch (err) {
      console.error(err);
      alert("Failed to confirm payment. Please try again.");
    }
  };

  const handleFail = async (id) => {
    const tx = transactions.find((t) => t.id === id);
    try {
      await ordersApi.updatePaymentStatus(id, "failed");
      setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, status: "Failed" } : t)));
      setModalTx(null);
      showToast(`Payment #${tx?.displayNo ?? id} marked as failed`);
    } catch (err) {
      console.error(err);
      alert("Failed to update payment. Please try again.");
    }
  };

  const handleUpdateTable = async (id, value) => {
    try {
      await ordersApi.updateTable(id, value);
      setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, table: value } : t)));
      setModalTx((prev) => (prev && prev.id === id ? { ...prev, table: value } : prev));
    } catch (err) {
      console.error(err);
      alert("Failed to update table. Please try again.");
    }
  };

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
          <StatCard label="Today's Transactions" value={transactions.length} />
          <StatCard label="Completed Payments" value={completedCount} />
        </div>

        <div className="flex gap-1.5 bg-white p-1 rounded-lg w-fit mb-6 shadow-sm border border-gray-100">
          {(embedded
            ? [{ key: "pending", label: "Pending" }]
            : [
                { key: "pending", label: "Pending" },
                { key: "history", label: "History" },
              ]
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setView(t.key)}
              className={`px-4 py-2 rounded-md text-sm font-[Prata] transition ${
                view === t.key ? "bg-[#1d080f] text-white" : "text-[#1d080f] hover:bg-gray-50"
              }`}
            >
              {t.label}
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
              transactions.filter((t) => t.status === "Pending").length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center text-gray-400 font-[Prata] text-sm shadow-sm border border-gray-100">
                  No payment transactions yet.
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-xs text-gray-500 border-b border-gray-100">
                        {["Order #", "Customer", "Table", "Method", "Amount", "Status", "Date & Time", "Actions"].map((h) => (
                          <th key={h} className="px-6 py-4 font-[Prata] font-normal">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.filter((t) => t.status === "Pending").map((t) => (
                        <tr key={t.id} className="border-b border-gray-100 last:border-0 text-sm">
                          <td className="px-6 py-4" style={{ WebkitTextStroke: "0.3px #1d080f" }}>{t.displayNo}</td>
                          <td className="px-6 py-4">{t.customer}</td>
                          <td className="px-6 py-4">{t.table}</td>
                          <td className="px-6 py-4 capitalize">{t.method}</td>
                          <td className="px-6 py-4">Php. {t.amount.toLocaleString()}</td>
                          <td className="px-6 py-4"><StatusBadge status={t.status} /></td>
                          <td className="px-6 py-4 text-gray-500">
                            {t.date}<br />{t.time}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => setModalTx(t)}
                              className="px-4 py-1.5 rounded-md bg-[#1d080f] text-white text-xs hover:bg-[#3a1420] transition"
                            >
                              Verify
                            </button>
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
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-xs text-gray-500 border-b border-gray-100">
                        {["Order #", "Customer", "Table", "Method", "Amount", "Status", "Date & Time"].map((h) => (
                          <th key={h} className="px-6 py-4 font-[Prata] font-normal">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {historyTransactions.map((t) => (
                        <tr key={t.id} className="border-b border-gray-100 last:border-0 text-sm">
                          <td className="px-6 py-4" style={{ WebkitTextStroke: "0.3px #1d080f" }}>{t.displayNo}</td>
                          <td className="px-6 py-4">{t.customer}</td>
                          <td className="px-6 py-4">{t.table}</td>
                          <td className="px-6 py-4 capitalize">{t.method}</td>
                          <td className="px-6 py-4">Php. {t.amount.toLocaleString()}</td>
                          <td className="px-6 py-4"><StatusBadge status={t.status} /></td>
                          <td className="px-6 py-4 text-gray-500">
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
        onClose={() => setModalTx(null)}
        onConfirm={handleConfirm}
        onFail={handleFail}
        onUpdateTable={handleUpdateTable}
      />

      {toast && (
        <div
          className="font-[Prata]"
          style={{
            position: "fixed",
            bottom: 28,
            right: 28,
            background: "#1d080f",
            color: "#fff",
            padding: "14px 20px",
            borderRadius: 10,
            boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
            fontSize: 13.5,
            display: "flex",
            alignItems: "center",
            gap: 10,
            zIndex: 100,
          }}
        >
          <span style={{ background: "#296c39", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
            ✓
          </span>
          {toast}
        </div>
      )}
    </div>
  );
}