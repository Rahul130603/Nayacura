/**
 * Speech synthesis & audio utilities for Naya AI Voice Mode
 */

export function cleanSpeechText(text: string): string {
  return text
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    // Remove markdown headers
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold and italic markers
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Remove links [title](url) -> title
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove bullet points / lists
    .replace(/^[\s]*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    // Remove blockquotes
    .replace(/^>\s+/gm, '')
    // Remove horizontal rules
    .replace(/^-{3,}$/gm, '')
    // Replace double newlines with pauses
    .replace(/\n\s*\n/g, '. ')
    .replace(/\n/g, ' ')
    // Remove excessive punctuation/symbols
    .replace(/[#*_~`]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

const FEMALE_VOICE_KEYWORDS = [
  'female',
  'zira',
  'jenny',
  'samantha',
  'victoria',
  'karen',
  'aria',
  'neerja',
  'heera',
  'swara',
  'pallavi',
  'siri',
  'ava',
  'allison',
  'olivia',
  'catherine',
  'hazel',
  'susan',
  'serena',
  'stephanie',
  'google uk english female',
  'google us english',
];

export function getBestFemaleVoice(
  voices: SpeechSynthesisVoice[],
  language: string = 'en',
): SpeechSynthesisVoice | null {
  const locale = language === 'ta' ? 'ta' : 'en';
  const localeVoices = voices.filter((voice) => {
    const voiceLocale = voice.lang.toLowerCase().split(/[-_]/)[0];
    return voiceLocale === locale && !/\bmale\b/i.test(voice.name);
  });
  const femaleVoices = localeVoices.filter((voice) =>
    FEMALE_VOICE_KEYWORDS.some((keyword) => voice.name.toLowerCase().includes(keyword)),
  );
  // Some browsers expose a Tamil voice under a language-only name.
  const candidates = femaleVoices.length || locale !== 'ta' ? femaleVoices : localeVoices;
  return candidates.find((voice) => /natural|online/i.test(voice.name)) ??
    candidates.find((voice) => /[-_]in$/i.test(voice.lang)) ?? candidates[0] ?? null;
}

export interface SpeakOptions {
  language?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: unknown) => void;
  rate?: number;
  pitch?: number;
}

export function speakFemaleVoice(
  rawText: string,
  options: SpeakOptions = {},
): { stop: () => void } {
  const synth = window.speechSynthesis;
  const clean = cleanSpeechText(rawText);
  let finished = false;
  let voiceTimer: number | undefined;

  const cleanup = () => {
    window.clearTimeout(voiceTimer);
    synth?.removeEventListener('voiceschanged', trySpeak);
  };

  const finish = (error?: unknown) => {
    if (finished) return;
    finished = true;
    cleanup();
    if (error) options.onError?.(error);
    options.onEnd?.();
  };

  function trySpeak() {
    if (finished) return;
    const voice = getBestFemaleVoice(synth.getVoices(), options.language);
    if (!voice) return;
    cleanup();
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.pitch = options.pitch ?? 1;
    utterance.rate = options.rate ?? 0.96;
    utterance.onstart = () => {
      if (!finished) options.onStart?.();
    };
    utterance.onend = () => finish();
    utterance.onerror = (event) => finish(event);
    try {
      synth.speak(utterance);
    } catch (error) {
      finish(error);
    }
  }

  if (!synth || !clean) {
    queueMicrotask(() => finish(new Error('Speech playback unavailable')));
  } else {
    synth.cancel();
    synth.addEventListener('voiceschanged', trySpeak);
    voiceTimer = window.setTimeout(() => finish(new Error('voice-unavailable')), 1200);
    trySpeak();
  }

  return {
    stop: () => {
      finished = true;
      cleanup();
      synth?.cancel();
    },
  };
}

/**
 * Creates a Web Audio analyser to measure mic volume level (0 to 1)
 */
export function createAudioLevelMeter(stream: MediaStream): {
  getLevel: () => number;
  destroy: () => void;
} {
  try {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) {
      return { getLevel: () => 0, destroy: () => {} };
    }

    const audioCtx = new AudioContextClass();
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.5;

    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);

    const buffer = new Uint8Array(analyser.frequencyBinCount);

    return {
      getLevel: () => {
        analyser.getByteFrequencyData(buffer);
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
          sum += buffer[i];
        }
        const average = sum / buffer.length;
        // Normalize 0 to 1 with a slight dynamic curve
        return Math.min(Math.max((average - 8) / 72, 0), 1);
      },
      destroy: () => {
        try {
          source.disconnect();
          analyser.disconnect();
          void audioCtx.close();
        } catch {
          /* ignore */
        }
      },
    };
  } catch {
    return { getLevel: () => 0, destroy: () => {} };
  }
}
