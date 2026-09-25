import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import logo from '../assets/logopic2.png';
import heroImage from '../assets/bg2.jpg';
import { customerAuthApi } from '../services/customerAuthApi';

function ForgotPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  // 'email' | 'code' | 'password' | 'done'
  const [step, setStep] = useState('email');

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // Count down the resend cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Hand back whatever the customer had typed on the login page
  const backToLogin = () => navigate('/login', { state: location.state });

  const inputClass =
    "w-full bg-[#f1ece7] rounded-md px-5 py-4 text-[#1d080f] placeholder:text-neutral-500 font-[Prata] focus:outline-none focus:ring-1 focus:ring-[#1d080f]";

  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    try {
      setBusy(true);
      setError('');
      await customerAuthApi.forgotPassword(email.trim());
      setCooldown(60);
      setStep('code');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Please enter the verification code.');
      return;
    }

    try {
      setBusy(true);
      setError('');
      await customerAuthApi.verifyResetCode(email.trim(), code.trim());
      setStep('password');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    try {
      setBusy(true);
      setError('');
      setResendMsg('');
      await customerAuthApi.forgotPassword(email.trim());
      setCooldown(60);
      setResendMsg('A new code has been sent to your email.');
      setTimeout(() => setResendMsg(''), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      setError('Please fill in both password fields.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setBusy(true);
      setError('');
      await customerAuthApi.resetPassword(email.trim(), code.trim(), password);
      setStep('done');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="absolute inset-0 bg-no-repeat"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%',
        }}
      />
      <div className="absolute inset-0 bg-white/30" />

      <div className="relative z-10 flex flex-col items-center px-4 pt-16 pb-16">
        <img src={logo} alt="Eurasia Restaurant" className="w-72 md:w-80 h-auto mb-6" />

        <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl px-8 md:px-8 py-6">

          {/* STEP 1 — Email */}
          {step === 'email' && (
            <>
              <h1
                className="text-center text-[#1d080f] mb-3"
                style={{ fontFamily: 'Prata, serif', fontSize: '26px', WebkitTextStroke: '0.7px #1d080f' }}
              >
                Forgot Password
              </h1>
              <p className="text-center font-[Prata] text-xs text-neutral-500 mb-6 leading-relaxed">
                Enter your email address and we'll send you a verification code.
              </p>

              <form onSubmit={handleSendCode} className="flex flex-col gap-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  disabled={busy}
                  className={inputClass}
                />

                {error && <p className="text-center text-sm text-red-500 font-[Prata]">{error}</p>}

                <div className="flex justify-center gap-3 mt-2">
                  <button
                    type="button"
                    onClick={backToLogin}
                    className="border border-neutral-300 text-neutral-700 font-[Prata] px-8 py-3 rounded-md hover:bg-neutral-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={busy}
                    className="bg-[#1d080f] text-white font-[Prata] font-bold px-8 py-3 rounded-md hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {busy ? 'Sending...' : 'Send Code'}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* STEP 2 — Verification code */}
          {step === 'code' && (
            <>
              <h1
                className="text-center text-[#1d080f] mb-3"
                style={{ fontFamily: 'Prata, serif', fontSize: '26px', WebkitTextStroke: '0.7px #1d080f' }}
              >
                Enter Code
              </h1>
              <p className="text-center font-[Prata] text-xs text-neutral-500 mb-6 leading-relaxed">
                We sent a 6-digit code to <b>{email}</b>. It expires in 15 minutes.
              </p>

              <form onSubmit={handleVerifyCode} className="flex flex-col gap-4">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  disabled={busy}
                  className="w-full bg-[#f1ece7] rounded-md px-5 py-4 text-center text-2xl tracking-[0.5em] text-[#1d080f] placeholder:text-neutral-400 font-[Prata] focus:outline-none focus:ring-1 focus:ring-[#1d080f]"
                />

                {error && <p className="text-center text-sm text-red-500 font-[Prata]">{error}</p>}
                {resendMsg && <p className="text-center text-sm text-green-600 font-[Prata]">{resendMsg}</p>}

                <div className="flex justify-center gap-3 mt-2">
                  <button
                    type="button"
                    onClick={backToLogin}
                    className="border border-neutral-300 text-neutral-700 font-[Prata] px-8 py-3 rounded-md hover:bg-neutral-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={busy}
                    className="bg-[#1d080f] text-white font-[Prata] font-bold px-8 py-3 rounded-md hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {busy ? 'Verifying...' : 'Verify Code'}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={busy || cooldown > 0}
                  className="font-[Prata] text-xs text-[#b38548] font-semibold hover:text-[#1d080f] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cooldown > 0 ? `Resend code in ${cooldown}s` : "Didn't get the code? Resend"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setCode('');
                    setError('');
                  }}
                  className="font-[Prata] text-xs text-neutral-500 underline hover:text-[#1d080f] transition"
                >
                  Use a different email
                </button>
              </form>
            </>
          )}

          {/* STEP 3 — New password */}
          {step === 'password' && (
            <>
              <h1
                className="text-center text-[#1d080f] mb-3"
                style={{ fontFamily: 'Prata, serif', fontSize: '26px', WebkitTextStroke: '0.7px #1d080f' }}
              >
                New Password
              </h1>
              <p className="text-center font-[Prata] text-xs text-neutral-500 mb-6 leading-relaxed">
                Choose a new password for your account.
              </p>

              <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="New Password"
                    disabled={busy}
                    className={`${inputClass} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-[#1d080f] transition"
                  >
                    {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm New Password"
                    disabled={busy}
                    className={`${inputClass} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-[#1d080f] transition"
                  >
                    {showConfirm ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>

                {error && <p className="text-center text-sm text-red-500 font-[Prata]">{error}</p>}

                <div className="flex justify-center gap-3 mt-2">
                  <button
                    type="button"
                    onClick={backToLogin}
                    className="border border-neutral-300 text-neutral-700 font-[Prata] px-8 py-3 rounded-md hover:bg-neutral-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={busy}
                    className="bg-[#1d080f] text-white font-[Prata] font-bold px-8 py-3 rounded-md hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {busy ? 'Updating...' : 'Reset Password'}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* STEP 4 — Done */}
          {step === 'done' && (
            <div className="text-center py-4">
              <h1
                className="text-[#1d080f] mb-3"
                style={{ fontFamily: 'Prata, serif', fontSize: '26px', WebkitTextStroke: '0.7px #1d080f' }}
              >
                Password Updated
              </h1>
              <p className="font-[Prata] text-sm text-neutral-500 mb-8 leading-relaxed">
                Your password has been changed. You can now log in with your new password.
              </p>
              <button
                onClick={backToLogin}
                className="bg-[#1d080f] text-white font-[Prata] font-bold px-12 py-3 rounded-md hover:opacity-90 transition"
              >
                Back to Login
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;