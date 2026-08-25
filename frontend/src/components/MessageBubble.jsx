import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, Sparkles, User, Volume2, VolumeX, ThumbsUp, ThumbsDown, Square } from 'lucide-react';
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

  // Check if text has Arabic/Urdu script
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

  return (
    <div className={`py-4 px-3 sm:px-6 w-full flex justify-center ${isUser ? 'bg-transparent' : 'bg-[#212121]/40 border-y border-white/[0.03]'}`}>
      <div className="max-w-3xl w-full flex gap-3.5 sm:gap-4 items-start">
        {/* Avatar */}
        <div className="shrink-0 mt-0.5">
          {isUser ? (
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-pink-500 to-rose-400 text-white flex items-center justify-center font-bold text-xs shadow-sm shadow-pink-500/20">
              {profile?.name ? profile.name.charAt(0).toUpperCase() : 'A'}
            </div>
          ) : (
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-purple-600 via-purple-500 to-pink-500 text-white flex items-center justify-center text-sm shadow-sm shadow-purple-500/30 border border-purple-400/20">
              🐱
            </div>
          )}
        </div>

        {/* Message Content Container */}
        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Header (Sender Name + Time) */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
              {isUser ? (profile?.name || 'Aap') : 'Billa ai'}
            </span>
            <span className="text-[10px] text-gray-500">
              {formatTime(message.timestamp)}
            </span>
          </div>

          {/* Body */}
          <div className={`text-sm leading-relaxed text-[#ececec] markdown-content ${isUrduScript ? 'urdu-text' : ''}`}>
            {isUser ? (
              <div className="whitespace-pre-wrap">{message.content}</div>
            ) : (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            )}

            {/* Live typing pulse for streaming message */}
            {isStreaming && isLast && !isUser && (
              <span className="inline-block w-2 h-4 ml-1 bg-purple-400 rounded-xs animate-pulse align-middle" />
            )}
          </div>

          {/* Action Bar (Copy, Listen Audio, Feedback) for AI messages */}
          {!isUser && message.content && !isStreaming && (
            <div className="pt-1 flex items-center gap-1.5">
              {/* Listen to Message / Text-to-Speech */}
              <button
                onClick={handleToggleAudio}
                className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded transition-colors ${
                  isPlayingAudio
                    ? 'bg-pink-600/40 text-pink-300 border border-pink-500/30 animate-pulse'
                    : 'text-gray-400 hover:text-pink-300 bg-[#2b2b2b] hover:bg-[#353535]'
                }`}
                title={isPlayingAudio ? "Stop speaking" : "Listen to answer (Text-to-Speech)"}
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

              {/* Copy */}
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-200 bg-[#2b2b2b] hover:bg-[#353535] px-2 py-0.5 rounded transition-colors"
                title="Copy response"
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
                    alert('Thanks for the feedback! 👍');
                  } catch (e) {}
                }}
                className="p-1 text-gray-400 hover:text-green-400 bg-[#2b2b2b] hover:bg-[#353535] rounded transition-colors"
                title="Good response"
              >
                <ThumbsUp className="w-3 h-3" />
              </button>

              {/* Thumbs Down / Improve */}
              <button
                onClick={async () => {
                  const note = prompt('What could be improved about this response? (Optional note for improvement):');
                  if (note !== null) {
                    try {
                      await api.submitFeedback({
                        message_id: message.id || 'msg',
                        conversation_id: message.conversation_id || 'conv',
                        rating: 'thumbs_down',
                        comment: note
                      });
                      alert('Feedback saved for AI tuning! 🛠️');
                    } catch (e) {}
                  }
                }}
                className="p-1 text-gray-400 hover:text-red-400 bg-[#2b2b2b] hover:bg-[#353535] rounded transition-colors"
                title="Needs improvement"
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
