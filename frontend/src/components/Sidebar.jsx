import React, { useState } from 'react';
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  Edit3, 
  Pin, 
  Search, 
  BrainCircuit, 
  User, 
  ChevronRight, 
  X,
  Sparkles,
  Check,
  Sliders,
  Lock,
  LogOut
} from 'lucide-react';

export default function Sidebar({
  conversations,
  activeId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onUpdateConversation,
  isOpen,
  onClose,
  onOpenMemories,
  onOpenProfile,
  onOpenTune,
  onLogout,
  profile
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const filteredConversations = conversations.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group conversations by date
  const groupConversations = () => {
    const pinned = [];
    const today = [];
    const yesterday = [];
    const earlier = [];

    const now = new Date();
    const todayStr = now.toDateString();
    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(now.getDate() - 1);
    const yesterdayStr = yesterdayDate.toDateString();

    filteredConversations.forEach(c => {
      if (c.is_pinned) {
        pinned.push(c);
        return;
      }
      const cDate = new Date(c.updated_at || c.created_at).toDateString();
      if (cDate === todayStr) {
        today.push(c);
      } else if (cDate === yesterdayStr) {
        yesterday.push(c);
      } else {
        earlier.push(c);
      }
    });

    return { pinned, today, yesterday, earlier };
  };

  const { pinned, today, yesterday, earlier } = groupConversations();

  const handleStartEdit = (e, conv) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveEdit = (e, convId) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onUpdateConversation(convId, { title: editTitle.trim() });
    }
    setEditingId(null);
  };

  const handleTogglePin = (e, conv) => {
    e.stopPropagation();
    onUpdateConversation(conv.id, { is_pinned: !conv.is_pinned });
  };

  const renderGroup = (title, items) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-4">
        <div className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase px-3 mb-1.5 flex items-center gap-1.5">
          {title}
        </div>
        <div className="space-y-0.5">
          {items.map(conv => {
            const isActive = conv.id === activeId;
            const isEditing = conv.id === editingId;

            return (
              <div
                key={conv.id}
                onClick={() => {
                  onSelectConversation(conv.id);
                  onClose();
                }}
                className={`group relative flex items-center justify-between px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-colors duration-150 ${
                  isActive 
                    ? 'bg-[#212121] text-white font-medium shadow-sm' 
                    : 'text-gray-300 hover:bg-[#212121]/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? 'text-purple-400' : 'text-gray-400 group-hover:text-gray-300'}`} />
                  
                  {isEditing ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(e, conv.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      autoFocus
                      className="w-full bg-[#303030] text-white text-xs px-2 py-1 rounded outline-none border border-purple-500/50"
                    />
                  ) : (
                    <span className="truncate text-xs">{conv.title}</span>
                  )}
                </div>

                {/* Actions */}
                <div className={`items-center gap-1 shrink-0 ${isActive || isEditing ? 'flex' : 'hidden group-hover:flex'}`}>
                  {isEditing ? (
                    <button
                      onClick={(e) => handleSaveEdit(e, conv.id)}
                      className="p-1 hover:text-green-400 text-gray-400"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={(e) => handleTogglePin(e, conv)}
                        title={conv.is_pinned ? "Unpin" : "Pin"}
                        className={`p-1 hover:text-purple-400 ${conv.is_pinned ? 'text-purple-400' : 'text-gray-400'}`}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleStartEdit(e, conv)}
                        title="Rename"
                        className="p-1 hover:text-blue-400 text-gray-400"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Delete this conversation?')) {
                            onDeleteConversation(conv.id);
                          }
                        }}
                        title="Delete"
                        className="p-1 hover:text-red-400 text-gray-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 left-0 bottom-0 z-50 w-72 bg-[#171717] border-r border-[#2d2d2d] flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header */}
        <div className="p-3 border-b border-[#2d2d2d] flex items-center justify-between">
          <div 
            className="flex items-center gap-2.5 px-2 cursor-pointer select-none"
            onDoubleClick={() => onOpenTune && onOpenTune()}
            title=""
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-lg shadow-md hover:scale-105 transition-transform">
              🐱
            </div>
            <div>
              <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                Billa ai
                <span className="text-[10px] bg-purple-500/20 text-purple-300 font-medium px-1.5 py-0.5 rounded-full border border-purple-500/30">
                  Personal
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg lg:hidden hover:bg-[#262626]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New Chat Button & Search */}
        <div className="p-3 space-y-2">
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-r from-purple-700/80 to-pink-600/80 hover:from-purple-700 hover:to-pink-600 text-white rounded-xl text-xs font-medium shadow-md shadow-purple-950/30 transition-all duration-150 active:scale-[0.98]"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>New chat</span>
            </div>
            <Sparkles className="w-3.5 h-3.5 opacity-80" />
          </button>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#212121] text-gray-200 placeholder-gray-500 text-xs pl-8 pr-3 py-2 rounded-lg border border-[#2d2d2d] focus:border-purple-500/50 outline-none transition-colors"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-2 py-1">
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-400 px-4">
              No conversations found. <br />
              Click "New chat" above to start! ✨
            </div>
          ) : (
            <>
              {renderGroup("Pinned", pinned)}
              {renderGroup("Today", today)}
              {renderGroup("Yesterday", yesterday)}
              {renderGroup("Previous 7 Days", earlier)}
            </>
          )}
        </div>

        {/* Bottom Footer Actions */}
        <div className="p-2.5 border-t border-[#2d2d2d] space-y-1 bg-[#171717]">
          {/* Memory Button */}
          <button
            onClick={() => {
              onOpenMemories();
              onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-gray-300 hover:bg-[#212121] hover:text-purple-300 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <BrainCircuit className="w-4 h-4 text-purple-400" />
              <span>Memory Center</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
          </button>

          {/* User Profile Button */}
          <button
            onClick={() => {
              onOpenProfile();
              onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-gray-300 hover:bg-[#212121] hover:text-pink-300 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] border ${
                profile?.avatar_color === 'purple' 
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' 
                  : 'bg-pink-500/20 text-pink-300 border-pink-500/30'
              }`}>
                {profile?.name ? profile.name.charAt(0) : 'U'}
              </div>
              <div className="text-left truncate">
                <div className="truncate font-medium">{profile?.name || 'My Profile'}</div>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
          </button>

          {/* Log Out Button */}
          <button
            onClick={() => {
              onLogout && onLogout();
              onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-gray-400 hover:bg-[#282020] hover:text-red-300 transition-colors"
            title="Log Out of your account"
          >
            <div className="flex items-center gap-2.5">
              <LogOut className="w-4 h-4 text-red-400/80" />
              <span>Log Out</span>
            </div>
            <span className="text-[10px] text-gray-500 truncate max-w-[90px]">{profile?.email}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
