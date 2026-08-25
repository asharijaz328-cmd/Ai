import React, { useState, useEffect } from 'react';
import { Lock, Sparkles, KeyRound, ArrowRight, ShieldCheck, Heart } from 'lucide-react';
import { api } from '../services/api';

export default function ProfileLockScreen({ onUnlock }) {
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const list = await api.getProfiles();
        setProfiles(list);
      } catch (e) {
        console.error("Error fetching profiles:", e);
      }
    };
    fetchProfiles();
  }, []);

  const handleSelectProfile = (profile) => {
    setSelectedProfile(profile);
    setPin('');
    setError('');
  };

  const handleVerifyPin = async (e) => {
    e?.preventDefault();
    if (!pin.trim() || loading) return;

    try {
      setLoading(true);
      setError('');
      const res = await api.verifyProfilePin(selectedProfile.id, pin.trim());
      if (res.status === 'success') {
        onUnlock(res.profile);
      }
    } catch (err) {
      setError(err.message || 'Galat PIN hai! Check karein.');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handleNumClick = (num) => {
    if (pin.length < 6) {
      const nextPin = pin + num;
      setPin(nextPin);
      if (nextPin.length === 4) {
        // Auto submit if 4 digits
        setTimeout(() => {
          verifyWithPin(nextPin);
        }, 150);
      }
    }
  };

  const verifyWithPin = async (enteredPin) => {
    try {
      setLoading(true);
      setError('');
      const res = await api.verifyProfilePin(selectedProfile.id, enteredPin);
      if (res.status === 'success') {
        onUnlock(res.profile);
      }
    } catch (err) {
      setError(err.message || 'Galat PIN hai!');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDigit = () => {
    setPin(prev => prev.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#121212] flex flex-col items-center justify-center p-4 select-none">
      {/* Background Glow */}
      <div className="absolute w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute w-96 h-96 bg-pink-600/10 rounded-full blur-3xl pointer-events-none translate-x-32" />

      {/* Main Container */}
      <div className="relative z-10 max-w-md w-full flex flex-col items-center text-center space-y-6 animate-fade-in">
        {/* Cat Mascot Logo */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-3xl shadow-xl shadow-purple-600/30">
          🐱
        </div>

        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Billa ai
          </h1>
        </div>

        {!selectedProfile ? (
          /* Profile Picker Cards */
          <div className="w-full space-y-4 pt-2">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Select Your Profile
            </div>

            <div className="grid grid-cols-2 gap-4">
              {profiles.map(p => {
                const isApi = p.id === 'api';
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectProfile(p)}
                    className={`group p-5 rounded-2xl border transition-all duration-200 flex flex-col items-center gap-3 active:scale-95 ${
                      isApi
                        ? 'bg-[#1e1e1e] border-pink-500/30 hover:border-pink-500 hover:shadow-lg hover:shadow-pink-500/20'
                        : 'bg-[#1e1e1e] border-purple-500/30 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/20'
                    }`}
                  >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-md transition-transform group-hover:scale-105 ${
                      isApi
                        ? 'bg-gradient-to-tr from-pink-500 to-rose-400'
                        : 'bg-gradient-to-tr from-purple-600 to-indigo-500'
                    }`}>
                      {p.name.charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <div className="text-sm font-bold text-white flex items-center justify-center gap-1">
                        {p.name}
                        {isApi && <Heart className="w-3 h-3 text-pink-400 fill-current inline" />}
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        {isApi ? 'Elder Sister' : 'Sister'}
                      </div>
                    </div>

                    <div className="text-[10px] text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20 flex items-center gap-1 mt-1">
                      <Lock className="w-2.5 h-2.5" />
                      <span>PIN Protected</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* PIN Entry Screen */
          <div className="w-full space-y-5 bg-[#1a1a1a] p-6 rounded-2xl border border-[#2e2e2e] shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#2a2a2a]">
              <div className="flex items-center gap-2.5 text-left">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white ${
                  selectedProfile.id === 'api' ? 'bg-pink-500' : 'bg-purple-600'
                }`}>
                  {selectedProfile.name.charAt(0)}
                </div>
                <div>
                  <div className="text-xs font-bold text-white">{selectedProfile.name}</div>
                  <div className="text-[10px] text-gray-400">Enter 4-Digit PIN</div>
                </div>
              </div>

              <button
                onClick={() => setSelectedProfile(null)}
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
              >
                Switch Profile
              </button>
            </div>

            {/* PIN Dots Display */}
            <div className="flex justify-center items-center gap-3 py-2">
              {[0, 1, 2, 3].map(i => (
                <div
                  key={i}
                  className={`w-3.5 h-3.5 rounded-full border transition-all duration-150 ${
                    pin.length > i
                      ? selectedProfile.id === 'api' 
                        ? 'bg-pink-500 border-pink-400 scale-110 shadow-sm shadow-pink-500/50'
                        : 'bg-purple-500 border-purple-400 scale-110 shadow-sm shadow-purple-500/50'
                      : 'border-gray-600 bg-transparent'
                  }`}
                />
              ))}
            </div>

            {error && (
              <div className="text-xs text-red-400 font-medium animate-shake">
                {error}
              </div>
            )}

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2.5 max-w-[240px] mx-auto pt-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleNumClick(num.toString())}
                  className="w-16 h-12 rounded-xl bg-[#252525] hover:bg-[#303030] active:scale-95 text-white font-semibold text-base transition-all border border-[#333] flex items-center justify-center"
                >
                  {num}
                </button>
              ))}

              <button
                type="button"
                onClick={handleDeleteDigit}
                className="w-16 h-12 rounded-xl bg-[#252525] hover:bg-[#303030] active:scale-95 text-gray-400 hover:text-white font-medium text-xs transition-all border border-[#333] flex items-center justify-center"
              >
                Delete
              </button>

              <button
                type="button"
                onClick={() => handleNumClick('0')}
                className="w-16 h-12 rounded-xl bg-[#252525] hover:bg-[#303030] active:scale-95 text-white font-semibold text-base transition-all border border-[#333] flex items-center justify-center"
              >
                0
              </button>

              <button
                type="button"
                onClick={handleVerifyPin}
                disabled={pin.length < 4 || loading}
                className="w-16 h-12 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:hover:bg-purple-600 active:scale-95 text-white font-medium text-xs transition-all flex items-center justify-center"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="text-[11px] text-gray-500 pt-1">
              Default PIN: <strong className="text-gray-400">{selectedProfile.id === 'api' ? '1111' : '2222'}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
