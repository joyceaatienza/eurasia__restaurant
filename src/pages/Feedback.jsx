import React, { useState } from "react";
import heroImage from "../assets/bgHero.jpg";
import logo from "../assets/logoword.png";

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

export default function Feedback() {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const isValid = rating > 0 && name.trim().length > 0 && message.trim().length > 0;

  const handleCancel = () => {
    setRating(0);
    setName("");
    setMessage("");
  };

  const handleSubmit = () => {
    if (!isValid) return;

    // TODO: replace with a real API call, e.g.
    // await fetch("/api/feedback", { method: "POST", body: JSON.stringify({ name, message, rating }) })

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

      {/* ---------------------------------------------------------- */}
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
                    placeholder="Tell us what you enjoyed, or what we can improve *"
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