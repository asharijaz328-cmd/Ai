import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import MemoryModal from './components/MemoryModal';
import ProfileModal from './components/ProfileModal';
import TuneModal from './components/TuneModal';
import AuthScreen from './components/AuthScreen';
import { api } from './services/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('billa_user_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [provider, setProvider] = useState('gemini');
  const [loading, setLoading] = useState(false);
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [memoryModalOpen, setMemoryModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [tuneModalOpen, setTuneModalOpen] = useState(false);

  const abortControllerRef = useRef(null);

  // Load conversations when user is logged in
  const loadUserData = async (user) => {
    if (!user) return;
    try {
      setLoading(true);
      const convs = await api.getConversations(user.id).catch(() => []);
      setConversations(convs);
      if (convs.length > 0) {
        loadConversation(convs[0].id);
      } else {
        setActiveId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error("Error loading user data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadUserData(currentUser);
    }
  }, [currentUser?.id]);

  // Secret Developer Keyboard Shortcut (Ctrl + Shift + A or Ctrl + Shift + T)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a' || e.key === 'T' || e.key === 't')) {
        e.preventDefault();
        setTuneModalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auth Success (Login or Sign Up)
  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('billa_user_session', JSON.stringify(user));
    } catch {}
    loadUserData(user);
  };

  // Logout
  const handleLogout = () => {
    if (isStreaming) handleStopStreaming();
    setCurrentUser(null);
    try {
      localStorage.removeItem('billa_user_session');
    } catch {}
    setActiveId(null);
    setMessages([]);
    setConversations([]);
  };

  // Load conversation messages
  const loadConversation = async (id) => {
    try {
      setLoading(true);
      setActiveId(id);
      const data = await api.getConversation(id);
      setMessages(data.messages || []);
    } catch (err) {
      console.error("Failed to load conversation:", err);
    } finally {
      setLoading(false);
    }
  };

  // Start New Chat
  const handleNewChat = () => {
    if (isStreaming) handleStopStreaming();
    setActiveId(null);
    setMessages([]);
  };

  // Send Message (with SSE streaming and user_id tag)
  const handleSendMessage = async (text) => {
    if (!text.trim() || isStreaming || !currentUser) return;

    const userMsg = {
      id: `temp-${Date.now()}`,
      sender: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);

    setIsStreaming(true);
    setStreamingContent('');

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let targetConvId = activeId;
    let accumulatedText = '';

    await api.streamChat({
      userId: currentUser.id,
      conversationId: activeId,
      message: text,
      provider: provider,
      signal: controller.signal,
      onInit: (newConvId) => {
        targetConvId = newConvId;
        if (!activeId) {
          setActiveId(newConvId);
        }
      },
      onChunk: (chunk) => {
        accumulatedText += chunk;
        setStreamingContent(prev => prev + chunk);
      },
      onDone: async (savedMsgId) => {
        setIsStreaming(false);
        const finalAiMsg = {
          id: savedMsgId || `ai-${Date.now()}`,
          sender: 'assistant',
          content: accumulatedText,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, finalAiMsg]);
        setStreamingContent('');

        // Refresh logged in sister's conversations
        const updatedConvs = await api.getConversations(currentUser.id).catch(() => []);
        setConversations(updatedConvs);

        if (!activeId && targetConvId) {
          api.generateTitle(targetConvId).then(() => {
            api.getConversations(currentUser.id).then(c => setConversations(c));
          });
        }
      },
      onError: (err) => {
        console.error("Streaming error:", err);
        setIsStreaming(false);
        setStreamingContent('');
        const errorMsg = {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          content: `⚠️ Baat cheet mein masla aya: ${err.message || 'Server se connect nahi ho saka.'}`,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    });
  };

  // Stop Streaming
  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      if (streamingContent) {
        setMessages(prev => [
          ...prev,
          {
            id: `ai-stopped-${Date.now()}`,
            sender: 'assistant',
            content: streamingContent + " [Stopped]",
            timestamp: new Date().toISOString()
          }
        ]);
        setStreamingContent('');
      }
    }
  };

  // Delete Conversation
  const handleDeleteConversation = async (id) => {
    try {
      await api.deleteConversation(id);
      const remaining = conversations.filter(c => c.id !== id);
      setConversations(remaining);
      if (activeId === id) {
        if (remaining.length > 0) {
          loadConversation(remaining[0].id);
        } else {
          handleNewChat();
        }
      }
    } catch (err) {
      alert("Delete karne mein masla aya");
    }
  };

  // Update Conversation (Title / Pin)
  const handleUpdateConversation = async (id, data) => {
    try {
      const updated = await api.updateConversation(id, data);
      setConversations(conversations.map(c => c.id === id ? updated : c));
    } catch (err) {
      alert("Update karne mein masla aya");
    }
  };

  const activeConv = conversations.find(c => c.id === activeId);

  // If not logged in, show AuthScreen
  if (!currentUser) {
    return (
      <>
        <AuthScreen onAuthSuccess={handleAuthSuccess} />
        <TuneModal
          isOpen={tuneModalOpen}
          onClose={() => setTuneModalOpen(false)}
        />
      </>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#212121] text-[#ececec]">
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelectConversation={loadConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onUpdateConversation={handleUpdateConversation}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenMemories={() => setMemoryModalOpen(true)}
        onOpenProfile={() => setProfileModalOpen(true)}
        onOpenTune={() => setTuneModalOpen(true)}
        onLogout={handleLogout}
        profile={currentUser}
      />

      {/* Main Chat Workspace */}
      <ChatArea
        conversation={activeConv}
        messages={messages}
        isStreaming={isStreaming}
        streamingContent={streamingContent}
        onSendMessage={handleSendMessage}
        onStopStreaming={handleStopStreaming}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onNewChat={handleNewChat}
        onOpenMemories={() => setMemoryModalOpen(true)}
        provider={provider}
        setProvider={setProvider}
        profile={currentUser}
        loading={loading}
      />

      {/* Modals */}
      <MemoryModal
        isOpen={memoryModalOpen}
        onClose={() => setMemoryModalOpen(false)}
        profile={currentUser}
      />

      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        profile={currentUser}
        onProfileUpdated={(updated) => {
          setCurrentUser(updated);
          try {
            localStorage.setItem('billa_user_session', JSON.stringify(updated));
          } catch {}
        }}
      />

      <TuneModal
        isOpen={tuneModalOpen}
        onClose={() => setTuneModalOpen(false)}
      />
    </div>
  );
}
