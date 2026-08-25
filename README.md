# 🐱 Billa AI - Modern Personal AI Companion

A modern, responsive, and empathetic conversational AI companion built with **FastAPI**, **React (Vite)**, **Tailwind CSS**, and **MongoDB Atlas**. 

Featuring **Dual AI Engines (Google Gemini & Groq)**, **Voice Input (Speech-to-Text)**, **Text-to-Speech (Audio Output)**, **Strict Multi-User Privacy Isolation**, and **Long-Term Memory Management**.

---

## ✨ Key Features

- **⚡ Dual AI Inference Engines:**
  - **Google Gemini 3.1 Flash-Lite:** Fast, nuanced, and empathetic reasoning with Roman Urdu, Urdu, and English fluency.
  - **Groq (OpenAI GPT-OSS 120B / Llama 3.3):** Ultra-fast inference with instant token streaming.
  - Switch providers with a single click directly from the chat interface.

- **🎙️ Voice Input & 🔊 Text-to-Speech:**
  - **Voice Input (Mic):** Live speech recognition with support for both **Urdu 🇵🇰** and **English 🇬🇧**.
  - **Audio Readout (Speaker):** Natural text-to-speech audio synthesis to listen to AI responses out loud.

- **🔒 Multi-User Authentication & Strict Data Isolation:**
  - Secure email & password registration and login.
  - Complete data isolation — each user only accesses their own conversations, memories, and profile.

- **🧠 Intelligent Long-Term Memory:**
  - Automatically captures user preferences, important facts, and ongoing context across sessions.
  - Built-in interactive Memory Bank to review, manage, or delete stored memories anytime.

- **💬 Empathetic & Balanced Conversational Tone:**
  - Natural code-switching between Roman Urdu, Urdu script, and English.
  - Provides objective, caring, and practical advice without robotic clichés.

- **📱 Progressive Web App (PWA) & iOS Standalone Support:**
  - Fully responsive on mobile, tablet, and desktop.
  - Installable directly to the iOS Home Screen (Safari) or Android Chrome for a native app experience.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons, React Markdown |
| **Backend** | FastAPI, Uvicorn, Pydantic, HTTPX (SSE Streaming) |
| **Database** | MongoDB Atlas Cloud (Motor Async Client) with Local JSON fallback |
| **AI / LLM** | Google Gemini API, Groq Cloud API |
| **Voice** | Web Speech API (SpeechRecognition & SpeechSynthesis) |

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **Python** (v3.10 or higher)
- **MongoDB Atlas URI** (or local database)
- **Gemini API Key** and/or **Groq API Key** (both offer free tiers)

---

### 2. Environment Configuration

Create a `.env` file in the `backend/` directory:

```env
PORT=8080
HOST=0.0.0.0
PROJECT_NAME="Billa ai"

# Default LLM Provider: gemini | groq
DEFAULT_LLM_PROVIDER=gemini

# 1. Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.1-flash-lite

# 2. Groq API
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b

# 3. Database
MONGODB_URI=your_mongodb_atlas_connection_string
DB_NAME=billa_ai_db
USE_LOCAL_FALLBACK=true
```

---

### 3. Installation & Running

#### Option A: Quick Launch (Windows)
Double-click the launcher scripts in the root directory:
1. Run **`run_backend.bat`** (Starts FastAPI server on `http://localhost:8080`)
2. Run **`run_frontend.bat`** (Starts React dev server on `http://localhost:5180`)

#### Option B: Manual Setup

**Backend:**
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
# source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8080 --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5180` in your browser.

---

## 📁 Project Architecture

```
Ai/
├── backend/
│   ├── routers/
│   │   ├── auth.py           # User registration, login, and profile access
│   │   ├── chat.py           # Real-time SSE chat streaming & message dispatcher
│   │   ├── conversations.py  # Conversation threads & titles
│   │   ├── memories.py       # Long-term memory storage
│   │   └── profile.py        # User profile customization
│   ├── services/
│   │   ├── llm_service.py    # Multi-provider streaming client (Gemini, Groq)
│   │   ├── personality.py    # Core system prompt & empathetic persona logic
│   │   └── memory_service.py # Selective memory extraction
│   ├── database.py           # MongoDB Atlas layer with connection pooling & local fallback
│   ├── models.py             # Pydantic data schemas
│   ├── main.py               # FastAPI application setup
│   └── requirements.txt      # Python dependencies
├── frontend/
│   ├── public/
│   │   ├── manifest.json     # PWA manifest
│   │   └── apple-touch-icon.png
│   ├── src/
│   │   ├── components/
│   │   │   ├── AuthScreen.jsx     # Login & registration portal
│   │   │   ├── ChatArea.jsx       # Main message thread & header controls
│   │   │   ├── ChatInput.jsx      # Auto-resizing input with mic & model picker
│   │   │   ├── MessageBubble.jsx  # Markdown renderer with TTS speaker
│   │   │   ├── Sidebar.jsx        # History drawer & user menu
│   │   │   └── MemoryModal.jsx    # Long-term memory manager
│   │   ├── services/
│   │   │   ├── api.js             # HTTP API client
│   │   │   └── voice.js           # Web Speech API wrapper
│   │   ├── App.jsx                # Root application layout
│   │   └── main.jsx
│   ├── index.html                 # PWA meta tags & fonts
│   └── package.json
├── run_backend.bat
├── run_frontend.bat
└── README.md
```

---

## 🐾 Dedication & In Loving Memory

> *"Though little paws may wander far away,*  
> *Their gentle warmth and loving memory stay forever."*  
>  
> This project is lovingly dedicated to **Billa** 🐱 — a dear little feline companion whose presence brought joy, comfort, and warmth, inspiring the caring spirit behind this companion AI.

---

## 📜 License
This project is open-source and available under the [MIT License](LICENSE).

