import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, X, Check } from 'lucide-react';
import heroImage from '../assets/bgHero.jpg';
import { useAuth } from '../context/AuthContext';

function Account() {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading, logout, updateProfile, changePassword } = useAuth();

  const [tab, setTab] = useState('profile');

  // --- Profile state ---
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [profileError, setProfileError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // --- Password state ---
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [toast, setToast] = useState('');

  // Fill the form whenever the account loads or changes
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setEmail(user.email || '');
      setContactNumber(user.contact_number || '');
    }
  }, [user]);

  // Lock scroll while the logout modal is open
  useEffect(() => {
    if (showLogoutConfirm) {
      const previous = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = previous; };
    }
  }, [showLogoutConfirm]);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 4000);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileError('');

    if (!fullName.trim() || !email.trim() || !contactNumber.trim()) {
      setProfileError('Please fill in all fields.');
      return;
    }

    try {
      setSavingProfile(true);
      await updateProfile({
        full_name: fullName.trim(),
        email: email.trim(),
        contact_number: contactNumber.trim(),
      });
      setEditing(false);
      showToast('Your profile has been updated.');
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCancelEdit = () => {
    setFullName(user.full_name || '');
    setEmail(user.email || '');
    setContactNumber(user.contact_number || '');
    setProfileError('');
    setEditing(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill in all fields.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    try {
      setSavingPassword(true);
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Your password has been updated.');
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setSavingPassword(false);
    }
  };

  const inputClass =
    "w-full text-left bg-white rounded-md px-4 py-3 text-sm text-[#1d080f] placeholder:text-neutral-400 font-[Prata] focus:outline-none focus:ring-1 focus:ring-[#1d080f]";

  const lockedClass =
    "w-full text-left bg-neutral-100 rounded-md px-4 py-3 text-sm text-[#1d080f] font-[Prata]";

  const labelClass = "block text-left font-[Prata] text-xs text-neutral-500 mb-1.5";

  const tabClass = (name) =>
    `px-6 py-2.5 rounded-lg text-sm font-[Prata] transition-colors ${
      tab === name
        ? 'bg-[#1d080f] text-white'
        : 'bg-neutral-200/70 text-[#1d080f] hover:bg-neutral-300/70'
    }`;

  const initial = (user?.full_name || '?').trim().charAt(0).toUpperCase();

  return (
    <div className="bg-white text-[#1d080f]">
      <div className="relative h-64 overflow-hidden shrink-0 md:h-60">
        <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-white/40" />
        <div className="relative flex h-full items-start justify-center px-4 pt-10 md:pt-14">
          <h1
            className="font-[Prata] font-bold text-xs md:text-xs text-[#1d080f]"
            style={{ WebkitTextStroke: '0.7px #1d080f', letterSpacing: '1.5px' }}
          >
            My Account
          </h1>
        </div>
      </div>

      <div style={{ marginTop: '4rem' }}> </div>
      <div className="max-w-3xl mx-auto px-4 md:px-3 -mt-24 md:-mt-32 relative z-10 pb-16">
        <div className="bg-[#e6e1d8] rounded-xl shadow-xl p-6 md:p-10">

          {loading ? (
            <p className="text-center py-10 text-sm text-neutral-500 font-[Prata]">Loading...</p>
          ) : !isAuthenticated ? (
            <div className="bg-white rounded-xl p-10 text-center">
              <p className="font-[Prata] text-lg text-[#1d080f] mb-2">You're not logged in</p>
              <p className="text-sm text-neutral-500 font-[Prata] mb-6">
                Log in to view and manage your account.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <button
                  onClick={() => navigate('/login')}
                  className="bg-[#1d080f] text-white font-[Prata] font-bold px-8 py-3 rounded-full hover:opacity-90 transition"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="border border-[#1d080f] text-[#1d080f] font-[Prata] font-bold px-8 py-3 rounded-full hover:bg-[#1d080f] hover:text-white transition"
                >
                  Create Account
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 shrink-0 rounded-full bg-[#1d080f] text-white flex items-center justify-center font-[Prata] text-xl">
                  {initial}
                </div>
                <div className="text-left">
                  <div className="font-[Prata] text-base text-[#1d080f]">{user.full_name}</div>
                  <div className="font-[Prata] text-xs text-neutral-500">{user.email}</div>
                </div>
              </div>

              <div className="flex gap-2 mb-6">
                <button onClick={() => setTab('profile')} className={tabClass('profile')}>
                  Profile
                </button>
                <button onClick={() => setTab('security')} className={tabClass('security')}>
                  Security
                </button>
              </div>

              {tab === 'profile' && (
                <div className="bg-white rounded-xl p-6 md:p-8">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="font-[Prata] text-sm text-[#1d080f]">Your Details</h2>
                                        {!editing && (
                      <button
                        onClick={() => setEditing(true)}
                        className="border border-[#1d080f] text-[#1d080f] font-[Prata] text-xs px-5 py-1.5 rounded-full hover:bg-[#1d080f] hover:text-white transition"
                      >
                        Edit
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
                    <div>
                      <label className={labelClass}>Full Name</label>
                      {editing ? (
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) =>
                            setFullName(e.target.value.replace(/\b[a-z]/g, (c) => c.toUpperCase()))
                          }
                          className={`${inputClass} border border-neutral-200`}
                        />
                      ) : (
                        <div className={lockedClass}>{user.full_name}</div>
                      )}
                    </div>

                    <div>
                      <label className={labelClass}>Email Address</label>
                      {editing ? (
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={`${inputClass} border border-neutral-200`}
                        />
                      ) : (
                        <div className={lockedClass}>{user.email}</div>
                      )}
                    </div>

                    <div>
                      <label className={labelClass}>Contact Number</label>
                      {editing ? (
                        <input
                          type="text"
                          value={contactNumber}
                          onChange={(e) => setContactNumber(e.target.value)}
                          className={`${inputClass} border border-neutral-200`}
                        />
                      ) : (
                        <div className={lockedClass}>{user.contact_number}</div>
                      )}
                    </div>

                    {profileError && (
                      <p className="text-center text-sm text-red-500 font-[Prata]">{profileError}</p>
                    )}

                    {editing && (
                      <div className="flex gap-3 mt-2">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="flex-1 border border-neutral-300 text-neutral-700 font-[Prata] text-sm py-2.5 rounded-full hover:bg-neutral-50 transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={savingProfile}
                          className="flex-1 bg-[#1d080f] text-white font-[Prata] text-sm font-bold py-2.5 rounded-full hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {savingProfile ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    )}
                  </form>
                </div>
              )}

              {tab === 'security' && (
                <div className="bg-white rounded-xl p-6 md:p-8">
                  <h2 className="font-[Prata] text-sm text-[#1d080f] mb-5 text-left">Change Password</h2>

                  <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
                    <div className="relative">
                      <input
                        type={showCurrent ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Current Password"
                        className={`${inputClass} border border-neutral-200 pr-12`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrent(!showCurrent)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-[#1d080f] transition"
                      >
                        {showCurrent ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type={showNew ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="New Password"
                        className={`${inputClass} border border-neutral-200 pr-12`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-[#1d080f] transition"
                      >
                        {showNew ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm New Password"
                        className={`${inputClass} border border-neutral-200 pr-12`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-[#1d080f] transition"
                      >
                        {showConfirm ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>
                    </div>

                    {passwordError && (
                      <p className="text-center text-sm text-red-500 font-[Prata]">{passwordError}</p>
                    )}

                    <div className="flex justify-end mt-2">
                      <button
                        type="submit"
                        disabled={savingPassword}
                        className="bg-[#1d080f] text-white font-[Prata] text-sm font-bold px-8 py-2.5 rounded-full hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {savingPassword ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="bg-[#c0392b] text-white font-[Prata] text-sm font-bold px-10 py-2.5 rounded-full hover:opacity-90 transition"
                >
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {showLogoutConfirm && (
        <div
          onClick={() => setShowLogoutConfirm(false)}
          className="fixed inset-0 z-[130] flex items-center justify-center bg-black/30 px-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl"
          >
            <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
              <X size={26} className="text-red-500" />
            </div>
            <h3 className="font-[Prata] text-lg text-[#1d080f] mb-2">Log out?</h3>
            <p className="text-sm text-neutral-500 mb-6 leading-relaxed">
              You'll need to log in again to make reservations or place orders.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 border border-neutral-300 text-neutral-700 font-[Prata] text-xs py-2.5 rounded-xl hover:bg-neutral-50 transition"
              >
                Stay Logged In
              </button>
              <button
                onClick={() => {
                  logout();
                  setShowLogoutConfirm(false);
                  navigate('/');
                }}
                className="flex-1 bg-[#c0392b] text-white font-[Prata] text-xs font-bold py-2.5 rounded-xl hover:opacity-90 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-7 right-7 z-[140] bg-[#2e5a2e] text-white rounded-xl px-5 py-4 shadow-2xl flex items-center gap-3 max-w-xs">
          <span className="w-8 h-8 shrink-0 rounded-lg bg-white/20 flex items-center justify-center">
            <Check size={18} />
          </span>
          <span className="text-sm font-[Prata]">{toast}</span>
        </div>
      )}
    </div>
  );
}

export default Account;