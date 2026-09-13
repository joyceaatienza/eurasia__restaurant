import { useState } from "react";
import { paymentsApi } from "../services/paymentsApi";

const PAYMENT_METHODS = ["Cash", "GCash", "Card", "Bank Transfer"];
const DISCOUNT_TYPES = ["None", "Senior Citizen", "PWD", "Student"];

export default function PaymentVerificationForm({ order, onSuccess, onCancel }) {
  const [form, setForm] = useState({
    order_id: order?.id || "",
    payment_method: "Cash",
    discount_type: "None",
    discount_amount: 0,
  });
  const [discountImage, setDiscountImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const requiresId = form.discount_type !== "None";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setDiscountImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (requiresId && !discountImage) {
      setError("Please upload a valid ID image for the selected discount type.");
      return;
    }

    setLoading(true);
    try {
      await paymentsApi.create({
        ...form,
        discount_id_image: discountImage || undefined,
        payment_status: "Pending",
      });
      onSuccess?.();
    } catch (err) {
      setError(err.message || "Failed to record payment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-xl shadow-md max-w-md">
      <h2 className="text-lg font-semibold text-gray-800">Verify Payment — Order #{form.order_id}</h2>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-md">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
        <select
          name="payment_method"
          value={form.payment_method}
          onChange={handleChange}
          className="w-full border rounded-md px-3 py-2"
        >
          {PAYMENT_METHODS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
        <select
          name="discount_type"
          value={form.discount_type}
          onChange={handleChange}
          className="w-full border rounded-md px-3 py-2"
        >
          {DISCOUNT_TYPES.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {requiresId && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Discount Amount (₱)</label>
            <input
              type="number"
              name="discount_amount"
              value={form.discount_amount}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="w-full border rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload ID ({form.discount_type})
            </label>
            <input type="file" accept="image/*" onChange={handleImageChange} />
            {preview && (
              <img src={preview} alt="ID preview" className="mt-2 h-32 rounded-md border object-cover" />
            )}
          </div>
        </>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 text-white py-2 rounded-md disabled:opacity-50"
        >
          {loading ? "Saving..." : "Confirm Payment"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-md"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}