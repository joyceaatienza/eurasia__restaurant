import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logopic3.png";

const FONT = "'Prata', serif";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    setError("");

    // TODO: replace with a real API call once the backend exists, e.g.
    // await fetch("/api/forgot-password", { method: "POST", body: JSON.stringify({ email }) })

    setSubmitted(true);
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
          {!submitted ? (
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
                Enter your email address below and we'll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit}>
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-md mb-2 text-sm bg-white text-[#1d080f] placeholder-neutral-400"
                />
                {error && <p className="text-red-400 text-xs mb-2">{error}</p>}

                <button
                  type="submit"
                  className="w-full mt-3 py-3 rounded-md bg-[#c0392b] text-white font-bold text-sm hover:bg-[#a5342a] transition"
                >
                  Send Reset Link
                </button>
              </form>

              <button
                onClick={() => navigate("/login")}
                className="w-full mt-3 py-3 rounded-md bg-white text-[#1d080f] font-bold text-sm hover:bg-neutral-200 transition"
              >
                Back to Log In
              </button>
            </>
          ) : (
            <div className="text-center">
              <h1
                className="text-3xl tracking-[0.05em] mb-4 text-[#f5e9d8]"
                style={{ WebkitTextStroke: "0.5px #f5e9d8" }}
              >
                Check Your Email
              </h1>
              <p className="text-[#f1ece7]/70 text-sm mb-8 leading-relaxed">
                If an account exists for <b>{email}</b>, you'll receive a password reset link shortly.
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