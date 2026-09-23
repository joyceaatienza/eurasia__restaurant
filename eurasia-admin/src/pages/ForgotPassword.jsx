import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import logo from "../assets/logopic3.png";
import { passwordResetApi } from "../services/passwordResetApi";

const FONT = "'Prata', serif";

export default function ForgotPassword() {
  const navigate = useNavigate();

  // 'email' | 'code' | 'password' | 'done'
  const [step, setStep] = useState("email");

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

   const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  const [cooldown, setCooldown] = useState(0);

  // Count down the resend cooldown
  React.useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);
  const inputClass =
    "w-full px-4 py-3 rounded-md text-sm bg-white text-[#1d080f] placeholder-neutral-400 disabled:opacity-70";

  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setBusy(true);
      setError("");
      await passwordResetApi.requestReset(email.trim());
      setCooldown(60);
      setStep("code");
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      setError("Please enter the verification code.");
      return;
    }

    try {
      setBusy(true);
      setError("");
      await passwordResetApi.verifyCode(email.trim(), code.trim());
      setStep("password");
    } catch (err) {
      setError(err.message || "That code is incorrect or has expired.");
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    try {
      setBusy(true);
      setError("");
      setResendMsg("");
      await passwordResetApi.requestReset(email.trim());
      setCooldown(60);
      setResendMsg("A new code has been sent to your email.");
      setTimeout(() => setResendMsg(""), 4000);
    } catch (err) {
      setError(err.message || "Failed to resend the code.");
    } finally {
      setBusy(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      setError("Please fill in both password fields.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setBusy(true);
      setError("");
      await passwordResetApi.resetPassword(email.trim(), code.trim(), password);
      setStep("done");
    } catch (err) {
      setError(err.message || "Failed to reset password. Please try again.");
    } finally {
      setBusy(false);
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

          {/* STEP 1 — Email */}
          {step === "email" && (
            <>
              <p className="text-center italic text-[#f1ece7]/60 text-sm mb-2">
                Password recovery
              </p>
              <h1
                className="text-center text-4xl tracking-[0.1em] mb-4 text-[#f5e9d8]"
                style={{ WebkitTextStroke: "0.5px #f5e9d8" }}
              >
                Forgot Password
              </h1>
              <p className="text-center text-[#f1ece7]/70 text-xs mb-8 leading-relaxed">
                Enter your email address and we'll send you a verification code.
              </p>

              <form onSubmit={handleSendCode}>
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={busy}
                  className={inputClass}
                />
                {error && <p className="text-red-400 text-xs mt-2">{error}</p>}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full mt-4 py-3 rounded-md bg-[#c0392b] text-white font-bold text-sm hover:bg-[#a5342a] transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {busy ? "Sending..." : "Send Code"}
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

          {/* STEP 2 — Verification code */}
          {step === "code" && (
            <>
              <p className="text-center italic text-[#f1ece7]/60 text-sm mb-2">
                Check your email
              </p>
              <h1
                className="text-center text-3xl tracking-[0.1em] mb-4 text-[#f5e9d8]"
                style={{ WebkitTextStroke: "0.5px #f5e9d8" }}
              >
                Enter Code
              </h1>
              <p className="text-center text-[#f1ece7]/70 text-xs mb-8 leading-relaxed">
                We sent a 6-digit code to <b>{email}</b>. It expires in 60 seconds.
              </p>

              <form onSubmit={handleVerifyCode}>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  disabled={busy}
                  className="w-full px-4 py-3 rounded-md text-center text-2xl tracking-[0.5em] bg-white text-[#1d080f] placeholder-neutral-300 disabled:opacity-70"
                />
                {error && <p className="text-red-400 text-xs mt-2 text-center">{error}</p>}
                {resendMsg && <p className="text-green-400 text-xs mt-2 text-center">{resendMsg}</p>}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full mt-4 py-3 rounded-md bg-[#c0392b] text-white font-bold text-sm hover:bg-[#a5342a] transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {busy ? "Verifying..." : "Verify Code"}
                </button>
              </form>

              <button
                onClick={handleResend}
                disabled={busy || cooldown > 0}
                className="w-full mt-3 text-xs text-[#f1ece7]/70 underline hover:text-white transition disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
              >
                {cooldown > 0
                  ? `Resend code in ${cooldown}s`
                  : "Didn't get the code? Resend"}
              </button>

              <button
                onClick={() => {
                  setStep("email");
                  setCode("");
                  setError("");
                }}
                className="w-full mt-4 py-3 rounded-md bg-white text-[#1d080f] font-bold text-sm hover:bg-neutral-200 transition"
              >
                Use a Different Email
              </button>
            </>
          )}

          {/* STEP 3 — New password */}
          {step === "password" && (
            <>
              <p className="text-center italic text-[#f1ece7]/60 text-sm mb-2">
                Almost there
              </p>
              <h1
                className="text-center text-3xl tracking-[0.1em] mb-4 text-[#f5e9d8]"
                style={{ WebkitTextStroke: "0.5px #f5e9d8" }}
              >
                New Password
              </h1>
              <p className="text-center text-[#f1ece7]/70 text-xs mb-8 leading-relaxed">
                Choose a new password for your admin account.
              </p>

              <form onSubmit={handleResetPassword}>
                <div className="relative mb-3">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="New password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={busy}
                    className={`${inputClass} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={busy}
                    className={`${inputClass} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    {showConfirm ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>

                {error && <p className="text-red-400 text-xs mt-2">{error}</p>}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full mt-4 py-3 rounded-md bg-[#c0392b] text-white font-bold text-sm hover:bg-[#a5342a] transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {busy ? "Updating..." : "Reset Password"}
                </button>
              </form>
            </>
          )}

          {/* STEP 4 — Done */}
          {step === "done" && (
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
                Back to Log In
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}