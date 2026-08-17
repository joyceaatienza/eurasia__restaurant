import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarCheck2,
  ChefHat,
  Wallet,
  Download,
  LogOut,
  Wallet2,
  ShoppingBag,
  Percent,
  Users,
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
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import logo from "../assets/logopic3.png";
import logoWord from "../assets/logoword.png";
import Reservations from "./Reservations";
import OrderQueue from "./OrderQueue";
import PaymentTransactions from "./PaymentTransactions";
import SettingsModal from "../components/SettingsModal";
import { History as HistoryIcon } from "lucide-react";
import { getPayments } from "../utils/paymentsStore";
import { getReservations } from "../utils/reservationsStore";
import { getOrders } from "../utils/ordersStore";

function to12h(time24) {
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "pm" : "am";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

const C = {
  void: "#1d080f",
  voidSoft: "#2a1018",
  canvas: "#f0eff3",
  card: "#ffffff",
  sidebarBg: "#ffffff",
  ink: "#1d080f",
  inkSoft: "#6b5b60",
  hair: "#e7e3e6",
  flame: "#1d080f",
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
  { name: "Appetizers", value: 2400 },
  { name: "Main Courses", value: 3800 },
  { name: "Soup", value: 1450 },
  { name: "Salad", value: 1200 },
  { name: "Pasta", value: 0 },
  { name: "Noodles", value: 0 },
  { name: "Veggies & Rice", value: 0 },
  { name: "Sandwiches", value: 0 },
  { name: "Pizza", value: 3700 },
  { name: "Kids Menu", value: 0 },
  { name: "Dessert", value: 0 },
  { name: "Chef's Special", value: 0 },
  { name: "Beverage", value: 0 },
];

const salesTrendByPeriod = {
  Today: [
    { label: "11am", value: 4 },
    { label: "1pm", value: 9 },
    { label: "3pm", value: 7 },
    { label: "5pm", value: 12 },
    { label: "7pm", value: 18 },
    { label: "9pm", value: 15 },
  ],
  Week: [
    { label: "Mon", value: 12 },
    { label: "Tue", value: 15 },
    { label: "Wed", value: 11 },
    { label: "Thu", value: 17 },
    { label: "Fri", value: 22 },
    { label: "Sat", value: 28 },
    { label: "Sun", value: 20 },
  ],
  Month: [
    { label: "Week 1", value: 65 },
    { label: "Week 2", value: 72 },
    { label: "Week 3", value: 68 },
    { label: "Week 4", value: 80 },
  ],
  Year: [
    { label: "Jan '24", value: 7.5 },
    { label: "Apr '24", value: 13 },
    { label: "Jul '24", value: 16.5 },
    { label: "Oct '24", value: 18 },
    { label: "Jan '25", value: 18.8 },
    { label: "Apr '25", value: 19.2 },
    { label: "Jul '25", value: 19.6 },
    { label: "Oct '25", value: 19.8 },
    { label: "Jan '26", value: 20 },
  ],
};

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
    <div
      style={{
        background: C.card,
        borderRadius: 22,
        padding: 22,
        boxShadow: "0 2px 8px rgba(23,3,16,0.05)",
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
        fontFamily: "'Prata', serif",
        fontSize: 18,
        margin: "0 0 16px 0",
        color: C.ink,
        WebkitTextStroke: "0.4px " + C.ink,
      }}
    >
      {children}
    </h3>
  );
}

function Badge({ tone = "green", children }) {
  const tones = {
    green: { background: "#e6f4ea", color: C.green },
    red: { background: "#fbeaea", color: C.red },
    amber: { background: "#fdf3dd", color: "#a06a00" },
  };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 11.5,
        fontWeight: 700,
        ...tones[tone],
      }}
    >
      {children}
    </span>
  );
}

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "frontdesk", label: "Front Desk", icon: CalendarCheck2 },
  { key: "kitchen", label: "Kitchen", icon: ChefHat },
  { key: "cashier", label: "Cashier", icon: Wallet },
  { key: "history", label: "History", icon: HistoryIcon },
];

