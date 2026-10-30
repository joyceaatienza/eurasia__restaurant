import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight, ChevronDown, X, Lock, ArrowUpDown, Search } from "lucide-react";
import { reservationsApi } from "../services/reservationsApi";
import { guestsApi } from "../services/guestsApi";
import StaffHeader from "../components/StaffHeader";

/* ---------------------------------------------------------------- */
const C = {
  void: "#170310",
  canvas: "#f0eff3",
  card: "#ffffff",
  ink: "#201417",
  inkSoft: "#6b5b60",
  hair: "#e7e3e6",
  flame: "#be0c1e",
  gold: "#c9a15a",
  green: "#296c39",
  orange: "#cd8a5d",
  red: "#c53a3a",
  gray: "#c9c2c4",
  grayText: "#6b5b60",
  eventYellow: "#f1d271",
  eventYellowBg: "#fdf6df",
  eventBlue: "#9db6e8",
  eventBlueBg: "#e9eefb",
  highlight: "#fff8e1",
};

const FONT_IMPORT =
  "@import url('https://fonts.googleapis.com/css2?family=Prata&display=swap');";
const FONT = "'Prata', serif";

const HIGHLIGHT_MS = 3000;
const POLL_MS = 8000;
const MOBILE_QUERY = "(max-width: 767px)";

const DAY_LABELS = ["SUN", "MON", "TUES", "WED", "THU", "FRI", "SAT"];
const DAY_LABELS_SHORT = ["S", "M", "T", "W", "T", "F", "S"];
const HOURS = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]; // 11am–10pm

// The front desk only confirms bookings now — guests cancel on their own side,
// and past reservations move to History by date instead of being marked Completed
const STATUS_OPTIONS = ["Pending", "Confirmed"];

// Reservations in these states need nothing more from the front desk
const DONE_STATUSES = ["Confirmed", "Completed", "Cancelled"];

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

