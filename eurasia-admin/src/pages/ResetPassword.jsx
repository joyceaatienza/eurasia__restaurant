import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import logo from "../assets/logopic3.png";
import { passwordResetApi } from "../services/passwordResetApi";

const FONT = "'Prata', serif";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [checking, setChecking] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userName, setUserName] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setChecking(false);
      setTokenValid(false);
      return;
    }

    passwordResetApi
      .verifyToken(token)
      .then((data) => {
        setTokenValid(true);
        setUserName(data.name || "");
      })
      .catch(() => setTokenValid(false))
      .finally(() => setChecking(false));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      await passwordResetApi.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ fontFamily: FONT }}>
      {/* Left — brand panel */}
      <div className="flex-1 bg-white flex flex-col items-center justify-center py-16">
        <img src={logo} alt="Eurasia Restaurant" className="w-56 md:w-72 h-auto" />
      </div>

      {/* Right — form */}
      <div className="flex-1 bg-[#1d080f] text-[#f1ece7] flex items-center justify-center px-8 py-16">
        <div className="w-full max-w-sm">
          {checking ? (
            <p className="text-center text-[#f1ece7]/70 text-sm">Verifying your link...</p>
          ) : !tokenValid ? (
            <div className="text-center">
              <h1
                className="text-3xl tracking-[0.05em] mb-4 text-[#f5e9d8]"
                style={{ WebkitTextStroke: "0.5px #f5e9d8" }}
              >
                Link Expired
              </h1>
              <p className="text-[#f1ece7]/70 text-sm mb-8 leading-relaxed">
                This reset link is invalid or has already been used. Please request a new one.
              </p>
              <button
                onClick={() => navigate("/forgot-password")}
                className="w-full py-3 rounded-md bg-[#c0392b] text-white font-bold text-sm hover:bg-[#a5342a] transition"
              >
                Request New Link
              </button>
              <button
                onClick={() => navigate("/login")}
                className="w-full mt-3 py-3 rounded-md bg-white text-[#1d080f] font-bold text-sm hover:bg-neutral-200 transition"
              >
                Back to Log In
              </button>
            </div>
          ) : done ? (
            <div className="text-center">
              <h1
                className="text-3xl tracking-[0.05em] mb-4 text-[#f5e9d8]"
                style={{ WebkitTextStroke: "0.5px #f5e9d8" }}
              >
                Password Updated
              </h1>
              <p className="text-[#f1ece7]/70 text-sm mb-8 leading-relaxed">
                Your password has been changed. You can now log in with your new password.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="w-full py-3 rounded-md bg-white text-[#1d080f] font-bold text-sm hover:bg-neutral-200 transition"
              >
                Go to Log In
              </button>
            </div>
          ) : (
            <>
              <p className="text-center italic text-[#f1ece7]/60 text-sm mb-2">
                Password recovery
              </p>
              <h1
                className="text-center text-4xl tracking-[0.1em] mb-4 text-[#f5e9d8]"
                style={{ WebkitTextStroke: "0.5px #f5e9d8" }}
              >
                New Password
              </h1>
              <p className="text-center text-[#f1ece7]/70 text-xs mb-8 leading-relaxed">
                {userName ? `Hi ${userName}, choose` : "Choose"} a new password for your admin account.
                It must be at least 8 characters.
              </p>

              <form onSubmit={handleSubmit}>
                <div className="relative w-full mb-3">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="New password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={submitting}
                    className="w-full px-4 py-3 pr-11 rounded-md text-sm bg-white text-[#1d080f] placeholder-neutral-400 disabled:opacity-70"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>

                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={submitting}
                  className="w-full px-4 py-3 rounded-md mb-2 text-sm bg-white text-[#1d080f] placeholder-neutral-400 disabled:opacity-70"
                />

                {error && <p className="text-red-400 text-xs mb-2">{error}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-3 py-3 rounded-md bg-[#c0392b] text-white font-bold text-sm hover:bg-[#a5342a] transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? "Updating..." : "Update Password"}
                </button>
              </form>

              <button
                onClick={() => navigate("/login")}
                className="w-full mt-3 py-3 rounded-md bg-white text-[#1d080f] font-bold text-sm hover:bg-neutral-200 transition"
              >
                Back to Log In
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}