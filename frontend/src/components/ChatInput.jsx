import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Square, Sparkles, ChevronDown, Mic, MicOff, Globe } from 'lucide-react';
import { createSpeechRecognizer } from '../services/voice';

export default function ChatInput({ 
  onSendMessage, 
  onStopStreaming, 
  isStreaming, 
  provider, 
  setProvider,
  disabled 
}) {
  const [text, setText] = useState('');
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceLang, setVoiceLang] = useState('ur-PK'); // 'ur-PK' or 'en-US'
  const [showLangMenu, setShowLangMenu] = useState(false);
  
  const textareaRef = useRef(null);
  const recognizerRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [text]);

  // Clean up recognizer on unmount
  useEffect(() => {
    return () => {
      if (recognizerRef.current) {
        try { recognizerRef.current.stop(); } catch {}
      }
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      if (recognizerRef.current) {
        try { recognizerRef.current.stop(); } catch {}
      }
      setIsListening(false);
      return;
    }

    const recognizer = createSpeechRecognizer({
      lang: voiceLang,
      onResult: ({ final, interim }) => {
        setText(prev => {
          const base = prev ? prev.trim() + ' ' : '';
          return (base + (final || interim)).trim();
        });
      },
      onEnd: () => {
        setIsListening(false);
      },
      onError: (err) => {
        console.warn("Speech recognition notice:", err);
        setIsListening(false);
      }
    });

    if (!recognizer) {
      alert("Aapke browser mein Speech Recognition support nahi mila.");
      return;
    }

    try {
      recognizer.start();
      recognizerRef.current = recognizer;
      setIsListening(true);
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!text.trim() || isStreaming || disabled) return;
    
    if (isListening && recognizerRef.current) {
      try { recognizerRef.current.stop(); } catch {}
      setIsListening(false);
    }

    onSendMessage(text.trim());
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const modelLabels = {
    gemini: "Gemini",
    openai: "GPT-4o",
    groq: "Groq ⚡"
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-2.5 sm:px-4 py-2 sm:pb-3">
      {/* Listening Indicator Bar */}
      {isListening && (
        <div className="mb-1.5 flex items-center justify-between bg-pink-950/50 border border-pink-500/40 rounded-xl px-3 py-1 text-xs text-pink-300 animate-pulse">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />
            <span className="font-medium text-[11px] sm:text-xs">
              Sun raha hoon... ({voiceLang === 'ur-PK' ? 'Urdu 🇵🇰' : 'English 🇬🇧'})
            </span>
          </div>
          <button
            type="button"
            onClick={toggleListening}
            className="text-[10px] bg-pink-500/20 hover:bg-pink-500/40 text-pink-200 px-2 py-0.5 rounded transition-colors"
          >
            Done
          </button>
        </div>
      )}

      {/* Main Input Box */}
      <div className={`relative bg-[#2c2c2c] rounded-2xl border transition-all ${
        isListening 
          ? 'border-pink-500/60 shadow-lg shadow-pink-500/10' 
          : 'border-[#3d3d3d] focus-within:border-purple-500/50 shadow-md'
      }`}>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? "Bolte rahein..." : "Message Billa ai..."}
          rows={1}
          disabled={disabled}
          className="w-full bg-transparent text-sm text-[#ececec] placeholder-gray-400 px-3.5 pt-2.5 pb-9 sm:pb-10 resize-none outline-none max-h-36 overflow-y-auto"
        />

        {/* Bottom Bar inside Input */}
        <div className="absolute bottom-1.5 left-2.5 right-2 flex items-center justify-between pointer-events-none">
          {/* Left Controls: Model Switcher & Mic Language */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            {/* Model Switcher Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowModelMenu(!showModelMenu)}
                className="flex items-center gap-1 text-[10px] sm:text-[11px] text-gray-400 hover:text-purple-300 bg-[#222] hover:bg-[#282828] px-2 py-0.5 rounded-full border border-white/5 transition-colors"
              >
                <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                <span>{modelLabels[provider] || "Gemini"}</span>
                <ChevronDown className="w-2.5 h-2.5" />
              </button>

              {/* Model Dropdown Menu */}
              {showModelMenu && (
                <div 
                  className="absolute bottom-full left-0 mb-1.5 w-44 bg-[#1e1e1e] border border-[#3a3a3a] rounded-xl shadow-2xl py-1 z-50 animate-fade-in"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => { setProvider('gemini'); setShowModelMenu(false); }}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-[#2c2c2c] flex items-center justify-between ${provider === 'gemini' ? 'text-purple-400 font-semibold' : 'text-gray-300'}`}
                  >
                    <span>Google Gemini</span>
                    <span className="text-[9px] bg-green-500/20 text-green-300 px-1 py-0.5 rounded">Free</span>
                  </button>
                  <button
                    onClick={() => { setProvider('groq'); setShowModelMenu(false); }}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-[#2c2c2c] flex items-center justify-between ${provider === 'groq' ? 'text-orange-400 font-semibold' : 'text-gray-300'}`}
                  >
                    <span>Groq (OSS 120B)</span>
                    <span className="text-[9px] bg-orange-500/20 text-orange-300 px-1 py-0.5 rounded">Fast</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mic Language Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-1 text-[10px] sm:text-[11px] text-gray-400 hover:text-pink-300 bg-[#222] hover:bg-[#282828] px-2 py-0.5 rounded-full border border-white/5 transition-colors"
                title="Voice Language"
              >
                <Globe className="w-2.5 h-2.5 text-pink-400" />
                <span>{voiceLang === 'ur-PK' ? 'Urdu' : 'Eng'}</span>
              </button>

              {showLangMenu && (
                <div 
                  className="absolute bottom-full left-0 mb-1.5 w-32 bg-[#1e1e1e] border border-[#3a3a3a] rounded-xl shadow-2xl py-1 z-50 animate-fade-in"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => { setVoiceLang('ur-PK'); setShowLangMenu(false); }}
                    className={`w-full text-left px-2.5 py-1.5 text-xs hover:bg-[#2c2c2c] ${voiceLang === 'ur-PK' ? 'text-pink-400 font-semibold' : 'text-gray-300'}`}
                  >
                    🇵🇰 Urdu
                  </button>
                  <button
                    onClick={() => { setVoiceLang('en-US'); setShowLangMenu(false); }}
                    className={`w-full text-left px-2.5 py-1.5 text-xs hover:bg-[#2c2c2c] ${voiceLang === 'en-US' ? 'text-pink-400 font-semibold' : 'text-gray-300'}`}
                  >
                    🇬🇧 English
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Controls: Mic Button & Send / Stop Button */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            {/* Microphone Button */}
            <button
              type="button"
              onClick={toggleListening}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all shadow-sm active:scale-95 ${
                isListening
                  ? 'bg-pink-600 hover:bg-pink-500 text-white animate-pulse ring-2 ring-pink-400/50'
                  : 'bg-[#222] hover:bg-[#2c2c2c] text-gray-300 hover:text-pink-400 border border-white/5'
              }`}
              title={isListening ? "Stop listening" : "Speak (Voice input)"}
            >
              {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>

            {/* Send / Stop Button */}
            {isStreaming ? (
              <button
                type="button"
                onClick={onStopStreaming}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-500/80 hover:bg-red-600 text-white flex items-center justify-center transition-all shadow-sm active:scale-95"
                title="Stop"
              >
                <Square className="w-3 h-3 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!text.trim() || disabled}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all shadow-sm ${
                  text.trim() && !disabled
                    ? 'bg-purple-600 hover:bg-purple-500 text-white active:scale-95'
                    : 'bg-white/10 text-gray-500 cursor-not-allowed'
                }`}
                title="Send"
              >
                <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