/* ---------------------------------------------------------------- */
/* Date helpers                                                      */
/* ---------------------------------------------------------------- */
// Uses local date parts so the day doesn't shift backwards in UTC+8
function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// The API sends dates as UTC timestamps, so parse them back into local
// date parts — slicing the raw string would land on the previous day here
function toISOString(value) {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return String(value).slice(0, 10);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function displayDateFromISO(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function formatDisplayDate(date) {
  return date.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}
function formatDisplayDateShort(date) {
  return date.toLocaleDateString("en-US", { day: "numeric", month: "short" });
}
function formatMonthLabel(date) {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" }).toUpperCase();
}
function startOfWeek(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}
function shiftDate(date, range, direction) {
  const d = new Date(date);
  const sign = direction === "next" ? 1 : -1;
  if (range === "Day") d.setDate(d.getDate() + sign);
  else if (range === "Week") d.setDate(d.getDate() + sign * 7);
  else if (range === "Month") d.setMonth(d.getMonth() + sign);
  return d;
}
function hourLabel(h) {
  if (h === 12) return "12 PM";
  if (h > 12) return `${h - 12} PM`;
  return `${h} AM`;
}
function to12h(time24) {
  if (!time24) return "";
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "pm" : "am";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}
function hourBucket(time24) {
  return Number(time24.split(":")[0]);
}
function peso(amount) {
  const n = Number(amount || 0);
  return `Php. ${n.toLocaleString()}`;
}
function buildMonthMatrix(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const gridStart = startOfWeek(firstOfMonth);
  const weeks = [];
  let cursor = new Date(gridStart);
  for (let w = 0; w < 6; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      week.push({ date: new Date(cursor), inMonth: cursor.getMonth() === month });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
    if (cursor.getMonth() !== month && w >= 4) break;
  }
  return weeks;
}

/* ---------------------------------------------------------------- */
/* Small building blocks                                             */
/* ---------------------------------------------------------------- */
function Badge({ children, tone = "green" }) {
  const map = {
    green: { bg: "#e5f0e6", fg: C.green },
    orange: { bg: "#fbeee2", fg: C.orange },
    red: { bg: "#fbe7e7", fg: C.red },
    amber: { bg: "#fdf3df", fg: "#9c7a1f" },
    gray: { bg: "#eeecec", fg: C.grayText },
  };
  const t = map[tone] || map.green;
  return (
    <span style={{ background: t.bg, color: t.fg, fontSize: 12, fontWeight: 700, padding: "5px 12px", borderRadius: 8, whiteSpace: "nowrap", fontFamily: FONT }}>
      {children}
    </span>
  );
}

function statusColors(status) {
  if (status === "Confirmed") return { bg: "#e5f0e6", fg: C.green, border: C.green };
  if (status === "Cancelled") return { bg: "#fbe7e7", fg: C.red, border: C.red };
  if (status === "Completed") return { bg: "#eeecec", fg: C.grayText, border: C.gray };
  if (status === "Arrived") return { bg: "#fbeee2", fg: C.orange, border: C.orange };
  return { bg: "#fdf3df", fg: "#9c7a1f", border: "#d9bf72" }; // Pending
}

// Read-only status label, used in History
function StatusPill({ status }) {
  const c = statusColors(status);
  return (
    <span style={{ background: c.bg, color: c.fg, fontSize: 12, fontWeight: 700, padding: "5px 12px", borderRadius: 8, whiteSpace: "nowrap", fontFamily: FONT }}>
      {status}
    </span>
  );
}

function Card({ children, style }) {
  return (
    <div style={{ background: C.card, borderRadius: 16, padding: 22, boxShadow: "0 1px 3px rgba(23,3,16,0.06)", minWidth: 0, ...style }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h3 style={{ fontFamily: FONT, fontWeight: 700, fontSize: 18, margin: "0 0 16px 0", color: C.ink }}>
      {children}
    </h3>
  );
}

/* ---------------------------------------------------------------- */
/* Status dropdown — locked until the cashier verifies the downpayment */
/* ---------------------------------------------------------------- */
function StatusSelect({ status, onChange, locked, fullWidth }) {
  const c = statusColors(status);

  if (locked) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 4, width: fullWidth ? "100%" : "auto" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: fullWidth ? "center" : "flex-start",
            gap: 6,
            background: "#f4f2f3",
            color: C.inkSoft,
            border: `1px solid ${C.hair}`,
            borderRadius: 8,
            padding: "9px 14px",
            fontSize: 12.5,
            fontWeight: 700,
            fontFamily: FONT,
            minWidth: fullWidth ? 0 : 130,
            width: fullWidth ? "100%" : "auto",
            cursor: "not-allowed",
          }}
        >
          <Lock size={12} /> {status}
        </div>
        <span style={{ fontSize: 10.5, color: C.inkSoft, fontFamily: FONT, maxWidth: fullWidth ? "none" : 150, lineHeight: 1.4 }}>
          Waiting for the cashier to verify the downpayment
        </span>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", display: fullWidth ? "block" : "inline-block", width: fullWidth ? "100%" : "auto" }}>
      <select
        value={status}
        onChange={(e) => onChange(e.target.value)}
        style={{
          appearance: "none",
          WebkitAppearance: "none",
          background: c.bg,
          color: c.fg,
          border: `1px solid ${c.border}`,
          borderRadius: 8,
          padding: "9px 32px 9px 14px",
          fontSize: 12.5,
          fontWeight: 700,
          fontFamily: FONT,
          cursor: "pointer",
          outline: "none",
          minWidth: fullWidth ? 0 : 130,
          width: fullWidth ? "100%" : "auto",
        }}
      >
        {/* An older status (Arrived, Completed, Cancelled) still shows, but can't be picked again */}
        {(STATUS_OPTIONS.includes(status) ? STATUS_OPTIONS : [status, ...STATUS_OPTIONS]).map((s) => (
          <option
            key={s}
            value={s}
            disabled={!STATUS_OPTIONS.includes(s)}
            style={{ background: "#fff", color: C.ink }}
          >
            {s}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        style={{
          position: "absolute",
          right: 11,
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
          color: c.fg,
        }}
      />
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Downpayment cell                                                   */
/* ---------------------------------------------------------------- */
const PAYMENT_TONES = {
  verified: { bg: "#e5f0e6", fg: C.green, label: "Verified" },
  failed: { bg: "#fbe7e7", fg: C.red, label: "Failed" },
  pending: { bg: "#fdf3df", fg: "#9c7a1f", label: "Awaiting cashier" },
};

function DownpaymentCell({ reservation, onViewProof }) {
  const amount = Number(reservation.downpayment || 0);

  if (!amount) {
    return <span style={{ color: C.inkSoft, fontSize: 12.5 }}>—</span>;
  }

  const tone = PAYMENT_TONES[reservation.paymentStatus] || PAYMENT_TONES.pending;

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 13, lineHeight: "18px" }}>{peso(amount)}</div>
      <div style={{ color: C.inkSoft, fontSize: 11, lineHeight: "16px" }}>{reservation.paymentMethod || "—"}</div>
      <span
        style={{
          display: "inline-block",
          background: tone.bg,
          color: tone.fg,
          fontSize: 10,
          fontWeight: 700,
          padding: "2px 8px",
          borderRadius: 6,
          marginTop: 3,
        }}
      >
        {tone.label}
      </span>
      {reservation.hasPaymentProof && (
        <div
          onClick={() => onViewProof(reservation)}
          style={{
            color: C.gold,
            fontSize: 11,
            fontWeight: 700,
            lineHeight: "16px",
            cursor: "pointer",
            marginTop: 2,
          }}
        >
          View proof
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Proof of payment modal — view only; the cashier does the verifying */
/* ---------------------------------------------------------------- */
function ProofModal({ reservation, onClose }) {
  const [proof, setProof] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!reservation) {
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

  const tone = PAYMENT_TONES[reservation.paymentStatus] || PAYMENT_TONES.pending;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 16,
          maxWidth: 480,
          width: "100%",
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          fontFamily: FONT,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, padding: "18px 22px", borderBottom: `1px solid ${C.hair}` }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>Proof of Payment</div>
            <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 2 }}>
              {reservation.name} · {peso(reservation.downpayment)} · {reservation.paymentMethod || "—"}
            </div>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer", color: C.inkSoft, flexShrink: 0, display: "flex" }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ overflowY: "auto", padding: 22, background: C.canvas, minHeight: 160 }}>
          {loading ? (
            <div style={{ textAlign: "center", color: C.inkSoft, fontSize: 13, padding: "40px 0" }}>
              Loading proof...
            </div>
          ) : proof ? (
            <img
              src={proof}
              alt="Proof of payment"
              style={{ width: "100%", borderRadius: 10, background: "#fff" }}
            />
          ) : (
            <div style={{ textAlign: "center", color: C.inkSoft, fontSize: 13, padding: "40px 0" }}>
              No proof of payment uploaded.
            </div>
          )}
        </div>

        <div style={{ padding: "16px 22px", borderTop: `1px solid ${C.hair}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <span style={{ fontSize: 12, color: C.inkSoft }}>Payment status</span>
          <span
            style={{
              background: tone.bg,
              color: tone.fg,
              fontSize: 11.5,
              fontWeight: 700,
              padding: "5px 12px",
              borderRadius: 8,
              whiteSpace: "nowrap",
            }}
          >
            {tone.label}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Toast — replaces alert                                            */
/* ---------------------------------------------------------------- */
function Toast({ message, tone = "error", onClose, isMobile }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        left: isMobile ? 20 : "auto",
        background: tone === "error" ? "#c0392b" : C.green,
        color: "#fff",
        padding: "14px 20px",
        borderRadius: 10,
        boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
        fontSize: 13,
        fontFamily: FONT,
        display: "flex",
        alignItems: "center",
        gap: 10,
        zIndex: 300,
        maxWidth: isMobile ? "none" : 340,
      }}
    >
      <span
        style={{
          background: "rgba(255,255,255,0.2)",
          borderRadius: "50%",
          width: 22,
          height: 22,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
        }}
      >
        {tone === "error" ? "!" : "✓"}
      </span>
      {message}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Confirmation modal — replaces window.confirm                      */
/* ---------------------------------------------------------------- */
function ConfirmModal({ open, title, message, confirmLabel, onConfirm, onCancel }) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(23,3,16,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 250,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: 28,
          width: "100%",
          maxWidth: 380,
          fontFamily: FONT,
          textAlign: "center",
          boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ fontSize: 18, color: C.ink, marginBottom: 8 }}>{title}</div>
        <p style={{ fontSize: 13, color: C.inkSoft, lineHeight: 1.6, margin: "0 0 24px 0" }}>
          {message}
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "11px 18px",
              borderRadius: 10,
              border: `1px solid ${C.hair}`,
              background: "#fff",
              color: C.ink,
              fontSize: 13,
              fontFamily: FONT,
              cursor: "pointer",
            }}
          >
            Keep It
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: "11px 18px",
              borderRadius: 10,
              border: "none",
              background: "#c0392b",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              fontFamily: FONT,
              cursor: "pointer",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Legend                                                             */
/* ---------------------------------------------------------------- */
function Legend() {
  return (
    <div style={{ display: "flex", gap: 20, marginBottom: 16, fontSize: 12.5, color: C.ink, fontFamily: FONT, flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 12, height: 12, borderRadius: 3, background: C.eventYellow, display: "inline-block" }} />
        Table Reservation
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 12, height: 12, borderRadius: 3, background: C.eventBlue, display: "inline-block" }} />
        Event Reservation
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Week view                                                          */
/* ---------------------------------------------------------------- */
function WeekView({ selectedDate, reservations, onOpenDay, isMobile }) {
  const weekStart = startOfWeek(selectedDate);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const cellFor = (dayISO, hour) =>
    reservations.filter((r) => r.date === dayISO && hourBucket(r.time) === hour);

  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: isMobile ? "16px 16px 0" : "20px 20px 0" }}>
        <Legend />
      </div>
      {isMobile && (
        <div style={{ padding: "0 16px 10px", fontSize: 11, color: C.inkSoft, fontFamily: FONT, fontStyle: "italic" }}>
          Swipe sideways to see the whole week
        </div>
      )}
      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <div style={{ display: "grid", gridTemplateColumns: "72px repeat(7, minmax(110px, 1fr))", minWidth: 840 }}>
          <div style={{ borderBottom: `1px solid ${C.hair}` }} />
          {days.map((d, i) => (
            <div key={i} style={{ textAlign: "center", padding: "10px 6px", fontFamily: FONT, fontWeight: 700, fontSize: 12.5, color: C.ink, borderBottom: `1px solid ${C.hair}`, borderLeft: `1px solid ${C.hair}` }}>
              {DAY_LABELS[i]} | {d.getDate()}
            </div>
          ))}

          {HOURS.map((hour) => (
            <React.Fragment key={hour}>
              <div style={{ padding: "14px 8px", fontSize: 11.5, color: C.inkSoft, borderBottom: `1px solid ${C.hair}`, fontFamily: FONT, whiteSpace: "nowrap" }}>
                {hourLabel(hour)}
              </div>
              {days.map((d, i) => {
                const dayISO = toISO(d);
                const items = cellFor(dayISO, hour);
                return (
                  <div key={i} style={{ minHeight: 60, padding: 4, borderBottom: `1px solid ${C.hair}`, borderLeft: `1px solid ${C.hair}`, display: "flex", flexDirection: "column", gap: 3 }}>
                    {items.map((r) => (
                      <div
                        key={r.id}
                        onClick={() => onOpenDay(d)}
                        style={{
                          background: r.type === "event" ? C.eventBlueBg : C.eventYellowBg,
                          borderLeft: `3px solid ${r.type === "event" ? C.eventBlue : C.eventYellow}`,
                          borderRadius: 4,
                          padding: "3px 6px",
                          fontSize: 10.5,
                          lineHeight: 1.3,
                          fontFamily: FONT,
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(0.95)")}
                        onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
                      >
                        <div style={{ fontWeight: 700 }}>
                          {to12h(r.time)} · {r.type === "event" ? r.eventTitle : r.name}
                        </div>
                        <div style={{ color: C.inkSoft }}>
                          {r.type === "table" ? `${r.pax} pax` : r.location}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </Card>
  );
}

/* ---------------------------------------------------------------- */
/* Month view                                                         */
/* ---------------------------------------------------------------- */
function MonthView({ selectedDate, reservations, onOpenDay, isMobile }) {
  const weeks = buildMonthMatrix(selectedDate);

  const countsFor = (dayISO) => {
    const dayRes = reservations.filter((r) => r.date === dayISO);
    return {
      table: dayRes.filter((r) => r.type === "table").length,
      event: dayRes.filter((r) => r.type === "event").length,
    };
  };

  const labels = isMobile ? DAY_LABELS_SHORT : DAY_LABELS;

  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: isMobile ? "16px 16px 0" : "20px 20px 0" }}>
        <Legend />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
        {labels.map((d, i) => (
          <div key={i} style={{ textAlign: "center", padding: isMobile ? "8px 2px" : "10px 6px", fontFamily: FONT, fontWeight: 700, fontSize: isMobile ? 11 : 13, color: C.ink, borderBottom: `1px solid ${C.hair}` }}>
            {d}
          </div>
        ))}
        {weeks.flat().map((cell, i) => {
          const dayISO = toISO(cell.date);
          const counts = countsFor(dayISO);
          return (
            <div
              key={i}
              onClick={() => onOpenDay(cell.date)}
              style={{
                minHeight: isMobile ? 58 : 90,
                padding: isMobile ? "5px 4px" : "8px 10px",
                borderBottom: `1px solid ${C.hair}`,
                borderLeft: i % 7 !== 0 ? `1px solid ${C.hair}` : "none",
                background: cell.inMonth ? "#fff" : "#f7f6f8",
                opacity: cell.inMonth ? 1 : 0.5,
                cursor: "pointer",
              }}
            >
              <div style={{ fontSize: isMobile ? 11.5 : 13, fontWeight: 600, color: C.ink, marginBottom: isMobile ? 3 : 6, fontFamily: FONT }}>{cell.date.getDate()}</div>
              {counts.table > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: isMobile ? 10.5 : 11.5, color: C.ink, marginBottom: 3, fontFamily: FONT }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.eventYellow, display: "inline-block", flexShrink: 0 }} />
                  {counts.table}
                </div>
              )}
              {counts.event > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: isMobile ? 10.5 : 11.5, color: C.ink, fontFamily: FONT }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.eventBlue, display: "inline-block", flexShrink: 0 }} />
                  {counts.event}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ---------------------------------------------------------------- */
/* Phone card — a six-column table is unreadable at 375px            */
/* ---------------------------------------------------------------- */
function ReservationCard({ r, highlighted, cardRef, markStatus, onViewProof, showStatus = true, showDates = false }) {
  const locked = r.paymentStatus !== "verified" && r.status !== "Cancelled";

  return (
    <div
      ref={cardRef}
      style={{
        background: highlighted ? C.highlight : "#fff",
        border: highlighted ? `2px solid ${C.eventYellow}` : `1px solid ${C.hair}`,
        borderRadius: 14,
        padding: 16,
        fontFamily: FONT,
        opacity: r.status === "Cancelled" ? 0.6 : 1,
        transition: "background 0.4s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>
            {r.type === "event" ? r.eventTitle : r.name}
          </div>
          <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 2 }}>
            {showDates ? `${displayDateFromISO(r.date)} · ` : ""}
            {to12h(r.time)} · {r.pax} pax
          </div>
          {showDates && (
            <div style={{ fontSize: 11, color: C.inkSoft, marginTop: 2 }}>Booked {r.booked}</div>
          )}
        </div>
        <Badge tone={r.type === "event" ? "amber" : "green"}>
          {r.type === "event" ? "Event" : "Table"}
        </Badge>
      </div>

      <div style={{ paddingTop: 10, borderTop: `1px dashed ${C.hair}`, marginBottom: 12 }}>
        <DownpaymentCell reservation={r} onViewProof={onViewProof} />
      </div>

      {showStatus ? (
        <StatusSelect
          status={r.status}
          locked={locked}
          fullWidth
          onChange={(status) => markStatus(r.id, status)}
        />
      ) : (
        <StatusPill status={r.status} />
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* History view — confirmed, closed, and past reservations           */
/* ---------------------------------------------------------------- */
function HistoryView({ reservations, onViewProof, isMobile }) {
  // Sort by the day it was booked or the reservation day, newest or oldest first
  const [sortBy, setSortBy] = useState("created");
  const [newestFirst, setNewestFirst] = useState(true);

  // Everything the front desk is done with: confirmed, cancelled, completed,
  // or any reservation whose date has already passed
  const todayISO = toISO(new Date());
  const sortValue = (r) =>
    sortBy === "reservation"
      ? `${r.date} ${r.time}`
      : r.createdAt
      ? r.createdAt.toISOString()
      : "";

  const history = [...reservations]
    .filter((r) => DONE_STATUSES.includes(r.status) || (r.date && r.date < todayISO))
    .sort((a, b) => {
      const av = sortValue(a);
      const bv = sortValue(b);
      if (av === bv) return 0;
      const diff = av < bv ? 1 : -1;
      return newestFirst ? diff : -diff;
    });

  const cell = { padding: "14px 22px", borderBottom: `1px solid ${C.hair}`, textAlign: "left", verticalAlign: "top" };

  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: isMobile ? "16px 16px 0" : "20px 22px 0" }}>
        <SectionTitle>Reservation History</SectionTitle>
        <span style={{ background: C.void, color: "#f5e9d8", fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 999, marginTop: -14, fontFamily: FONT }}>
          {history.length}
        </span>
      </div>

      {/* Sorting: which date to go by, and which way */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", padding: isMobile ? "0 16px 14px" : "0 22px 16px", fontFamily: FONT }}>
        <span style={{ fontSize: 12, color: C.inkSoft }}>Sort by</span>
        <div style={{ display: "flex", gap: 4, background: C.canvas, padding: 4, borderRadius: 8 }}>
          {[
            { key: "created", label: "Date Booked" },
            { key: "reservation", label: "Reservation Date" },
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSortBy(opt.key)}
              style={{
                border: "none",
                borderRadius: 6,
                padding: "6px 12px",
                fontSize: 12,
                fontFamily: FONT,
                cursor: "pointer",
                whiteSpace: "nowrap",
                background: sortBy === opt.key ? C.void : "transparent",
                color: sortBy === opt.key ? "#f5e9d8" : C.ink,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setNewestFirst((prev) => !prev)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            border: `1px solid ${C.hair}`,
            borderRadius: 8,
            padding: "7px 12px",
            fontSize: 12,
            fontFamily: FONT,
            background: "#fff",
            color: C.ink,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {newestFirst ? "Newest first" : "Oldest first"}
          <ArrowUpDown size={13} />
        </button>
      </div>

      {history.length === 0 ? (
        <div style={{ color: C.inkSoft, fontSize: 13.5, textAlign: "center", padding: "30px 16px", fontFamily: FONT }}>
          No reservation history yet.
        </div>
      ) : isMobile ? (
        <div style={{ display: "grid", gap: 12, padding: "0 16px 16px" }}>
          {history.map((r) => (
            <ReservationCard
              key={r.id}
              r={r}
              highlighted={false}
              cardRef={null}
              markStatus={() => {}}
              onViewProof={onViewProof}
              showStatus={false}
              showDates
            />
          ))}
        </div>
      ) : (
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT, minWidth: 900 }}>
            <thead>
              <tr style={{ textAlign: "left", fontSize: 12, color: C.inkSoft }}>
                {["Reservation Date", "Time", "Name", "Pax", "Downpayment", "Type", "Status", "Reserved On"].map((h) => (
                  <th key={h} style={{ padding: "10px 22px", borderBottom: `1px solid ${C.hair}`, fontWeight: 700, textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map((r) => (
                <tr key={r.id} style={{ fontSize: 13.5, opacity: r.status === "Cancelled" ? 0.6 : 1 }}>
                  <td style={{ ...cell, whiteSpace: "nowrap" }}>{displayDateFromISO(r.date)}</td>
                  <td style={{ ...cell, fontWeight: 700, whiteSpace: "nowrap" }}>{to12h(r.time)}</td>
                  <td style={cell}>{r.type === "event" ? r.eventTitle : r.name}</td>
                  <td style={{ ...cell, color: C.inkSoft }}>{r.pax}</td>
                  <td style={cell}>
                    <DownpaymentCell reservation={r} onViewProof={onViewProof} />
                  </td>
                  <td style={cell}>
                    <Badge tone={r.type === "event" ? "amber" : "green"}>
                      {r.type === "event" ? "Event" : "Table"}
                    </Badge>
                  </td>
                  <td style={cell}>
                    <StatusPill status={r.status} />
                  </td>
                  <td style={{ ...cell, color: C.inkSoft, whiteSpace: "nowrap" }}>{r.booked}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

/* ---------------------------------------------------------------- */
/* Guests — reserved arrivals plus walk-ins                          */
/* ---------------------------------------------------------------- */
function GuestCard({ counts, onAddWalkIn, busy, isToday, isMobile }) {
  const [input, setInput] = useState("");

  const handleAdd = async () => {
    const value = Number(input);
    if (!value || value < 1) return;
    await onAddWalkIn(value);
    setInput("");
  };

  return (
    <Card
      style={{
        display: "flex",
        alignItems: isMobile ? "stretch" : "center",
        justifyContent: "space-between",
        gap: isMobile ? 14 : 20,
        flexDirection: isMobile ? "column" : "row",
        flexWrap: "wrap",
        padding: isMobile ? 16 : 22,
      }}
    >
      <div style={{ textAlign: "left" }}>
        <div style={{ fontSize: 12, color: C.inkSoft, fontFamily: FONT, marginBottom: 4 }}>
          {isToday ? "Guests Today" : "Guests"}
        </div>
        <div
          style={{ fontSize: isMobile ? 28 : 34, fontFamily: FONT, color: C.ink, lineHeight: 1.1, WebkitTextStroke: "0.5px " + C.ink }}
        >
          {counts.total}
        </div>
        <div style={{ fontSize: 11.5, color: C.inkSoft, fontFamily: FONT, marginTop: 4 }}>
          {counts.reserved} reserved · {counts.walk_in} walk-in
        </div>
      </div>

      {!isToday ? (
        <span style={{ fontSize: 11.5, color: C.inkSoft, fontFamily: FONT, fontStyle: "italic" }}>
          Walk-ins can only be logged for today
        </span>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: C.inkSoft, fontFamily: FONT }}>Walk-in guests</span>
          <input
            type="number"
            min="1"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="0"
            style={{
              width: 70,
              padding: "8px 12px",
              borderRadius: 8,
              border: `1px solid ${C.hair}`,
              fontSize: 13,
              fontFamily: FONT,
              color: C.ink,
              textAlign: "center",
              outline: "none",
            }}
          />
          <button
            onClick={handleAdd}
            disabled={busy || !input}
            style={{
              border: "none",
              borderRadius: 8,
              padding: "9px 20px",
              fontSize: 12.5,
              fontWeight: 700,
              fontFamily: FONT,
              background: C.void,
              color: "#f5e9d8",
              cursor: busy || !input ? "not-allowed" : "pointer",
              opacity: busy || !input ? 0.5 : 1,
              flex: isMobile ? 1 : "none",
            }}
          >
            {busy ? "Adding..." : "Add"}
          </button>
        </div>
      )}
    </Card>
  );
}

/* ---------------------------------------------------------------- */
/* Day view                                                           */
/* ---------------------------------------------------------------- */
function DayView({ selectedISO, reservations, markStatus, highlightId, highlightRef, onViewProof, isMobile }) {
  // Only reservations still waiting on the front desk stay in this list —
  // once confirmed (or already closed) they move to History
  const dayReservations = reservations.filter(
    (r) => r.date === selectedISO && !DONE_STATUSES.includes(r.status)
  );
  const sortedAll = [...dayReservations].sort((a, b) => (a.time > b.time ? 1 : -1));
  const confirmedCount = reservations.filter(
    (r) => r.date === selectedISO && r.status === "Confirmed"
  ).length;

  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: isMobile ? "16px 16px 0" : "20px 22px 0" }}>
        <SectionTitle>Reservations to Confirm</SectionTitle>
        <span style={{ background: C.void, color: "#f5e9d8", fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 999, marginTop: -14, fontFamily: FONT }}>
          {sortedAll.length}
        </span>
      </div>

      {sortedAll.length === 0 ? (
        <div style={{ color: C.inkSoft, fontSize: 13.5, textAlign: "center", padding: "30px 16px", fontFamily: FONT }}>
          Nothing left to confirm for this day.
          {confirmedCount > 0 && (
            <div style={{ fontSize: 12, marginTop: 6 }}>
              {confirmedCount} confirmed reservation{confirmedCount !== 1 ? "s" : ""} — see History, or the Week and Month views.
            </div>
          )}
        </div>
      ) : isMobile ? (
        <div style={{ display: "grid", gap: 12, padding: "0 16px 16px" }}>
          {sortedAll.map((r) => (
            <ReservationCard
              key={r.id}
              r={r}
              highlighted={r.id === highlightId}
              cardRef={r.id === highlightId ? highlightRef : null}
              markStatus={markStatus}
              onViewProof={onViewProof}
            />
          ))}
        </div>
      ) : (
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT, minWidth: 800, textAlign: "left" }}>
            <thead>
              <tr style={{ textAlign: "left", fontSize: 12, color: C.inkSoft }}>
                {["Time", "Name", "Type", "Pax", "Downpayment", "Status"].map((h) => (
                  <th key={h} style={{ padding: "10px 22px", borderBottom: `1px solid ${C.hair}`, fontWeight: 700, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedAll.map((r) => {
                const isHighlighted = r.id === highlightId;
                // Nothing moves until the cashier has cleared the downpayment
                const locked = r.paymentStatus !== "verified" && r.status !== "Cancelled";
                return (
                  <tr
                    key={r.id}
                    ref={isHighlighted ? highlightRef : null}
                    style={{
                      fontSize: 13.5,
                      background: isHighlighted ? C.highlight : "transparent",
                      transition: "background 0.4s ease",
                    }}
                  >
                    <td style={{ padding: "16px 22px", borderBottom: `1px solid ${C.hair}`, fontWeight: 700, verticalAlign: "top", whiteSpace: "nowrap" }}>
                      {to12h(r.time)}
                    </td>
                    <td style={{ padding: "16px 22px", borderBottom: `1px solid ${C.hair}`, verticalAlign: "top" }}>
                      {r.type === "event" ? r.eventTitle : r.name}
                    </td>
                    <td style={{ padding: "16px 22px", borderBottom: `1px solid ${C.hair}`, verticalAlign: "top" }}>
                      <Badge tone={r.type === "event" ? "amber" : "green"}>
                        {r.type === "event" ? "Event" : "Table"}
                      </Badge>
                    </td>
                    <td style={{ padding: "16px 22px", borderBottom: `1px solid ${C.hair}`, color: C.inkSoft, verticalAlign: "top" }}>{r.pax}</td>
                    <td style={{ padding: "16px 22px", borderBottom: `1px solid ${C.hair}`, verticalAlign: "top" }}>
                      <DownpaymentCell reservation={r} onViewProof={onViewProof} />
                    </td>
                    <td style={{ padding: "16px 22px", borderBottom: `1px solid ${C.hair}`, verticalAlign: "top" }}>
                      <StatusSelect
                        status={r.status}
                        locked={locked}
                        onChange={(status) => markStatus(r.id, status)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

/* ---------------------------------------------------------------- */
/* Search results — every date, so a guest can be found right away   */
/* ---------------------------------------------------------------- */
function matchesSearch(r, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const digits = q.replace(/\D/g, "");
  return (
    (r.name || "").toLowerCase().includes(q) ||
    (r.email || "").toLowerCase().includes(q) ||
    // Phone numbers match on digits alone, so "0917 123" finds "09171234567"
    (digits.length >= 3 && (r.contact || "").replace(/\D/g, "").includes(digits))
  );
}

function SearchView({ query, reservations, markStatus, onViewProof, onOpenDay, isMobile }) {
  const todayISO = toISO(new Date());

  // Upcoming first (soonest at the top), then past ones (most recent first)
  const results = reservations
    .filter((r) => matchesSearch(r, query))
    .sort((a, b) => {
      const aPast = a.date < todayISO;
      const bPast = b.date < todayISO;
      if (aPast !== bPast) return aPast ? 1 : -1;
      const av = `${a.date} ${a.time}`;
      const bv = `${b.date} ${b.time}`;
      return aPast ? (av < bv ? 1 : -1) : (av > bv ? 1 : -1);
    });

  // Only reservations still waiting on the front desk can be changed from here
  const canEdit = (r) => !DONE_STATUSES.includes(r.status) && r.date >= todayISO;
  const isLocked = (r) => r.paymentStatus !== "verified" && r.status !== "Cancelled";

  const cell = { padding: "14px 22px", borderBottom: `1px solid ${C.hair}`, textAlign: "left", verticalAlign: "top" };

  const goButton = (r) => (
    <button
      onClick={() => onOpenDay(r.date)}
      style={{
        border: `1px solid ${C.hair}`,
        background: "#fff",
        borderRadius: 8,
        padding: "6px 10px",
        fontSize: 11.5,
        fontFamily: FONT,
        color: C.ink,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      Go to day
    </button>
  );

  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: isMobile ? "16px 16px 0" : "20px 22px 0" }}>
        <SectionTitle>Search Results</SectionTitle>
        <span style={{ background: C.void, color: "#f5e9d8", fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 999, marginTop: -14, fontFamily: FONT }}>
          {results.length}
        </span>
      </div>

      {results.length === 0 ? (
        <div style={{ color: C.inkSoft, fontSize: 13.5, textAlign: "center", padding: "30px 16px", fontFamily: FONT }}>
          No reservations found for "{query.trim()}".
        </div>
      ) : isMobile ? (
        <div style={{ display: "grid", gap: 12, padding: "0 16px 16px" }}>
          {results.map((r) => (
            <div key={r.id}>
              <ReservationCard
                r={r}
                highlighted={false}
                cardRef={null}
                markStatus={markStatus}
                onViewProof={onViewProof}
                showStatus={canEdit(r)}
                showDates
              />
              <div style={{ marginTop: 6, textAlign: "right" }}>{goButton(r)}</div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT, minWidth: 1000 }}>
            <thead>
              <tr style={{ textAlign: "left", fontSize: 12, color: C.inkSoft }}>
                {["Reservation Date", "Time", "Name", "Contact", "Pax", "Downpayment", "Type", "Status", ""].map((h, i) => (
                  <th key={i} style={{ padding: "10px 22px", borderBottom: `1px solid ${C.hair}`, fontWeight: 700, textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.id} style={{ fontSize: 13.5, opacity: r.status === "Cancelled" ? 0.6 : 1 }}>
                  <td style={{ ...cell, whiteSpace: "nowrap" }}>{displayDateFromISO(r.date)}</td>
                  <td style={{ ...cell, fontWeight: 700, whiteSpace: "nowrap" }}>{to12h(r.time)}</td>
                  <td style={cell}>{r.type === "event" ? r.eventTitle : r.name}</td>
                  <td style={{ ...cell, color: C.inkSoft }}>
                    <div style={{ whiteSpace: "nowrap" }}>{r.contact || "—"}</div>
                    {r.email && <div style={{ fontSize: 11.5 }}>{r.email}</div>}
                  </td>
                  <td style={{ ...cell, color: C.inkSoft }}>{r.pax}</td>
                  <td style={cell}>
                    <DownpaymentCell reservation={r} onViewProof={onViewProof} />
                  </td>
                  <td style={cell}>
                    <Badge tone={r.type === "event" ? "amber" : "green"}>
                      {r.type === "event" ? "Event" : "Table"}
                    </Badge>
                  </td>
                  <td style={cell}>
                    {canEdit(r) ? (
                      <StatusSelect
                        status={r.status}
                        locked={isLocked(r)}
                        onChange={(status) => markStatus(r.id, status)}
                      />
                    ) : (
                      <StatusPill status={r.status} />
                    )}
                  </td>
                  <td style={cell}>{goButton(r)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

/* ---------------------------------------------------------------- */
/* Root                                                               */
/* ---------------------------------------------------------------- */

const STATUS_TO_BACKEND = {
  Pending: "pending",
  Confirmed: "confirmed",
  Arrived: "seated",
  Completed: "completed",
  Cancelled: "cancelled",
};

const BACKEND_TO_STATUS = {
  pending: "Pending",
  confirmed: "Confirmed",
  seated: "Arrived",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "Cancelled",
};

// Converts a raw MySQL reservation row into the shape the views above expect
function normalizeReservation(r) {
  const createdAt = r.created_at ? new Date(r.created_at) : null;
  const validCreated = createdAt && !isNaN(createdAt.getTime());

  return {
    id: r.id,
    date: toISOString(r.reservation_date),
    time: r.reservation_time
      ? (r.reservation_time instanceof Date
          ? r.reservation_time.toTimeString().slice(0, 5)
          : String(r.reservation_time).slice(0, 5))
      : "",
    type: r.reservation_type,
    name: r.guest_name,
    eventTitle: r.guest_name,
    contact: r.contact_number || "",
    email: r.email || "",
    pax: r.party_size,
    location: r.special_requests || r.occasion || "—",
    downpayment: r.downpayment_amount,
    paymentMethod: r.payment_method,
    paymentStatus: String(r.payment_status || "pending").toLowerCase(),
    // The list endpoint only reports whether a proof exists — the image
    // itself is fetched when the modal opens
    hasPaymentProof: Boolean(r.has_payment_proof ?? r.payment_proof),
    status: BACKEND_TO_STATUS[String(r.status || "").toLowerCase()] || "Pending",
    // When the booking was made — used by the History sort
    createdAt: validCreated ? createdAt : null,
    booked: validCreated
      ? createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "—",
  };
}

// historyOnly: the Owner's History page shows just the History view from here,
// so it matches what the front desk sees
export default function Reservations({ embedded = false, highlightTarget = null, isMobile: isMobileProp, historyOnly = false }) {
  const location = useLocation();
  const detectedMobile = useMediaQuery(MOBILE_QUERY);
  const isMobile = isMobileProp ?? detectedMobile;

  const [range, setRange] = useState(historyOnly ? "History" : "Day");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [highlightId, setHighlightId] = useState(null);
  const [proofTarget, setProofTarget] = useState(null);
  const [guestCounts, setGuestCounts] = useState({ reserved: 0, walk_in: 0, total: 0 });
  const [addingWalkIn, setAddingWalkIn] = useState(false);
  const [toast, setToast] = useState({ message: "", tone: "error" });
  const [pendingCancel, setPendingCancel] = useState(null);
  // Searching looks across every date, not just the day on screen
  const [search, setSearch] = useState("");
  const isSearching = search.trim().length > 0;
  const highlightRef = useRef(null);

  const showError = (message) => setToast({ message, tone: "error" });
  const showSuccess = (message) => setToast({ message, tone: "success" });
  const closeToast = () => setToast({ message: "", tone: "error" });

  // showSpinner is only true on the first load — background polls stay silent
  const loadReservations = useCallback((showSpinner = false) => {
    if (showSpinner) setLoading(true);
    return reservationsApi.getAll()
      .then((data) => setReservations(data.map(normalizeReservation)))
      .catch((err) => console.error("Failed to load reservations:", err))
      .finally(() => { if (showSpinner) setLoading(false); });
  }, []);

  useEffect(() => {
    loadReservations(true);
  }, [loadReservations]);

  // Keep the desk in sync so new bookings and cashier verifications appear
  // without a refresh
  useEffect(() => {
    const interval = setInterval(() => loadReservations(), POLL_MS);
    return () => clearInterval(interval);
  }, [loadReservations]);

  // Counts follow the day the front desk is looking at, not just today
  const loadGuestCounts = useCallback(() => {
    const iso = toISO(selectedDate);
    return guestsApi.getCounts(iso, iso)
      .then(setGuestCounts)
      .catch((err) => console.error("Failed to load guest counts:", err));
  }, [selectedDate]);

  useEffect(() => {
    loadGuestCounts();
  }, [loadGuestCounts]);

  useEffect(() => {
    const interval = setInterval(loadGuestCounts, POLL_MS);
    return () => clearInterval(interval);
  }, [loadGuestCounts]);

  const handleAddWalkIn = async (count) => {
    try {
      setAddingWalkIn(true);
      await guestsApi.addWalkIn(count);
      loadGuestCounts();
    } catch (err) {
      console.error(err);
      showError(err.message || "Failed to record walk-in guests.");
    } finally {
      setAddingWalkIn(false);
    }
  };

  // Jump to and highlight a reservation when arriving from a notification
  useEffect(() => {
    const target = highlightTarget || location.state?.highlight;
    if (!target || target.type !== "reservation") return;

    setRange("Day");
    if (target.date) {
      const iso = toISOString(target.date);
      const [y, m, d] = iso.split("-").map(Number);
      if (y && m && d) setSelectedDate(new Date(y, m - 1, d));
    }
    setHighlightId(target.id);

    const timer = setTimeout(() => setHighlightId(null), HIGHLIGHT_MS);
    return () => clearTimeout(timer);
  }, [highlightTarget, location.state]);

  // Scroll the highlighted row into view once it renders
  useEffect(() => {
    if (highlightId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightId, reservations]);

  const applyStatus = async (id, status) => {
    const backendStatus = STATUS_TO_BACKEND[status] || "pending";
    try {
      await reservationsApi.updateStatus(id, backendStatus);
      setReservations((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      loadGuestCounts();
      if (status === "Cancelled") showSuccess("Reservation cancelled.");
      if (status === "Confirmed") showSuccess("Reservation confirmed and moved to History.");
    } catch (err) {
      console.error("Failed to update status:", err);
      showError("Failed to update reservation status. Please try again.");
    }
  };

  // Cancelling asks for confirmation first; every other status applies right away
  const markStatus = (id, status) => {
    if (status === "Cancelled") {
      setPendingCancel(id);
      return;
    }
    applyStatus(id, status);
  };

  // Accepts a Date (from the calendars) or an ISO date string (from search results)
  const openDay = (date) => {
    if (typeof date === "string") {
      const [y, m, d] = date.split("-").map(Number);
      if (!y || !m || !d) return;
      date = new Date(y, m - 1, d);
    }
    setSelectedDate(date);
    setRange("Day");
    setSearch("");
  };

  const selectedISO = toISO(selectedDate);
  const weekStart = startOfWeek(selectedDate);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const isHistory = range === "History";

  const rangeLabel = (() => {
    if (range === "Week") {
      return isMobile
        ? `${formatDisplayDateShort(weekStart)} - ${formatDisplayDateShort(weekEnd)}`
        : `${formatDisplayDate(weekStart)} - ${formatDisplayDate(weekEnd)}`;
    }
    return isMobile ? formatDisplayDateShort(selectedDate) : formatDisplayDate(selectedDate);
  })();

  const arrowButton = {
    border: "none",
    background: "#fff",
    borderRadius: 8,
    width: 34,
    height: 34,
    boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
    cursor: "pointer",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <div style={{ fontFamily: FONT, minHeight: historyOnly ? 0 : "100vh", background: historyOnly ? "transparent" : C.canvas }}>
      <style>{`${FONT_IMPORT}
        * { box-sizing: border-box; }
      `}</style>

      {!embedded && <StaffHeader />}
      <div style={{ padding: historyOnly ? 0 : isMobile ? 16 : 28, display: "flex", flexDirection: "column", gap: 14, width: "100%" }}>
        {!historyOnly && (
        <div
          style={{
            fontFamily: FONT,
            fontSize: "clamp(26px, 6vw, 39px)",
            fontWeight: 700,
            color: C.ink,
            WebkitTextStroke: "0.5px " + C.ink,
            textAlign: "left",
            width: "100%",
          }}
        >
          Reservations
        </div>
        )}

        {!historyOnly && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          {!isHistory ? (
            <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 12, flexWrap: "wrap" }}>
              {!isMobile && (
                <span style={{ letterSpacing: 1, color: "#1d080f", fontSize: 13, fontFamily: FONT, WebkitTextStroke: "0.5px #1d080f" }}>
                  {formatMonthLabel(selectedDate)}
                </span>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", padding: "8px 14px", borderRadius: 10, fontSize: isMobile ? 12.5 : 13, fontWeight: 600, boxShadow: "0 1px 2px rgba(0,0,0,0.06)", fontFamily: FONT, whiteSpace: "nowrap" }}>
                {rangeLabel}
              </div>
              <button onClick={() => setSelectedDate(shiftDate(selectedDate, range, "prev"))} style={arrowButton}>
                <ChevronLeft size={15} />
              </button>
              <button onClick={() => setSelectedDate(shiftDate(selectedDate, range, "next"))} style={arrowButton}>
                <ChevronRight size={15} />
              </button>
            </div>
          ) : (
            <div />
          )}

          {/* The range switcher scrolls sideways rather than wrapping.
              Inside the Owner shell, History lives on the Owner's own History page */}
          <div style={{ overflowX: "auto", maxWidth: "100%" }}>
            <div style={{ display: "flex", gap: 6, background: "#fff", padding: 4, borderRadius: 10, boxShadow: "0 1px 2px rgba(0,0,0,0.06)", width: "fit-content" }}>
              {(embedded ? ["Day", "Week", "Month"] : ["Day", "Week", "Month", "History"]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  style={{
                    border: "none",
                    borderRadius: 8,
                    padding: isMobile ? "8px 13px" : "8px 16px",
                    fontSize: isMobile ? 12.5 : 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: FONT,
                    background: range === r ? C.void : "transparent",
                    color: range === r ? "#f5e9d8" : C.ink,
                    whiteSpace: "nowrap",
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>
        )}

        {/* Search by guest name, contact number, or email */}
        <div style={{ position: "relative", width: "100%", maxWidth: isMobile ? "none" : 420 }}>
          <Search
            size={16}
            style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: C.inkSoft, pointerEvents: "none" }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setSearch("")}
            placeholder="Search guest name, contact no., or email"
            style={{
              width: "100%",
              padding: "11px 40px 11px 40px",
              borderRadius: 10,
              border: `1px solid ${C.hair}`,
              background: "#fff",
              fontSize: 13,
              fontFamily: FONT,
              color: C.ink,
              outline: "none",
              boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
            }}
          />
          {isSearching && (
            <button
              onClick={() => setSearch("")}
              aria-label="Clear search"
              style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", border: "none", background: "transparent", cursor: "pointer", color: C.inkSoft, display: "flex", padding: 4 }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {!isHistory && !isSearching && (
          <GuestCard
            counts={guestCounts}
            onAddWalkIn={handleAddWalkIn}
            busy={addingWalkIn}
            isToday={toISO(selectedDate) === toISO(new Date())}
            isMobile={isMobile}
          />
        )}

        {loading ? (
          <Card style={{ textAlign: "center", padding: 40, color: C.inkSoft, fontFamily: FONT }}>Loading reservations...</Card>
        ) : isSearching ? (
          <SearchView
            query={search}
            reservations={reservations}
            markStatus={markStatus}
            onViewProof={setProofTarget}
            onOpenDay={openDay}
            isMobile={isMobile}
          />
        ) : (
          <>
            {range === "Day" && (
              <DayView
                selectedISO={selectedISO}
                reservations={reservations}
                markStatus={markStatus}
                highlightId={highlightId}
                highlightRef={highlightRef}
                onViewProof={setProofTarget}
                isMobile={isMobile}
              />
            )}
            {range === "Week" && (
              <WeekView
                selectedDate={selectedDate}
                reservations={reservations}
                onOpenDay={openDay}
                isMobile={isMobile}
              />
            )}
            {range === "Month" && (
              <MonthView
                selectedDate={selectedDate}
                reservations={reservations}
                onOpenDay={openDay}
                isMobile={isMobile}
              />
            )}
            {range === "History" && (
              <HistoryView reservations={reservations} onViewProof={setProofTarget} isMobile={isMobile} />
            )}
          </>
        )}
      </div>

      <ProofModal reservation={proofTarget} onClose={() => setProofTarget(null)} />

      <ConfirmModal
        open={Boolean(pendingCancel)}
        title="Cancel this reservation?"
        message="The guest will see this as cancelled. Their downpayment is non-refundable."
        confirmLabel="Yes, Cancel"
        onConfirm={() => {
          const id = pendingCancel;
          setPendingCancel(null);
          applyStatus(id, "Cancelled");
        }}
        onCancel={() => setPendingCancel(null)}
      />

      <Toast message={toast.message} tone={toast.tone} onClose={closeToast} isMobile={isMobile} />
    </div>
  );
}