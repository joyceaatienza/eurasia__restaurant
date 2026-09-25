import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logopic2.png';
import heroImage from '../assets/bg2.jpg';

function Login() {
   const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [fullName, setFullName] = useState(location.state?.fullName || '');
  const [identifier, setIdentifier] = useState(location.state?.identifier || '');  
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const inputClass =
    "w-full bg-[#f1ece7] rounded-md px-5 py-4 text-[#1d080f] placeholder:text-neutral-500 font-[Prata] focus:outline-none focus:ring-1 focus:ring-[#1d080f]";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim() || !identifier.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      setSubmitting(true);
      await login({
        full_name: fullName.trim(),
        identifier: identifier.trim(),
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
           <img src={logo} alt="Eurasia Restaurant" className="w-66 md:w-84 h-auto mb-6" />
   
           <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl px-8 md:px-8 py-6">   
          <h1
            className="text-center text-[#1d080f] mb-8"
            style={{ fontFamily: 'Prata, serif', fontSize: '30px', WebkitTextStroke: '0.7px #1d080f' }}
          >
            Welcome back!
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
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Email Address or Contact Number"
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
            {error && (
              <p className="text-center text-sm text-red-500 font-[Prata]">{error}</p>
            )}

            <p className="text-center font-[Prata] text-sm text-[#1d080f] mt-1">
              Don't have an account?{' '}
              <Link to="/register" className="underline hover:opacity-70">Signup</Link>
            </p>

            <div className="flex flex-col items-center gap-3 mt-2">
              <button
                type="submit"
                disabled={submitting}
                className="bg-[#1d080f] text-white font-[Prata] font-bold px-12 py-3 rounded-md hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Logging in...' : 'Login'}
              </button>

              <Link
                to="/forgot-password"
                state={{ fullName, identifier }}
                className="bg-[#c0392b] text-white font-[Prata] font-bold px-12 py-3 rounded-md hover:opacity-90 transition"
              >
                Forgot Password
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;