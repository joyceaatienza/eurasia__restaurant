import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserRound, LogOut, Settings, Bell } from "lucide-react";
import logo from "../assets/logopic3.png";
import SettingsModal from "./SettingsModal";

const FONT = "'Prata', serif";
const INK = "#1d080f";
const MUTED = "#7a756c";

const NOTIFICATIONS_BY_ROLE = {
  Reception: [
    { id: 1, message: "New table reservation from John Doe", time: "5 min ago", read: false },
    { id: 2, message: "Reservation for Jane Smith marked as Completed", time: "20 min ago", read: false },
    { id: 3, message: "New event reservation request", time: "1 hour ago", read: true },
  ],
  Kitchen: [
    { id: 1, message: "New order received — Order 03 (Table 5)", time: "3 min ago", read: false },
    { id: 2, message: "Order 01 marked as Ready", time: "18 min ago", read: false },
    { id: 3, message: "Order 02 is now Preparing", time: "45 min ago", read: true },
  ],
  Cashier: [
    { id: 1, message: "New payment received via GCash — Order 02", time: "4 min ago", read: false },
    { id: 2, message: "Payment #01 confirmed successfully", time: "22 min ago", read: false },
    { id: 3, message: "Payment #03 marked as Failed", time: "1 hour ago", read: true },
  ],
};

export default function StaffHeader({ name, role }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const [showSettings, setShowSettings] = useState(false);
  const [avatarColor, setAvatarColor] = useState(localStorage.getItem("eurasia_avatar_color") || INK);

  const savedName = localStorage.getItem("eurasia_name");
  const savedRole = localStorage.getItem("eurasia_role");

  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const resolvedRole = savedRole || role || "Reception";
const normalizedRole =
  resolvedRole.charAt(0).toUpperCase() + resolvedRole.slice(1).toLowerCase();

const [notifications, setNotifications] = useState(
  NOTIFICATIONS_BY_ROLE[normalizedRole] || NOTIFICATIONS_BY_ROLE.Reception
);

  const displayName = savedName || name || "Staff Member";
  const displayRole = savedRole || role || "Staff";

  const unreadCount = notifications.filter((n) => !n.read).length;

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
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markOneRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
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
                      onClick={() => markOneRead(n.id)}
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
            <div style={{ fontFamily: FONT, fontSize: 16, color: MUTED, textTransform: "capitalize" }}>
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