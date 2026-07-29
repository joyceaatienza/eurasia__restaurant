import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, LogOut, Bell, Plus, X } from "lucide-react";
import { getReservations, addReservation, updateReservationStatus } from "../utils/reservationsStore";

/* ---------------------------------------------------------------- */
/* Design tokens — sampled from the Eurasia restaurant mockups       */
/* ---------------------------------------------------------------- */
const C = {
  void: "#170310",
  canvas: "#f0eff3",
  card: "#ffffff",
  ink: "#201417",
  inkSoft: "#6b5b60",
  hair: "#e7e3e6",
  flame: "#fa293f",
  gold: "#f5e9d8",
  green: "#296c39",
  orange: "#cd8a5d",
  red: "#c53a3a",
};

const FONT_IMPORT =
  "@import url('https://fonts.googleapis.com/css2?family=Prata&family=Inter:wght@400;500;600;700&display=swap');";

const TABLES = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];

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

/* ---------------------------------------------------------------- */
/* Small building blocks                                             */
/* ---------------------------------------------------------------- */
function Logo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="19" stroke={C.gold} strokeWidth="1.2" />
      <path
        d="M20 10c-3 0-5.5 2.4-5.5 5.6 0 1.1.3 2 .8 2.9-1.7.5-3 2-3 3.9 0 2.3 2 4 4.4 4 .5 0 1-.1 1.4-.3.5 1.3 1.9 2.2 3.4 2.2s2.9-.9 3.4-2.2c.4.2.9.3 1.4.3 2.4 0 4.4-1.7 4.4-4 0-1.9-1.3-3.4-3-3.9.5-.9.8-1.8.8-2.9 0-3.2-2.5-5.6-5.5-5.6z"
        stroke={C.gold}
        strokeWidth="1"
        fill="none"
      />
    </svg>
  );
}

