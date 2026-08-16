import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logopic2.png";
import { Eye, EyeOff, X, Check } from "lucide-react";

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
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!role || !name || !password) {
      setError("Please fill in all fields.");
      return;
    }

    // Validation para sa Terms and Conditions
    if (!agreedToTerms) {
      setError("Please agree to the Terms and Conditions before logging in.");
      return;
    }

    // Save user info
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

          {/* 🟢 NA-FIX: Terms and Conditions Link & Green Check Badge */}
          <div className="text-center mt-3 mb-3">
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setShowTermsModal(true)}
                className="text-xs underline text-[#f5e9d8] hover:text-white"
              >
                Terms and Conditions
              </button>
              {agreedToTerms && (
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-green-500">
                  <Check size={11} color="white" strokeWidth={3} />
                </span>
              )}
            </div>
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
              className="w-full rounded-md bg-white text-[#1d080f] font-bold text-sm hover:bg-neutral-200 transition"
              style={{ padding: "12px 16px" }}
            >
              Log In
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

      {/* Terms and Conditions Modal */}
      {showTermsModal && (
        <div
          onClick={() => setShowTermsModal(false)}
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white rounded-xl p-7 max-w-lg w-full max-h-[80vh] overflow-y-auto text-[#1d080f]"
          >
            <button
              onClick={() => setShowTermsModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>

            <h3 className="text-xl text-[#1d080f] mb-4 font-bold">Terms and Conditions for Staff</h3>

            <div className="text-sm text-neutral-700 space-y-4 leading-relaxed text-justify">
              <div>
                <p className="font-bold text-[#1d080f] mb-1" style={{ WebkitTextStroke: "0.4px #1d080f" }}>1. Account Responsibility</p>
                <p>You must not share your login credentials (Role, Name, Password) with anyone. You are responsible for all actions performed under your account.</p>
              </div>
              <div>
                <p className="font-bold text-[#1d080f] mb-1" style={{ WebkitTextStroke: "0.4px #1d080f" }}>2. Data Confidentiality</p>
                <p>Customer information (name, contact number, email, payment details) must not be shared or used outside of your work duties. Screenshots or exports of customer data for personal use are strictly prohibited.</p>
              </div>
              <div>
                <p className="font-bold text-[#1d080f] mb-1" style={{ WebkitTextStroke: "0.4px #1d080f" }}>3. Accurate Use of the System</p>
                <p>Actions such as validating payments and marking orders as "Ready" or "Completed" must only be performed based on what has actually occurred. Records must not be altered without valid reason.</p>
              </div>
              <div>
                <p className="font-bold text-[#1d080f] mb-1" style={{ WebkitTextStroke: "0.4px #1d080f" }}>4. Acceptable Use</p>
                <p>This admin system is to be used solely for legitimate restaurant operations. Personal or unauthorized use is not permitted.</p>
              </div>
              <div>
                <p className="font-bold text-[#1d080f] mb-1" style={{ WebkitTextStroke: "0.4px #1d080f" }}>5. Reporting Issues</p>
                <p>Any suspicious activity or system errors must be reported to the manager or owner immediately.</p>
              </div>
              <div>
                <p className="font-bold text-[#1d080f] mb-1" style={{ WebkitTextStroke: "0.4px #1d080f" }}>6. Termination of Access</p>
                <p>Eurasia Restaurant reserves the right to revoke system access at any time, particularly in cases of violation of these terms.</p>
              </div>
              <div>
                <p className="font-bold text-[#1d080f] mb-1" style={{ WebkitTextStroke: "0.4px #1d080f" }}>7. Consequences of Violation</p>
                <p>Violation of these terms may result in a formal warning, suspension, or permanent revocation of system access, subject to management's discretion. Serious violations (e.g. data theft, financial fraud) may result in termination and legal action.</p>
              </div>
            </div>

            <button
              onClick={() => {
                setAgreedToTerms(true);
                setShowTermsModal(false);
              }}
              className="w-full mt-6 py-3 rounded-md bg-[#1d080f] text-white font-bold text-sm hover:bg-[#3a1420] transition"
            >
              I Understand and Agree
            </button>
          </div>
        </div>
      )}
    </div>
  );
}