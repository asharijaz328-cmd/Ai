import React, { useState, useEffect } from 'react';
import { X, BrainCircuit, Trash2, Plus, Sparkles, Filter } from 'lucide-react';
import { api } from '../services/api';

export default function MemoryModal({ isOpen, onClose, profile }) {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [newCategory, setNewCategory] = useState('preference');
  const [newKey, setNewKey] = useState('');
  const [newContent, setNewContent] = useState('');

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'preference', label: 'Preferences' },
    { id: 'person', label: 'People & Friends' },
    { id: 'hobby', label: 'Hobbies' },
    { id: 'ongoing_situation', label: 'Ongoing Situations' },
    { id: 'decision', label: 'Decisions & Goals' },
    { id: 'fact', label: 'Facts' }
  ];

  const fetchMemories = async () => {
    try {
      setLoading(true);
      const data = await api.getMemories(profile?.id || 'api');
      setMemories(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMemories();
    }
  }, [isOpen, profile]);

  const handleDelete = async (id) => {
    try {
      await api.deleteMemory(id);
      setMemories(memories.filter(m => m.id !== id));
    } catch (e) {
      alert("Error deleting memory");
    }
  };

  const handleAddMemory = async (e) => {
    e.preventDefault();
    if (!newKey.trim() || !newContent.trim()) return;

    try {
      const created = await api.createMemory({
        user_id: profile?.id || 'api',
        category: newCategory,
        key: newKey.trim(),
        content: newContent.trim(),
        importance: 4
      });
      setMemories([created, ...memories]);
      setNewKey('');
      setNewContent('');
      setShowAddForm(false);
    } catch (e) {
      alert("Error saving memory");
    }
  };

  if (!isOpen) return null;

  const filteredMemories = selectedCategory === 'all' 
    ? memories 
    : memories.filter(m => m.category === selectedCategory);

  const getCategoryBadgeColor = (cat) => {
    switch(cat) {
      case 'preference': return 'bg-pink-500/10 text-pink-300 border-pink-500/30';
      case 'person': return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
      case 'hobby': return 'bg-blue-500/10 text-blue-300 border-blue-500/30';
      case 'ongoing_situation': return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      case 'decision': return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
      default: return 'bg-gray-500/10 text-gray-300 border-gray-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#1f1f1f] border border-[#333] rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-fade-in overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#2e2e2e] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Memory Center
              </h2>
              <p className="text-xs text-gray-400">
                Insights and details remembered across conversations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#2c2c2c] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Categories Bar & Add Action */}
        <div className="p-3 border-b border-[#2e2e2e] flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`text-xs px-3 py-1 rounded-lg transition-all shrink-0 ${
                  selectedCategory === cat.id
                    ? 'bg-purple-600 text-white font-medium shadow-sm'
                    : 'bg-[#2a2a2a] text-gray-400 hover:text-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="shrink-0 flex items-center gap-1 text-xs bg-[#2e2e2e] hover:bg-[#383838] text-purple-300 px-3 py-1.5 rounded-lg border border-purple-500/30 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Memory</span>
          </button>
        </div>

        {/* Add Memory Form */}
        {showAddForm && (
          <form onSubmit={handleAddMemory} className="p-4 bg-[#282828] border-b border-[#383838] space-y-3">
            <div className="text-xs font-semibold text-purple-300">Add New Memory / Fact:</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="bg-[#1f1f1f] text-xs text-white p-2 rounded-lg border border-[#3e3e3e] outline-none"
              >
                <option value="preference">Preference (Likes & Dislikes)</option>
                <option value="person">Person (Friend / Family)</option>
                <option value="hobby">Hobby & Interests</option>
                <option value="ongoing_situation">Ongoing Situation</option>
                <option value="decision">Decision & Goals</option>
                <option value="fact">General Fact</option>
              </select>

              <input
                type="text"
                placeholder="Topic / Key (e.g. Favorite Drink)"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                required
                className="bg-[#1f1f1f] text-xs text-white p-2 rounded-lg border border-[#3e3e3e] outline-none"
              />
            </div>

            <textarea
              placeholder="Detail (e.g. Loves iced matcha latte with almond milk)"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              required
              rows={2}
              className="w-full bg-[#1f1f1f] text-xs text-white p-2 rounded-lg border border-[#3e3e3e] outline-none resize-none"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1 text-xs text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs rounded-lg font-medium"
              >
                Save Memory
              </button>
            </div>
          </form>
        )}

        {/* Memory List Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {loading ? (
            <div className="text-center py-12 text-sm text-gray-400">
              Loading memories...
            </div>
          ) : filteredMemories.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm px-4">
              <Sparkles className="w-8 h-8 text-purple-400/50 mx-auto mb-2" />
              No saved memories yet. <br />
              As you chat, Billa AI will automatically remember key facts! 🐱
            </div>
          ) : (
            filteredMemories.map(m => (
              <div
                key={m.id}
                className="p-3.5 bg-[#262626] hover:bg-[#2c2c2c] rounded-xl border border-[#333] flex items-start justify-between gap-3 transition-colors"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${getCategoryBadgeColor(m.category)}`}>
                      {m.category}
                    </span>
                    <span className="text-xs font-semibold text-white truncate">
                      {m.key}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    {m.content}
                  </p>
                  {m.context && (
                    <span className="text-[10px] text-gray-500 block">
                      {m.context}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleDelete(m.id)}
                  title="Forget this memory"
                  className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-[#333] rounded-lg transition-colors shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
