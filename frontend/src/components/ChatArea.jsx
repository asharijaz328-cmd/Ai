import React, { useRef, useEffect } from 'react';
import { Menu, Plus, Sparkles, BrainCircuit, Heart } from 'lucide-react';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';

export default function ChatArea({
  conversation,
  messages,
  isStreaming,
  streamingContent,
  onSendMessage,
  onStopStreaming,
  onToggleSidebar,
  onNewChat,
  onOpenMemories,
  provider,
  setProvider,
  profile,
  loading
}) {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  return (
    <div className="flex-1 flex flex-col h-[100dvh] max-h-[100dvh] bg-[#212121] overflow-hidden relative">
      {/* Top Header - Sticky on Mobile & Desktop */}
      <header className="h-13 sm:h-14 border-b border-[#2d2d2d] bg-[#212121]/95 backdrop-blur-md px-3 sm:px-5 flex items-center justify-between z-20 shrink-0 select-none">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 sm:p-2 text-gray-400 hover:text-white rounded-lg lg:hidden hover:bg-[#2c2c2c] transition-colors"
            title="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-base sm:text-lg">🐱</span>
            <h1 className="text-xs sm:text-sm font-semibold text-white truncate max-w-[140px] sm:max-w-md">
              {conversation?.title || "Billa ai"}
            </h1>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Provider Selector (Gemini / Groq) */}
          <div className="flex items-center bg-[#2b2b2b] p-0.5 rounded-lg border border-[#3a3a3a] text-xs">
            <button
              onClick={() => setProvider('gemini')}
              className={`px-1.5 sm:px-2 py-1 rounded-md text-[10px] sm:text-[11px] font-medium transition-all ${
                provider === 'gemini'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              title="Google Gemini"
            >
              ✨ <span className="hidden xs:inline">Gemini</span>
            </button>
            <button
              onClick={() => setProvider('groq')}
              className={`px-1.5 sm:px-2 py-1 rounded-md text-[10px] sm:text-[11px] font-medium transition-all ${
                provider === 'groq'
                  ? 'bg-orange-600 text-white shadow'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              title="Groq (Ultra-Fast)"
            >
              ⚡ <span className="hidden xs:inline">Groq</span>
            </button>
          </div>

          {/* Memories */}
          <button
            onClick={onOpenMemories}
            className="flex items-center gap-1 text-xs text-gray-300 hover:text-purple-300 bg-[#2b2b2b] hover:bg-[#343434] px-2 sm:px-2.5 py-1.5 rounded-lg border border-[#3a3a3a] transition-colors"
            title="Memories"
          >
            <BrainCircuit className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Memories</span>
          </button>

          {/* New Chat */}
          <button
            onClick={onNewChat}
            className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs text-gray-300 hover:text-white bg-[#2b2b2b] hover:bg-[#343434] rounded-lg border border-[#3a3a3a] flex items-center gap-1 transition-colors"
            title="New chat"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </div>
      </header>

      {/* Main Message Stream */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col justify-start">
        {messages.length === 0 && !isStreaming ? (
          /* Empty Chat Hero Greeting */
          <div className="my-auto flex flex-col items-center justify-center text-center p-4 sm:p-6 max-w-lg mx-auto">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-purple-600 via-purple-500 to-pink-500 flex items-center justify-center text-2xl sm:text-3xl shadow-xl shadow-purple-600/20 mb-3 animate-bounce">
              🐱
            </div>
            
            <h2 className="text-lg sm:text-xl font-bold text-white mb-2 flex items-center gap-2">
              Salam {profile?.name || "Aap"}! <Heart className="w-4 h-4 text-pink-400 fill-current inline" />
            </h2>
            
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed px-2">
              Main hoon <strong>Billa ai</strong>. Mujhse kisi bhi baat par khul kar mashwara karein. 
              Main hamesha sach aur balanced advice doonga! 😊
            </p>
          </div>
        ) : (
          /* Message List */
          <div className="flex flex-col py-2">
            {messages.map((msg, index) => (
              <MessageBubble
                key={msg.id || index}
                message={msg}
                isLast={index === messages.length - 1 && !isStreaming}
                profile={profile}
              />
            ))}

            {/* Live Streaming Chunk */}
            {isStreaming && streamingContent && (
              <MessageBubble
                message={{
                  sender: 'assistant',
                  content: streamingContent,
                  timestamp: new Date().toISOString()
                }}
                isLast={true}
                isStreaming={true}
                profile={profile}
              />
            )}
            <div ref={messagesEndRef} className="h-2 shrink-0" />
          </div>
        )}
      </div>

      {/* Bottom Fixed Chat Input */}
      <div className="shrink-0 bg-[#212121] border-t border-[#2a2a2a]/60">
        <ChatInput
          onSendMessage={onSendMessage}
          onStopStreaming={onStopStreaming}
          isStreaming={isStreaming}
          provider={provider}
          setProvider={setProvider}
          disabled={loading}
        />
      </div>
    </div>
  );
}
