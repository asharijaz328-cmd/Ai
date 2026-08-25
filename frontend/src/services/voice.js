// Billa AI - Voice Input & Text-to-Speech Engine

// 1. Text-to-Speech (Speaker)
export const playSpeech = (text, onStart, onEnd, onError) => {
  if (!('speechSynthesis' in window)) {
    alert("Aapke browser mein Text-to-Speech support nahi hai.");
    return false;
  }

  // Stop any ongoing speech first
  window.speechSynthesis.cancel();

  // Clean Markdown formatting, emojis, and symbols for natural voice
  const cleanText = text
    .replace(/[*_#`~>[\]()]/g, ' ')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .trim();

  if (!cleanText) return false;

  const utterance = new SpeechSynthesisUtterance(cleanText);

  // Find best natural voice (Urdu > Hindi > Indian English > UK/US English)
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = 
    voices.find(v => v.lang.startsWith('ur')) ||
    voices.find(v => v.lang.startsWith('hi')) ||
    voices.find(v => v.lang.includes('IN') && (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('google'))) ||
    voices.find(v => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('samantha')) ||
    voices[0];

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  utterance.rate = 0.95; // Warm, natural cadence
  utterance.pitch = 1.05; // Slightly friendly tone

  utterance.onstart = () => {
    if (onStart) onStart();
  };

  utterance.onend = () => {
    if (onEnd) onEnd();
  };

  utterance.onerror = (err) => {
    if (onError) onError(err);
  };

  window.speechSynthesis.speak(utterance);
  return true;
};

export const stopSpeech = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

// 2. Speech-to-Text (Microphone)
export const createSpeechRecognizer = ({ lang = 'ur-PK', onResult, onEnd, onError }) => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = lang; // 'ur-PK' (Urdu Pakistan) or 'en-US' / 'hi-IN'

  recognition.onresult = (event) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }

    if (onResult) {
      onResult({
        final: finalTranscript,
        interim: interimTranscript,
        full: (finalTranscript + ' ' + interimTranscript).trim()
      });
    }
  };

  recognition.onend = () => {
    if (onEnd) onEnd();
  };

  recognition.onerror = (event) => {
    if (onError) onError(event);
  };

  return recognition;
};
