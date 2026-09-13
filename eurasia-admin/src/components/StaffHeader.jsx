import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { UserRound, LogOut, Settings, Bell } from "lucide-react";
import logo from "../assets/logopic3.png";
import SettingsModal from "./SettingsModal";
import { ordersApi } from "../services/ordersApi";
import { reservationsApi } from "../services/reservationsApi";

const FONT = "'Prata', serif";
const INK = "#1d080f";
const MUTED = "#7a756c";

const NOTIF_POLL_MS = 20000;
const READ_IDS_KEY = "eurasia_read_notifications";

// Friendly labels for each role (the raw values stored in localStorage are lowercase)
const ROLE_LABELS = {
  owner: "Owner",
  reception: "Receptionist",
  kitchen: "Kitchen Staff",
  cashier: "Cashier",
};

// Turns a timestamp into "5 min ago", "2 hours ago", etc.
function timeAgo(dateStr) {
  if (!dateStr) return "";
  const then = new Date(dateStr);
  if (isNaN(then.getTime())) return "";

  const seconds = Math.floor((Date.now() - then.getTime()) / 1000);
  if (seconds < 60) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}

function getReadIds() {
  try {
    return JSON.parse(localStorage.getItem(READ_IDS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveReadIds(ids) {
  try {
    // Keep the list from growing forever
    localStorage.setItem(READ_IDS_KEY, JSON.stringify(ids.slice(-200)));
  } catch (e) {
    console.error("Failed to save read notifications:", e);
  }
}

function to12h(timeStr) {
  if (!timeStr) return "";
  if (timeStr instanceof Date) timeStr = timeStr.toTimeString().slice(0, 8);
  const [h, m] = String(timeStr).split(":").map(Number);
  if (isNaN(h)) return "";
  const period = h >= 12 ? "pm" : "am";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

export default function StaffHeader({ name, role, onNotificationClick }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const [showSettings, setShowSettings] = useState(false);
  const [avatarColor, setAvatarColor] = useState(localStorage.getItem("eurasia_avatar_color") || INK);

  const savedName = localStorage.getItem("eurasia_name");
  const savedRole = localStorage.getItem("eurasia_role");

  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const resolvedRole = (savedRole || role || "reception").toLowerCase();

  const [notifications, setNotifications] = useState([]);

  const displayName = savedName || name || "Staff Member";
  const displayRole = ROLE_LABELS[resolvedRole] || resolvedRole;

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Build the notification list from real orders / reservations for this role
  const loadNotifications = useCallback(async () => {
    const readIds = getReadIds();

    try {
      let built = [];

      if (resolvedRole === "reception") {
        const data = await reservationsApi.getAll();
        built = data
          .filter((r) => r.status !== "cancelled" && r.status !== "no_show")
          .map((r) => ({
            id: `res-${r.id}`,
            message:
              r.status === "completed"
                ? `Reservation for ${r.guest_name} marked as Completed`
                : r.status === "seated"
                ? `${r.guest_name} has arrived — Table ${r.table_number || "—"}`
                : `New reservation from ${r.guest_name} at ${to12h(r.reservation_time)}`,
            createdAt: r.created_at,
            target: {
              page: "reception",
              type: "reservation",
              id: r.id,
              date: r.reservation_date,
            },
          }));
      } else if (resolvedRole === "kitchen") {
        const data = await ordersApi.getAll({ today_only: "true" });
        built = data
          .filter((o) => ["pending", "preparing", "ready"].includes(o.status))
          .map((o) => {
            const no = o.daily_number ?? o.id;
            return {
              id: `ord-${o.id}-${o.status}`,
              message:
                o.status === "ready"
                  ? `Order ${no} marked as Ready`
                  : o.status === "preparing"
                  ? `Order ${no} is now Preparing`
                  : `New order received — Order ${no} (Table ${o.table_number})`,
              createdAt: o.created_at,
              target: { page: "kitchen", type: "order", id: o.id },
            };
          });
      } else if (resolvedRole === "cashier") {
        const data = await ordersApi.getAll({ today_only: "true" });
        built = data
          .filter((o) => o.has_receipt || o.receipt_image || o.payment_status !== "pending")
          .map((o) => {
            const no = o.daily_number ?? o.id;
            return {
              id: `pay-${o.id}-${o.payment_status}`,
              message:
                o.payment_status === "verified"
                  ? `Payment for Order ${no} confirmed`
                  : o.payment_status === "failed"
                  ? `Payment for Order ${no} marked as Failed`
                  : `Payment submitted for Order ${no} — awaiting verification`,
              createdAt: o.created_at,
              target: { page: "cashier", type: "order", id: o.id },
            };
          });
      } else {
        // Owner sees both kitchen and front-desk activity
        const [orders, reservations] = await Promise.all([
          ordersApi.getAll({ today_only: "true" }),
          reservationsApi.getAll(),
        ]);
        built = [
          ...orders.map((o) => ({
            id: `ord-${o.id}-${o.status}`,
            message: `Order ${o.daily_number ?? o.id} — Table ${o.table_number} (${o.status})`,
            createdAt: o.created_at,
            target: { page: "kitchen", type: "order", id: o.id },
          })),
          ...reservations
            .filter((r) => r.status !== "cancelled")
            .map((r) => ({
              id: `res-${r.id}`,
              message: `Reservation — ${r.guest_name} (${r.status})`,
              createdAt: r.created_at,
              target: {
                page: "reception",
                type: "reservation",
                id: r.id,
                date: r.reservation_date,
              },
            })),
        ];
      }

      // Newest first, capped so the panel stays readable
      built.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      built = built.slice(0, 15).map((n) => ({
        ...n,
        time: timeAgo(n.createdAt),
        read: readIds.includes(n.id),
      }));

      setNotifications(built);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  }, [resolvedRole]);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, NOTIF_POLL_MS);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
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

  const markAllRead = () => {
    const allIds = notifications.map((n) => n.id);
    saveReadIds([...new Set([...getReadIds(), ...allIds])]);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markOneRead = (id) => {
    saveReadIds([...new Set([...getReadIds(), id])]);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleNotifClick = (n) => {
    markOneRead(n.id);
    setNotifOpen(false);
    if (!n.target) return;

    // Inside the Owner shell, switch tabs. Standalone pages navigate by route.
    if (onNotificationClick) {
      onNotificationClick(n.target);
    } else {
      navigate(`/${n.target.page}`, { state: { highlight: n.target } });
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 32px",
        background: "#fff",
        boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
      }}
    >
      <img src={logo} alt="Eurasia Restaurant" style={{ height: 64, width: "auto" }} />

      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        {/* Notification Bell */}
        <div style={{ position: "relative" }} ref={notifRef}>
          <button
            onClick={() => setNotifOpen((prev) => !prev)}
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "#f4f2f6",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <Bell size={19} color={INK} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: 4,
                  right: 5,
                  width: 9,
                  height: 9,
                  borderRadius: "50%",
                  background: "#c0392b",
                  border: "2px solid #fff",
                }}
              />
            )}
          </button>

          {notifOpen && (
            <div
              style={{
                position: "absolute",
                top: 50,
                right: 0,
                background: "rgba(255, 255, 255, 0.55)",
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                border: "1px solid rgba(0, 0, 0, 0.08)",
                borderRadius: 12,
                boxShadow: "0 6px 20px rgba(0,0,0,0.14)",
                overflow: "hidden",
                width: 320,
                zIndex: 30,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 16px",
                  borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
                }}
              >
                <span style={{ fontFamily: FONT, fontSize: 15, fontWeight: 700, color: INK, textAlign: "left" }}>
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    style={{
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      fontFamily: FONT,
                      fontSize: 11.5,
                      color: MUTED,
                      textDecoration: "underline",
                    }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div style={{ maxHeight: 320, overflowY: "auto" }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: "24px 16px", textAlign: "center", color: MUTED, fontFamily: FONT, fontSize: 13 }}>
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotifClick(n)}
                      style={{
                        padding: "12px 16px",
                        borderBottom: "1px solid rgba(0, 0, 0, 0.05)",
                        background: n.read ? "transparent" : "rgba(250, 246, 242, 0.5)",
                        display: "flex",
                        gap: 10,
                        alignItems: "flex-start",
                        cursor: "pointer",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0, 0, 0, 0.04)")}
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = n.read ? "transparent" : "rgba(250, 246, 242, 0.5)")
                      }
                    >
                      {!n.read && (
                        <span
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: "50%",
                            background: "#c0392b",
                            marginTop: 5,
                            flexShrink: 0,
                          }}
                        />
                      )}
                      <div style={{ flex: 1, textAlign: "left" }}>
                        <div style={{ fontFamily: FONT, fontSize: 13, color: INK, lineHeight: 1.4, textAlign: "left" }}>
                          {n.message}
                        </div>
                        <div style={{ fontFamily: FONT, fontSize: 11, color: MUTED, marginTop: 3, textAlign: "left" }}>
                          {n.time}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Menu */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, position: "relative" }} ref={menuRef}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: FONT, fontSize: 18, color: INK, WebkitTextStroke: "0.5px " + INK }}>
              {displayName}
            </div>
            <div style={{ fontFamily: FONT, fontSize: 16, color: MUTED }}>
              {displayRole}
            </div>
          </div>

          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            style={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              background: avatarColor,
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <UserRound size={26} color="#fff" />
          </button>

          {menuOpen && (
            <div
              style={{
                position: "absolute",
                top: 52,
                right: 0,
                background: "#fff",
                borderRadius: 10,
                boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                overflow: "hidden",
                minWidth: 140,
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
                  fontFamily: FONT,
                  fontSize: 13,
                  color: INK,
                  textAlign: "left",
                  borderBottom: "1px solid #eee",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f7f5f6")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
              >
                <Settings size={15} /> Settings
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
                  fontFamily: FONT,
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
      </div>

      {showSettings && (
        <SettingsModal
          onClose={() => {
            setShowSettings(false);
            setAvatarColor(localStorage.getItem("eurasia_avatar_color") || INK);
          }}
        />
      )}
    </div>
  );
}