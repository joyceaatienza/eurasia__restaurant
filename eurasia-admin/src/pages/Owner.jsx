import React, { useState } from "react";
import {
  LayoutDashboard,
  CalendarCheck2,
  ChefHat,
  Wallet,
  Search,
  Bell,
  ChevronLeft,
  ChevronRight,
  Download,
  X,
  Check,
  Ban,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

/* ---------------------------------------------------------------- */
/* Design tokens — sampled from the Eurasia restaurant mockups       */
/* ---------------------------------------------------------------- */
const C = {
  void: "#170310",       // sidebar / header / login backdrop
  voidSoft: "#2a1018",   // sidebar hover
  canvas: "#f0eff3",     // page background
  card: "#ffffff",
  ink: "#201417",
  inkSoft: "#6b5b60",
  hair: "#e7e3e6",
  flame: "#fa293f",      // primary accent (buttons)
  gold: "#f5e9d8",
  azure: "#4b7ff7",
  violet: "#9b7ee0",
  amber: "#f2c14e",
  green: "#296c39",
  greenBg: "#e5f0e6",
  orange: "#cd8a5d",
  orangeBg: "#fbeee2",
  red: "#c53a3a",
  redBg: "#fbe7e7",
};

const FONT_IMPORT =
  "@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');";

/* ---------------------------------------------------------------- */
/* Mock data                                                         */
/* ---------------------------------------------------------------- */
const categoryBreakdown = [
  { name: "Best Seller", value: 3800 },
  { name: "Appetizer", value: 3150 },
  { name: "Main Course", value: 2550 },
  { name: "Pizza", value: 1900 },
  { name: "Dessert", value: 1250 },
  { name: "Drink", value: 3700 },
];

const salesTrend = [
  { month: "Jan '24", value: 7.5 },
  { month: "Apr '24", value: 13 },
  { month: "Jul '24", value: 16.5 },
  { month: "Oct '24", value: 18 },
  { month: "Jan '25", value: 18.8 },
  { month: "Apr '25", value: 19.2 },
  { month: "Jul '25", value: 19.6 },
  { month: "Oct '25", value: 19.8 },
  { month: "Jan '26", value: 20 },
];

const paymentMethods = [
  { name: "Cash", value: 50, color: C.azure },
  { name: "GCash", value: 22.7, color: C.amber },
  { name: "Bank Transfer", value: 22.7, color: C.violet },
  { name: "Paymaya", value: 4.5, color: "#f6df6d" },
];

const topSelling = [
  { name: "Pizza", amount: "Php. 300" },
  { name: "Ribs", amount: "Php. 300" },
  { name: "Cocktail", amount: "Php. 200" },
];

const orderStats = [
  { label: "Completed", value: 110, color: C.green },
  { label: "Pending", value: 4, color: C.amber },
  { label: "Cancelled", value: 7, color: C.red },
  { label: "No Shows", value: 2, color: C.inkSoft },
];

const todaysReservations = [
  { time: "11:15", name: "John Doe", table: "T7", pax: 7, phone: "0900 000 0000", email: "johndoe@gmail.com", status: "Completed" },
  { time: "11:15", name: "Jane Smith", table: "T11", pax: 4, phone: "0900 000 0000", email: "jane@gmail.com", status: "Arrived" },
  { time: "1:30", name: "Juan Dela Cruz", table: "T11", pax: 4, phone: "0900 000 0000", email: "juan@gmail.com", status: "Pending" },
];

const tableAvailability = [
  { table: "T1", status: "Available" },
  { table: "T2", status: "Reserved - 3:20pm" },
  { table: "T3", status: "Reserved - 5:30pm" },
  { table: "T4", status: "Reserved - 12pm" },
  { table: "T5", status: "Occupied" },
];

const kitchenItems = [
  { name: "Tom Ka Ghai - less spicy", qty: 1, price: 288 },
  { name: "Salpicao", qty: 1, price: 690 },
  { name: "Tutto Mare", qty: 1, price: 578 },
  { name: "Strawberry Yogurt Smoothie", qty: 2, price: 200 },
];

const kitchenOrders = [
  { id: "Order 01", customer: "John Doe", table: "Table 2", status: "Preparing", time: "12:47pm", items: kitchenItems, total: 1756 },
  { id: "Order 02", customer: "Jane Smith", table: "Table 8", status: "Waiting", time: "1:34pm", items: kitchenItems, total: 1756 },
  { id: "Order 03", customer: "Juan Dela Cruz", table: "Table 5", status: "Waiting", time: "1:45pm", items: kitchenItems.slice(0, 1), total: 1756 },
];

const transactions = [
  { id: "01", customer: "John Doe", method: "GCash", amount: "Php. 1,756", date: "June 8, 2026", time: "2:06pm", status: "Completed" },
  { id: "02", customer: "Jane Smith", method: "GCash", amount: "Php. 1,756", date: "June 8, 2026", time: "2:29pm", status: "Pending" },
  { id: "03", customer: "Juan Dela Cruz", method: "Bank Transfer", amount: "Php. 1,756", date: "June 8, 2026", time: "2:40pm", status: "Pending" },
];

/* ---------------------------------------------------------------- */
/* Small building blocks                                             */
/* ---------------------------------------------------------------- */
function Logo({ size = 34 }) {
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
    green: { bg: C.greenBg, fg: C.green },
    orange: { bg: C.orangeBg, fg: C.orange },
    red: { bg: C.redBg, fg: C.red },
    amber: { bg: "#fdf3df", fg: "#9c7a1f" },
  };
  const t = map[tone] || map.green;
  return (
    <span
      style={{
        background: t.bg,
        color: t.fg,
        fontSize: 12,
        fontWeight: 700,
        padding: "5px 12px",
        borderRadius: 999,
        whiteSpace: "nowrap",
      }}
    >
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

function Btn({ children, variant = "primary", onClick, small }) {
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
    transition: "opacity .15s ease",
  };
  const variants = {
    primary: { background: C.flame, color: "#fff" },
    dark: { background: C.void, color: C.gold },
    ghost: { background: "#fff", color: C.ink, border: `1px solid ${C.hair}` },
    subtle: { background: C.canvas, color: C.ink },
  };
  return (
    <button
      onClick={onClick}
      style={{ ...base, ...variants[variant] }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = 0.85)}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = 1)}
    >
      {children}
    </button>
  );
}

