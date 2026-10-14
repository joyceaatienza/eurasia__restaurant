import React, { useState, useRef, useEffect, useCallback } from "react";
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
  Users,
  History as HistoryIcon,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Bell,
  X,
  Menu as MenuIcon,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
  Tooltip,
} from "recharts";
import logoWord from "../assets/logoword.png";
import Reservations from "./Reservations";
import OrderQueue from "./OrderQueue";
import PaymentTransactions from "./PaymentTransactions";
import { ordersApi } from "../services/ordersApi";
import { guestsApi } from "../services/guestsApi";
import { reservationsApi } from "../services/reservationsApi";

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

const POLL_MS = 8000;
const READ_KEY = "eurasia_read_notifications";

/* Phones get the drawer sidebar; tablets keep it collapsed to icons */
const MOBILE_QUERY = "(max-width: 767px)";
const TABLET_QUERY = "(min-width: 768px) and (max-width: 1100px)";

// Tracks a CSS media query so layout decisions can live in JS alongside the
// inline styles this admin is built with
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

/* ---------------------------------------------------------------- */
/* Date helpers                                                      */
/* ---------------------------------------------------------------- */
// The API sends dates as UTC timestamps, so parse them into local date
// parts — slicing the raw string lands on the previous day in UTC+8
function to12hFromDBTime(timeStr) {
  if (!timeStr) return "";
  if (timeStr instanceof Date) {
    timeStr = timeStr.toTimeString().slice(0, 8);
  }
  const [h, m] = String(timeStr).split(":").map(Number);
  if (isNaN(h)) return "";
  const period = h >= 12 ? "pm" : "am";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

function formatDBDate(value) {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDBDateTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// "3 minutes ago" reads better than a timestamp for something that just happened
function timeAgo(value) {
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

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
    whiteSpace: "nowrap",
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
        minWidth: 0,
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
        whiteSpace: "nowrap",
        ...tones[tone],
      }}
    >
      {children}
    </span>
  );
}

