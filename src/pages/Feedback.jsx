import React, { useState, useEffect } from "react";
import heroImage from "../assets/bgHero.jpg";
import logo from "../assets/logoword.png";
import { addReview } from "../utils/reviewsStore";
import { ordersApi } from "../services/ordersApi";
import { useAuth } from "../context/AuthContext";

const C = {
  bg: "#EFEAE2",
  ink: "#2b1a1a",
  maroon: "#2b1a1a",
  line: "#d9d5cb",
  muted: "#7a756c",
  gold: "#c9a15a",
  red: "#c0392b",
  redHover: "#a5342a",
  maroonHover: "#40161C",
  green: "#3E9463",
  greenBg: "#E9F5EE",
  disabled: "#c9c2b5",
};

const FONT = "'Prata', serif";

function StarRow({ value, onChange, size = 26 }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((val) => (
        <span
          key={val}
          onClick={() => onChange(val === value ? 0 : val)}
          onMouseEnter={() => setHover(val)}
          onMouseLeave={() => setHover(0)}
          style={{
            fontSize: size,
            lineHeight: 1,
            cursor: "pointer",
            transition: "color .1s",
            color: val <= (hover || value) ? C.gold : "#d9d0c0",
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function Feedback() {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [dishes, setDishes] = useState([]);
  const [dishRatings, setDishRatings] = useState({});

  // Logged-in customers get their account name filled in (and locked), like the Reservation form
  const { user, isAuthenticated } = useAuth();
  const accountName = isAuthenticated ? (user?.full_name || "").trim() : "";

  useEffect(() => {
    if (accountName) setName(accountName);
  }, [accountName]);

  // The dishes this customer has ordered, so they can rate each one
  useEffect(() => {
    if (!isAuthenticated) {
      setDishes([]);
      return;
    }

    ordersApi.getMine()
      .then((orders) => {
        const names = [];
        (orders || [])
          .filter((o) => String(o.status || "").toLowerCase() !== "cancelled")
          .forEach((order) => {
            (order.items || []).forEach((it) => {
              const dishName = (it.item_name || it.name || "").toString().trim();
              if (dishName && !names.includes(dishName)) names.push(dishName);
            });
          });
        setDishes(names);
      })
      .catch((e) => console.error("Failed to load ordered dishes:", e));
  }, [isAuthenticated]);

  const isValid = rating > 0 && name.trim().length > 0;

  const setDishRating = (dish, value) => {
    setDishRatings((prev) => ({ ...prev, [dish]: value }));
  };

  const handleCancel = () => {
    setRating(0);
    // A logged-in customer keeps their account name; a guest's typed name is cleared
    setName(accountName);
    setMessage("");
    setDishRatings({});
    setError("");
  };

  const handleSubmit = async () => {
    if (!isValid || submitting) return;

    try {
      setSubmitting(true);
      setError("");

      await addReview({
        name: name.trim(),
        message: message.trim(),
        rating,
        dishRatings: dishes.map((dish) => ({
          dish,
          rating: dishRatings[dish] || 0,
        })),
      });

      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Failed to submit feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Shared look for the two buttons at the bottom
  const buttonBase = {
    padding: "11px 10px",
    border: "none",
    borderRadius: 8,
    fontSize: 13.5,
    fontWeight: 700,
    fontFamily: FONT,
    color: "#fff",
    // One line only, so both buttons stay short and the same height
    whiteSpace: "nowrap",
    lineHeight: 1.2,
  };

  // Shared look for the Name and comment fields
  const fieldBase = {
    width: "100%",
    padding: "13px 16px",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontFamily: FONT,
    color: C.ink,
  };

  return (
    <div style={{ fontFamily: FONT, color: C.ink, background: C.bg }}>
      <div className="relative h-44 sm:h-52 md:h-60 overflow-hidden shrink-0">
        <img
          src={heroImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-white/40" />
        <div className="relative flex h-full items-start justify-center px-4 pt-6 sm:pt-8 md:pt-14">
          <img
            src={logo}
            alt="Eurasia Restaurant"
            className="h-20 w-auto md:h-32"
          />
        </div>
      </div>

      {/* Tighter on phones so the dish list has room; desktop spacing unchanged */}
      <div className="px-3 sm:px-10 pb-16" style={{ position: "relative", marginTop: -60 }}>
        <div
          className="px-4 py-6 sm:px-10 sm:pt-8 sm:pb-10"
          style={{
            background: C.bg,
            borderRadius: "14px 14px 0 0",
            maxWidth: 1200,
            margin: "0 auto",
            boxShadow: "0 -4px 24px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
            <div
              style={{
                flex: 1,
                textAlign: "center",
                padding: "14px 16px",
                borderRadius: 8,
                fontFamily: FONT,
                fontSize: "clamp(16px, 4.2vw, 19px)",
                fontWeight: 700,
                background: C.maroon,
                color: "#fff",
              }}
            >
              Rate Your Visit
            </div>
          </div>

          <div style={{ maxWidth: 700, margin: "0 auto" }}>
            {!submitted ? (
              <>
                <p style={{ fontFamily: FONT, fontSize: "clamp(15px, 4.2vw, 19px)", margin: "0 0 12px", textAlign: "center" }}>
                  How was your overall experience?
                </p>

                <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 26 }}>
                  {[1, 2, 3, 4, 5].map((val) => (
                    <span
                      key={val}
                      onClick={() => setRating(val)}
                      onMouseEnter={() => setHoverRating(val)}
                      onMouseLeave={() => setHoverRating(0)}
                      style={{
                        fontSize: "clamp(32px, 9vw, 42px)",
                        lineHeight: 1,
                        cursor: "pointer",
                        transition: "color .1s",
                        color: val <= (hoverRating || rating) ? C.gold : "#d9d0c0",
                      }}
                    >
                      ★
                    </span>
                  ))}
                </div>

                {dishes.length > 0 && (
                  <div
                    style={{
                      background: "#fff",
                      borderRadius: 10,
                      padding: "18px 16px",
                      marginBottom: 20,
                    }}
                  >
                    <p
                      style={{
                        fontFamily: FONT,
                        fontSize: 15,
                        margin: "0 0 12px",
                        textAlign: "center",
                      }}
                    >
                      Rate the dishes you ordered
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {dishes.map((dish) => (
                        <div
                          key={dish}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 12,
                            paddingBottom: 10,
                            borderBottom: `1px solid ${C.line}`,
                          }}
                        >
                          {/* Left-aligned and allowed to shrink, so the stars always have room */}
                          <span
                            style={{
                              flex: 1,
                              minWidth: 0,
                              fontSize: 13.5,
                              fontFamily: FONT,
                              color: C.ink,
                              textAlign: "left",
                              lineHeight: 1.3,
                            }}
                          >
                            {dish}
                          </span>
                          <div style={{ flexShrink: 0 }}>
                            <StarRow
                              size={20}
                              value={dishRatings[dish] || 0}
                              onChange={(v) => setDishRating(dish, v)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ marginBottom: 14 }}>
                  <input
                    type="text"
                    placeholder="Name *"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    readOnly={Boolean(accountName)}
                    title={accountName ? "Taken from your account" : undefined}
                    style={{
                      ...fieldBase,
                      // Gray and locked when it comes from the account
                      background: accountName ? "#f0eeea" : "#fff",
                      cursor: accountName ? "not-allowed" : "text",
                    }}
                  />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <textarea
                    placeholder="Tell us what you enjoyed, or what we can improve"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    style={{
                      ...fieldBase,
                      minHeight: 110,
                      resize: "vertical",
                      background: "#fff",
                    }}
                  />
                </div>

                {error && (
                  <p style={{ color: C.red, fontSize: 13, textAlign: "center", marginBottom: 12, fontFamily: FONT }}>
                    {error}
                  </p>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 20 }}>
                  <button
                    onClick={handleCancel}
                    disabled={submitting}
                    style={{
                      ...buttonBase,
                      cursor: submitting ? "not-allowed" : "pointer",
                      background: C.red,
                      opacity: submitting ? 0.6 : 1,
                    }}
                    onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.background = C.redHover; }}
                    onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.background = C.red; }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!isValid || submitting}
                    style={{
                      ...buttonBase,
                      cursor: isValid && !submitting ? "pointer" : "default",
                      background: isValid && !submitting ? C.maroon : C.disabled,
                    }}
                    onMouseEnter={(e) => { if (isValid && !submitting) e.currentTarget.style.background = C.maroonHover; }}
                    onMouseLeave={(e) => { if (isValid && !submitting) e.currentTarget.style.background = C.maroon; }}
                  >
                    {submitting ? "Submitting..." : "Submit Feedback"}
                  </button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    background: C.greenBg,
                    color: C.green,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 30,
                    margin: "0 auto 18px",
                  }}
                >
                  ✓
                </div>
                <h2 style={{ fontFamily: FONT, fontSize: 24, margin: "0 0 8px" }}>Thank you!</h2>
                <p style={{ fontSize: 14, color: C.muted, margin: 0, fontFamily: FONT }}>
                  Your feedback means a lot to us at Eurasia.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}