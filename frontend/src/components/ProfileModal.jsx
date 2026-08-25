import React, { useState, useEffect } from 'react';
import { X, User, Heart, Sparkles, Check, Lock, Mail } from 'lucide-react';
import { api } from '../services/api';

export default function ProfileModal({ isOpen, onClose, profile, onProfileUpdated }) {
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [languagePreference, setLanguagePreference] = useState('Roman Urdu & English');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setNickname(profile.nickname || '');
      setPassword('');
      setLanguagePreference(profile.language_preference || 'Roman Urdu & English');
      setBio(profile.bio || '');
    }
  }, [profile]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        nickname: nickname.trim(),
        language_preference: languagePreference,
        bio: bio.trim()
      };
      if (password.trim()) {
        payload.password = password.trim();
      }

      const updated = await api.updateProfile(profile.id, payload);
      onProfileUpdated(updated);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1000);
    } catch (e) {
      alert("Error updating profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#1f1f1f] border border-[#333] rounded-2xl w-full max-w-md shadow-2xl animate-fade-in overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#2e2e2e] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl border border-pink-500/30 bg-pink-500/20 text-pink-400 flex items-center justify-center">
              <Heart className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{profile?.name} - Profile Settings</h2>
              <p className="text-xs text-gray-400">Personalize how Billa AI interacts with you</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#2c2c2c] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          <div>
            <label className="block text-gray-300 font-medium mb-1">Email (Account ID)</label>
            <input
              type="text"
              value={profile?.email || ''}
              disabled
              className="w-full bg-[#252525] text-gray-400 p-2.5 rounded-lg border border-[#333] outline-none cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-gray-300 font-medium mb-1">Your Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-[#2a2a2a] text-white p-2.5 rounded-lg border border-[#3d3d3d] focus:border-pink-500/50 outline-none"
                placeholder="e.g. Ayesha"
              />
            </div>
            <div>
              <label className="block text-gray-300 font-medium mb-1">Calling Name</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full bg-[#2a2a2a] text-white p-2.5 rounded-lg border border-[#3d3d3d] focus:border-pink-500/50 outline-none"
                placeholder="e.g. Api, Guriya"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-300 font-medium mb-1 flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-purple-400" />
              <span>Change Password (Leave blank to keep current)</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#2a2a2a] text-white p-2.5 rounded-lg border border-[#3d3d3d] focus:border-purple-500/50 outline-none"
              placeholder="Enter new password"
            />
          </div>

          <div>
            <label className="block text-gray-300 font-medium mb-1">Language Style</label>
            <select
              value={languagePreference}
              onChange={(e) => setLanguagePreference(e.target.value)}
              className="w-full bg-[#2a2a2a] text-white p-2.5 rounded-lg border border-[#3d3d3d] focus:border-pink-500/50 outline-none"
            >
              <option value="Roman Urdu & English">Roman Urdu & English (Mix - Natural)</option>
              <option value="Urdu (Nastaliq Script)">اردو (Urdu Script)</option>
              <option value="English">English</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-300 font-medium mb-1">About You (Personality / Routine)</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={2}
              className="w-full bg-[#2a2a2a] text-white p-2.5 rounded-lg border border-[#3d3d3d] focus:border-pink-500/50 outline-none resize-none"
              placeholder="e.g. Student, loves coffee, preparing for exams."
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white rounded-lg hover:bg-[#2c2c2c]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-lg font-medium shadow-md shadow-pink-900/30 flex items-center gap-1.5"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Settings</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