function Card({ children, style }) {
  return (
    <div
      style={{
        background: C.card,
        borderRadius: 16,
        padding: 22,
        boxShadow: "0 1px 3px rgba(23,3,16,0.06)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h3
      style={{
        fontFamily: "'Playfair Display', serif",
        fontWeight: 700,
        fontSize: 18,
        margin: "0 0 16px 0",
        color: C.ink,
      }}
    >
      {children}
    </h3>
  );
}

/* ---------------------------------------------------------------- */
/* Shell — sidebar + topbar                                          */
/* ---------------------------------------------------------------- */
const NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "frontdesk", label: "Front Desk", icon: CalendarCheck2 },
  { key: "kitchen", label: "Kitchen", icon: ChefHat },
  { key: "cashier", label: "Cashier", icon: Wallet },
];

function Sidebar({ active, setActive }) {
  return (
    <aside
      style={{
        width: 232,
        minWidth: 232,
        background: C.void,
        display: "flex",
        flexDirection: "column",
        padding: "28px 18px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px 32px" }}>
        <Logo />
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", color: C.gold, fontSize: 15, fontWeight: 700, lineHeight: 1.1 }}>
            EURASIA
          </div>
          <div style={{ color: "rgba(245,233,216,0.55)", fontSize: 10, letterSpacing: 1.5 }}>RESTAURANT</div>
        </div>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {NAV.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setActive(item.key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "11px 14px",
                borderRadius: 10,
                border: "none",
                cursor: "pointer",
                background: isActive ? C.flame : "transparent",
                color: isActive ? "#fff" : "rgba(245,233,216,0.75)",
                fontFamily: "Inter, sans-serif",
                fontSize: 14,
                fontWeight: 600,
                textAlign: "left",
              }}
            >
              <Icon size={17} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div style={{ marginTop: "auto", paddingTop: 20, borderTop: `1px solid rgba(245,233,216,0.12)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px" }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: C.gold,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              color: C.void,
              fontSize: 13,
            }}
          >
            A
          </div>
          <div>
            <div style={{ color: C.gold, fontSize: 13, fontWeight: 600 }}>Admin User</div>
            <div style={{ color: "rgba(245,233,216,0.5)", fontSize: 11 }}>Administrator</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function Topbar({ title, subtitle }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px 32px",
        background: C.card,
        borderBottom: `1px solid ${C.hair}`,
      }}
    >
      <div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: C.ink }}>{title}</div>
        {subtitle && <div style={{ color: C.inkSoft, fontSize: 13, marginTop: 2 }}>{subtitle}</div>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: C.canvas,
            padding: "8px 14px",
            borderRadius: 10,
            width: 220,
          }}
        >
          <Search size={15} color={C.inkSoft} />
          <span style={{ color: C.inkSoft, fontSize: 13 }}>Search…</span>
        </div>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            background: C.canvas,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Bell size={16} color={C.ink} />
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Dashboard page                                                    */
/* ---------------------------------------------------------------- */
function StatCard({ label, value }) {
  return (
    <Card style={{ padding: "18px 20px" }}>
      <div style={{ color: C.inkSoft, fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: C.ink }}>{value}</div>
    </Card>
  );
}

function DashboardPage() {
  return (
    <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <Btn variant="ghost" small>
          Today
        </Btn>
        <Btn variant="dark" small>
          <Download size={14} /> Export
        </Btn>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        <StatCard label="Total Revenue" value="₱ 12,324.21" />
        <StatCard label="Total Orders" value="173" />
        <StatCard label="Total Amount Deducted (Discounts)" value="₱ 424.19" />
        <StatCard label="Total Guests" value="164" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: 16 }}>
        <Card>
          <SectionTitle>Category Breakdown</SectionTitle>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={categoryBreakdown}>
              <CartesianGrid vertical={false} stroke={C.hair} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: C.inkSoft }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: C.inkSoft }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="value" fill={C.azure} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionTitle>Top Selling Items</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {topSelling.map((it) => (
              <div key={it.name} style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                <span style={{ color: C.ink, fontWeight: 600 }}>{it.name}</span>
                <span style={{ color: C.inkSoft }}>{it.amount}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle>Order &amp; Cancellation Stats</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {orderStats.map((s) => (
              <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13.5, color: C.ink, fontWeight: 600 }}>{s.label}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr 1fr", gap: 16 }}>
        <Card>
          <SectionTitle>Payment Method Analysis</SectionTitle>
          <ResponsiveContainer width="100%" height={190}>
            <PieChart>
              <Pie data={paymentMethods} dataKey="value" nameKey="name" innerRadius={0} outerRadius={80}>
                {paymentMethods.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 4 }}>
            {paymentMethods.map((p) => (
              <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: C.inkSoft }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: p.color, display: "inline-block" }} />
                {p.name} {p.value}%
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle>Sales Trends</SectionTitle>
          <ResponsiveContainer width="100%" height={190}>
            <LineChart data={salesTrend}>
              <CartesianGrid vertical={false} stroke={C.hair} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: C.inkSoft }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: C.inkSoft }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke={C.azure} strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionTitle>Revenue &amp; Profit Summary</SectionTitle>
          <div style={{ marginBottom: 18 }}>
            <div style={{ color: C.inkSoft, fontSize: 12.5, fontWeight: 600 }}>Total Revenue</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: C.green }}>
              ₱ 12,324.21 ↗
            </div>
          </div>
          <div>
            <div style={{ color: C.inkSoft, fontSize: 12.5, fontWeight: 600 }}>Estimated Profit</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: C.green }}>
              ₱ 3,862.37 ↗
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Front Desk page                                                   */
/* ---------------------------------------------------------------- */
function FrontDeskPage() {
  const [range, setRange] = useState("Day");
  const [reservations, setReservations] = useState(todaysReservations);

  const markArrived = (idx) =>
    setReservations((prev) => prev.map((r, i) => (i === idx ? { ...r, status: "Arrived" } : r)));

  return (
    <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontWeight: 700, letterSpacing: 1, color: C.inkSoft, fontSize: 13 }}>JULY 2026</span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: C.canvas,
              padding: "8px 14px",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            4 Jul 2026
          </div>
          <button style={{ border: "none", background: "#fff", borderRadius: 8, width: 32, height: 32, boxShadow: "0 1px 2px rgba(0,0,0,0.08)", cursor: "pointer" }}>
            <ChevronLeft size={15} style={{ margin: "auto" }} />
          </button>
          <button style={{ border: "none", background: "#fff", borderRadius: 8, width: 32, height: 32, boxShadow: "0 1px 2px rgba(0,0,0,0.08)", cursor: "pointer" }}>
            <ChevronRight size={15} style={{ margin: "auto" }} />
          </button>
        </div>
        <div style={{ display: "flex", gap: 6, background: C.canvas, padding: 4, borderRadius: 10 }}>
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
            <SectionTitle>Today's Reservations</SectionTitle>
            <span
              style={{
                background: C.void,
                color: C.gold,
                fontSize: 11,
                fontWeight: 700,
                padding: "3px 9px",
                borderRadius: 999,
                marginTop: -14,
              }}
            >
              {reservations.length}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {reservations.map((r, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 16, borderBottom: i < reservations.length - 1 ? `1px solid ${C.hair}` : "none" }}>
                <div style={{ display: "flex", gap: 16 }}>
                  <div style={{ fontWeight: 700, color: C.ink, fontSize: 14, width: 44 }}>{r.time}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: C.ink }}>{r.name}</div>
                    <div style={{ fontSize: 12.5, color: C.inkSoft }}>
                      {r.table} · {r.pax} pax
                    </div>
                    <div style={{ fontSize: 12.5, color: C.inkSoft }}>
                      {r.phone} · {r.email}
                    </div>
                  </div>
                </div>
                {r.status === "Pending" ? (
                  <Btn variant="ghost" small onClick={() => markArrived(i)}>
                    Mark as arrived
                  </Btn>
                ) : (
                  <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle>Table Availability</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: C.inkSoft, paddingBottom: 10, borderBottom: `1px solid ${C.hair}` }}>
              <span>Table</span>
              <span>Status</span>
            </div>
            {tableAvailability.map((t) => (
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
  );
}

/* ---------------------------------------------------------------- */
/* Kitchen page                                                      */
/* ---------------------------------------------------------------- */
function KitchenPage() {
  const [orders, setOrders] = useState(kitchenOrders);

  const advance = (idx) =>
    setOrders((prev) =>
      prev.map((o, i) => (i === idx ? { ...o, status: o.status === "Waiting" ? "Preparing" : "Ready" } : o))
    );

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
        {orders.map((o, idx) => (
          <Card key={o.id} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 16, color: C.ink }}>{o.id}</div>
                <div style={{ fontSize: 12.5, color: C.inkSoft }}>
                  {o.customer} · {o.table}
                </div>
              </div>
              <Badge tone={o.status === "Preparing" ? "amber" : o.status === "Ready" ? "green" : "red"}>{o.status}</Badge>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {o.items.map((it) => (
                <div key={it.name} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: C.ink }}>
                    ({it.qty}) {it.name}
                  </span>
                  <span style={{ color: C.inkSoft }}>Php. {it.price}</span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: `1px solid ${C.hair}` }}>
              <span style={{ fontWeight: 700, color: C.ink }}>Php. {o.total.toLocaleString()}</span>
              <span style={{ fontSize: 12, color: C.inkSoft }}>{o.time}</span>
            </div>

            {o.status !== "Ready" && (
              <Btn variant={o.status === "Waiting" ? "ghost" : "primary"} onClick={() => advance(idx)}>
                {o.status === "Waiting" ? "Start Preparing" : "Mark as Ready"}
              </Btn>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Cashier page                                                      */
/* ---------------------------------------------------------------- */
function CashierPage() {
  const [rows, setRows] = useState(transactions);
  const [modalRow, setModalRow] = useState(null);

  const resolve = (status) => {
    setRows((prev) => prev.map((r) => (r.id === modalRow.id ? { ...r, status } : r)));
    setModalRow(null);
  };

  const pending = rows.filter((r) => r.status === "Pending").length;
  const completed = rows.filter((r) => r.status === "Completed").length;

  return (
    <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        <StatCard label="Pending Payments" value={pending} />
        <StatCard label="Today's Transactions" value={rows.length} />
        <StatCard label="Completed Payments" value={completed} />
      </div>

      <Card style={{ padding: 0 }}>
        <div style={{ padding: "20px 22px 0" }}>
          <SectionTitle>Payment Transactions</SectionTitle>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", fontSize: 12, color: C.inkSoft }}>
              {["Order #", "Customer", "Method", "Amount", "Status", "Date & Time", "Actions"].map((h) => (
                <th key={h} style={{ padding: "10px 22px", borderBottom: `1px solid ${C.hair}`, fontWeight: 700 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} style={{ fontSize: 13.5 }}>
                <td style={{ padding: "16px 22px", borderBottom: `1px solid ${C.hair}`, fontWeight: 700 }}>{r.id}</td>
                <td style={{ padding: "16px 22px", borderBottom: `1px solid ${C.hair}` }}>{r.customer}</td>
                <td style={{ padding: "16px 22px", borderBottom: `1px solid ${C.hair}` }}>{r.method}</td>
                <td style={{ padding: "16px 22px", borderBottom: `1px solid ${C.hair}` }}>{r.amount}</td>
                <td style={{ padding: "16px 22px", borderBottom: `1px solid ${C.hair}` }}>
                  <Badge tone={r.status === "Completed" ? "green" : "amber"}>{r.status}</Badge>
                </td>
                <td style={{ padding: "16px 22px", borderBottom: `1px solid ${C.hair}`, color: C.inkSoft }}>
                  {r.date} · {r.time}
                </td>
                <td style={{ padding: "16px 22px", borderBottom: `1px solid ${C.hair}` }}>
                  {r.status === "Pending" ? (
                    <Btn small variant="primary" onClick={() => setModalRow(r)}>
                      Validate
                    </Btn>
                  ) : (
                    <Btn small variant="ghost">
                      Refund
                    </Btn>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {modalRow && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(23,3,16,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
          onClick={() => setModalRow(null)}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, padding: 26, width: 380 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
              <div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 19 }}>Validate Payment</div>
                <div style={{ color: C.inkSoft, fontSize: 12.5, marginTop: 2 }}>Verify and confirm the payment.</div>
              </div>
              <button onClick={() => setModalRow(null)} style={{ border: "none", background: "transparent", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 10, fontSize: 13.5 }}>
              {[
                ["Customer", modalRow.customer],
                ["Order #", modalRow.id],
                ["Payment Method", modalRow.method],
                ["Amount", modalRow.amount],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: C.inkSoft }}>{k}</span>
                  <span style={{ fontWeight: 700, color: C.ink }}>{v}</span>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: 16,
                height: 90,
                borderRadius: 10,
                border: `1px dashed ${C.hair}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                color: C.inkSoft,
                textAlign: "center",
                padding: 10,
              }}
            >
              Proof of payment (uploaded by customer)
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              <Btn variant="ghost" onClick={() => setModalRow(null)}>
                Cancel
              </Btn>
              <Btn variant="ghost" onClick={() => resolve("Failed")}>
                <Ban size={14} /> Mark as Failed
              </Btn>
              <Btn variant="primary" onClick={() => resolve("Completed")}>
                <Check size={14} /> Confirm Payment
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Root                                                               */
/* ---------------------------------------------------------------- */
const PAGES = {
  dashboard: { title: "Sales Overview", subtitle: "Track revenue, orders and guest activity", Comp: DashboardPage },
  frontdesk: { title: "Reservations", subtitle: "Manage today's tables and bookings", Comp: FrontDeskPage },
  kitchen: { title: "Kitchen", subtitle: "Order queue and preparation status", Comp: KitchenPage },
  cashier: { title: "Cashier", subtitle: "Review and validate payments", Comp: CashierPage },
};

export default function EurasiaAdmin() {
  const [active, setActive] = useState("dashboard");
  const page = PAGES[active];
  const Page = page.Comp;

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <style>{`${FONT_IMPORT}
        * { box-sizing: border-box; }
      `}</style>
      <div style={{ display: "flex", minHeight: "100vh", background: C.canvas }}>
        <Sidebar active={active} setActive={setActive} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <Topbar title={page.title} subtitle={page.subtitle} />
          <div style={{ flex: 1, overflow: "auto" }}>
            <Page />
          </div>
        </div>
      </div>
    </div>
  );
}