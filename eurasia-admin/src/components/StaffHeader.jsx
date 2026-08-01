import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserRound, LogOut } from "lucide-react";
import logo from "../assets/logopic3.png";

const FONT = "'Prata', serif";
const GOLD = "#c9a15a";

export default function StaffHeader({ name, role }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // 1. Titingin sa LocalStorage (kapag tunay na nag-login)
  // 2. Kung wala, gagamitin ang ipinasang Prop
  // 3. Kung wala pa rin, magde-default sa "Staff"
  const savedName = localStorage.getItem("eurasia_name");
  const savedRole = localStorage.getItem("eurasia_role");

  const displayName = savedName || name || "Staff Member";
  const displayRole = savedRole || role || "Staff";

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
      <img src={logo} alt="Eurasia Restaurant" style={{ height: 56, width: "auto" }} />

      <div style={{ display: "flex", alignItems: "center", gap: 14, position: "relative" }} ref={menuRef}>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 15, color: "#3a1420" }}>
            {displayName}
          </div>
          <div style={{ fontFamily: FONT, fontSize: 12, color: GOLD, textTransform: "capitalize"}}>
            {displayRole}
          </div>
        </div>

        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          style={{
            width: 42,
            height: 42,
            borderRadius: "50%",
            background: "#7fa8d8",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <UserRound size={22} color="#fff" />
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
  );
}