import React, { useState, useEffect } from "react";
import heroImage from "../assets/bgHero.jpg";
import logo from "../assets/logoword.png";
import { addReview } from "../utils/reviewsStore";
import { ordersApi } from "../services/ordersApi";

const MY_ORDER_HISTORY_KEY = "eurasia_my_order_history";

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

// Small reusable star row (used for per-dish ratings)
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

  const [dishes, setDishes] = useState([]);
  const [dishRatings, setDishRatings] = useState({});

  // Load the dishes the customer actually ordered, so they can rate each one
  useEffect(() => {
    const loadDishes = async () => {
      try {
        const ids = JSON.parse(localStorage.getItem(MY_ORDER_HISTORY_KEY) || "[]");
        if (ids.length === 0) return;

        const results = await Promise.all(
          ids.map((id) => ordersApi.getById(id).catch(() => null))
        );

        const names = [];
        results.filter(Boolean).forEach((order) => {
          (order.items || []).forEach((it) => {
            const dishName = (it.item_name || it.name || "").toString().trim();
            if (dishName && !names.includes(dishName)) names.push(dishName);
          });
        });

        setDishes(names);
      } catch (e) {
        console.error("Failed to load ordered dishes:", e);
      }
    };

    loadDishes();
  }, []);

  const isValid = rating > 0 && name.trim().length > 0;

  const setDishRating = (dish, value) => {
    setDishRatings((prev) => ({ ...prev, [dish]: value }));
  };

  const handleCancel = () => {
    setRating(0);
    setName("");
    setMessage("");
    setDishRatings({});
  };

  const handleSubmit = () => {
    if (!isValid) return;

    addReview({
      name: name.trim(),
      message: message.trim(),
      rating,
      dishRatings: dishes.map((dish) => ({
        dish,
        rating: dishRatings[dish] || 0,
      })),
    });

    setSubmitted(true);
  };

  return (
    <div style={{ fontFamily: FONT, color: C.ink, background: C.bg }}>
      {/* Hero Header — matches Menu.jsx */}
      <div className="relative h-64 overflow-hidden shrink-0 md:h-60">
        <img
          src={heroImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-white/40" />
        <div className="relative flex h-full items-start justify-center px-4 pt-16 md:pt-16">
          <img
            src={logo}
            alt="Eurasia Restaurant"
            className="h-20 w-auto md:h-32"
          />
        </div>
      </div>

      <div style={{ position: "relative", marginTop: -60, padding: "0 40px 60px" }}>
        <div
          style={{
            background: C.bg,
            borderRadius: "14px 14px 0 0",
            padding: "32px 40px 40px",
            maxWidth: 1200,
            margin: "0 auto",
            boxShadow: "0 -4px 24px rgba(0,0,0,0.06)",
          }}
        >
          {/* Tabs */}
          <div style={{ display: "flex", gap: 10, marginBottom: 30 }}>
            <div
              style={{
                flex: 1,
                textAlign: "center",
                padding: 20,
                borderRadius: 8,
                fontFamily: FONT,
                fontSize: 19,
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
                <p style={{ fontFamily: FONT, fontSize: 19, margin: "0 0 14px", textAlign: "center" }}>
                  How was your overall experience?
                </p>

                <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 30 }}>
                  {[1, 2, 3, 4, 5].map((val) => (
                    <span
                      key={val}
                      onClick={() => setRating(val)}
                      onMouseEnter={() => setHoverRating(val)}
                      onMouseLeave={() => setHoverRating(0)}
                      style={{
                        fontSize: 42,
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

                {/* Per-dish ratings — only shown if the customer has ordered dishes */}
                {dishes.length > 0 && (
                  <div
                    style={{
                      background: "#fff",
                      borderRadius: 10,
                      padding: "20px 22px",
                      marginBottom: 24,
                    }}
                  >
                    <p
                      style={{
                        fontFamily: FONT,
                        fontSize: 16,
                        margin: "0 0 4px",
                        textAlign: "center",
                      }}
                    >
                      Rate the dishes you ordered
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {dishes.map((dish) => (
                        <div
                          key={dish}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 12,
                            paddingBottom: 12,
                            borderBottom: `1px solid ${C.line}`,
                          }}
                        >
                          <span style={{ fontSize: 14.5, fontFamily: FONT, color: C.ink }}>
                            {dish}
                          </span>
                          <StarRow
                            value={dishRatings[dish] || 0}
                            onChange={(v) => setDishRating(dish, v)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ marginBottom: 16 }}>
                  <input
                    type="text"
                    placeholder="Name *"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "16px 18px",
                      border: "none",
                      borderRadius: 8,
                      fontSize: 15,
                      fontFamily: FONT,
                      background: "#fff",
                      color: C.ink,
                    }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <textarea
                    placeholder="Tell us what you enjoyed, or what we can improve"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    style={{
                      width: "100%",
                      minHeight: 130,
                      resize: "vertical",
                      padding: "16px 18px",
                      border: "none",
                      borderRadius: 8,
                      fontSize: 15,
                      fontFamily: FONT,
                      background: "#fff",
                      color: C.ink,
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 24 }}>
                  <button
                    onClick={handleCancel}
                    style={{
                      padding: 18,
                      border: "none",
                      borderRadius: 8,
                      fontSize: 16,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: FONT,
                      background: C.red,
                      color: "#fff",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = C.redHover)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = C.red)}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!isValid}
                    style={{
                      padding: 18,
                      border: "none",
                      borderRadius: 8,
                      fontSize: 16,
                      fontWeight: 700,
                      fontFamily: FONT,
                      cursor: isValid ? "pointer" : "default",
                      background: isValid ? C.maroon : C.disabled,
                      color: "#fff",
                    }}
                    onMouseEnter={(e) => {
                      if (isValid) e.currentTarget.style.background = C.maroonHover;
                    }}
                    onMouseLeave={(e) => {
                      if (isValid) e.currentTarget.style.background = C.maroon;
                    }}
                  >
                    Submit Feedback
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
                <h2 style={{ fontFamily: FONT, fontSize: 26, margin: "0 0 8px" }}>Thank you!</h2>
                <p style={{ fontSize: 14.5, color: C.muted, margin: 0, fontFamily: FONT }}>
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