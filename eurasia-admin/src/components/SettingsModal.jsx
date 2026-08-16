import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, LogOut, Save } from "lucide-react";

const FONT = "'Prata', serif";
const INK = "#1d080f";

const AVATAR_COLORS = ["#1d080f", "#7fa8d8", "#296c39", "#cd8a5d", "#9b7ee0"];

const ROLE_LABELS = {
  owner: "Owner / Manager",
  reception: "Front Desk",
  kitchen: "Kitchen",
  cashier: "Cashier",
};

export default function SettingsModal({ onClose }) {
  const navigate = useNavigate();
const [name, setName] = useState(localStorage.getItem("eurasia_name") || "");
const role = localStorage.getItem("eurasia_role") || "";
const [phone, setPhone] = useState(localStorage.getItem("eurasia_phone") || "");
const [email, setEmail] = useState(localStorage.getItem("eurasia_email") || "");
const [avatarColor, setAvatarColor] = useState(localStorage.getItem("eurasia_avatar_color") || AVATAR_COLORS[0]);
const [saved, setSaved] = useState(false);
const [currentPassword, setCurrentPassword] = useState("");
const [newPassword, setNewPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");
const [passwordError, setPasswordError] = useState("");
const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem("eurasia_name", name);
    localStorage.setItem("eurasia_phone", phone);
    localStorage.setItem("eurasia_email", email);
    localStorage.setItem("eurasia_avatar_color", avatarColor);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };
const handlePasswordChange = (e) => {
  e.preventDefault();
  if (!currentPassword || !newPassword || !confirmPassword) {
    setPasswordError("Please fill in all fields.");
    return;
  }
  if (newPassword !== confirmPassword) {
    setPasswordError("New passwords do not match.");
    return;
  }
  if (newPassword.length < 6) {
    setPasswordError("New password must be at least 6 characters.");
    return;
  }

  setPasswordError("");
  setPasswordSuccess(true);
  setCurrentPassword("");
  setNewPassword("");
  setConfirmPassword("");
};

  const handleLogout = () => {
    localStorage.removeItem("eurasia_role");
    localStorage.removeItem("eurasia_name");
    navigate("/login");
  };

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(23,3,16,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}
    >
      <div
  onClick={(e) => e.stopPropagation()}
  style={{ background: "#fff", borderRadius: 18, padding: 28, width: "100%", maxWidth: 480, maxHeight: "85vh", overflowY: "auto", fontFamily: FONT, textAlign: "left" }}
>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 22, color: INK, WebkitTextStroke: "0.4px " + INK }}>Profile Settings</div>
          <button onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer" }}>
            <X size={20} color={INK} />
          </button>
        </div>

        {/* Avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 22 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: avatarColor, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 20, fontWeight: 700, flexShrink: 0 }}>
            {name ? name.charAt(0).toUpperCase() : "?"}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {AVATAR_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setAvatarColor(c)}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: c,
                  border: avatarColor === c ? "2px solid " + INK : "2px solid transparent",
                  cursor: "pointer",
                }}
              />
            ))}
          </div>
        </div>

        {/* Basic Info */}
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 12, color: "#6b5b60", display: "block", marginBottom: 5 }}>Display Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #e7e3e6", fontSize: 14, fontFamily: FONT, color: INK }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, color: "#6b5b60", display: "block", marginBottom: 5 }}>Role</label>
            <input
              value={ROLE_LABELS[role] || role}
              disabled
              style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #e7e3e6", fontSize: 14, fontFamily: FONT, color: "#9c8f92", background: "#f7f5f6" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, color: "#6b5b60", display: "block", marginBottom: 5 }}>Phone Number</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0917 000 0000"
                style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #e7e3e6", fontSize: 14, fontFamily: FONT, color: INK }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "#6b5b60", display: "block", marginBottom: 5 }}>Email Address</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #e7e3e6", fontSize: 14, fontFamily: FONT, color: INK }}
              />
            </div>
          </div>

          <button
            type="submit"
            style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 10, border: "none", background: INK, color: "#fff", fontSize: 13, fontFamily: FONT, cursor: "pointer" }}
          >
            <Save size={14} /> Save Changes
          </button>

          {saved && <div style={{ color: "#296c39", fontSize: 12 }}>Saved!</div>}
        </form>

        {/* Change Password */}
<div style={{ background: "#f7f5f6", borderRadius: 10, padding: 18, marginBottom: 20 }}>
  <div style={{ fontSize: 13.5, color: INK, marginBottom: 12 }}>Change Password</div>

  {passwordSuccess ? (
    <p style={{ fontSize: 12.5, color: "#296c39", margin: 0 }}>
      Your password has been updated successfully.
    </p>
  ) : (
    <form onSubmit={handlePasswordChange} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <input
        type="password"
        placeholder="Current Password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #e7e3e6", fontSize: 13, fontFamily: FONT, color: INK, background: "#fff" }}
      />
      <input
        type="password"
        placeholder="New Password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #e7e3e6", fontSize: 13, fontFamily: FONT, color: INK, background: "#fff" }}
      />
      <input
        type="password"
        placeholder="Confirm New Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #e7e3e6", fontSize: 13, fontFamily: FONT, color: INK, background: "#fff" }}
      />

      {passwordError && <p style={{ fontSize: 11.5, color: "#c0392b", margin: 0 }}>{passwordError}</p>}

      <button
        type="submit"
        style={{ alignSelf: "flex-start", padding: "9px 18px", borderRadius: 8, border: "none", background: "#c0392b", color: "#fff", fontSize: 12.5, fontFamily: FONT, cursor: "pointer" }}
      >
        Update Password
      </button>
    </form>
  )}
</div>

        <button
          onClick={handleLogout}
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 18px", borderRadius: 10, border: "none", background: "#c0392b", color: "#fff", fontSize: 13, fontFamily: FONT, cursor: "pointer" }}
        >
          <LogOut size={14} /> Log Out
        </button>
      </div>
    </div>
  );
}