import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logopic2.png';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    role: '',
    name: '',
    password: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    const result = login(formData.role, formData.name, formData.password);

    if (result.success) {
      // Navigate to owner dashboard upon login success
      navigate('/admin');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-[#120408]">
      {/* Left Panel */}
      <div className="hidden md:flex w-1/2 bg-white items-center justify-center p-8">
        <img 
          src={logo} 
          alt="Eurasia Restaurant Logo" 
          className="w-80 h-auto object-contain"
        />
      </div>

      {/* Right Panel */}
      <div className="w-full md:w-1/2 bg-[#19080e] flex flex-col items-center justify-center px-8 md:px-16 lg:px-24 py-12">
        <div className="w-full max-w-md flex flex-col items-center">
          <span className="font-serif italic text-white/90 text-sm md:text-base tracking-wide mb-6">
            Authorized personnel only
          </span>

          <h1 className="font-serif text-white text-4xl md:text-5xl font-normal tracking-[0.2em] mb-8 uppercase text-center">
            ADMIN
          </h1>

          {error && (
            <p className="text-red-400 text-sm font-serif mb-4 text-center">{error}</p>
          )}

          <form onSubmit={handleLogin} className="w-full space-y-6">
            <div className="relative w-full">
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full bg-white text-[#19080e] font-serif px-5 py-3 rounded-lg text-base focus:outline-none appearance-none cursor-pointer"
              >
                <option value="" disabled hidden>Role</option>
                <option value="Manager">Manager</option>
                <option value="Staff">Staff</option>
                <option value="Admin">Admin</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-neutral-500">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>

            <div>
              <input
                type="text"
                name="name"
                placeholder="Name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-white text-[#19080e] font-serif px-5 py-3 rounded-lg text-base placeholder-neutral-500 focus:outline-none"
              />
            </div>

            <div>
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-white text-[#19080e] font-serif px-5 py-3 rounded-lg text-base placeholder-neutral-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-col items-center pt-6 space-y-4">
              <button
                type="submit"
                className="bg-white text-[#19080e] font-serif px-10 py-2.5 rounded-lg text-base hover:bg-neutral-100 transition cursor-pointer shadow-sm"
              >
                Log In
              </button>

              <button
                type="button"
                className="bg-[#ff2a30] hover:bg-[#e02026] text-white font-serif px-6 py-2.5 rounded-lg text-sm tracking-wide transition cursor-pointer shadow-sm"
              >
                Forgot Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}