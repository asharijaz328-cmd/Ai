import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, Volume2, VolumeX, ThumbsUp, ThumbsDown } from 'lucide-react';
import { api } from '../services/api';
import { playSpeech, stopSpeech } from '../services/voice';

export default function MessageBubble({ message, isLast, isStreaming, profile }) {
  const [copied, setCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const isUser = message.sender === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleAudio = () => {
    if (isPlayingAudio) {
      stopSpeech();
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      playSpeech(
        message.content,
        () => setIsPlayingAudio(true),
        () => setIsPlayingAudio(false),
        () => setIsPlayingAudio(false)
      );
    }
  };

  useEffect(() => {
    return () => {
      if (isPlayingAudio) {
        stopSpeech();
      }
    };
  }, [isPlayingAudio]);

  const isUrduScript = /[\u0600-\u06FF]/.test(message.content);

  const formatTime = (ts) => {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // User Message (Right-aligned ChatGPT / WhatsApp style bubble)
  if (isUser) {
    return (
      <div className="w-full flex justify-end px-3 sm:px-6 py-2">
        <div className="max-w-[85%] sm:max-w-xl flex flex-col items-end">
          <div className="bg-[#2f2f2f] text-[#f0f0f0] rounded-2xl rounded-tr-xs px-4 py-2.5 text-sm sm:text-base leading-relaxed shadow-sm border border-white/5 whitespace-pre-wrap break-words">
            {message.content}
          </div>
          <span className="text-[10px] text-gray-500 mt-1 mr-1">
            {formatTime(message.timestamp)}
          </span>
        </div>
      </div>
    );
  }

  // AI Message (Left-aligned with Cat mascot)
  return (
    <div className="w-full flex justify-start px-3 sm:px-6 py-3 bg-[#1e1e1e]/40 border-y border-white/[0.02]">
      <div className="max-w-3xl w-full flex gap-3 items-start">
        {/* Cat Avatar */}
        <div className="shrink-0 mt-0.5">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-purple-600 via-purple-500 to-pink-500 text-white flex items-center justify-center text-sm shadow-sm shadow-purple-500/20 border border-purple-400/20">
            🐱
          </div>
        </div>

        {/* AI Content */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-300">
              Billa ai
            </span>
            <span className="text-[10px] text-gray-500">
              {formatTime(message.timestamp)}
            </span>
          </div>

          <div className={`text-sm sm:text-base leading-relaxed text-[#e6e6e6] markdown-content break-words ${isUrduScript ? 'urdu-text' : ''}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>

            {isStreaming && isLast && (
              <span className="inline-block w-2 h-4 ml-1 bg-purple-400 rounded-xs animate-pulse align-middle" />
            )}
          </div>

          {/* Action Bar (Audio, Copy, Feedback) */}
          {message.content && !isStreaming && (
            <div className="pt-1.5 flex items-center gap-1.5 flex-wrap">
              {/* Listen Button */}
              <button
                onClick={handleToggleAudio}
                className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md transition-colors ${
                  isPlayingAudio
                    ? 'bg-pink-600/30 text-pink-300 border border-pink-500/40 animate-pulse'
                    : 'text-gray-400 hover:text-pink-300 bg-[#2b2b2b] hover:bg-[#353535]'
                }`}
                title="Listen to message"
              >
                {isPlayingAudio ? (
                  <>
                    <VolumeX className="w-3 h-3 text-pink-400" />
                    <span>Stop</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3 h-3 text-purple-400" />
                    <span>Listen</span>
                  </>
                )}
              </button>

              {/* Copy Button */}
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-200 bg-[#2b2b2b] hover:bg-[#353535] px-2.5 py-1 rounded-md transition-colors"
                title="Copy text"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-green-400" />
                    <span className="text-green-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              {/* Thumbs Up */}
              <button
                onClick={async () => {
                  try {
                    await api.submitFeedback({
                      message_id: message.id || 'msg',
                      conversation_id: message.conversation_id || 'conv',
                      rating: 'thumbs_up'
                    });
                    alert('Feedback saved! 👍');
                  } catch (e) {}
                }}
                className="p-1 text-gray-400 hover:text-green-400 bg-[#2b2b2b] hover:bg-[#353535] rounded-md transition-colors"
                title="Good response"
              >
                <ThumbsUp className="w-3 h-3" />
              </button>

              {/* Thumbs Down */}
              <button
                onClick={async () => {
                  const note = prompt('What could be improved? (Optional note):');
                  if (note !== null) {
                    try {
                      await api.submitFeedback({
                        message_id: message.id || 'msg',
                        conversation_id: message.conversation_id || 'conv',
                        rating: 'thumbs_down',
                        comment: note
                      });
                      alert('Feedback saved! 🛠️');
                    } catch (e) {}
                  }
                }}
                className="p-1 text-gray-400 hover:text-red-400 bg-[#2b2b2b] hover:bg-[#353535] rounded-md transition-colors"
                title="Improve response"
              >
                <ThumbsDown className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
