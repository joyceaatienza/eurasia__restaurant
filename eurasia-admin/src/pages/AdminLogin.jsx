import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logopic2.png";
import { Eye, EyeOff } from "lucide-react";
import { authApi } from "../services/authApi";

/* Role → where they land after logging in */
const ROLE_ROUTES = {
  owner: "/admin",
  reception: "/reception",
  kitchen: "/kitchen",
  cashier: "/cashier",
};

const ROLE_LABELS = {
  owner: "Owner / Manager",
  reception: "Front Desk",
  kitchen: "Kitchen",
  cashier: "Cashier",
};

function toTitleCase(str) {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => (word.length > 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(" ");
}

export default function Login() {
  const navigate = useNavigate();
  const [role, setRole] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!role || !name || !password) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      const { token, user } = await authApi.login(role, name, password);

      localStorage.setItem("eurasia_token", token);
      localStorage.setItem("eurasia_role", user.role);
      localStorage.setItem("eurasia_name", user.name);

      navigate(ROLE_ROUTES[role]);
    } catch (err) {
      setError(err.message || "Invalid role, name, or password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-[Prata]">
      {/* Left — brand panel */}
      <div className="md:w-2/5 bg-white flex flex-col items-center justify-center py-16">
        <img src={logo} alt="Eurasia Restaurant" className="w-56 md:w-80 h-auto" />
      </div>

      {/* Right — login form */}
      <div className="md:w-4/5 bg-[#1d080f] text-[#f1ece7] flex items-center justify-center px-8 py-16">
        <form onSubmit={handleSubmit} className="w-full max-w-lg">
          <div className="text-center mb-2">
            <p
              className="text-[#f1ece7]/60 text-sm"
              style={{ transform: "skewX(-10deg)", display: "inline-block" }}
            >
              Authorized personnel only
            </p>
          </div>

          <h1
            className="text-center text-5xl tracking-[0.15em] mb-10 text-[#f5e9d8]"
            style={{ WebkitTextStroke: "0.5px #f5e9d8" }}
          >
            ADMIN
          </h1>

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className={`w-full px-4 py-3 rounded-md mb-4 text-sm bg-white ${
              role ? "text-[#1d080f]" : "text-neutral-400"
            }`}
          >
            <option value="">Role</option>
            {Object.entries(ROLE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(toTitleCase(e.target.value))}
            className="w-full px-4 py-3 rounded-md mb-4 text-sm bg-white text-[#1d080f] placeholder-neutral-400"
          />

          <div className="relative w-full mb-4">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 pr-11 rounded-md text-sm bg-white text-[#1d080f] placeholder-neutral-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            >
              {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>

          {error && <p className="text-red-400 text-xs mb-4 text-center">{error}</p>}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              marginTop: "10px",
              width: "100%",
              maxWidth: "50%",
              margin: "10px auto 0",
              boxSizing: "border-box",
            }}
          >
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-white text-[#1d080f] font-bold text-sm hover:bg-neutral-200 transition disabled:opacity-60"
              style={{ padding: "12px 16px" }}
            >
              {submitting ? "Logging in..." : "Log In"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="w-full rounded-md bg-[#c0392b] text-white font-bold text-sm hover:bg-[#a5342a] transition"
              style={{ padding: "12px 16px" }}
            >
              Forgot Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}