function TopHeader({ onLogoClick }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 32px",
      }}
    >
      <button
        onClick={onLogoClick}
        style={{
          border: "none",
          background: "transparent",
          cursor: "pointer",
          padding: 0,
          display: "flex",
        }}
      >
        <img
          src={logoWord}
          alt="Eurasia Restaurant Logo"
          style={{
            height: 45,
            width: "auto",
            objectFit: "contain",
          }}
        />
      </button>
    </div>
  );
}

function Topbar({ title, subtitle }) {
  return (
    <div
      style={{
        padding: "20px 28px 8px 28px",
        background: "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div>
        <h1
          style={{
            fontFamily: "'Prata', serif",
            fontSize: 39,
            margin: 0,
            color: C.ink,
            WebkitTextStroke: "0.5px " + C.ink,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p style={{ margin: "4px 0 0 0", fontSize: 13, color: C.inkSoft }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

function Sidebar({ active, setActive, collapsed }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const [showSettings, setShowSettings] = useState(false);
  const [avatarColor, setAvatarColor] = useState(
    localStorage.getItem("eurasia_avatar_color") || C.gold
  );

  const savedName = localStorage.getItem("eurasia_name");
  const savedRole = localStorage.getItem("eurasia_role");
  const displayName = savedName || "Admin User";
  const displayRole = savedRole || "Administrator";

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("eurasia_role");
    localStorage.removeItem("eurasia_name");
    navigate("/login");
  };

  return (
   <aside
  style={{
    width: collapsed ? 64 : 240,
    minWidth: collapsed ? 64 : 240,
    height: "100vh",
    position: "sticky",
    top: 0,
    alignSelf: "flex-start",
    background: C.void,
    display: "flex",
    flexDirection: "column",
    padding: collapsed ? "24px 12px" : "22px 16px",
    borderTopRightRadius: 24,
    transition:
      "width 0.25s ease, min-width 0.25s ease, padding 0.25s ease",
  }}
>
      <nav style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {NAV.map((item) => {
  const Icon = item.icon;
  const isActive = active === item.key;
  return (
    <div key={item.key} style={{ position: "relative" }} className="sidebar-nav-item">
      <button
        onClick={() => setActive(item.key)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: collapsed ? "12px 0" : "11px 14px",
          justifyContent: collapsed ? "center" : "flex-start",
          borderRadius: 10,
          border: "none",
          cursor: "pointer",
          background: isActive ? C.flame : "transparent",
          color: isActive ? "#ffffff" : "rgba(245,233,216,0.75)",
          fontFamily: "'Prata', serif",
          fontSize: 14,
          fontWeight: 600,
          textAlign: "left",
          transition: "all 0.15s ease",
          whiteSpace: "nowrap",
          width: "100%",
        }}
      >
        <Icon size={17} style={{ flexShrink: 0 }} />
        <span
          style={{
            opacity: collapsed ? 0 : 1,
            width: collapsed ? 0 : "auto",
            overflow: "hidden",
            transition: "opacity 0.2s ease",
          }}
        >
          {item.label}
        </span>
      </button>

      {collapsed && (
        <span
          className="sidebar-tooltip"
          style={{
            position: "absolute",
            left: "calc(100% + 10px)",
            top: "50%",
            transform: "translateY(-50%)",
            background: C.void,
            color: "#f5e9d8",
            fontFamily: "'Prata', serif",
            fontSize: 12.5,
            fontWeight: 600,
            padding: "6px 12px",
            borderRadius: 6,
            whiteSpace: "nowrap",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            opacity: 0,
            pointerEvents: "none",
            transition: "opacity 0.15s ease",
            zIndex: 50,
          }}
        >
          {item.label}
        </span>
      )}
    </div>
  );
})}
      </nav>

      <div
        style={{
          marginTop: "auto",
          paddingTop: 20,
          borderTop: `1px solid rgba(245,233,216,0.15)`,
          position: "relative",
        }}
        ref={menuRef}
      >
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            width: "100%",
            justifyContent: collapsed ? "center" : "flex-start",
            textAlign: "left",
            borderRadius: 10,
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: avatarColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              color: "#fff",
              fontSize: 13,
              flexShrink: 0,
            }}
          >
            {displayName.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div style={{ whiteSpace: "nowrap", overflow: "hidden" }}>
              <div style={{ color: C.gold, fontSize: 13, fontWeight: 600 }}>
                {displayName}
              </div>
              <div
                style={{
                  color: "rgba(245,233,216,0.55)",
                  fontSize: 11,
                  textTransform: "capitalize",
                }}
              >
                {displayRole}
              </div>
            </div>
          )}
        </button>

        {menuOpen && (
  <div
    style={{
      position: "absolute",
      bottom: collapsed ? "auto" : "100%",
      top: collapsed ? 0 : "auto",
      left: collapsed ? "calc(100% + 10px)" : 8,
      right: collapsed ? "auto" : 8,
      marginBottom: collapsed ? 0 : 6,
      width: collapsed ? 160 : "auto",
      background: "#fff",
      borderRadius: 10,
      boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
      overflow: "hidden",
      zIndex: 20,
    }}
  >
            <button
              onClick={() => {
                setShowSettings(true);
                setMenuOpen(false);
              }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 16px",
                border: "none",
                background: "#fff",
                cursor: "pointer",
                fontFamily: "'Prata', serif",
                fontSize: 13,
                color: C.ink,
                textAlign: "left",
                borderBottom: "1px solid #eee",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#f7f5f6")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#fff")
              }
            >
              Settings
            </button>

            <button
              onClick={handleLogout}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 16px",
                border: "none",
                background: "#fff",
                cursor: "pointer",
                fontFamily: "'Prata', serif",
                fontSize: 13,
                color: "#c0392b",
                textAlign: "left",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#faf2f2")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#fff")
              }
            >
              <LogOut size={15} /> Log out
            </button>
          </div>
        )}
      </div>

      {showSettings && (
        <SettingsModal
          onClose={() => {
            setShowSettings(false);
            setAvatarColor(
              localStorage.getItem("eurasia_avatar_color") || C.gold
            );
          }}
        />
      )}
    </aside>
  );
}

function StatCard({ label, value, icon: Icon }) {
  return (
    <Card style={{ padding: "20px 22px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 14,
        }}
      >
        <div style={{ color: C.inkSoft, fontSize: 12.5, fontWeight: 600 }}>
          {label}
        </div>
        {Icon && (
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: "#f3e3e6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon size={16} color={C.void} />
          </div>
        )}
      </div>
      <div
        style={{
          fontFamily: "'Prata', serif",
          fontSize: 24,
          color: C.ink,
          WebkitTextStroke: "0.5px " + C.ink,
        }}
      >
        {value}
      </div>
    </Card>
  );
}

function PeriodDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const options = ["Today", "Week", "Month", "Year"];

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div style={{ position: "relative" }} ref={ref}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        style={{
          border: `1px solid ${C.hair}`,
          borderRadius: 10,
          fontFamily: "'Prata', serif",
          fontSize: 13,
          padding: "9px 16px",
          background: "#fff",
          color: C.ink,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {value}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "110%",
            right: 0,
            background: "#fff",
            borderRadius: 10,
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            overflow: "hidden",
            minWidth: 130,
            zIndex: 20,
          }}
        >
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "10px 16px",
                border: "none",
                background: opt === value ? C.canvas : "#fff",
                cursor: "pointer",
                fontFamily: "'Prata', serif",
                fontSize: 13,
                color: C.ink,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = C.canvas)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background =
                  opt === value ? C.canvas : "#fff")
              }
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DashboardPage() {
  const [period, setPeriod] = useState("Today");
  const [showExportToast, setShowExportToast] = useState(false);

  const trendData = salesTrendByPeriod[period] || salesTrendByPeriod.Year;

  const handleExport = () => {
    setShowExportToast(true);
    setTimeout(() => setShowExportToast(false), 3000);
  };

  return (
    <div style={{ padding: 28 }}>
      <div
        style={{
          fontFamily: "'Prata', serif",
          fontSize: 39,
          color: C.ink,
          WebkitTextStroke: "0.4px " + C.ink,
          marginBottom: 20,
        }}
      >
        Sales Overview
      </div>

      <div
        style={{
          padding: 24,
          background: "#faf7f6",
          borderRadius: 28,
          display: "flex",
          flexDirection: "column",
          gap: 20,
          boxShadow: "0 4px 24px rgba(23,3,16,0.06)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <PeriodDropdown value={period} onChange={setPeriod} />
          <Btn variant="dark" small onClick={handleExport}>
            <Download size={14} /> Export
          </Btn>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
          }}
        >
          <StatCard label="Total Revenue" value="₱ 12,324.21" icon={Wallet2} />
          <StatCard label="Total Orders" value="173" icon={ShoppingBag} />
          <StatCard
            label="Total Amount Deducted (Discounts)"
            value="₱ 424.19"
            icon={Percent}
          />
          <StatCard label="Total Guests" value="164" icon={Users} />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.6fr 1fr",
            gap: 16,
          }}
        >
          <Card>
            <SectionTitle>Category Breakdown</SectionTitle>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={categoryBreakdown} margin={{ bottom: 60 }}>
                <CartesianGrid vertical={false} stroke={C.hair} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: C.inkSoft }}
                  axisLine={false}
                  tickLine={false}
                  angle={-40}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: C.inkSoft }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip />
                <Bar dataKey="value" fill={C.azure} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <SectionTitle>Top Selling Items</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {topSelling.map((it) => (
                <div
                  key={it.name}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 14,
                  }}
                >
                  <span style={{ color: C.ink, fontWeight: 600 }}>
                    {it.name}
                  </span>
                  <span style={{ color: C.inkSoft }}>{it.amount}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.6fr 1fr",
            gap: 16,
          }}
        >
          <Card>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 18,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: "'Prata', serif",
                    fontSize: 16,
                    color: C.ink,
                    WebkitTextStroke: "0.3px " + C.ink,
                  }}
                >
                  Sales Trends
                </div>
                <div
                  style={{ color: C.inkSoft, fontSize: 11.5, marginTop: 2 }}
                >
                  Performance overview
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontFamily: "'Prata', serif",
                    fontSize: 22,
                    color: C.ink,
                    WebkitTextStroke: "0.4px " + C.ink,
                  }}
                >
                  {trendData[trendData.length - 1].value}K
                </div>
                <div
                  style={{
                    color: C.green,
                    fontSize: 11.5,
                    fontWeight: 700,
                    marginTop: 2,
                  }}
                >
                  +{" "}
                  {(
                    ((trendData[trendData.length - 1].value -
                      trendData[trendData.length - 2].value) /
                      trendData[trendData.length - 2].value) *
                    100
                  ).toFixed(1)}
                  % than last period
                </div>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={200}>
              <AreaChart
                data={trendData}
                margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="salesGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor={C.azure} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={C.azure} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  stroke={C.hair}
                  strokeDasharray="4 4"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: C.inkSoft }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: C.inkSoft }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={C.azure}
                  strokeWidth={2.5}
                  fill="url(#salesGradient)"
                  dot={{ r: 3, fill: C.azure, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: C.azure }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <SectionTitle>Order &amp; Cancellation Stats</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {orderStats.map((s) => (
                <div
                  key={s.label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: 13.5,
                      color: C.ink,
                      fontWeight: 600,
                    }}
                  >
                    {s.label}
                  </span>
                  <span
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: s.color,
                    }}
                  >
                    {s.value}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
          }}
        >
          <Card>
            <SectionTitle>Payment Method Analysis</SectionTitle>
            <ResponsiveContainer width="100%" height={190}>
              <PieChart>
                <Pie
                  data={paymentMethods}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={0}
                  outerRadius={80}
                >
                  {paymentMethods.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
                marginTop: 4,
              }}
            >
              {paymentMethods.map((p) => (
                <div
                  key={p.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 11.5,
                    color: C.inkSoft,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 2,
                      background: p.color,
                      display: "inline-block",
                    }}
                  />
                  {p.name} {p.value}%
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionTitle>Revenue &amp; Profit Summary</SectionTitle>
            <div style={{ marginBottom: 18 }}>
              <div
                style={{ color: C.inkSoft, fontSize: 12.5, fontWeight: 600 }}
              >
                Total Revenue
              </div>
              <div
                style={{
                  fontFamily: "'Prata', serif",
                  fontSize: 22,
                  color: C.green,
                  WebkitTextStroke: "0.4px " + C.green,
                }}
              >
                ₱ 12,324.21 ↗
              </div>
            </div>
            <div>
              <div
                style={{ color: C.inkSoft, fontSize: 12.5, fontWeight: 600 }}
              >
                Estimated Profit
              </div>
              <div
                style={{
                  fontFamily: "'Prata', serif",
                  fontSize: 22,
                  color: C.green,
                  WebkitTextStroke: "0.4px " + C.green,
                }}
              >
                ₱ 3,862.37 ↗
              </div>
            </div>
          </Card>
        </div>

        {showExportToast && (
          <div
            style={{
              position: "fixed",
              bottom: 28,
              right: 28,
              background: C.void,
              color: "#fff",
              padding: "14px 20px",
              borderRadius: 10,
              boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
              fontFamily: "'Prata', serif",
              fontSize: 13.5,
              display: "flex",
              alignItems: "center",
              gap: 10,
              zIndex: 100,
            }}
          >
            <span
              style={{
                background: C.green,
                borderRadius: "50%",
                width: 20,
                height: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
              }}
            >
              ✓
            </span>
            Data exported successfully
          </div>
        )}
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

function HistoryPage() {
  const [tab, setTab] = useState("reservations");
  const [completedReservations, setCompletedReservations] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    setCompletedReservations(getReservations().filter((r) => r.status === "Completed"));
    setCompletedOrders(getOrders().filter((o) => o.status === "Ready"));
    setPayments(getPayments().filter((p) => p.status === "Completed" || p.status === "Failed"));
  }, []);

  const tabs = [
    { key: "reservations", label: "Reservations" },
    { key: "orders", label: "Orders" },
    { key: "payments", label: "Payments" },
  ];

  return (
    <div style={{ padding: 28 }}>
      <div style={{ fontFamily: "'Prata', serif", fontSize: 39, color: C.ink, WebkitTextStroke: "0.4px " + C.ink, marginBottom: 20 }}>
        History
      </div>

      <div style={{ display: "flex", gap: 6, background: "#fff", padding: 4, borderRadius: 10, width: "fit-content", marginBottom: 20, boxShadow: "0 1px 3px rgba(23,3,16,0.06)" }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              border: "none",
              borderRadius: 8,
              padding: "9px 18px",
              fontSize: 13,
              fontFamily: "'Prata', serif",
              cursor: "pointer",
              background: tab === t.key ? C.void : "transparent",
              color: tab === t.key ? "#f5e9d8" : C.ink,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "reservations" && (
        <Card style={{ padding: 0 }}>
          {completedReservations.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: C.inkSoft, fontSize: 13 }}>No completed reservations yet.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", fontSize: 12, color: C.inkSoft }}>
                  {["Date", "Time", "Name", "Table", "Pax"].map((h) => (
                    <th key={h} style={{ padding: "12px 20px", borderBottom: `1px solid ${C.hair}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {completedReservations.map((r) => (
                  <tr key={r.id} style={{ fontSize: 13.5 }}>
                    <td style={{ padding: "12px 20px", borderBottom: `1px solid ${C.hair}` }}>{r.date}</td>
                    <td style={{ padding: "12px 20px", borderBottom: `1px solid ${C.hair}` }}>{to12h(r.time)}</td>
                    <td style={{ padding: "12px 20px", borderBottom: `1px solid ${C.hair}` }}>{r.name}</td>
                    <td style={{ padding: "12px 20px", borderBottom: `1px solid ${C.hair}` }}>{r.table || r.eventTitle}</td>
                    <td style={{ padding: "12px 20px", borderBottom: `1px solid ${C.hair}` }}>{r.pax}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {tab === "orders" && (
        <Card style={{ padding: 0 }}>
          {completedOrders.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: C.inkSoft, fontSize: 13 }}>No completed orders yet.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", fontSize: 12, color: C.inkSoft }}>
                  {["Order #", "Customer", "Table", "Total", "Date & Time"].map((h) => (
                    <th key={h} style={{ padding: "12px 20px", borderBottom: `1px solid ${C.hair}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {completedOrders.map((o) => (
                  <tr key={o.id} style={{ fontSize: 13.5 }}>
                    <td style={{ padding: "12px 20px", borderBottom: `1px solid ${C.hair}` }}>{o.id}</td>
                    <td style={{ padding: "12px 20px", borderBottom: `1px solid ${C.hair}` }}>{o.customer}</td>
                    <td style={{ padding: "12px 20px", borderBottom: `1px solid ${C.hair}` }}>{o.table}</td>
                    <td style={{ padding: "12px 20px", borderBottom: `1px solid ${C.hair}` }}>Php. {o.total}</td>
                    <td style={{ padding: "12px 20px", borderBottom: `1px solid ${C.hair}`, color: C.inkSoft }}>{o.date} · {o.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {tab === "payments" && (
        <Card style={{ padding: 0 }}>
          {payments.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: C.inkSoft, fontSize: 13 }}>No payment history yet.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", fontSize: 12, color: C.inkSoft }}>
                  {["Order #", "Customer", "Table", "Amount", "Status", "Date & Time"].map((h) => (
                    <th key={h} style={{ padding: "12px 20px", borderBottom: `1px solid ${C.hair}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} style={{ fontSize: 13.5 }}>
                    <td style={{ padding: "12px 20px", borderBottom: `1px solid ${C.hair}` }}>{p.id}</td>
                    <td style={{ padding: "12px 20px", borderBottom: `1px solid ${C.hair}` }}>{p.customer}</td>
                    <td style={{ padding: "12px 20px", borderBottom: `1px solid ${C.hair}` }}>{p.table}</td>
                    <td style={{ padding: "12px 20px", borderBottom: `1px solid ${C.hair}` }}>Php. {p.amount}</td>
                    <td style={{ padding: "12px 20px", borderBottom: `1px solid ${C.hair}` }}>
                      <Badge tone={p.status === "Completed" ? "green" : "red"}>{p.status}</Badge>
                    </td>
                    <td style={{ padding: "12px 20px", borderBottom: `1px solid ${C.hair}`, color: C.inkSoft }}>{p.date} · {p.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}
    </div>
  );
}

const PAGES = {
  dashboard: { Comp: DashboardPage },
  frontdesk: { Comp: FrontDeskPage },
  kitchen: { Comp: KitchenPage },
  cashier: { Comp: CashierPage },
  history: { Comp: HistoryPage },
};

export default function EurasiaAdmin() {
  const [active, setActive] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const page = PAGES[active];
  const Page = page.Comp;

  return (
    <div style={{ fontFamily: "'Prata', serif", textAlign: "left" }}>
      <style>{`
  ${FONT_IMPORT}
  * { box-sizing: border-box; }
  .sidebar-nav-item:hover .sidebar-tooltip {
    opacity: 1 !important;
  }
`}</style>
      <div
        style={{ minHeight: "100vh", background: C.canvas, textAlign: "left" }}
      >
        <TopHeader onLogoClick={() => setSidebarOpen((prev) => !prev)} />
        <div style={{ display: "flex" }}>
          <Sidebar
            active={active}
            setActive={setActive}
            collapsed={!sidebarOpen}
          />
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <Topbar setActive={setActive} />
            <div style={{ flex: 1, overflow: "auto" }}>
              <Page />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}