function Badge({ children, tone = "green" }) {
  const map = {
    green: { bg: "#e5f0e6", fg: C.green },
    orange: { bg: "#fbeee2", fg: C.orange },
    red: { bg: "#fbe7e7", fg: C.red },
    amber: { bg: "#fdf3df", fg: "#9c7a1f" },
  };
  const t = map[tone] || map.green;
  return (
    <span style={{ background: t.bg, color: t.fg, fontSize: 12, fontWeight: 700, padding: "5px 12px", borderRadius: 999, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

function statusTone(status) {
  if (status === "Completed") return "green";
  if (status === "Arrived") return "orange";
  if (status === "Pending") return "amber";
  return "red";
}

function Btn({ children, variant = "primary", onClick, small, type = "button" }) {
  const base = {
    border: "none",
    borderRadius: 10,
    fontFamily: "Inter, sans-serif",
    fontWeight: 600,
    fontSize: small ? 13 : 14,
    padding: small ? "7px 14px" : "10px 18px",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  };
  const variants = {
    primary: { background: C.flame, color: "#fff" },
    dark: { background: C.void, color: C.gold },
    ghost: { background: "#fff", color: C.ink, border: `1px solid ${C.hair}` },
  };
  return (
    <button type={type} onClick={onClick} style={{ ...base, ...variants[variant] }}>
      {children}
    </button>
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
    <h3 style={{ fontFamily: "'Prata', serif", fontWeight: 700, fontSize: 18, margin: "0 0 16px 0", color: C.ink }}>
      {children}
    </h3>
  );
}

/* ---------------------------------------------------------------- */
/* Header — role-locked, no nav to other sections                    */
/* ---------------------------------------------------------------- */
function StaffHeader({ name = "Maria Santos", role = "Front Desk" }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 32px",
        background: C.void,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Logo />
        <div>
          <div style={{ fontFamily: "'Prata', serif", color: C.gold, fontSize: 15, fontWeight: 700, lineHeight: 1.1 }}>
            EURASIA
          </div>
          <div style={{ color: "rgba(245,233,216,0.55)", fontSize: 10, letterSpacing: 1.5 }}>RESTAURANT</div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(245,233,216,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Bell size={16} color={C.gold} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: C.gold, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: C.void, fontSize: 13 }}>
            {name.split(" ").map((n) => n[0]).join("")}
          </div>
          <div>
            <div style={{ color: C.gold, fontSize: 13, fontWeight: 600 }}>{name}</div>
            <div style={{ color: "rgba(245,233,216,0.5)", fontSize: 11 }}>{role}</div>
          </div>
        </div>
        <button
          style={{
            border: "none",
            background: "transparent",
            color: "rgba(245,233,216,0.7)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            fontFamily: "Inter, sans-serif",
          }}
        >
          <LogOut size={15} /> Log out
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Add Reservation modal                                             */
/* ---------------------------------------------------------------- */
function AddReservationModal({ defaultDate, onClose, onSave }) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    date: defaultDate,
    time: "",
    table: TABLES[0],
    pax: 2,
  });
  const [error, setError] = useState("");

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.time || !form.date) {
      setError("Name, date, and time are required.");
      return;
    }
    onSave(form);
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(23,3,16,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, padding: 26, width: 420 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          <div style={{ fontFamily: "'Prata', serif", fontWeight: 700, fontSize: 19, color: C.ink }}>New Reservation</div>
          <button onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            placeholder="Guest name *"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            style={{ padding: "10px 14px", borderRadius: 8, border: `1px solid ${C.hair}`, fontSize: 14 }}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <input
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              style={{ padding: "10px 14px", borderRadius: 8, border: `1px solid ${C.hair}`, fontSize: 14 }}
            />
            <input
              placeholder="Email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              style={{ padding: "10px 14px", borderRadius: 8, border: `1px solid ${C.hair}`, fontSize: 14 }}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <input
              type="date"
              value={form.date}
              onChange={(e) => update("date", e.target.value)}
              style={{ padding: "10px 14px", borderRadius: 8, border: `1px solid ${C.hair}`, fontSize: 14 }}
            />
            <input
              type="time"
              value={form.time}
              onChange={(e) => update("time", e.target.value)}
              style={{ padding: "10px 14px", borderRadius: 8, border: `1px solid ${C.hair}`, fontSize: 14 }}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <select
              value={form.table}
              onChange={(e) => update("table", e.target.value)}
              style={{ padding: "10px 14px", borderRadius: 8, border: `1px solid ${C.hair}`, fontSize: 14 }}
            >
              {TABLES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              placeholder="Pax"
              value={form.pax}
              onChange={(e) => update("pax", Number(e.target.value))}
              style={{ padding: "10px 14px", borderRadius: 8, border: `1px solid ${C.hair}`, fontSize: 14 }}
            />
          </div>

          {error && <div style={{ color: C.red, fontSize: 12.5 }}>{error}</div>}

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <Btn variant="ghost" onClick={onClose}>
              Cancel
            </Btn>
            <Btn type="submit" variant="primary">
              Save Reservation
            </Btn>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Front Desk / Reservations — the ONLY page a receptionist sees     */
/* ---------------------------------------------------------------- */
export default function Reservations() {
  const [range, setRange] = useState("Day");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [reservations, setReservations] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    setReservations(getReservations());
  }, []);

  const markArrived = (id) => {
    setReservations(updateReservationStatus(id, "Arrived"));
  };

  const handleSave = (form) => {
    setReservations(addReservation(form));
    setShowAddModal(false);
  };

  const selectedISO = toISO(selectedDate);

  // Filter reservations based on selected range
  const filtered = reservations.filter((r) => {
    if (range === "Day") return r.date === selectedISO;
    if (range === "Week") {
      const start = startOfWeek(selectedDate);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      const rDate = new Date(r.date);
      return rDate >= start && rDate <= end;
    }
    if (range === "Month") {
      const rDate = new Date(r.date);
      return rDate.getMonth() === selectedDate.getMonth() && rDate.getFullYear() === selectedDate.getFullYear();
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => (a.time > b.time ? 1 : -1));

  // Table availability derived from today's (selectedISO) reservations only
  const todaysReservations = reservations.filter((r) => r.date === selectedISO);
  const tableStatus = TABLES.map((table) => {
    const match = todaysReservations.find((r) => r.table === table);
    if (!match) return { table, status: "Available" };
    if (match.status === "Arrived") return { table, status: "Occupied" };
    return { table, status: `Reserved - ${match.time}` };
  });

  return (
    <div style={{ fontFamily: "Inter, sans-serif", minHeight: "100vh", background: C.canvas }}>
      <style>{`${FONT_IMPORT}
        * { box-sizing: border-box; }
      `}</style>

      <StaffHeader />

      <div style={{ padding: "24px 32px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontFamily: "'Prata', serif", fontSize: 24, fontWeight: 700, color: C.ink }}>Reservations</div>
          <div style={{ color: C.inkSoft, fontSize: 13, marginTop: 2 }}>Manage today's tables and bookings</div>
        </div>
        <Btn variant="primary" onClick={() => setShowAddModal(true)}>
          <Plus size={15} /> Add Reservation
        </Btn>
      </div>

      <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontWeight: 700, letterSpacing: 1, color: C.inkSoft, fontSize: 13 }}>
              {formatMonthLabel(selectedDate)}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", padding: "8px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600, boxShadow: "0 1px 2px rgba(0,0,0,0.06)" }}>
              {formatDisplayDate(selectedDate)}
            </div>
            <button
              onClick={() => setSelectedDate(shiftDate(selectedDate, range, "prev"))}
              style={{ border: "none", background: "#fff", borderRadius: 8, width: 32, height: 32, boxShadow: "0 1px 2px rgba(0,0,0,0.08)", cursor: "pointer" }}
            >
              <ChevronLeft size={15} style={{ margin: "auto" }} />
            </button>
            <button
              onClick={() => setSelectedDate(shiftDate(selectedDate, range, "next"))}
              style={{ border: "none", background: "#fff", borderRadius: 8, width: 32, height: 32, boxShadow: "0 1px 2px rgba(0,0,0,0.08)", cursor: "pointer" }}
            >
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
                  background: range === r ? C.void : "transparent",
                  color: range === r ? C.gold : C.ink,
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr 1fr", gap: 16, alignItems: "start" }}>
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "16px 18px 0" }}>
              <SectionTitle>Floor Plan</SectionTitle>
            </div>
            <div
              style={{
                margin: 18,
                marginTop: 0,
                height: 260,
                borderRadius: 12,
                background: "repeating-linear-gradient(45deg, #f4f2f6, #f4f2f6 10px, #eeecf0 10px, #eeecf0 20px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: C.inkSoft,
                fontSize: 12.5,
              }}
            >
              Table layout preview
            </div>
          </Card>

          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <SectionTitle>
                {range === "Day" ? "Reservations Today" : range === "Week" ? "Reservations This Week" : "Reservations This Month"}
              </SectionTitle>
              <span style={{ background: C.void, color: C.gold, fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 999, marginTop: -14 }}>
                {sorted.length}
              </span>
            </div>
            {sorted.length === 0 ? (
              <div style={{ color: C.inkSoft, fontSize: 13.5, textAlign: "center", padding: "30px 0" }}>
                No reservations for this {range.toLowerCase()}.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {sorted.map((r, i) => (
                  <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 16, borderBottom: i < sorted.length - 1 ? `1px solid ${C.hair}` : "none" }}>
                    <div style={{ display: "flex", gap: 16 }}>
                      <div style={{ fontWeight: 700, color: C.ink, fontSize: 14, width: 48 }}>{r.time}</div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: C.ink }}>{r.name}</div>
                        <div style={{ fontSize: 12.5, color: C.inkSoft }}>
                          {r.table} · {r.pax} pax {range !== "Day" ? `· ${r.date}` : ""}
                        </div>
                        <div style={{ fontSize: 12.5, color: C.inkSoft }}>
                          {r.phone} · {r.email}
                        </div>
                      </div>
                    </div>
                    {r.status === "Pending" ? (
                      <Btn variant="ghost" small onClick={() => markArrived(r.id)}>
                        Mark as arrived
                      </Btn>
                    ) : (
                      <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <SectionTitle>Table Availability</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: C.inkSoft, paddingBottom: 10, borderBottom: `1px solid ${C.hair}` }}>
                <span>Table</span>
                <span>Status</span>
              </div>
              {tableStatus.map((t) => (
                <div key={t.table} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${C.hair}`, fontSize: 13.5 }}>
                  <span style={{ fontWeight: 700, color: C.ink }}>{t.table}</span>
                  <span style={{ color: t.status === "Available" ? C.green : t.status === "Occupied" ? C.orange : C.red, fontWeight: 600 }}>
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {showAddModal && (
        <AddReservationModal
          defaultDate={selectedISO}
          onClose={() => setShowAddModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}