import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, X, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logopic2.png';
import heroImage from '../assets/bg2.jpg';

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [certified, setCertified] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  

    // Lock the page scroll while the terms modal is open
  useEffect(() => {
    if (showTerms) {
      const previous = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = previous; };
    }
  }, [showTerms]);

  const inputClass =
    "w-full bg-[#f1ece7] rounded-md px-5 py-4 text-[#1d080f] placeholder:text-neutral-500 font-[Prata] focus:outline-none focus:ring-1 focus:ring-[#1d080f]";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim() || !contactNumber.trim() || !email.trim() || !password) {
      setError('Please fill in all fields.');
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

    if (!certified) {
      setError('Please read and agree to the Terms and Conditions.');
      return;
    }

    try {
      setSubmitting(true);
      await register({
        full_name: fullName.trim(),
        contact_number: contactNumber.trim(),
        email: email.trim(),
        password,
      });
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
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
          <h1
            className="text-center text-[#1d080f] mb-8"
            style={{ fontFamily: 'Prata, serif', fontSize: '30px', WebkitTextStroke: '0.7px #1d080f' }}
          >
            Create an account
          </h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="text"
              value={fullName}
              onChange={(e) =>
                setFullName(e.target.value.replace(/\b[a-z]/g, (c) => c.toUpperCase()))
              }
              placeholder="Full Name"
              className={inputClass}
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              className={inputClass}
            />
            <input
              type="text"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              placeholder="Contact Number"
              className={inputClass}
            />

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className={`${inputClass} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
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
                placeholder="Confirm Password"
                className={`${inputClass} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-[#1d080f] transition"
              >
                {showConfirm ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>

             <div className="flex items-center justify-center gap-2 mt-1">
              <span
                className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                  certified ? 'bg-[#1d080f] border-[#1d080f]' : 'border-neutral-400'
                }`}
              >
                {certified && <Check size={13} className="text-white" strokeWidth={3} />}
              </span>
              <button
                type="button"
                onClick={() => setShowTerms(true)}
                className="font-[Prata] text-sm text-[#1d080f] underline hover:opacity-70"
              >
                Terms and Conditions
              </button>
            </div>

            {error && (
              <p className="text-center text-sm text-red-500 font-[Prata]">{error}</p>
            )}

            <p className="text-center font-[Prata] text-sm text-[#1d080f]">
              Already have an account?{' '}
              <Link to="/login" className="underline hover:opacity-70">Login</Link>
            </p>

            <div className="flex justify-center mt-2">
              <button
                type="submit"
                disabled={submitting}
                className="bg-[#1d080f] text-white font-[Prata] font-bold px-12 py-3 rounded-md hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Creating account...' : 'Sign up'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showTerms && (
        <div
          onClick={() => setShowTerms(false)}
          className="fixed inset-0 z-[130] flex items-center justify-center bg-black/30 px-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
          >
            <div className="flex items-center justify-between px-8 py-5 border-b border-neutral-200">
              <h3
                className="text-[#1d080f]"
                style={{ fontFamily: 'Prata, serif', fontSize: '20px' }}
              >
                Terms and Conditions
              </h3>
              <button
                onClick={() => setShowTerms(false)}
                className="text-neutral-500 hover:text-[#1d080f] transition"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto px-8 py-6 text-sm text-neutral-700 leading-relaxed space-y-5 text-justify">              
                <p className="text-xs text-neutral-400">Last updated: September 2026</p>

              <div>
                <h4 className="font-[Prata] text-[#1d080f] mb-2" style={{ WebkitTextStroke: '0.5px #1d080f' }}>1. Your Account</h4>
                <p>
                  You agree to provide accurate and complete information when creating your account,
                  and to keep your password confidential. You are responsible for all activity made
                  through your account. Eurasia Restaurant may suspend accounts found to contain
                  false information or used for fraudulent bookings.
                </p>
              </div>

              <div>
                <h4 className="font-[Prata] text-[#1d080f] mb-2" style={{ WebkitTextStroke: '0.5px #1d080f' }}>2. Reservations</h4>
                <p>
                  A downpayment is required to confirm any reservation, and is deducted from your
                  final bill. Your reservation remains pending until our receptionist verifies your
                  proof of payment. Cancellations must be made at least three (3) days before your
                  reservation date. Downpayments for cancellations and no-shows are
                  non-refundable. The restaurant reserves the right to release a table after a
                  reasonable waiting period.
                </p>
              </div>

              <div>
                <h4 className="font-[Prata] text-[#1d080f] mb-2" style={{ WebkitTextStroke: '0.5px #1d080f' }}>3. Orders and Payment</h4>                <p>
                  Orders placed through this website are sent directly to our kitchen and cannot be
                  cancelled once preparation has begun. Payment is settled at the restaurant, and
                  proof of payment must be uploaded for verification by our cashier. Prices are
                  subject to change without prior notice. Senior Citizen and PWD discounts require a
                  valid ID presented on site.
                </p>
              </div>

              <div>
                <h4 className="font-[Prata] text-[#1d080f] mb-2" style={{ WebkitTextStroke: '0.5px #1d080f' }}>4. Your Information</h4>                <p>
                  We collect your name, contact number, email address, and the images you upload
                  solely to process your reservations, orders, and payments. Your information is not
                  sold or shared with third parties. You may request correction or deletion of your
                  information by contacting the restaurant.
                </p>
              </div>

              <div>
                <h4 className="font-[Prata] text-[#1d080f] mb-2" style={{ WebkitTextStroke: '0.5px #1d080f' }}>5. Changes of these Terms</h4>                <p>
                  Eurasia Restaurant may update these terms from time to time. Continued use of your
                  account after any update constitutes acceptance of the revised terms.
                </p>
              </div>
            </div>

                        <div className="px-6 py-3 border-t border-neutral-200 flex justify-end gap-2">
              <button
                onClick={() => {
                  setCertified(false);
                  setShowTerms(false);
                }}
                className="border border-neutral-300 text-neutral-700 font-[Prata] text-xs px-4 py-2 rounded-md hover:bg-neutral-50 transition"
              >
                I Don't Agree
              </button>
              <button
                onClick={() => {
                  setCertified(true);
                  setShowTerms(false);
                }}
                className="bg-[#1d080f] text-white font-[Prata] text-xs px-4 py-2 rounded-md hover:opacity-90 transition"
              >
                I Agree
              </button>
            </div>
            </div>
          </div>
      )}
    </div>
  );
}

export default Register;