import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight, ChevronDown, X } from "lucide-react";
import { reservationsApi } from "../services/reservationsApi";
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

const DAY_LABELS = ["SUN", "MON", "TUES", "WED", "THU", "FRI", "SAT"];
const HOURS = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]; // 11am–10pm

const STATUS_OPTIONS = ["Pending", "Confirmed", "Arrived", "Completed", "Cancelled"];

/* ---------------------------------------------------------------- */
/* Date helpers                                                      */
/* ---------------------------------------------------------------- */
function toISO(date) {
  return date.toISOString().slice(0, 10);
}
function toISOString(value) {
  if (!value) return "";
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return String(value).slice(0, 10);
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
  if (status === "Completed") return { bg: "#eeecec", fg: C.grayText, border: C.gray };
  if (status === "Arrived") return { bg: "#fbeee2", fg: C.orange, border: C.orange };
  if (status === "Confirmed") return { bg: "#e5f0e6", fg: C.green, border: C.green };
  if (status === "Cancelled") return { bg: "#fbe7e7", fg: C.red, border: C.red };
  return { bg: "#fdf3df", fg: "#9c7a1f", border: "#d9bf72" }; // Pending
}

function Card({ children, style }) {
  return (
    <div style={{ background: C.card, borderRadius: 16, padding: 22, boxShadow: "0 1px 3px rgba(23,3,16,0.06)", ...style }}>
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
/* Status dropdown                                                    */
/* ---------------------------------------------------------------- */
function StatusSelect({ status, onChange }) {
  const c = statusColors(status);

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
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
          padding: "7px 32px 7px 14px",
          fontSize: 12.5,
          fontWeight: 700,
          fontFamily: FONT,
          cursor: "pointer",
          outline: "none",
          minWidth: 130,
        }}
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s} style={{ background: "#fff", color: C.ink }}>
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
function DownpaymentCell({ reservation, onViewProof }) {
  const amount = Number(reservation.downpayment || 0);

  if (!amount) {
    return <span style={{ color: C.inkSoft, fontSize: 12.5 }}>—</span>;
  }

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 13, lineHeight: "18px" }}>{peso(amount)}</div>
      <div style={{ color: C.inkSoft, fontSize: 11, lineHeight: "16px" }}>{reservation.paymentMethod || "—"}</div>
      {reservation.paymentProof && (
        <div
          onClick={() => onViewProof(reservation)}
          style={{
            color: C.gold,
            fontSize: 11,
            fontWeight: 700,
            lineHeight: "16px",
            cursor: "pointer",
          }}
        >
          View proof
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Proof of payment modal                                             */
/* ---------------------------------------------------------------- */
function ProofModal({ reservation, onClose }) {
  if (!reservation) return null;

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
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          fontFamily: FONT,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: `1px solid ${C.hair}` }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>Proof of Payment</div>
            <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 2 }}>
              {reservation.name} · {peso(reservation.downpayment)} · {reservation.paymentMethod || "—"}
            </div>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer", color: C.inkSoft }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ overflowY: "auto", padding: 22, background: C.canvas }}>
          <img
            src={reservation.paymentProof}
            alt="Proof of payment"
            style={{ width: "100%", borderRadius: 10, background: "#fff" }}
          />
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
    <div style={{ display: "flex", gap: 20, marginBottom: 16, fontSize: 12.5, color: C.ink, fontFamily: FONT }}>
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
function WeekView({ selectedDate, reservations, onOpenDay }) {
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
      <div style={{ padding: "20px 20px 0" }}>
        <Legend />
      </div>
      <div style={{ overflowX: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "90px repeat(7, 1fr)", minWidth: 900 }}>
          <div style={{ borderBottom: `1px solid ${C.hair}` }} />
          {days.map((d, i) => (
            <div key={i} style={{ textAlign: "center", padding: "10px 6px", fontFamily: FONT, fontWeight: 700, fontSize: 13, color: C.ink, borderBottom: `1px solid ${C.hair}`, borderLeft: `1px solid ${C.hair}` }}>
              {DAY_LABELS[i]} | {d.getDate()}
            </div>
          ))}

          {HOURS.map((hour) => (
            <React.Fragment key={hour}>
              <div style={{ padding: "14px 10px", fontSize: 12, color: C.inkSoft, borderBottom: `1px solid ${C.hair}`, fontFamily: FONT }}>
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
function MonthView({ selectedDate, reservations }) {
  const weeks = buildMonthMatrix(selectedDate);

  const countsFor = (dayISO) => {
    const dayRes = reservations.filter((r) => r.date === dayISO);
    return {
      table: dayRes.filter((r) => r.type === "table").length,
      event: dayRes.filter((r) => r.type === "event").length,
    };
  };

  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "20px 20px 0" }}>
        <Legend />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
        {DAY_LABELS.map((d) => (
          <div key={d} style={{ textAlign: "center", padding: "10px 6px", fontFamily: FONT, fontWeight: 700, fontSize: 13, color: C.ink, borderBottom: `1px solid ${C.hair}` }}>
            {d}
          </div>
        ))}
        {weeks.flat().map((cell, i) => {
          const dayISO = toISO(cell.date);
          const counts = countsFor(dayISO);
          return (
            <div
              key={i}
              style={{
                minHeight: 90,
                padding: "8px 10px",
                borderBottom: `1px solid ${C.hair}`,
                borderLeft: i % 7 !== 0 ? `1px solid ${C.hair}` : "none",
                background: cell.inMonth ? "#fff" : "#f7f6f8",
                opacity: cell.inMonth ? 1 : 0.5,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 6, fontFamily: FONT }}>{cell.date.getDate()}</div>
              {counts.table > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: C.ink, marginBottom: 3, fontFamily: FONT }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.eventYellow, display: "inline-block" }} />
                  {counts.table}
                </div>
              )}
              {counts.event > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: C.ink, fontFamily: FONT }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.eventBlue, display: "inline-block" }} />
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
/* History view — completed reservations                              */
/* ---------------------------------------------------------------- */
function HistoryView({ reservations, onViewProof }) {
  const completed = [...reservations]
    .filter((r) => r.status === "Completed")
    .sort((a, b) => (a.date + a.time < b.date + b.time ? 1 : -1));

  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 22px 0" }}>
        <SectionTitle>Completed Reservations</SectionTitle>
        <span style={{ background: C.void, color: "#f5e9d8", fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 999, marginTop: -14, fontFamily: FONT }}>
          {completed.length}
        </span>
      </div>

      {completed.length === 0 ? (
        <div style={{ color: C.inkSoft, fontSize: 13.5, textAlign: "center", padding: "30px 0", fontFamily: FONT }}>
          No completed reservations yet.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT, minWidth: 800 }}>
            <thead>
              <tr style={{ textAlign: "left", fontSize: 12, color: C.inkSoft }}>
                {["Date", "Time", "Name", "Pax", "Downpayment", "Type"].map((h) => (
                  <th key={h} style={{ padding: "10px 22px", borderBottom: `1px solid ${C.hair}`, fontWeight: 700, textAlign: "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {completed.map((r) => (
                <tr key={r.id} style={{ fontSize: 13.5 }}>
                  <td style={{ padding: "14px 22px", borderBottom: `1px solid ${C.hair}`, textAlign: "left" }}>{displayDateFromISO(r.date)}</td>
                  <td style={{ padding: "14px 22px", borderBottom: `1px solid ${C.hair}`, fontWeight: 700, textAlign: "left" }}>{to12h(r.time)}</td>
                  <td style={{ padding: "14px 22px", borderBottom: `1px solid ${C.hair}`, textAlign: "left" }}>
                    {r.type === "event" ? r.eventTitle : r.name}
                  </td>
                  <td style={{ padding: "14px 22px", borderBottom: `1px solid ${C.hair}`, color: C.inkSoft, textAlign: "left" }}>{r.pax}</td>
                     <td style={{ padding: "16px 22px", borderBottom: `1px solid ${C.hair}`, verticalAlign: "top", textAlign: "left" }}>
                      <DownpaymentCell reservation={r} onViewProof={onViewProof} />
                    </td>
                  <td style={{ padding: "14px 22px", borderBottom: `1px solid ${C.hair}`, textAlign: "left" }}>
                    <Badge tone={r.type === "event" ? "amber" : "green"}>
                      {r.type === "event" ? "Event" : "Table"}
                    </Badge>
                  </td>
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
/* Day view                                                           */
/* ---------------------------------------------------------------- */
function DayView({ selectedISO, reservations, markStatus, highlightId, highlightRef, onViewProof }) {
  const dayReservations = reservations.filter((r) => r.date === selectedISO && r.status !== "Completed");
  const sortedAll = [...dayReservations].sort((a, b) => (a.time > b.time ? 1 : -1));

  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 22px 0" }}>
        <SectionTitle>Today's Reservations</SectionTitle>
        <span style={{ background: C.void, color: "#f5e9d8", fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 999, marginTop: -14, fontFamily: FONT }}>
          {sortedAll.length}
        </span>
      </div>
      {sortedAll.length === 0 ? (
        <div style={{ color: C.inkSoft, fontSize: 13.5, textAlign: "center", padding: "30px 0", fontFamily: FONT }}>No reservations today.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT, minWidth: 800, textAlign: "left" }}>
                        <thead>
              <tr style={{ textAlign: "left", fontSize: 12, color: C.inkSoft }}>
                {["Time", "Name", "Type", "Pax", "Downpayment", "Status"].map((h) => (
                  <th key={h} style={{ padding: "10px 22px", borderBottom: `1px solid ${C.hair}`, fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedAll.map((r) => {
                const isHighlighted = r.id === highlightId;
                return (
                  <tr
                    key={r.id}
                    ref={isHighlighted ? highlightRef : null}
                    style={{
                      fontSize: 13.5,
                      background: isHighlighted ? C.highlight : "transparent",
                      transition: "background 0.4s ease",
                      opacity: r.status === "Cancelled" ? 0.55 : 1,
                    }}
                  >
                    <td style={{ padding: "16px 22px", borderBottom: `1px solid ${C.hair}`, fontWeight: 700, verticalAlign: "top" }}>
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
                      <StatusSelect status={r.status} onChange={(status) => markStatus(r.id, status)} />
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
    pax: r.party_size,
    location: r.special_requests || r.occasion || "—",
    downpayment: r.downpayment_amount,
    paymentMethod: r.payment_method,
    paymentProof: r.payment_proof,
    status: BACKEND_TO_STATUS[r.status] || "Pending",
  };
}

export default function Reservations({ embedded = false, highlightTarget = null }) {
  const location = useLocation();
  const [range, setRange] = useState("Day");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [highlightId, setHighlightId] = useState(null);
  const [proofTarget, setProofTarget] = useState(null);
  const highlightRef = useRef(null);

  const loadReservations = useCallback(() => {
    setLoading(true);
    reservationsApi.getAll()
      .then((data) => setReservations(data.map(normalizeReservation)))
      .catch((err) => console.error("Failed to load reservations:", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

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

  const markStatus = async (id, status) => {
    if (status === "Cancelled" && !window.confirm("Cancel this reservation?")) return;

    const backendStatus = STATUS_TO_BACKEND[status] || "pending";
    try {
      await reservationsApi.updateStatus(id, backendStatus);
      setReservations((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Failed to update reservation status. Please try again.");
    }
  };

  const openDay = (date) => {
    setSelectedDate(date);
    setRange("Day");
  };

  const selectedISO = toISO(selectedDate);
  const weekStart = startOfWeek(selectedDate);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const isHistory = range === "History";

  return (
    <div style={{ fontFamily: FONT, minHeight: "100vh", background: C.canvas }}>
      <style>{`${FONT_IMPORT}
        * { box-sizing: border-box; }
      `}</style>

      {!embedded && <StaffHeader />}
      <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 14, width: "100%" }}>
        <div style={{ fontFamily: FONT, fontSize: 39, fontWeight: 700, color: C.ink, WebkitTextStroke: "0.5px " + C.ink, textAlign: "left", width: "100%" }}>
          Reservations
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          {!isHistory ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ letterSpacing: 1, color: "#1d080f", fontSize: 13, fontFamily: FONT, WebkitTextStroke: "0.5px #1d080f" }}>{formatMonthLabel(selectedDate)}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", padding: "8px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600, boxShadow: "0 1px 2px rgba(0,0,0,0.06)", fontFamily: FONT }}>
                {range === "Week" ? `${formatDisplayDate(weekStart)} - ${formatDisplayDate(weekEnd)}` : formatDisplayDate(selectedDate)}
              </div>
              <button onClick={() => setSelectedDate(shiftDate(selectedDate, range, "prev"))} style={{ border: "none", background: "#fff", borderRadius: 8, width: 32, height: 32, boxShadow: "0 1px 2px rgba(0,0,0,0.08)", cursor: "pointer" }}>
                <ChevronLeft size={15} style={{ margin: "auto" }} />
              </button>
              <button onClick={() => setSelectedDate(shiftDate(selectedDate, range, "next"))} style={{ border: "none", background: "#fff", borderRadius: 8, width: 32, height: 32, boxShadow: "0 1px 2px rgba(0,0,0,0.08)", cursor: "pointer" }}>
                <ChevronRight size={15} style={{ margin: "auto" }} />
              </button>
            </div>
          ) : (
            <div />
          )}
          <div style={{ display: "flex", gap: 6, background: "#fff", padding: 4, borderRadius: 10, boxShadow: "0 1px 2px rgba(0,0,0,0.06)" }}>
            {(embedded ? ["Day", "Week", "Month"] : ["Day", "Week", "Month", "History"]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                style={{
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 16px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: FONT,
                  background: range === r ? C.void : "transparent",
                  color: range === r ? "#f5e9d8" : C.ink,
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <Card style={{ textAlign: "center", padding: 40, color: C.inkSoft, fontFamily: FONT }}>Loading reservations...</Card>
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
              />
            )}
            {range === "Week" && <WeekView selectedDate={selectedDate} reservations={reservations} onOpenDay={openDay} />}
            {range === "Month" && <MonthView selectedDate={selectedDate} reservations={reservations} />}
            {range === "History" && <HistoryView reservations={reservations} onViewProof={setProofTarget} />}
          </>
        )}
      </div>

      <ProofModal reservation={proofTarget} onClose={() => setProofTarget(null)} />
    </div>
  );
}