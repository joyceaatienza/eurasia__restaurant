import React, { useState } from "react";
import {
  LayoutDashboard,
  CalendarCheck2,
  ChefHat,
  Wallet,
  Download,
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
import logo from "../assets/logopic3.png";
import Reservations from "./Reservations";
import OrderQueue from "./OrderQueue";
import PaymentTransactions from "./PaymentTransactions";

const C = {
  void: "#1d080f",
  voidSoft: "#2a1018",
  canvas: "#f0eff3",
  card: "#ffffff",
  sidebarBg: "#ffffff",
  ink: "#1d080f",
  inkSoft: "#6b5b60",
  hair: "#e7e3e6",
  flame: "#fa293f",
  gold: "#f5e9d8",
  azure: "#4b7ff7",
  violet: "#9b7ee0",
  amber: "#f2c14e",
  green: "#296c39",
  orange: "#cd8a5d",
  red: "#c53a3a",
};

const FONT_IMPORT =
  "@import url('https://fonts.googleapis.com/css2?family=Prata&display=swap');";

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

function Btn({ children, variant = "primary", onClick, small }) {
  const base = {
    border: "none",
    borderRadius: 10,
    fontFamily: "'Prata', serif",
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
    <button onClick={onClick} style={{ ...base, ...variants[variant] }}>
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
    <h3 style={{ fontFamily: "'Prata', serif", fontSize: 18, margin: "0 0 16px 0", color: C.ink, WebkitTextStroke: "0.4px " + C.ink }}>
      {children}
    </h3>
  );
}

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "frontdesk", label: "Front Desk", icon: CalendarCheck2 },
  { key: "kitchen", label: "Kitchen", icon: ChefHat },
  { key: "cashier", label: "Cashier", icon: Wallet },
];

function Sidebar({ active, setActive }) {
  return (
    <aside style={{ width: 232, minWidth: 232, background: C.sidebarBg, borderRight: `1px solid ${C.hair}`, display: "flex", flexDirection: "column", padding: "24px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 8px 28px 8px" }}>
        <img src={logo} alt="Eurasia Restaurant" style={{ height: 42, width: 42, objectFit: "contain", borderRadius: "50%", background: "rgba(29,8,15,0.05)", padding: 2 }} />
        <div>
          <div style={{ fontFamily: "'Prata', serif", color: C.ink, fontSize: 16, lineHeight: 1.1, letterSpacing: "0.5px", WebkitTextStroke: "0.4px " + C.ink }}>
            EURASIA
          </div>
          <div style={{ color: C.inkSoft, fontSize: 9.5, letterSpacing: 1.8, marginTop: 2 }}>
            RESTAURANT
          </div>
        </div>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {NAV.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <button key={item.key} onClick={() => setActive(item.key)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 10, border: "none", cursor: "pointer", background: isActive ? C.flame : "transparent", color: isActive ? "#ffffff" : C.inkSoft, fontFamily: "'Prata', serif", fontSize: 14, fontWeight: 600, textAlign: "left", transition: "all 0.15s ease" }}>
              <Icon size={17} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div style={{ marginTop: "auto", paddingTop: 20, borderTop: `1px solid ${C.hair}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px" }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: C.void, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: C.gold, fontSize: 13 }}>
            A
          </div>
          <div>
            <div style={{ color: C.ink, fontSize: 13, fontWeight: 600 }}>Admin User</div>
            <div style={{ color: C.inkSoft, fontSize: 11 }}>Administrator</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function Topbar({ title, subtitle }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 32px", background: C.void, borderBottom: `1px solid rgba(245,233,216,0.1)` }}>
      <div>
        <div style={{ fontFamily: "'Prata', serif", fontSize: 24, color: C.gold, WebkitTextStroke: "0.5px " + C.gold }}>
          {title}
        </div>
        {subtitle && <div style={{ color: "rgba(245,233,216,0.65)", fontSize: 13, marginTop: 2 }}>{subtitle}</div>}
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <Card style={{ padding: "18px 20px" }}>
      <div style={{ color: C.inkSoft, fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: "'Prata', serif", fontSize: 24, color: C.ink, WebkitTextStroke: "0.5px " + C.ink }}>{value}</div>
    </Card>
  );
}

function DashboardPage() {
  return (
    <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <Btn variant="ghost" small>Today</Btn>
        <Btn variant="dark" small><Download size={14} /> Export</Btn>
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
            <div style={{ fontFamily: "'Prata', serif", fontSize: 22, color: C.green, WebkitTextStroke: "0.4px " + C.green }}>
              ₱ 12,324.21 ↗
            </div>
          </div>
          <div>
            <div style={{ color: C.inkSoft, fontSize: 12.5, fontWeight: 600 }}>Estimated Profit</div>
            <div style={{ fontFamily: "'Prata', serif", fontSize: 22, color: C.green, WebkitTextStroke: "0.4px " + C.green }}>
              ₱ 3,862.37 ↗
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}


function FrontDeskPage() {
  return <Reservations embedded />;
}

function KitchenPage() {
  return <OrderQueue embedded />;
}

function CashierPage() {
  return <PaymentTransactions embedded />;
}

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
    <div style={{ fontFamily: "'Prata', serif", textAlign: "left" }}>
      <style>{`
        ${FONT_IMPORT}
        * { box-sizing: border-box; }
      `}</style>
      <div style={{ display: "flex", minHeight: "100vh", background: C.canvas, textAlign: "left" }}>
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