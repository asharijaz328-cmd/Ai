const API_BASE = (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, '') : '') + '/api';

export const api = {
  // Authentication & Accounts
  async login(email, password) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Login failed' }));
        throw new Error(err.detail || 'Email ya password galat hai.');
      }
      return res.json();
    } catch (e) {
      if (e.name === 'AbortError') {
        throw new Error('Server respond nahi kar raha. Check karein ke backend chal raha hai.');
      }
      throw e;
    }
  },

  async register(data) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Registration failed' }));
        throw new Error(err.detail || 'Account create nahi ho saka.');
      }
      return res.json();
    } catch (e) {
      if (e.name === 'AbortError') {
        throw new Error('Server respond nahi kar raha. Check karein ke backend chal raha hai.');
      }
      throw e;
    }
  },

  async getAllUsers() {
    const res = await fetch(`${API_BASE}/auth/users`);
    if (!res.ok) throw new Error('Failed to load users');
    return res.json();
  },

  // Profiles & Security
  async getProfiles() {
    const res = await fetch(`${API_BASE}/profiles`);
    if (!res.ok) throw new Error('Failed to load profiles');
    return res.json();
  },

  async getProfile(userId = 'api') {
    const res = await fetch(`${API_BASE}/profiles/${userId}`);
    if (!res.ok) throw new Error('Failed to load profile');
    return res.json();
  },

  async verifyProfilePin(userId, pin) {
    const res = await fetch(`${API_BASE}/profiles/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, pin }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Galat PIN hai!' }));
      throw new Error(err.detail || 'PIN verification failed');
    }
    return res.json();
  },

  async updateProfile(userId, data) {
    const res = await fetch(`${API_BASE}/profiles/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
  },

  // Conversations
  async getConversations(userId = null) {
    const url = userId ? `${API_BASE}/conversations?user_id=${userId}` : `${API_BASE}/conversations`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load conversations');
    return res.json();
  },

  async createConversation(title = "New chat", userId = "api") {
    const res = await fetch(`${API_BASE}/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, user_id: userId }),
    });
    if (!res.ok) throw new Error('Failed to create conversation');
    return res.json();
  },

  async getConversation(id) {
    const res = await fetch(`${API_BASE}/conversations/${id}`);
    if (!res.ok) throw new Error('Failed to load conversation');
    return res.json();
  },

  async updateConversation(id, data) {
    const res = await fetch(`${API_BASE}/conversations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update conversation');
    return res.json();
  },

  async deleteConversation(id) {
    const res = await fetch(`${API_BASE}/conversations/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete conversation');
    return res.json();
  },

  async generateTitle(conversationId) {
    try {
      const res = await fetch(`${API_BASE}/chat/title/${conversationId}`, { method: 'POST' });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Could not auto-generate title", e);
    }
    return null;
  },

  // Streaming Chat
  async streamChat({ userId = "api", conversationId, message, provider, onInit, onChunk, onDone, onError, signal }) {
    try {
      const response = await fetch(`${API_BASE}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          conversation_id: conversationId,
          message,
          provider
        }),
        signal
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Keep incomplete line

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            try {
              const event = JSON.parse(dataStr);
              if (event.type === 'init' && onInit) {
                onInit(event.conversation_id);
              } else if (event.type === 'chunk' && onChunk) {
                onChunk(event.text);
              } else if (event.type === 'done' && onDone) {
                onDone(event.message_id);
              }
            } catch (err) {
              console.error('Error parsing SSE event', err, dataStr);
            }
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        onError && onError(err);
      }
    }
  },

  // Memories
  async getMemories(userId = null, category = null) {
    let url = `${API_BASE}/memories?`;
    if (userId) url += `user_id=${userId}&`;
    if (category && category !== 'all') url += `category=${category}&`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load memories');
    return res.json();
  },

  async createMemory(memoryData) {
    const res = await fetch(`${API_BASE}/memories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(memoryData),
    });
    if (!res.ok) throw new Error('Failed to create memory');
    return res.json();
  },

  async deleteMemory(id) {
    const res = await fetch(`${API_BASE}/memories/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete memory');
    return res.json();
  },

  // Tuning & Developer Feedback
  async getTuningRules(activeOnly = false) {
    const res = await fetch(`${API_BASE}/tuning/rules?active_only=${activeOnly}`);
    if (!res.ok) throw new Error('Failed to load tuning rules');
    return res.json();
  },

  async createTuningRule(ruleData) {
    const res = await fetch(`${API_BASE}/tuning/rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ruleData),
    });
    if (!res.ok) throw new Error('Failed to create tuning rule');
    return res.json();
  },

  async updateTuningRule(id, data) {
    const res = await fetch(`${API_BASE}/tuning/rules/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update tuning rule');
    return res.json();
  },

  async deleteTuningRule(id) {
    const res = await fetch(`${API_BASE}/tuning/rules/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete tuning rule');
    return res.json();
  },

  async getFeedbacks() {
    const res = await fetch(`${API_BASE}/tuning/feedbacks`);
    if (!res.ok) throw new Error('Failed to load feedbacks');
    return res.json();
  },

  async submitFeedback(data) {
    const res = await fetch(`${API_BASE}/tuning/feedbacks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to submit feedback');
    return res.json();
  },

  async deleteFeedback(id) {
    const res = await fetch(`${API_BASE}/tuning/feedbacks/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete feedback');
    return res.json();
  },

  async getTuningStats() {
    const res = await fetch(`${API_BASE}/tuning/stats`);
    if (!res.ok) throw new Error('Failed to load stats');
    return res.json();
  }
};
