import React, { useState } from "react";
import { X, Check, Ban } from "lucide-react";
import StaffHeader from "../components/StaffHeader";

const INITIAL_TRANSACTIONS = [
  { id: "01", customer: "John Doe", method: "GCash", amount: 1756, date: "June 8, 2026", time: "2:06pm", status: "Completed" },
  { id: "02", customer: "Jane Smith", method: "GCash", amount: 1756, date: "June 8, 2026", time: "2:29pm", status: "Pending" },
  { id: "03", customer: "Juan Dela Cruz", method: "Bank Transfer", amount: 1756, date: "June 8, 2026", time: "2:40pm", status: "Pending" },
];

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

function ValidateModal({ transaction, onClose, onConfirm, onFail }) {
  if (!transaction) return null;

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
          <div className="flex justify-between">
            <span className="text-gray-500">Order #</span>
            <span className="text-[#1d080f]">{transaction.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Payment Method</span>
            <span className="text-[#1d080f]">{transaction.method}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Amount</span>
            <span className="text-[#1d080f]">Php. {transaction.amount.toLocaleString()}</span>
          </div>
        </div>

        <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center text-xs text-gray-500 mb-6">
          Proof of payment (uploaded by customer)
        </div>

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

export default function PaymentTransactions() {
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [modalTx, setModalTx] = useState(null);

  const pendingCount = transactions.filter((t) => t.status === "Pending").length;
  const completedCount = transactions.filter((t) => t.status === "Completed").length;

  const handleConfirm = (id) => {
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, status: "Completed" } : t)));
    setModalTx(null);
  };

  const handleFail = (id) => {
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, status: "Failed" } : t)));
    setModalTx(null);
  };

  return (
    <div className="min-h-screen bg-[#f0eff3] font-[Prata] text-[#1d080f] text-left">
      <StaffHeader role="Cashier" />

      <main className="max-w-[1400px] mx-auto px-8" style={{ paddingTop: "16px", paddingBottom: "32px" }}>
        <h1
          className="text-2xl text-[#1d080f] text-left"
          style={{ marginTop: 0, marginBottom: "20px", WebkitTextStroke: "0.8px #1d080f" }}
        >
          Payment Transactions
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <StatCard label="Pending Payments" value={pendingCount} />
          <StatCard label="Today's Transactions" value={transactions.length} />
          <StatCard label="Completed Payments" value={completedCount} />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-100">
                {["Order #", "Customer", "Method", "Amount", "Status", "Date & Time", "Actions"].map((h) => (
                  <th key={h} className="px-6 py-4 font-[Prata] font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} className="border-b border-gray-100 last:border-0 text-sm">
                  <td className="px-6 py-4" style={{ WebkitTextStroke: "0.3px #1d080f" }}>{t.id}</td>
                  <td className="px-6 py-4">{t.customer}</td>
                  <td className="px-6 py-4">{t.method}</td>
                  <td className="px-6 py-4">Php. {t.amount.toLocaleString()}</td>
                  <td className="px-6 py-4"><StatusBadge status={t.status} /></td>
                  <td className="px-6 py-4 text-gray-500">
                    {t.date}<br />{t.time}
                  </td>
                  <td className="px-6 py-4">
                    {t.status === "Pending" ? (
                      <button
                        onClick={() => setModalTx(t)}
                        className="px-4 py-1.5 rounded-md bg-[#1d080f] text-white text-xs hover:bg-[#3a1420] transition"
                      >
                        Validate
                      </button>
                    ) : t.status === "Completed" ? (
                      <button className="px-4 py-1.5 rounded-md bg-[#e0e0e0] text-[#555] text-xs hover:bg-gray-300 transition">
                        Refund
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      <ValidateModal
        transaction={modalTx}
        onClose={() => setModalTx(null)}
        onConfirm={handleConfirm}
        onFail={handleFail}
      />
    </div>
  );
}