/* ---------------------------------------------------------------- */
/* Confirmation modal — replaces window.confirm                      */
/* ---------------------------------------------------------------- */
function ConfirmModal({ open, title, message, confirmLabel, onConfirm, onCancel, danger }) {
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
        zIndex: 9999,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 18,
          padding: 28,
          width: "100%",
          maxWidth: 380,
          fontFamily: "'Prata', serif",
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
              fontFamily: "'Prata', serif",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: "11px 18px",
              borderRadius: 10,
              border: "none",
              background: danger ? "#c0392b" : C.void,
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "'Prata', serif",
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
/* Notifications — what needs someone's attention right now          */
/* ---------------------------------------------------------------- */
const NOTIF_STYLES = {
  reservation: { bg: "#e9eefb", fg: "#3b5ba8", Icon: CalendarCheck2, page: "frontdesk" },
  order: { bg: "#fdf6df", fg: "#9c7a1f", Icon: ChefHat, page: "kitchen" },
  payment: { bg: "#e5f0e6", fg: C.green, Icon: Wallet, page: "cashier" },
  downpayment: { bg: "#f3e3e6", fg: "#9b4a5e", Icon: Wallet2, page: "cashier" },
};

// Turns the raw order and reservation rows into things a person can act on
function buildNotifications(orders, reservations) {
  const list = [];

  reservations.forEach((r) => {
    if (r.status === "pending") {
      list.push({
        id: `reservation-${r.id}`,
        kind: "reservation",
        title: "New reservation",
        detail: `${r.guest_name} · ${r.party_size} pax · ${formatDBDate(r.reservation_date)} ${to12hFromDBTime(r.reservation_time)}`,
        at: r.created_at,
        target: { type: "reservation", id: r.id, date: r.reservation_date },
      });
    }

    if (Number(r.downpayment_amount) > 0 && (r.payment_status || "pending") === "pending") {
      list.push({
        id: `downpayment-${r.id}`,
        kind: "downpayment",
        title: "Downpayment to verify",
        detail: `${r.guest_name} · Php. ${Number(r.downpayment_amount).toLocaleString()} · ${r.payment_method || "—"}`,
        at: r.created_at,
        target: { type: "downpayment", id: r.id },
      });
    }
  });

  orders.forEach((o) => {
    if (o.status === "pending") {
      list.push({
        id: `order-${o.id}`,
        kind: "order",
        title: "New order",
        detail: `Order #${o.daily_number ?? o.id} · ${o.customer_name || "Guest"} · Php. ${Number(o.total).toLocaleString()}`,
        at: o.created_at,
        target: { type: "order", id: o.id },
      });
    }

    const hasProof = Boolean(o.has_receipt ?? o.receipt_image);
    if (hasProof && (o.payment_status || "pending") === "pending") {
      list.push({
        id: `payment-${o.id}`,
        kind: "payment",
        title: "Payment to verify",
        detail: `Order #${o.daily_number ?? o.id} · ${o.customer_name || "Guest"} · Php. ${Number(o.total).toLocaleString()}`,
        at: o.created_at,
        target: { type: "payment", id: o.id },
      });
    }
  });

  return list.sort((a, b) => new Date(b.at) - new Date(a.at));
}

function NotificationBell({ notifications, readIds, onOpenItem, onMarkAllRead }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const unread = notifications.filter((n) => !readIds.includes(n.id));

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
        title="Notifications"
        style={{
          position: "relative",
          border: `1px solid ${C.hair}`,
          background: "#fff",
          borderRadius: 12,
          width: 42,
          height: 42,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: C.ink,
          boxShadow: "0 1px 3px rgba(23,3,16,0.06)",
          flexShrink: 0,
        }}
      >
        <Bell size={19} />
        {unread.length > 0 && (
          <span
            style={{
              position: "absolute",
              top: -5,
              right: -5,
              minWidth: 20,
              height: 20,
              padding: "0 5px",
              borderRadius: 999,
              background: "#c0392b",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              fontFamily: "'Prata', serif",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid #f0eff3",
            }}
          >
            {unread.length > 9 ? "9+" : unread.length}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            right: 0,
            // Never wider than the screen on a phone
            width: "min(360px, calc(100vw - 32px))",
            maxHeight: "min(440px, 70vh)",
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 12px 40px rgba(23,3,16,0.18)",
            overflow: "hidden",
            zIndex: 500,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 18px",
              borderBottom: `1px solid ${C.hair}`,
            }}
          >
            <div style={{ fontFamily: "'Prata', serif", fontSize: 15, color: C.ink }}>
              Notifications
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {unread.length > 0 && (
                <button
                  onClick={onMarkAllRead}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#8a6228",
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: "'Prata', serif",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                style={{ border: "none", background: "transparent", cursor: "pointer", color: C.inkSoft, display: "flex" }}
              >
                <X size={17} />
              </button>
            </div>
          </div>

          <div style={{ overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: "40px 20px",
                  textAlign: "center",
                  color: C.inkSoft,
                  fontSize: 13,
                  fontFamily: "'Prata', serif",
                }}
              >
                Nothing needs your attention right now.
              </div>
            ) : (
              notifications.map((n) => {
                const style = NOTIF_STYLES[n.kind];
                const Icon = style.Icon;
                const isUnread = !readIds.includes(n.id);

                return (
                  <button
                    key={n.id}
                    onClick={() => {
                      onOpenItem(n);
                      setOpen(false);
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                      padding: "14px 18px",
                      border: "none",
                      borderBottom: `1px solid ${C.hair}`,
                      background: isUnread ? "#fffdf7" : "#fff",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = C.canvas)}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = isUnread ? "#fffdf7" : "#fff")
                    }
                  >
                    <span
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        background: style.bg,
                        color: style.fg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={16} />
                    </span>

                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontFamily: "'Prata', serif",
                          fontSize: 13.5,
                          color: C.ink,
                        }}
                      >
                        {n.title}
                        {isUnread && (
                          <span
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: "50%",
                              background: "#c0392b",
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </span>
                      <span
                        style={{
                          display: "block",
                          fontSize: 12,
                          color: "#5a4a4f",
                          marginTop: 3,
                          lineHeight: 1.5,
                        }}
                      >
                        {n.detail}
                      </span>
                      <span style={{ display: "block", fontSize: 11, color: C.inkSoft, marginTop: 4 }}>
                        {timeAgo(n.at)}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "frontdesk", label: "Front Desk", icon: CalendarCheck2 },
  { key: "kitchen", label: "Kitchen", icon: ChefHat },
  { key: "cashier", label: "Cashier", icon: Wallet },
  { key: "history", label: "History", icon: HistoryIcon },
];

function TopHeader({ onToggleSidebar, isMobile, children }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: isMobile ? "12px 16px" : "14px 32px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        {/* On a phone the drawer needs an obvious handle of its own */}
        {isMobile && (
          <button
            onClick={onToggleSidebar}
            aria-label="Open menu"
            style={{
              border: `1px solid ${C.hair}`,
              background: "#fff",
              borderRadius: 10,
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: C.ink,
              flexShrink: 0,
            }}
          >
            <MenuIcon size={15} />
          </button>
        )}

        <button
          onClick={isMobile ? undefined : onToggleSidebar}
          style={{
            border: "none",
            background: "transparent",
            cursor: isMobile ? "default" : "pointer",
            padding: 0,
            display: "flex",
            minWidth: 0,
          }}
        >
          <img
            src={logoWord}
            alt="Eurasia Restaurant Logo"
            style={{
              height: isMobile ? 34 : 45,
              width: "auto",
              objectFit: "contain",
            }}
          />
        </button>
      </div>

      {children}
    </div>
  );
}

function Sidebar({ active, setActive, collapsed, onLogout, isMobile, drawerOpen, onCloseDrawer }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

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

  // On a phone the sidebar slides over the page instead of taking a column
  const isCollapsed = isMobile ? false : collapsed;
  const width = isCollapsed ? 64 : 240;

  const asideStyle = isMobile
    ? {
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        width: 230,
        maxWidth: "78%",
        zIndex: 1000,
        transform: drawerOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.25s ease",
        boxShadow: drawerOpen ? "4px 0 24px rgba(0,0,0,0.3)" : "none",
      }
    : {
        width,
        minWidth: width,
        height: "100vh",
        position: "sticky",
        top: 0,
        alignSelf: "flex-start",
        transition: "width 0.25s ease, min-width 0.25s ease, padding 0.25s ease",
      };

  return (
    <>
      {/* Tapping the dimmed page closes the drawer */}
      {isMobile && drawerOpen && (
        <div
          onClick={onCloseDrawer}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(23,3,16,0.45)",
            zIndex: 999,
          }}
        />
      )}

      <aside
        style={{
          background: C.void,
          display: "flex",
          flexDirection: "column",
          padding: isCollapsed ? "24px 12px" : "22px 16px",
          borderTopRightRadius: isMobile ? 0 : 24,
          overflowY: "auto",
          ...asideStyle,
        }}
      >
        {isMobile && (
          <button
            onClick={onCloseDrawer}
            aria-label="Close menu"
            style={{
              alignSelf: "flex-end",
              border: "none",
              background: "transparent",
              color: C.gold,
              cursor: "pointer",
              padding: 4,
              marginBottom: 8,
              display: "flex",
            }}
          >
            <X size={22} />
          </button>
        )}

        <nav style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {NAV.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.key;
            return (
              <div key={item.key} style={{ position: "relative" }} className="sidebar-nav-item">
                <button
                  onClick={() => {
                    setActive(item.key);
                    if (isMobile) onCloseDrawer();
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: isCollapsed ? "12px 0" : "13px 14px",
                    justifyContent: isCollapsed ? "center" : "flex-start",
                    borderRadius: 10,
                    border: "none",
                    cursor: "pointer",
                    background: isActive ? C.flame : "transparent",
                    color: isActive ? "#ffffff" : "rgba(245,233,216,0.75)",
                    fontFamily: "'Prata', serif",
                    fontSize: isMobile ? 13 : 14,
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
                      opacity: isCollapsed ? 0 : 1,
                      width: isCollapsed ? 0 : "auto",
                      overflow: "hidden",
                      transition: "opacity 0.2s ease",
                    }}
                  >
                    {item.label}
                  </span>
                </button>

                {isCollapsed && (
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
              justifyContent: isCollapsed ? "center" : "flex-start",
              textAlign: "left",
              borderRadius: 10,
            }}
          >
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
                flexShrink: 0,
              }}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
            {!isCollapsed && (
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
                bottom: isCollapsed ? "auto" : "100%",
                top: isCollapsed ? 0 : "auto",
                left: isCollapsed ? "calc(100% + 10px)" : 8,
                right: isCollapsed ? "auto" : 8,
                marginBottom: isCollapsed ? 0 : 6,
                width: isCollapsed ? 160 : "auto",
                background: "#fff",
                borderRadius: 10,
                boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
                overflow: "hidden",
                zIndex: 20,
              }}
            >
              <button
                onClick={() => {
                  onLogout();
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
                  color: "#c0392b",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#faf2f2")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
              >
                <LogOut size={15} /> Log out
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
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
          gap: 8,
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
          fontSize: "clamp(18px, 4.5vw, 24px)",
          color: C.ink,
          WebkitTextStroke: "0.5px " + C.ink,
          wordBreak: "break-word",
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
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "110%",
            // Anchored left so a button near the right edge doesn't push
            // the menu off the screen on a phone
            left: 0,
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
              onMouseEnter={(e) => (e.currentTarget.style.background = C.canvas)}
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = opt === value ? C.canvas : "#fff")
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

/* ---------------------------------------------------------------- */
/* Date range for the selected period, shiftable with the arrows     */
/* ---------------------------------------------------------------- */
function getPeriodRange(period, offset) {
  const now = new Date();
  let start, end;

  if (period === "Today") {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    end = new Date(start);
  } else if (period === "Week") {
    const base = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset * 7);
    start = new Date(base);
    start.setDate(start.getDate() - start.getDay()); // back to Sunday
    end = new Date(start);
    end.setDate(end.getDate() + 6);
  } else if (period === "Month") {
    start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
  } else {
    start = new Date(now.getFullYear() + offset, 0, 1);
    end = new Date(now.getFullYear() + offset, 11, 31);
  }

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function DashboardPage({ isMobile, isTablet }) {
  const [period, setPeriod] = useState("Today");
  const [offset, setOffset] = useState(0);
  const [showExportToast, setShowExportToast] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [guestCounts, setGuestCounts] = useState({ reserved: 0, walk_in: 0, total: 0 });

  const { start: rangeStart, end: rangeEnd } = getPeriodRange(period, offset);

  useEffect(() => {
    Promise.all([ordersApi.getAll(), reservationsApi.getAll()])
      .then(([ordersData, reservationsData]) => {
        setOrders(ordersData);
        setReservations(reservationsData);
      })
      .catch((err) => console.error("Failed to load dashboard data:", err))
      .finally(() => setLoading(false));
  }, []);

  // Guest counts come from the server so walk-ins are included in every period
  useEffect(() => {
    guestsApi.getCounts(toISODate(rangeStart), toISODate(rangeEnd))
      .then(setGuestCounts)
      .catch((err) => console.error("Failed to load guest counts:", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, offset]);

  // Keep the figures current while the owner is watching — no spinner on polls
  useEffect(() => {
    const interval = setInterval(() => {
      Promise.all([ordersApi.getAll(), reservationsApi.getAll()])
        .then(([ordersData, reservationsData]) => {
          setOrders(ordersData);
          setReservations(reservationsData);
        })
        .catch((err) => console.error("Dashboard poll failed:", err));

      guestsApi.getCounts(toISODate(rangeStart), toISODate(rangeEnd))
        .then(setGuestCounts)
        .catch((err) => console.error("Guest count poll failed:", err));
    }, POLL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, offset]);

  // Going back to the current period resets the offset
  const changePeriod = (p) => {
    setPeriod(p);
    setOffset(0);
  };

  const inRange = (value) => {
    const d = new Date(value);
    return d >= rangeStart && d <= rangeEnd;
  };

  const filteredOrders = orders.filter((o) => inRange(o.created_at));
  const filteredReservations = reservations.filter((r) => inRange(r.created_at));

  const trendData = salesTrendByPeriod[period] || salesTrendByPeriod.Year;

  // Label describing exactly what the figures cover
  const periodLabel = (() => {
    const long = (d) =>
      d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const short = (d) =>
      d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    if (period === "Today") {
      return rangeStart.toLocaleDateString("en-US", {
        weekday: isMobile ? "short" : "long",
        month: isMobile ? "short" : "long",
        day: "numeric",
        year: "numeric",
      });
    }
    if (period === "Month") {
      return rangeStart.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }
    if (period === "Year") {
      return String(rangeStart.getFullYear());
    }
    return isMobile
      ? `${short(rangeStart)} – ${short(rangeEnd)}`
      : `${long(rangeStart)} – ${long(rangeEnd)}`;
  })();

  // --- Real computed stats (filtered by the selected range) ---
  const totalRevenue = filteredOrders
    .filter((o) => o.payment_status === "verified")
    .reduce((sum, o) => sum + Number(o.total), 0);

  const totalOrders = filteredOrders.length;
  const totalGuests = guestCounts.total;

  const reservationStatusCounts = {
    Completed: filteredReservations.filter((r) => r.status === "completed").length,
    Pending: filteredReservations.filter((r) => ["pending", "confirmed", "seated"].includes(r.status)).length,
    Cancelled: filteredReservations.filter((r) => r.status === "cancelled").length,
    "No Shows": filteredReservations.filter((r) => r.status === "no_show").length,
  };
  const computedOrderStats = [
    { label: "Completed", value: reservationStatusCounts.Completed, color: C.green },
    { label: "Pending", value: reservationStatusCounts.Pending, color: C.amber },
    { label: "Cancelled", value: reservationStatusCounts.Cancelled, color: C.red },
    { label: "No Shows", value: reservationStatusCounts["No Shows"], color: C.inkSoft },
  ];

  const itemTotals = {};
  filteredOrders.forEach((o) => {
    (o.items || []).forEach((it) => {
      const key = it.item_name;
      itemTotals[key] = (itemTotals[key] || 0) + Number(it.price) * Number(it.quantity);
    });
  });
  const computedTopSelling = Object.entries(itemTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, amount]) => ({ name, amount: `Php. ${amount.toLocaleString()}` }));

  const estimatedProfit = totalRevenue * 0.3;

  const handleExport = async () => {
    // Wrap each cell so commas inside names don't break the columns
    const cell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const row = (cells) => cells.map(cell).join(",");

    const lines = [
      row(["Eurasia Restaurant — Sales Report"]),
      row(["Period", period]),
      row(["Covering", periodLabel]),
      row(["Generated", new Date().toLocaleString("en-US")]),
      "",
      row(["SUMMARY"]),
      row(["Total Revenue", totalRevenue.toFixed(2)]),
      row(["Total Orders", totalOrders]),
      row(["Total Guests", totalGuests]),
      row(["  Reserved", guestCounts.reserved]),
      row(["  Walk-in", guestCounts.walk_in]),
      row(["Estimated Profit (30%)", estimatedProfit.toFixed(2)]),
      "",
      row(["RESERVATION STATUS"]),
      ...computedOrderStats.map((s) => row([s.label, s.value])),
      "",
      row(["TOP SELLING ITEMS"]),
      ...(computedTopSelling.length === 0
        ? [row(["No orders in this period"])]
        : computedTopSelling.map((it) => row([it.name, it.amount]))),
      "",
      row(["ORDERS"]),
      row(["Order #", "Customer", "Payment Method", "Subtotal", "Discount", "Service Fee", "Total", "Payment Status", "Date & Time"]),
      ...(filteredOrders.length === 0
        ? [row(["No orders in this period"])]
        : filteredOrders.map((o) =>
            row([
              o.daily_number ?? o.id,
              o.customer_name || "—",
              o.payment_method || "—",
              Number(o.subtotal || 0).toFixed(2),
              Number(o.discount_amount || 0).toFixed(2),
              Number(o.service_fee || 0).toFixed(2),
              Number(o.total || 0).toFixed(2),
              o.payment_status || "pending",
              formatDBDateTime(o.created_at),
            ])
          )),
      "",
      row(["RESERVATIONS"]),
      row(["Date", "Time", "Guest Name", "Pax", "Type", "Downpayment", "Status"]),
      ...(filteredReservations.length === 0
        ? [row(["No reservations in this period"])]
        : filteredReservations.map((r) =>
            row([
              formatDBDate(r.reservation_date),
              to12hFromDBTime(r.reservation_time),
              r.guest_name,
              r.party_size,
              r.reservation_type === "event" ? "Event" : "Table",
              Number(r.downpayment_amount || 0).toFixed(2),
              r.status,
            ])
          )),
    ];

    // The BOM keeps Excel from mangling the peso sign and accented names
    const csv = "\uFEFF" + lines.join("\n");
    const fileName = `eurasia-sales-${toISODate(rangeStart)}-to-${toISODate(rangeEnd)}.csv`;

    // Chrome and Edge can open a real folder picker; other browsers fall back to a plain download
    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: fileName,
          types: [
            {
              description: "CSV file (opens in Excel)",
              accept: { "text/csv": [".csv"] },
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(csv);
        await writable.close();

        setShowExportToast(true);
        setTimeout(() => setShowExportToast(false), 3000);
        return;
      } catch (err) {
        // The person closed the picker — nothing to report
        if (err.name === "AbortError") return;
        console.error("Save picker failed, falling back to download:", err);
      }
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setShowExportToast(true);
    setTimeout(() => setShowExportToast(false), 3000);
  };

  const arrowStyle = (disabled) => ({
    border: `1px solid ${C.hair}`,
    background: "#fff",
    borderRadius: 8,
    width: 32,
    height: 32,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.4 : 1,
    color: C.ink,
    flexShrink: 0,
  });

  // One column on a phone, two on a tablet, the roomy layout on desktop
  const statsColumns = isMobile ? "1fr" : "repeat(3, 1fr)";
  const splitColumns = isMobile || isTablet ? "1fr" : "1.6fr 1fr";

  return (
    <div style={{ padding: isMobile ? 16 : 28 }}>
      <div
        style={{
          fontFamily: "'Prata', serif",
          fontSize: "clamp(26px, 6vw, 39px)",
          color: C.ink,
          WebkitTextStroke: "0.4px " + C.ink,
          marginBottom: 20,
        }}
      >
        Sales Overview
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: "center", color: C.inkSoft, fontFamily: "'Prata', serif" }}>
          Loading dashboard data...
        </div>
      ) : (
        <div
          style={{
            padding: isMobile ? 14 : 24,
            background: "#faf7f6",
            borderRadius: isMobile ? 20 : 28,
            display: "flex",
            flexDirection: "column",
            gap: isMobile ? 14 : 20,
            boxShadow: "0 4px 24px rgba(23,3,16,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <button onClick={() => setOffset((o) => o - 1)} style={arrowStyle(false)}>
                <ChevronLeft size={15} />
              </button>
              <div
                style={{
                  fontSize: isMobile ? 12 : 13.5,
                  color: C.ink,
                  fontFamily: "'Prata', serif",
                  minWidth: isMobile ? 0 : 200,
                  textAlign: "center",
                  flex: isMobile ? 1 : "none",
                }}
              >
                {periodLabel}
              </div>
              <button
                onClick={() => setOffset((o) => Math.min(0, o + 1))}
                disabled={offset >= 0}
                style={arrowStyle(offset >= 0)}
              >
                <ChevronRight size={15} />
              </button>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <PeriodDropdown value={period} onChange={changePeriod} />
              <Btn variant="dark" small onClick={handleExport}>
                <Download size={14} /> Export
              </Btn>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: statsColumns, gap: isMobile ? 12 : 16 }}>
            <StatCard
              label="Total Revenue"
              value={`₱ ${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
              icon={Wallet2}
            />
            <StatCard label="Total Orders" value={totalOrders} icon={ShoppingBag} />
            <StatCard label="Total Guests" value={totalGuests} icon={Users} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: splitColumns, gap: isMobile ? 12 : 16 }}>
            <Card>
              <SectionTitle>Category Breakdown</SectionTitle>
              <p style={{ fontSize: 11.5, color: C.inkSoft, marginTop: -8, marginBottom: 12 }}>
                (Estimate — menu categories aren't tracked in orders yet)
              </p>
              <ResponsiveContainer width="100%" height={isMobile ? 220 : 260}>
                <BarChart data={categoryBreakdown} margin={{ bottom: 60 }}>
                  <CartesianGrid vertical={false} stroke={C.hair} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: isMobile ? 8 : 10, fill: C.inkSoft }}
                    axisLine={false}
                    tickLine={false}
                    angle={-40}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis
                    tick={{ fontSize: isMobile ? 9 : 11, fill: C.inkSoft }}
                    axisLine={false}
                    tickLine={false}
                    width={isMobile ? 34 : 60}
                  />
                  <Tooltip />
                  <Bar dataKey="value" fill={C.azure} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <SectionTitle>Top Selling Items</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {computedTopSelling.length === 0 ? (
                  <p style={{ fontSize: 13, color: C.inkSoft }}>No orders in this period.</p>
                ) : (
                  computedTopSelling.map((it) => (
                    <div
                      key={it.name}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 10,
                        fontSize: 14,
                      }}
                    >
                      <span style={{ color: C.ink, fontWeight: 600, minWidth: 0 }}>{it.name}</span>
                      <span style={{ color: C.inkSoft, whiteSpace: "nowrap" }}>{it.amount}</span>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: splitColumns, gap: isMobile ? 12 : 16 }}>
            <Card>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 12,
                  marginBottom: 18,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ minWidth: 0 }}>
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
                  <div style={{ color: C.inkSoft, fontSize: 11.5, marginTop: 2 }}>
                    (Estimate — will reflect real trends as more orders come in)
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
                  <div style={{ color: C.green, fontSize: 11.5, fontWeight: 700, marginTop: 2 }}>
                    +{" "}
                    {(
                      ((trendData[trendData.length - 1].value - trendData[trendData.length - 2].value) /
                        trendData[trendData.length - 2].value) *
                      100
                    ).toFixed(1)}
                    % than last period
                  </div>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={isMobile ? 180 : 200}>
                <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.azure} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={C.azure} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke={C.hair} strokeDasharray="4 4" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: isMobile ? 9 : 10, fill: C.inkSoft }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: isMobile ? 9 : 11, fill: C.inkSoft }}
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
              <p style={{ fontSize: 11.5, color: C.inkSoft, marginTop: -8, marginBottom: 12 }}>
                (Based on reservations)
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {computedOrderStats.map((s) => (
                  <div
                    key={s.label}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  >
                    <span style={{ fontSize: 13.5, color: C.ink, fontWeight: 600 }}>{s.label}</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: s.color }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 12 : 16 }}>
            <Card>
              <SectionTitle>Revenue &amp; Profit Summary</SectionTitle>
              <div style={{ marginBottom: 18 }}>
                <div style={{ color: C.inkSoft, fontSize: 12.5, fontWeight: 600 }}>Total Revenue</div>
                <div
                  style={{
                    fontFamily: "'Prata', serif",
                    fontSize: "clamp(18px, 4.5vw, 22px)",
                    color: C.green,
                    WebkitTextStroke: "0.4px " + C.green,
                    wordBreak: "break-word",
                  }}
                >
                  ₱ {totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <div style={{ color: C.inkSoft, fontSize: 12.5, fontWeight: 600 }}>
                  Estimated Profit (30% margin)
                </div>
                <div
                  style={{
                    fontFamily: "'Prata', serif",
                    fontSize: "clamp(18px, 4.5vw, 22px)",
                    color: C.green,
                    WebkitTextStroke: "0.4px " + C.green,
                    wordBreak: "break-word",
                  }}
                >
                  ₱ {estimatedProfit.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
              </div>
            </Card>
          </div>

          {showExportToast && (
            <div
              style={{
                position: "fixed",
                bottom: 20,
                right: 20,
                left: isMobile ? 20 : "auto",
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
                  flexShrink: 0,
                }}
              >
                ✓
              </span>
              Data exported successfully
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function HistoryPage({ isMobile }) {
  const [tab, setTab] = useState("reservations");
  const [pastReservations, setPastReservations] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortNewest, setSortNewest] = useState(true);

  useEffect(() => {
    Promise.all([reservationsApi.getAll(), ordersApi.getAll()])
      .then(([reservationsData, ordersData]) => {
        setPastReservations(
          reservationsData.filter((r) => ["completed", "cancelled", "no_show"].includes(r.status))
        );
        setCompletedOrders(ordersData.filter((o) => ["ready", "served", "completed"].includes(o.status)));
        setPayments(
          ordersData.filter((o) => o.payment_status === "verified" || o.payment_status === "failed")
        );
      })
      .catch((err) => console.error("Failed to load history:", err))
      .finally(() => setLoading(false));
  }, []);

  const tabs = [
    { key: "reservations", label: "Reservations" },
    { key: "orders", label: "Orders" },
    { key: "payments", label: "Payments" },
  ];

  // Newest first by default; the toggle flips it
  const sortByDate = (list, dateKey) =>
    [...list].sort((a, b) => {
      const diff = new Date(b[dateKey]) - new Date(a[dateKey]);
      return sortNewest ? diff : -diff;
    });

  const sortedReservations = sortByDate(pastReservations, "reservation_date");
  const sortedOrders = sortByDate(completedOrders, "created_at");
  const sortedPayments = sortByDate(payments, "created_at");

  const cellStyle = {
    padding: isMobile ? "10px 14px" : "12px 20px",
    borderBottom: `1px solid ${C.hair}`,
    whiteSpace: "nowrap",
  };

  // Tables keep their columns and scroll sideways instead of squashing
  const tableWrap = { overflowX: "auto", WebkitOverflowScrolling: "touch" };
  const tableStyle = {
    width: "100%",
    minWidth: 560,
    borderCollapse: "collapse",
    textAlign: "left",
  };

  return (
    <div style={{ padding: isMobile ? 16 : 28 }}>
      <div
        style={{
          fontFamily: "'Prata', serif",
          fontSize: "clamp(26px, 6vw, 39px)",
          color: C.ink,
          WebkitTextStroke: "0.4px " + C.ink,
          marginBottom: 20,
        }}
      >
        History
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 6,
            background: "#fff",
            padding: 4,
            borderRadius: 10,
            width: "fit-content",
            boxShadow: "0 1px 3px rgba(23,3,16,0.06)",
          }}
        >
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                border: "none",
                borderRadius: 8,
                padding: isMobile ? "8px 12px" : "9px 18px",
                fontSize: isMobile ? 12 : 13,
                fontFamily: "'Prata', serif",
                cursor: "pointer",
                background: tab === t.key ? C.void : "transparent",
                color: tab === t.key ? "#f5e9d8" : C.ink,
                whiteSpace: "nowrap",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setSortNewest((prev) => !prev)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            border: `1px solid ${C.hair}`,
            borderRadius: 10,
            padding: isMobile ? "8px 12px" : "9px 16px",
            fontSize: isMobile ? 12 : 13,
            fontFamily: "'Prata', serif",
            background: "#fff",
            color: C.ink,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {sortNewest ? "Newest first" : "Oldest first"}
          <ArrowUpDown size={14} />
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 32, textAlign: "center", color: C.inkSoft, fontSize: 13 }}>Loading...</div>
      ) : (
        <>
          {tab === "reservations" && (
            <Card style={{ padding: 0, overflow: "hidden" }}>
              {sortedReservations.length === 0 ? (
                <div style={{ padding: 32, textAlign: "center", color: C.inkSoft, fontSize: 13 }}>
                  No reservation history yet.
                </div>
              ) : (
                <div style={tableWrap}>
                  <table style={tableStyle}>
                    <thead>
                      <tr style={{ textAlign: "left", fontSize: 12, color: C.inkSoft }}>
                        {["Date", "Time", "Name", "Pax", "Status"].map((h) => (
                          <th key={h} style={cellStyle}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedReservations.map((r) => (
                        <tr key={r.id} style={{ fontSize: 13.5 }}>
                          <td style={cellStyle}>{formatDBDate(r.reservation_date)}</td>
                          <td style={cellStyle}>{to12hFromDBTime(r.reservation_time)}</td>
                          <td style={cellStyle}>{r.guest_name}</td>
                          <td style={cellStyle}>{r.party_size}</td>
                          <td style={cellStyle}>
                            <Badge tone={r.status === "completed" ? "green" : "red"}>
                              {r.status === "completed"
                                ? "Completed"
                                : r.status === "no_show"
                                ? "No Show"
                                : "Cancelled"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}

          {tab === "orders" && (
            <Card style={{ padding: 0, overflow: "hidden" }}>
              {sortedOrders.length === 0 ? (
                <div style={{ padding: 32, textAlign: "center", color: C.inkSoft, fontSize: 13 }}>
                  No completed orders yet.
                </div>
              ) : (
                <div style={tableWrap}>
                  <table style={tableStyle}>
                    <thead>
                      <tr style={{ textAlign: "left", fontSize: 12, color: C.inkSoft }}>
                        {["Order #", "Customer", "Total", "Date & Time"].map((h) => (
                          <th key={h} style={cellStyle}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedOrders.map((o) => (
                        <tr key={o.id} style={{ fontSize: 13.5 }}>
                          <td style={cellStyle}>{o.daily_number ?? o.id}</td>
                          <td style={cellStyle}>{o.customer_name || "—"}</td>
                          <td style={cellStyle}>Php. {Number(o.total).toLocaleString()}</td>
                          <td style={{ ...cellStyle, color: C.inkSoft }}>{formatDBDateTime(o.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}

          {tab === "payments" && (
            <Card style={{ padding: 0, overflow: "hidden" }}>
              {sortedPayments.length === 0 ? (
                <div style={{ padding: 32, textAlign: "center", color: C.inkSoft, fontSize: 13 }}>
                  No payment history yet.
                </div>
              ) : (
                <div style={tableWrap}>
                  <table style={{ ...tableStyle, minWidth: 700 }}>
                    <thead>
                      <tr style={{ textAlign: "left", fontSize: 12, color: C.inkSoft }}>
                        {["Order #", "Customer", "Method", "Amount", "Status", "Date & Time"].map((h) => (
                          <th key={h} style={cellStyle}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedPayments.map((p) => (
                        <tr key={p.id} style={{ fontSize: 13.5 }}>
                          <td style={cellStyle}>{p.daily_number ?? p.id}</td>
                          <td style={cellStyle}>{p.customer_name || "—"}</td>
                          <td style={{ ...cellStyle, textTransform: "capitalize" }}>
                            {p.payment_method || "—"}
                          </td>
                          <td style={cellStyle}>Php. {Number(p.total).toLocaleString()}</td>
                          <td style={cellStyle}>
                            <Badge tone={p.payment_status === "verified" ? "green" : "red"}>
                              {p.payment_status === "verified" ? "Completed" : "Failed"}
                            </Badge>
                          </td>
                          <td style={{ ...cellStyle, color: C.inkSoft }}>{formatDBDateTime(p.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
}

export default function EurasiaAdmin() {
  const navigate = useNavigate();
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const isTablet = useMediaQuery(TABLET_QUERY);

  const [active, setActiveState] = useState(
    () => localStorage.getItem("eurasia_admin_active_tab") || "dashboard"
  );
  const setActive = (key) => {
    setActiveState(key);
    localStorage.setItem("eurasia_admin_active_tab", key);
  };

  // Desktop: expanded. Tablet: collapsed to icons so the content keeps its room.
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    setSidebarOpen(!isTablet);
  }, [isTablet]);

  // Leaving phone width should never strand the page behind a dimmed overlay
  useEffect(() => {
    if (!isMobile) setDrawerOpen(false);
  }, [isMobile]);

  // Lock the page behind the drawer so only the menu scrolls
  useEffect(() => {
    if (isMobile && drawerOpen) {
      const previous = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = previous; };
    }
  }, [isMobile, drawerOpen]);

  // --- Notifications ---
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(READ_KEY)) || [];
    } catch {
      return [];
    }
  });
  // What the notification click asked the page to jump to
  const [highlight, setHighlight] = useState(null);

  // Orders are fetched for today only, to match what the Kitchen and Cashier
  // screens actually show — otherwise a notification points at a row that
  // isn't on the page
  const loadNotifications = useCallback(() => {
    return Promise.all([
      ordersApi.getAll({ today_only: "true" }),
      reservationsApi.getAll(),
    ])
      .then(([orders, reservations]) => {
        setNotifications(buildNotifications(orders, reservations));
      })
      .catch((err) => console.error("Failed to load notifications:", err));
  }, []);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, POLL_MS);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const markRead = (ids) => {
    setReadIds((prev) => {
      const next = Array.from(new Set([...prev, ...ids]));
      try {
        localStorage.setItem(READ_KEY, JSON.stringify(next));
      } catch (e) {
        console.error("Failed to save read notifications:", e);
      }
      return next;
    });
  };

  const openNotification = (n) => {
    markRead([n.id]);
    setActive(NOTIF_STYLES[n.kind].page);
    setHighlight(n.target);
    // The highlight is a one-shot cue, so clear it once the page has used it
    setTimeout(() => setHighlight(null), 4000);
  };

  const handleLogout = () => {
    localStorage.removeItem("eurasia_role");
    localStorage.removeItem("eurasia_name");
    localStorage.removeItem("eurasia_token");
    navigate("/login");
  };

  const renderPage = () => {
    switch (active) {
      case "frontdesk":
        return <Reservations embedded highlightTarget={highlight} isMobile={isMobile} />;
      case "kitchen":
        return <OrderQueue embedded highlightTarget={highlight} isMobile={isMobile} />;
      case "cashier":
        return <PaymentTransactions embedded highlightTarget={highlight} isMobile={isMobile} />;
      case "history":
        return <HistoryPage isMobile={isMobile} />;
      default:
        return <DashboardPage isMobile={isMobile} isTablet={isTablet} />;
    }
  };

  return (
    <div style={{ fontFamily: "'Prata', serif", textAlign: "left" }}>
      <style>{`
        ${FONT_IMPORT}
        * { box-sizing: border-box; }
        html, body { overflow-x: hidden; }
        .sidebar-nav-item:hover .sidebar-tooltip {
          opacity: 1 !important;
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: C.canvas, textAlign: "left" }}>
        <TopHeader
          isMobile={isMobile}
          onToggleSidebar={() =>
            isMobile ? setDrawerOpen((prev) => !prev) : setSidebarOpen((prev) => !prev)
          }
        >
          <NotificationBell
            notifications={notifications}
            readIds={readIds}
            onOpenItem={openNotification}
            onMarkAllRead={() => markRead(notifications.map((n) => n.id))}
          />
        </TopHeader>

        <div style={{ display: "flex" }}>
          <Sidebar
            active={active}
            setActive={setActive}
            collapsed={!sidebarOpen}
            onLogout={() => setShowLogoutConfirm(true)}
            isMobile={isMobile}
            drawerOpen={drawerOpen}
            onCloseDrawer={() => setDrawerOpen(false)}
          />
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
            <div style={{ flex: 1, minWidth: 0 }}>{renderPage()}</div>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={showLogoutConfirm}
        title="Log out?"
        message="You'll need to log in again to access the admin panel."
        confirmLabel="Log Out"
        danger
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
}