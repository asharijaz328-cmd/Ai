import React, { useState } from 'react';
import { Sparkles, Heart, Mail, Lock, User, ArrowRight, Eye, EyeOff, Check, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

export default function AuthScreen({ onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Signup State
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [avatarColor, setAvatarColor] = useState('pink');

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const colors = [
    { id: 'pink', bg: 'bg-pink-500', ring: 'ring-pink-500', name: 'Pink' },
    { id: 'purple', bg: 'bg-purple-600', ring: 'ring-purple-500', name: 'Purple' },
    { id: 'rose', bg: 'bg-rose-500', ring: 'ring-rose-500', name: 'Rose' },
    { id: 'emerald', bg: 'bg-emerald-500', ring: 'ring-emerald-500', name: 'Emerald' },
    { id: 'amber', bg: 'bg-amber-500', ring: 'ring-amber-500', name: 'Amber' },
    { id: 'cyan', bg: 'bg-cyan-500', ring: 'ring-cyan-500', name: 'Cyan' },
  ];

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim() || loading) return;

    try {
      setLoading(true);
      setError('');
      const res = await api.login(loginEmail, loginPassword);
      if (res.status === 'success') {
        onAuthSuccess(res.user);
      }
    } catch (err) {
      setError(err.message || 'Login failed! Email ya password check karein.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e?.preventDefault();
    if (!name.trim() || !signupEmail.trim() || !signupPassword.trim() || loading) return;

    try {
      setLoading(true);
      setError('');
      const res = await api.register({
        name: name.trim(),
        nickname: nickname.trim() || name.trim(),
        email: signupEmail.trim(),
        password: signupPassword.trim(),
        avatar_color: avatarColor
      });
      if (res.status === 'success') {
        onAuthSuccess(res.user);
      }
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#121212] flex flex-col items-center justify-center p-4 select-none">
      {/* Background Glow */}
      <div className="absolute w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute w-96 h-96 bg-pink-600/10 rounded-full blur-3xl pointer-events-none translate-x-32" />

      {/* Main Container */}
      <div className="relative z-10 max-w-md w-full flex flex-col items-center text-center space-y-5 animate-fade-in">
        {/* Cat Mascot Logo */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-3xl shadow-xl shadow-purple-600/30">
          🐱
        </div>

        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
            Billa ai <Heart className="w-4 h-4 text-pink-400 fill-current inline" />
          </h1>
        </div>

        {/* Auth Box */}
        <div className="w-full bg-[#1a1a1a] p-6 rounded-2xl border border-[#2e2e2e] shadow-2xl space-y-4">
          {/* Tabs */}
          <div className="flex bg-[#252525] p-1 rounded-xl border border-[#333]">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'signup'
                  ? 'bg-pink-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 py-2 px-3 rounded-lg text-left">
              ⚠️ {error}
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-3 text-left text-xs">
              <div>
                <label className="block text-gray-300 font-medium mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-purple-400" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  className="w-full bg-[#252525] text-white px-3 py-2.5 rounded-lg border border-[#383838] focus:border-purple-500/60 outline-none text-xs"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-purple-400" />
                    <span>Password</span>
                  </span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className="w-full bg-[#252525] text-white px-3 py-2.5 rounded-lg border border-[#383838] focus:border-purple-500/60 outline-none text-xs pr-9"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !loginEmail.trim() || !loginPassword.trim()}
                className="w-full mt-2 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-lg font-medium text-xs shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <span>{loading ? 'Logging in...' : 'Log In'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="pt-2 text-center text-[11px] text-gray-400">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setError(''); }}
                  className="text-pink-400 hover:text-pink-300 font-medium underline"
                >
                  Create one here
                </button>
              </div>
            </form>
          ) : (
            /* SIGNUP FORM */
            <form onSubmit={handleSignup} className="space-y-3 text-left text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-300 font-medium mb-1">Your Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-[#252525] text-white px-3 py-2.5 rounded-lg border border-[#383838] focus:border-pink-500/60 outline-none text-xs"
                    placeholder="e.g. Ali"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-medium mb-1">Calling Name</label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="w-full bg-[#252525] text-white px-3 py-2.5 rounded-lg border border-[#383838] focus:border-pink-500/60 outline-none text-xs"
                    placeholder="Nickname"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-1">Email Address</label>
                <input
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  required
                  className="w-full bg-[#252525] text-white px-3 py-2.5 rounded-lg border border-[#383838] focus:border-pink-500/60 outline-none text-xs"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-1">Choose Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    className="w-full bg-[#252525] text-white px-3 py-2.5 rounded-lg border border-[#383838] focus:border-pink-500/60 outline-none text-xs pr-9"
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Theme Color Selector */}
              <div>
                <label className="block text-gray-300 font-medium mb-1">Profile Color</label>
                <div className="flex items-center gap-2 pt-1">
                  {colors.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setAvatarColor(c.id)}
                      className={`w-6 h-6 rounded-full ${c.bg} transition-all flex items-center justify-center ${
                        avatarColor === c.id ? `ring-2 ${c.ring} ring-offset-2 ring-offset-[#1a1a1a] scale-110` : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      {avatarColor === c.id && <Check className="w-3 h-3 text-white stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !name.trim() || !signupEmail.trim() || !signupPassword.trim()}
                className="w-full mt-2 py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 disabled:opacity-50 text-white rounded-lg font-medium text-xs shadow-lg shadow-pink-900/30 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <span>{loading ? 'Creating Account...' : 'Create Account & Start Chatting'}</span>
                <Sparkles className="w-3.5 h-3.5" />
              </button>

              <div className="pt-2 text-center text-[11px] text-gray-400">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); }}
                  className="text-purple-400 hover:text-purple-300 font-medium underline"
                >
                  Log In
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Privacy Promise Badge */}
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 bg-[#1a1a1a]/80 px-3 py-1.5 rounded-full border border-[#2a2a2a]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>100% Private & Isolated. Only you have access to your chat.</span>
        </div>
      </div>
    </div>
  );
}
