import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../apiConfig';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/dashboard');
      } else {
        setError(data.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError('Connection error. Is the server running?');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-between font-['Plus_Jakarta_Sans'] overflow-hidden px-12 lg:px-24">
      {/* Cinematic Background Layer */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 animate-[slow-zoom_20s_infinite_alternate]"
        style={{ backgroundImage: `url('/login-bg2.png')` }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 via-gray-900/40 to-transparent transition-opacity duration-1000"></div>

      {/* Brand Messaging (Left Aligned) */}
      <div className="relative z-10 hidden lg:block w-full animate-in fade-in slide-in-from-left-12 duration-1000">

        <h1 className="text-7xl font-black text-white mb-8 drop-shadow-2xl">
          Advancing <span className="text-[#D15616]"> <br />Pure Water</span> Technology.
        </h1>

        <div className="flex items-center gap-6">
          <div className="h-16 w-[2px] bg-white/20 rounded-full"></div>
          <p className="text-white/70 text-lg font-medium leading-relaxed max-w-md">
            Delivering state-of-the-art RO purification solutions that power industries and homes with crystalline excellence.
          </p>
        </div>
      </div>

      {/* Floating Login Container (Right Aligned) */}
      <div className="relative z-10 w-full max-w-[480px]">
        <div className="bg-white rounded-[0.5rem] p-12 md:p-16 shadow-[0_50px_100px_-15px_rgba(0,0,0,0.3)] animate-in fade-in zoom-in slide-in-from-right-12 duration-1000">

          {/* Header & Logo */}
          <div className="flex flex-col items-center mb-12">
            <div className="mb-10">
              <img src="/energy-logo.png" alt="Energy Enterprises" className="w-[300px] object-contain " />
            </div>
            <p className="text-gray-400 font-bold uppercase tracking-[0.3em] text-[8px] text-center">
              Admin Management Portal
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-7">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                <p className="text-xs font-bold text-red-700 uppercase tracking-wider">{error}</p>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pb-4">Administrator Email</label>
              <input
                type="email"
                required
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@energy.com"
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-md text-sm font-semibold text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-4 focus:ring-[#D15616]/5 focus:border-[#D15616] transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Access Key / Password</label>
              <input
                type="password"
                required
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-md text-sm font-semibold text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-4 focus:ring-[#D15616]/5 focus:border-[#D15616] transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4.5 bg-[#D15616] hover:bg-[#b84a12] text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-md shadow-2xl shadow-[#D15616]/20 transition-all hover:scale-[1.03] active:scale-[0.97] mt-2 flex items-center justify-center gap-3 group relative overflow-hidden ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              <div className="cursor-pointer absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              {loading ? 'Authenticating...' : 'Login'}
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="3" fill="none" className="group-hover:translate-x-1 transition-transform"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
            </button>
          </form>

        </div>
      </div>

      {/* Embedded CSS for animation */}
      <style>{`
        @keyframes slow-zoom {
          from { transform: scale(1); }
          to { transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
};

export default Login;
