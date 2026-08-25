import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sliders, 
  MessageSquare, 
  Plus, 
  Trash2, 
  Check, 
  Sparkles, 
  ThumbsDown, 
  ThumbsUp, 
  ToggleLeft, 
  ToggleRight,
  Activity,
  Layers,
  BookOpen
} from 'lucide-react';
import { api } from '../services/api';

export default function TuneModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('rules'); // 'rules', 'logs', 'feedback', 'stats'
  const [rules, setRules] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUserFilter, setSelectedUserFilter] = useState('all');
  const [selectedConv, setSelectedConv] = useState(null);
  const [convMessages, setConvMessages] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  // New Rule Form
  const [newRuleText, setNewRuleText] = useState('');
  const [newRuleCategory, setNewRuleCategory] = useState('behavior');

  const loadData = async () => {
    try {
      setLoading(true);
      const [rulesData, feedbacksData, convsData, statsData, usersData] = await Promise.all([
        api.getTuningRules().catch(() => []),
        api.getFeedbacks().catch(() => []),
        api.getConversations().catch(() => []),
        api.getTuningStats().catch(() => null),
        api.getAllUsers().catch(() => [])
      ]);
      setRules(rulesData);
      setFeedbacks(feedbacksData);
      setConversations(convsData);
      setStats(statsData);
      setUsers(usersData);

      if (convsData.length > 0 && !selectedConv) {
        loadConversationLogs(convsData[0].id);
      }
    } catch (e) {
      console.error("Error loading tuning data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadConversationLogs = async (convId) => {
    try {
      const data = await api.getConversation(convId);
      setSelectedConv(data.conversation);
      setConvMessages(data.messages || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddRule = async (e) => {
    e.preventDefault();
    if (!newRuleText.trim()) return;

    try {
      const created = await api.createTuningRule({
        rule_text: newRuleText.trim(),
        category: newRuleCategory
      });
      setRules([created, ...rules]);
      setNewRuleText('');
      loadData();
    } catch (e) {
      alert("Error saving tuning rule");
    }
  };

  const handleToggleRule = async (rule) => {
    try {
      const updated = await api.updateTuningRule(rule.id, { is_active: !rule.is_active });
      setRules(rules.map(r => r.id === rule.id ? updated : r));
      loadData();
    } catch (e) {
      alert("Error updating rule status");
    }
  };

  const handleDeleteRule = async (id) => {
    try {
      await api.deleteTuningRule(id);
      setRules(rules.filter(r => r.id !== id));
      loadData();
    } catch (e) {
      alert("Error deleting rule");
    }
  };

  const handleDeleteFeedback = async (id) => {
    try {
      await api.deleteFeedback(id);
      setFeedbacks(feedbacks.filter(f => f.id !== id));
      loadData();
    } catch (e) {
      alert("Error deleting feedback");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#1e1e1e] border border-[#333] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-fade-in overflow-hidden">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-[#2e2e2e] flex items-center justify-between bg-[#191919]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                AI Tuning & Review Dashboard
              </h2>
              <p className="text-xs text-gray-400">
                Review chats and fine-tune how Billa AI interacts and responds
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

        {/* Stats Strip */}
        {stats && (
          <div className="bg-[#171717] px-4 py-2.5 border-b border-[#2d2d2d] grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="flex items-center gap-2 text-gray-300">
              <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
              <span>Total Chats: <strong>{stats.total_conversations}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Activity className="w-3.5 h-3.5 text-pink-400" />
              <span>Total Messages: <strong>{stats.total_messages}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              <span>Active Rules: <strong>{stats.active_rules}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <ThumbsUp className="w-3.5 h-3.5 text-blue-400" />
              <span>Feedbacks: <strong>{stats.total_feedbacks}</strong></span>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="px-4 border-b border-[#2e2e2e] flex items-center gap-2 overflow-x-auto bg-[#1a1a1a]">
          <button
            onClick={() => setActiveTab('rules')}
            className={`py-3 px-3.5 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'rules'
                ? 'border-purple-500 text-purple-400 font-semibold'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Behavior Tuning Rules ({rules.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`py-3 px-3.5 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'logs'
                ? 'border-purple-500 text-purple-400 font-semibold'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Read All Chats & Logs</span>
          </button>

          <button
            onClick={() => setActiveTab('feedback')}
            className={`py-3 px-3.5 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'feedback'
                ? 'border-purple-500 text-purple-400 font-semibold'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <ThumbsDown className="w-3.5 h-3.5" />
            <span>Response Feedback ({feedbacks.length})</span>
          </button>
        </div>

        {/* Tab 1: Behavior Tuning Rules */}
        {activeTab === 'rules' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* Add New Rule Form */}
            <form onSubmit={handleAddRule} className="p-4 bg-[#262626] rounded-xl border border-[#383838] space-y-3">
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-purple-400" />
                Add Custom Instruction / Behavior Rule
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <div className="sm:col-span-3">
                  <input
                    type="text"
                    value={newRuleText}
                    onChange={(e) => setNewRuleText(e.target.value)}
                    required
                    placeholder="e.g. When Api discusses exams or studies, motivate her and give 2 practical tips."
                    className="w-full bg-[#1c1c1c] text-white text-xs p-2.5 rounded-lg border border-[#3e3e3e] focus:border-purple-500/50 outline-none"
                  />
                </div>
                <div>
                  <select
                    value={newRuleCategory}
                    onChange={(e) => setNewRuleCategory(e.target.value)}
                    className="w-full bg-[#1c1c1c] text-white text-xs p-2.5 rounded-lg border border-[#3e3e3e] outline-none"
                  >
                    <option value="behavior">Behavior / Tone</option>
                    <option value="topic">Specific Topic</option>
                    <option value="routine">Routine & Timing</option>
                    <option value="boundary">Boundary / Guardrail</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-purple-900/30 transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Apply Rule to AI</span>
                </button>
              </div>
            </form>

            {/* Rules List */}
            <div className="space-y-2.5">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">
                Active Rules ({rules.filter(r => r.is_active).length}/{rules.length})
              </div>

              {rules.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-500 bg-[#242424] rounded-xl border border-[#333]">
                  No custom tuning rules added yet. Add a rule above to instantly improve AI behavior!
                </div>
              ) : (
                rules.map(rule => (
                  <div
                    key={rule.id}
                    className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                      rule.is_active
                        ? 'bg-[#252525] border-purple-500/30 shadow-sm'
                        : 'bg-[#1c1c1c] border-[#333] opacity-60'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">
                          {rule.category}
                        </span>
                        <span className={`text-xs font-medium ${rule.is_active ? 'text-white' : 'text-gray-400 line-through'}`}>
                          {rule.rule_text}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleToggleRule(rule)}
                        title={rule.is_active ? "Disable Rule" : "Enable Rule"}
                        className={`p-1.5 rounded-lg transition-colors ${rule.is_active ? 'text-green-400 hover:bg-[#333]' : 'text-gray-500 hover:bg-[#333]'}`}
                      >
                        {rule.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        title="Delete Rule"
                        className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-[#333] rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Chat Logs & Review */}
        {activeTab === 'logs' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Conversation Selector Sidebar */}
            <div className="w-1/3 border-r border-[#2e2e2e] bg-[#1a1a1a] overflow-y-auto p-2 space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  Chats ({conversations.filter(c => selectedUserFilter === 'all' || (c.user_id || 'api') === selectedUserFilter).length})
                </span>
              </div>

              {/* User Filter Dropdown */}
              <select
                value={selectedUserFilter}
                onChange={(e) => setSelectedUserFilter(e.target.value)}
                className="w-full bg-[#252525] text-white text-xs p-1.5 rounded-lg border border-[#383838] outline-none"
              >
                <option value="all">👥 All Users & Sisters</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    👤 {u.name} ({u.email || u.id})
                  </option>
                ))}
              </select>

              <div className="space-y-1">
                {conversations
                  .filter(c => selectedUserFilter === 'all' || (c.user_id || 'api') === selectedUserFilter)
                  .map(c => {
                    const convUser = users.find(u => u.id === c.user_id);
                    return (
                      <div
                        key={c.id}
                        onClick={() => loadConversationLogs(c.id)}
                        className={`p-2.5 rounded-lg cursor-pointer text-xs transition-colors ${
                          selectedConv?.id === c.id
                            ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 font-medium'
                            : 'text-gray-300 hover:bg-[#252525]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="text-[10px] font-bold text-pink-400 bg-pink-500/10 px-1.5 py-0.5 rounded border border-pink-500/20 truncate">
                            {convUser?.name || c.user_id || 'User'}
                          </span>
                          <span className="text-[10px] text-gray-500">
                            {new Date(c.updated_at || c.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="truncate font-semibold text-white">{c.title}</div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Conversation Messages View */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#202020]">
              {convMessages.length === 0 ? (
                <div className="text-center py-12 text-xs text-gray-400">
                  Select a conversation from the left to inspect full chat history.
                </div>
              ) : (
                convMessages.map(m => {
                  const msgUser = users.find(u => u.id === m.user_id);
                  return (
                    <div
                      key={m.id}
                      className={`p-3.5 rounded-xl text-xs space-y-1 ${
                        m.sender === 'user'
                          ? 'bg-[#2b2b2b] border border-pink-500/20 ml-6'
                          : 'bg-[#1c1c1c] border border-purple-500/20 mr-6'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-gray-400 font-semibold">
                        <span className={m.sender === 'user' ? 'text-pink-400' : 'text-purple-400'}>
                          {m.sender === 'user' ? `${msgUser?.name || 'Sister'} (User)` : 'Billa ai (AI)'}
                        </span>
                        <span>{new Date(m.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                        {m.content}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Feedback & Corrections */}
        {activeTab === 'feedback' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">
              Marked Responses & Feedback ({feedbacks.length})
            </div>

            {feedbacks.length === 0 ? (
              <div className="text-center py-12 text-xs text-gray-500 bg-[#242424] rounded-xl border border-[#333]">
                No feedback items submitted yet. You or Api can click 👍/👎 on any message in chat to flag it for improvement!
              </div>
            ) : (
              feedbacks.map(f => (
                <div
                  key={f.id}
                  className="p-4 bg-[#262626] rounded-xl border border-[#383838] flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] flex items-center gap-1 ${
                        f.rating === 'thumbs_up'
                          ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                          : 'bg-red-500/20 text-red-300 border border-red-500/30'
                      }`}>
                        {f.rating === 'thumbs_up' ? <ThumbsUp className="w-3 h-3" /> : <ThumbsDown className="w-3 h-3" />}
                        {f.rating === 'thumbs_up' ? 'Helpful' : 'Needs Improvement'}
                      </span>
                      <span className="text-gray-500 text-[10px]">
                        {new Date(f.created_at).toLocaleString()}
                      </span>
                    </div>

                    {f.comment && (
                      <div>
                        <span className="text-gray-400 font-semibold">Note / Issue: </span>
                        <span className="text-white">{f.comment}</span>
                      </div>
                    )}

                    {f.suggested_reply && (
                      <div className="p-2.5 bg-[#1e1e1e] rounded-lg border border-[#353535] text-gray-300">
                        <span className="text-purple-400 font-semibold">Suggested Ideal Reply: </span>
                        {f.suggested_reply}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleDeleteFeedback(f.id)}
                    className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-[#333] rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
