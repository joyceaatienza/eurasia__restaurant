import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getReservations, updateReservationStatus } from "../utils/reservationsStore";
import StaffHeader from "../components/StaffHeader";

/* ---------------------------------------------------------------- */
const C = {
  void: "#170310",
  canvas: "#f0eff3",
  card: "#ffffff",
  ink: "#201417",
  inkSoft: "#6b5b60",
  hair: "#e7e3e6",
  flame: "#fa293f",
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
};

const FONT_IMPORT =
  "@import url('https://fonts.googleapis.com/css2?family=Prata&display=swap');";
const FONT = "'Prata', serif";

const TABLES = ["T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12", "T13", "T14", "T15", "T16", "T17"];
const DAY_LABELS = ["SUN", "MON", "TUES", "WED", "THU", "FRI", "SAT"];
const HOURS = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]; // 11am–10pm

// Same coordinates as the customer-facing floor plan, so the layouts match exactly
const FLOOR_TABLES = [
  { id: "T13", x: 20, y: 7.3, w: 15.5, h: 11 },
  { id: "T6", x: 67.3, y: 7.3, w: 15.7, h: 11 },
  { id: "T14", x: 3.7, y: 22.6, w: 16.2, h: 8 },
  { id: "T5", x: 81, y: 22.6, w: 16.2, h: 8 },
  { id: "T12", x: 33.7, y: 23, w: 7, h: 20 },
  { id: "T7", x: 58, y: 23, w: 7.2, h: 20 },
  { id: "T15", x: 3.7, y: 38.4, w: 16.2, h: 7.7 },
  { id: "T4", x: 81, y: 38.4, w: 16.2, h: 7.7 },
  { id: "T11", x: 29.2, y: 49, w: 16.5, h: 8.6 },
  { id: "T8", x: 54.1, y: 49, w: 16.5, h: 8.6 },
  { id: "T16", x: 2.5, y: 55.3, w: 16.2, h: 9 },
  { id: "T3", x: 81, y: 55.3, w: 16.2, h: 9 },
  { id: "T10", x: 33.7, y: 61.8, w: 7, h: 19.8 },
  { id: "T9", x: 58, y: 61.8, w: 7.2, h: 19.8 },
  { id: "T17", x: 2.5, y: 70, w: 16.2, h: 8.6 },
  { id: "T2", x: 81, y: 70, w: 16.2, h: 8.6 },
];

