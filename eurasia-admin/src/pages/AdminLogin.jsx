import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logopic2.png";

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

export default function Login() {
  const navigate = useNavigate();
  const [role, setRole] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!role || !name || !password) {
      setError("Please fill in all fields.");
      return;
    }

    // TODO: replace with a real login call once the backend/AuthContext
    // is wired up, e.g. await login({ name, password, role })
    localStorage.setItem("eurasia_role", role);
    localStorage.setItem("eurasia_name", name);

    setError("");
    navigate(ROLE_ROUTES[role]);
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
          <p
  className="text-center text-[#f1ece7]/60 text-sm mb-2"
  style={{ transform: "skewX(-10deg)", display: "inline-block" }}
>
  Authorized personnel only
</p>
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
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-md mb-4 text-sm bg-white text-[#1d080f] placeholder-neutral-400"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-md mb-2 text-sm bg-white text-[#1d080f] placeholder-neutral-400"
          />

          {error && <p className="text-red-400 text-xs mb-2">{error}</p>}

          <div className="flex flex-col items-center gap-3 mt-3">
            <button
              type="submit"
              className="px-10 py-3 rounded-md bg-white text-[#1d080f] text-sm hover:bg-neutral-200 transition"
              style={{ WebkitTextStroke: "0.4px #1d080f" }}
            >
              Log In
            </button>

            <button
              type="button"
              className="px-8 py-3 rounded-md bg-[#c0392b] text-white text-sm hover:bg-[#a5342a] transition"
              style={{ WebkitTextStroke: "0.4px white" }}
            >
              Forgot Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}