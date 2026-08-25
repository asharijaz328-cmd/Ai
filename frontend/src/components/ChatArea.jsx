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
    <div className="flex-1 flex flex-col h-full bg-[#212121] overflow-hidden relative">
      {/* Top Header */}
      <header className="h-14 border-b border-[#2d2d2d] bg-[#212121]/90 backdrop-blur-xs px-3 sm:px-5 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="p-2 text-gray-400 hover:text-white rounded-lg lg:hidden hover:bg-[#2c2c2c] transition-colors"
            title="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-sm font-semibold text-white truncate max-w-[200px] sm:max-w-md">
              {conversation?.title || "New chat"}
            </h1>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          {/* Provider Selector */}
          <div className="flex items-center bg-[#2b2b2b] p-0.5 rounded-lg border border-[#3a3a3a] text-xs">
            <button
              onClick={() => setProvider('gemini')}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                provider === 'gemini'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              title="Google Gemini 3.1 Flash"
            >
              ✨ Gemini
            </button>
            <button
              onClick={() => setProvider('groq')}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                provider === 'groq'
                  ? 'bg-orange-600 text-white shadow'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              title="Groq Ultra-Fast (OSS 120B)"
            >
              ⚡ Groq
            </button>
          </div>

          <button
            onClick={onOpenMemories}
            className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-purple-300 bg-[#2b2b2b] hover:bg-[#343434] px-2.5 py-1.5 rounded-lg border border-[#3a3a3a] transition-colors"
            title="View Memory"
          >
            <BrainCircuit className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Memories</span>
          </button>

          <button
            onClick={onNewChat}
            className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs text-gray-300 hover:text-white bg-[#2b2b2b] hover:bg-[#343434] rounded-lg border border-[#3a3a3a] flex items-center gap-1 transition-colors"
            title="Start new chat"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </div>
      </header>

      {/* Main Message Stream */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {messages.length === 0 && !isStreaming ? (
          /* Empty Chat Hero Greeting */
          <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 via-purple-500 to-pink-500 flex items-center justify-center text-3xl shadow-xl shadow-purple-600/20 mb-4 animate-bounce">
              🐱
            </div>
            
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              Salam {profile?.name || "Api"}! <Heart className="w-4 h-4 text-pink-400 fill-current inline" />
            </h2>
            
            <p className="text-sm text-gray-300 leading-relaxed">
              Main hoon <strong>Billa ai</strong>. Mujhse kisi bhi baat par khul kar mashwara karein. 
              Main hamesha sach aur balanced advice doonga bina kisi jhoote butter ke! 😊
            </p>
          </div>
        ) : (
          /* Message List */
          <div className="flex flex-col pb-4">
            {messages.map((msg, index) => (
              <MessageBubble
                key={msg.id || index}
                message={msg}
                isLast={index === messages.length - 1 && !isStreaming}
                profile={profile}
              />
            ))}

            {/* Live Streaming Chunk Bubble */}
            {isStreaming && (
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

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Floating Input Box */}
      <ChatInput
        onSendMessage={onSendMessage}
        onStopStreaming={onStopStreaming}
        isStreaming={isStreaming}
        provider={provider}
        setProvider={setProvider}
        disabled={loading}
      />
    </div>
  );
}