/* ---------------------------------------------------------------- */
/* Date helpers                                                      */
/* ---------------------------------------------------------------- */
function toISO(date) {
  return date.toISOString().slice(0, 10);
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
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}
function hourBucket(time24) {
  return Number(time24.split(":")[0]);
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
    <span style={{ background: t.bg, color: t.fg, fontSize: 12, fontWeight: 700, padding: "5px 12px", borderRadius: 999, whiteSpace: "nowrap", fontFamily: FONT }}>
      {children}
    </span>
  );
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
/* Status action buttons — Arrived / Completed                       */
/* ---------------------------------------------------------------- */
function StatusButtons({ status, onMark }) {
  const isCompleted = status === "Completed";
  const isArrived = status === "Arrived" || isCompleted;

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button
        onClick={() => onMark("Arrived")}
        disabled={isCompleted}
        style={{
          border: isArrived ? "none" : `1px solid ${C.hair}`,
          borderRadius: 8,
          padding: "7px 14px",
          fontSize: 12.5,
          fontWeight: 700,
          fontFamily: FONT,
          cursor: isCompleted ? "default" : "pointer",
          background: isArrived ? C.orange : "#fff",
          color: isArrived ? "#fff" : C.ink,
        }}
      >
        Arrived
      </button>
      <button
        onClick={() => onMark("Completed")}
        style={{
          border: "none",
          borderRadius: 8,
          padding: "7px 14px",
          fontSize: 12.5,
          fontWeight: 700,
          fontFamily: FONT,
          cursor: "pointer",
          background: isCompleted ? C.gray : C.flame,
          color: isCompleted ? C.grayText : "#fff",
        }}
      >
        Completed
      </button>
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
                        {r.type === "table" ? (
                          <div style={{ color: C.inkSoft }}>{r.table} ({r.pax})</div>
                        ) : (
                          <div style={{ color: C.inkSoft }}>{r.location}</div>
                        )}
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
/* Floor Plan — same table coordinates as the customer-facing page,  */
/* but colored by live status instead of being selectable            */
/* ---------------------------------------------------------------- */
function FloorPlan({ tableStatus }) {
  const statusFor = (id) => tableStatus.find((t) => t.table === id)?.status || "Available";

  const colorsFor = (status) => {
    if (status === "Occupied") return { bg: C.orange, border: C.orange, text: "#fff" };
    if (status === "Available") return { bg: "#fff", border: "#cfe3d2", text: C.green };
    return { bg: "#fbe7e7", border: C.red, text: C.red }; // Reserved - {time}
  };

  return (
    <div style={{ margin: 18, marginTop: 0 }}>
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "401 / 521",
          background: "#f4f2f6",
          borderRadius: 12,
          border: `1px solid ${C.hair}`,
          overflow: "hidden",
        }}
      >
        {FLOOR_TABLES.map((t) => {
          const status = statusFor(t.id);
          const c = colorsFor(status);
          return (
            <div
              key={t.id}
              title={status === "Available" ? t.id : `${t.id} — ${status}`}
              style={{
                position: "absolute",
                left: `${t.x}%`,
                top: `${t.y}%`,
                width: `${t.w}%`,
                height: `${t.h}%`,
                background: c.bg,
                border: `2px solid ${c.border}`,
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: FONT,
                fontWeight: 700,
                fontSize: 11,
                color: c.text,
              }}
            >
              {t.id}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 12, fontSize: 11.5, color: C.inkSoft, fontFamily: FONT }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: "#fff", border: `2px solid #cfe3d2`, display: "inline-block" }} />
          Available
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: "#fbe7e7", border: `2px solid ${C.red}`, display: "inline-block" }} />
          Reserved
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: C.orange, display: "inline-block" }} />
          Occupied
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Day view                                                           */
/* ---------------------------------------------------------------- */
function DayView({ selectedISO, reservations, markStatus }) {
  const dayReservations = reservations.filter((r) => r.date === selectedISO);
  const tableRes = dayReservations.filter((r) => r.type === "table");
  const sortedAll = [...dayReservations].sort((a, b) => (a.time > b.time ? 1 : -1));

  const tableStatus = TABLES.map((table) => {
    const match = tableRes.find((r) => r.table === table);
    if (!match) return { table, status: "Available" };
    if (match.status === "Arrived" || match.status === "Completed") return { table, status: "Occupied" };
    return { table, status: `Reserved - ${to12h(match.time)}` };
  });

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.7fr 0.65fr", gap: 16, alignItems: "start" }}>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 18px 0" }}>
          <SectionTitle>Floor Plan</SectionTitle>
        </div>
        <FloorPlan tableStatus={tableStatus} />
      </Card>

      <Card style={{ padding: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 22px 0" }}>
          <SectionTitle>Today's Reservations</SectionTitle>
          <span style={{ background: C.void, color: "#f5e9d8", fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 999, marginTop: -14, fontFamily: FONT }}>
            {sortedAll.length}
          </span>
        </div>
        {sortedAll.length === 0 ? (
          <div style={{ color: C.inkSoft, fontSize: 13.5, textAlign: "center", padding: "30px 0", fontFamily: FONT }}>No reservations today.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT }}>
            <thead>
              <tr style={{ textAlign: "left", fontSize: 12, color: C.inkSoft }}>
                {["Time", "Name", "Table", "Pax", "Status"].map((h) => (
                  <th key={h} style={{ padding: "10px 22px", borderBottom: `1px solid ${C.hair}`, fontWeight: 700 }}>{h}</th>
                ))}
                <th style={{ padding: "10px 22px", borderBottom: `1px solid ${C.hair}` }} />
              </tr>
            </thead>
            <tbody>
              {sortedAll.map((r) => (
                <tr key={r.id} style={{ fontSize: 13.5 }}>
                  <td style={{ padding: "14px 22px", borderBottom: `1px solid ${C.hair}`, fontWeight: 700 }}>
                    {to12h(r.time)}
                  </td>
                  <td style={{ padding: "14px 22px", borderBottom: `1px solid ${C.hair}` }}>
                    {r.type === "event" ? r.eventTitle : r.name}
                  </td>
                  <td style={{ padding: "14px 22px", borderBottom: `1px solid ${C.hair}`, color: r.type === "event" ? C.eventBlue : C.ink, fontWeight: r.type === "event" ? 700 : 400 }}>
                    {r.type === "event" ? "Event" : r.table}
                  </td>
                  <td style={{ padding: "14px 22px", borderBottom: `1px solid ${C.hair}`, color: C.inkSoft }}>{r.pax}</td>
                  <td style={{ padding: "14px 22px", borderBottom: `1px solid ${C.hair}` }}>
                    <Badge tone={r.status === "Completed" ? "gray" : r.status === "Arrived" ? "orange" : "amber"}>{r.status}</Badge>
                  </td>
                  <td style={{ padding: "14px 22px", borderBottom: `1px solid ${C.hair}` }}>
                    <StatusButtons status={r.status} onMark={(status) => markStatus(r.id, status)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card style={{ padding: 16 }}>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 15, margin: "0 0 10px 0", color: C.ink }}>Table Availability</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, color: C.inkSoft, paddingBottom: 6, borderBottom: `1px solid ${C.hair}`, fontFamily: FONT }}>
            <span>Table</span>
            <span>Status</span>
          </div>
          {tableStatus.map((t) => (
            <div key={t.table} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${C.hair}`, fontSize: 12, fontFamily: FONT }}>
              <span style={{ fontWeight: 700, color: C.ink }}>{t.table}</span>
              <span style={{ color: t.status === "Available" ? C.green : t.status === "Occupied" ? C.orange : C.red, fontWeight: 600, fontSize: 11 }}>
                {t.status}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Root                                                               */
/* ---------------------------------------------------------------- */
export default function Reservations() {
  const [range, setRange] = useState("Day");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [reservations, setReservations] = useState([]);

  useEffect(() => {
    setReservations(getReservations());
  }, []);

  const markStatus = (id, status) => setReservations(updateReservationStatus(id, status));

  const openDay = (date) => {
    setSelectedDate(date);
    setRange("Day");
  };

  const selectedISO = toISO(selectedDate);
  const weekStart = startOfWeek(selectedDate);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  return (
    <div style={{ fontFamily: FONT, minHeight: "100vh", background: C.canvas }}>
      <style>{`${FONT_IMPORT}
        * { box-sizing: border-box; }
      `}</style>

      <StaffHeader />

      <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 14, width: "100%" }}>
        <div style={{ fontFamily: FONT, fontSize: 24, fontWeight: 700, color: C.ink, WebkitTextStroke: "0.5px " + C.ink, textAlign: "left", width: "100%",}}>
          Reservations
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
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
          <div style={{ display: "flex", gap: 6, background: "#fff", padding: 4, borderRadius: 10, boxShadow: "0 1px 2px rgba(0,0,0,0.06)" }}>
            {["Day", "Week", "Month"].map((r) => (
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

        {range === "Day" && <DayView selectedISO={selectedISO} reservations={reservations} markStatus={markStatus} />}
        {range === "Week" && <WeekView selectedDate={selectedDate} reservations={reservations} onOpenDay={openDay} />}
        {range === "Month" && <MonthView selectedDate={selectedDate} reservations={reservations} />}
      </div>
    </div>
  );
}