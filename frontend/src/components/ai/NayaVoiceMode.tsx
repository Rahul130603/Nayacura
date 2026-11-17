import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Plus, X, Sparkles, Volume2, AlertCircle } from 'lucide-react';
import { NayaVoiceOrb, type VoiceOrbState } from './NayaVoiceOrb';
import { cleanSpeechText, speakFemaleVoice } from '@/lib/voice';
import { api, ApiError, type ChatLanguage } from '@/lib/api';

interface NayaVoiceModeProps {
  isOpen: boolean;
  onClose: () => void;
  language: ChatLanguage;
  onSendQuery: (text: string, signal: AbortSignal) => Promise<string>;
  onVoiceMessageLogged?: (userText: string, assistantText: string) => void;
}

export function NayaVoiceMode({
  isOpen,
  onClose,
  language,
  onSendQuery,
  onVoiceMessageLogged,
}: NayaVoiceModeProps) {
  const [orbState, setOrbState] = useState<VoiceOrbState>('idle');
  const [audioLevel, setAudioLevel] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [userTranscript, setUserTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [assistantSubtitle, setAssistantSubtitle] = useState('');
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const speechSpeakerRef = useRef<{ stop: () => void } | null>(null);
  const isProcessingRef = useRef(false);
  const latestTranscriptRef = useRef('');

  const sendQuery = useRef(onSendQuery);
  const turnRef = useRef<AbortController | null>(null);
  useEffect(() => {
    sendQuery.current = onSendQuery;
  }, [onSendQuery]);

  // Clean shutdown helper
  const stopAllAudio = useCallback(() => {
    turnRef.current?.abort();
    turnRef.current = null;
    latestTranscriptRef.current = '';
    if (speechSpeakerRef.current) {
      speechSpeakerRef.current.stop();
      speechSpeakerRef.current = null;
    }
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    recognition?.abort();
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    isProcessingRef.current = false;
  }, []);

  // Process user speech turn
  const handleUserSpeechTurn = useCallback(
    async (finalText: string) => {
      const textToProcess = finalText.trim();
      if (!textToProcess || isProcessingRef.current) return;

      const turn = new AbortController();
      turnRef.current = turn;
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      isProcessingRef.current = true;
      latestTranscriptRef.current = '';
      setPermissionError(null);
      setUserTranscript(textToProcess);
      setInterimTranscript('');
      setOrbState('thinking');

      // Stop speech recognition while AI is thinking and replying
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          /* ignore */
        }
      }

      try {
        const responseText = await sendQuery.current(textToProcess, turn.signal);
        if (turn.signal.aborted) return;
        if (!responseText) {
          isProcessingRef.current = false;
          startRecognition();
          return;
        }

        setAssistantSubtitle(responseText);

        let usePiper = false;
        const resumeListening = () => {
          if (turn.signal.aborted) return;
          onVoiceMessageLogged?.(textToProcess, responseText);
          isProcessingRef.current = false;
          setUserTranscript('');
          setAssistantSubtitle('');
          startRecognition();
        };

        async function playPiperReply() {
          try {
            const speechLanguage = language === 'ta' ? 'tamil' : 'english';
            const response = await api<Response>('/ai/speech/' + speechLanguage, {
              method: 'POST',
              raw: true,
              signal: turn.signal,
              body: { text: cleanSpeechText(responseText).slice(0, 2400) },
            });
            const blob = await response.blob();
            if (turn.signal.aborted) return;
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            let stopped = false;
            const stop = () => {
              if (stopped) return;
              stopped = true;
              audio.onended = null;
              audio.onerror = null;
              audio.pause();
              URL.revokeObjectURL(url);
            };
            const fail = () => {
              if (stopped) return;
              stop();
              if (turn.signal.aborted) return;
              setPermissionError('Voice audio could not play. The reply is available in chat.');
              resumeListening();
            };
            speechSpeakerRef.current = { stop };
            audio.onended = () => { stop(); resumeListening(); };
            audio.onerror = fail;
            try {
              await audio.play();
              if (!turn.signal.aborted && !audio.ended) setOrbState('speaking');
            } catch {
              fail();
            }
          } catch (error) {
            if (turn.signal.aborted) return;
            setPermissionError(error instanceof ApiError ? error.message : 'Voice audio could not play.');
            resumeListening();
          }
        }

        // Play female voice audio response
        speechSpeakerRef.current = speakFemaleVoice(responseText, {
          language,
          onStart: () => {
            setOrbState('speaking');
          },
          onEnd: () => {
            if (!usePiper) resumeListening();
          },
          onError: () => {
            if (turn.signal.aborted) return;
            if (language === 'tanglish') {
              setPermissionError('Voice playback is unavailable. The reply is available in chat.');
              return;
            }
            usePiper = true;
            void playPiperReply();
          },
        });
      } catch (err) {
        if (turn.signal.aborted) return;
        setPermissionError('Naya could not reply. Please try again.');
        console.error('Voice query failed:', err);
        isProcessingRef.current = false;
        setOrbState('listening');
        startRecognition();
      }
    },
    [isOpen, isMuted, language, onVoiceMessageLogged],
  );

  // Setup SpeechRecognition
  const startRecognition = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setOrbState('idle');
      setPermissionError('Voice speech recognition is not supported in this browser.');
      return;
    }

    setAudioLevel(0);
    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          /* ignore */
        }
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language === 'ta' ? 'ta-IN' : 'en-IN';
      const isCurrent = () => recognitionRef.current === recognition && !isProcessingRef.current;

      recognition.onstart = () => {
        if (!isCurrent()) return;
        setOrbState('listening');
      };

      recognition.onspeechstart = () => {
        if (isCurrent()) setAudioLevel(0.6);
      };
      recognition.onspeechend = () => {
        if (isCurrent()) setAudioLevel(0);
      };

      recognition.onresult = (event: any) => {
        if (!isCurrent()) return;
        let interim = '';
        let final = '';

        for (let i = 0; i < event.results.length; ++i) {
          const transcriptChunk = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcriptChunk + ' ';
          } else {
            interim += transcriptChunk + ' ';
          }
        }

        const combined = (final + interim).trim();
        if (combined) {
          latestTranscriptRef.current = combined;
          setUserTranscript(final || combined);
          setInterimTranscript(interim);

          // Reset silence timer: if user stops speaking for 1.8s, submit query
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }
          silenceTimerRef.current = setTimeout(() => {
            if (latestTranscriptRef.current.trim().length > 1) {
              void handleUserSpeechTurn(latestTranscriptRef.current);
            }
          }, 1800);
        }
      };

      recognition.onerror = (event: any) => {
        if (!isCurrent()) return;
        if (event.error === 'no-speech' || event.error === 'aborted') return;
        recognitionRef.current = null;
        latestTranscriptRef.current = '';
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        setAudioLevel(0);
        setOrbState('idle');
        setPermissionError(
          event.error === 'not-allowed' || event.error === 'service-not-allowed'
            ? 'Allow microphone access in Chrome site settings, then tap the mic to retry.'
            : event.error === 'audio-capture'
              ? 'No microphone is available. Check your input device, then tap the mic to retry.'
              : 'Speech recognition stopped. Tap the mic to retry.',
        );
      };

      recognition.onend = () => {
        // Automatically restart listening if still in voice mode and not processing/speaking
        if (isOpen && isCurrent() && !isMuted) {
          if (latestTranscriptRef.current.trim()) {
            void handleUserSpeechTurn(latestTranscriptRef.current);
            return;
          }
          try {
            recognition.start();
          } catch {
            recognitionRef.current = null;
            setOrbState('idle');
            setPermissionError('Tap the mic to restart listening.');
          }
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      recognitionRef.current = null;
      setOrbState('idle');
      setPermissionError('Could not start speech recognition. Tap the mic to retry.');
      console.warn('Recognition start failed:', e);
    }
  }, [handleUserSpeechTurn, isMuted, isOpen, language]);

  // Initialize microphone & audio meter
  useEffect(() => {
    if (!isOpen) {
      stopAllAudio();
      setOrbState('idle');
      setIsMuted(false);
      setUserTranscript('');
      setInterimTranscript('');
      setAssistantSubtitle('');
      setPermissionError(null);
      return;
    }

    if (isMuted) {
      setOrbState('idle');
      return;
    }
    startRecognition();
    return stopAllAudio;
  }, [isOpen, isMuted, startRecognition, stopAllAudio]);

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
    } else if (!recognitionRef.current && !isProcessingRef.current) {
      setPermissionError(null);
      startRecognition();
    } else {
      stopAllAudio();
      setIsMuted(true);
    }
  };

  // Tap orb to manually trigger / interrupt
  const handleOrbClick = () => {
    if (orbState === 'speaking') {
      turnRef.current?.abort();
      // Interrupt AI speech and listen to user
      if (speechSpeakerRef.current) {
        speechSpeakerRef.current.stop();
        speechSpeakerRef.current = null;
      }
      isProcessingRef.current = false;
      setOrbState('listening');
      setUserTranscript('');
      setAssistantSubtitle('');
      startRecognition();
    } else if (orbState === 'listening' && latestTranscriptRef.current.trim()) {
      // Tap to submit current speech immediately
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      void handleUserSpeechTurn(latestTranscriptRef.current);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-between overflow-hidden bg-gradient-to-b from-[#090514] via-[#0b0717] to-[#080512] text-ivory p-6 sm:p-10 select-none"
      >
        {/* Ambient background glow accents */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[130px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[350px] w-[350px] rounded-full bg-violet-600/10 blur-[110px]" />
        </div>

        {/* Top Header */}
        <div className="relative z-10 flex w-full max-w-4xl items-center justify-between">
          <div className="flex items-center gap-2.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-1.5 backdrop-blur-md">
            <Sparkles className="h-4 w-4 text-rose animate-pulse" />
            <span className="font-serif text-sm font-medium tracking-wide text-ivory">
              Naya Voice Mode
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
            <span className="text-xs uppercase tracking-wider text-mauve/80">
              {language === 'ta' ? 'தமிழ்' : language === 'tanglish' ? 'Tanglish' : 'English Female'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-mauve/70">
            {orbState === 'speaking' && (
              <span className="flex items-center gap-1.5 text-lavender/90">
                <Volume2 className="h-3.5 w-3.5 animate-pulse" />
                Tap orb to interrupt
              </span>
            )}
            {orbState === 'listening' && (
              <span>Speak naturally — Naya is listening</span>
            )}
          </div>
        </div>

        {/* Center: Fluid Animated Orb & Subtitles */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center my-auto w-full max-w-2xl px-4 text-center">
          {/* Morphing Ball Motion */}
          <div
            onClick={handleOrbClick}
            className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
            title={orbState === 'speaking' ? 'Click to interrupt' : orbState === 'listening' ? 'Listening...' : 'Naya Orb'}
          >
            <NayaVoiceOrb
              state={orbState}
              audioLevel={audioLevel}
              size={340}
              className="drop-shadow-[0_20px_50px_rgba(59,130,246,0.3)]"
            />
          </div>

          {/* Status Label & Subtitles */}
          <div className="mt-8 min-h-[90px] flex flex-col items-center justify-center space-y-2 max-w-xl">
            {permissionError ? (
              <div className="flex items-center gap-2 rounded-2xl border border-rose/30 bg-rose/10 px-4 py-2.5 text-sm text-rose">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{permissionError}</span>
              </div>
            ) : orbState === 'listening' ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500" />
                  </span>
                  <span className="text-xs uppercase tracking-widest text-mauve/90 font-medium">
                    Listening...
                  </span>
                </div>
                <p className="text-base sm:text-lg text-ivory/90 font-sans tracking-wide leading-relaxed min-h-[28px]">
                  {interimTranscript || userTranscript ? (
                    <span>
                      “{userTranscript || interimTranscript}”
                    </span>
                  ) : (
                    <span className="text-mauve/50 italic">
                      Start speaking or ask a question about intimacy, health, or specialists...
                    </span>
                  )}
                </p>
              </>
            ) : orbState === 'thinking' ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500" />
                  </span>
                  <span className="text-xs uppercase tracking-widest text-lavender font-medium">
                    Understanding & Thinking...
                  </span>
                </div>
                <p className="text-sm text-mauve/70 italic">
                  Reflecting on guidance for you...
                </p>
              </>
            ) : orbState === 'speaking' ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose" />
                  </span>
                  <span className="text-xs uppercase tracking-widest text-rose font-medium">
                    Naya is speaking
                  </span>
                </div>
                <p className="text-base sm:text-lg text-ivory font-serif tracking-wide leading-relaxed line-clamp-3">
                  “{assistantSubtitle}”
                </p>
              </>
            ) : (
              <div className="text-xs uppercase tracking-widest text-mauve/60">
                {isMuted ? 'Microphone Muted' : 'Ready'}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar — ChatGPT Voice Pill Design */}
        <div className="relative z-10 w-full max-w-lg mb-2">
          <div className="flex items-center justify-between rounded-full border border-white/[0.15] bg-white/[0.08] backdrop-blur-2xl px-5 py-3 shadow-[0_15px_35px_rgba(0,0,0,0.5)] transition-all">
            {/* + Type button (exits voice mode and focuses text chat) */}
            <button
              type="button"
              onClick={onClose}
              className="group flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-all"
            >
              <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
              <span>Type</span>
            </button>

            {/* Status indicator in middle */}
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-white/70">
              <span
                className={`h-2 w-2 rounded-full ${
                  orbState === 'listening'
                    ? 'bg-sky-400 animate-pulse'
                    : orbState === 'thinking'
                    ? 'bg-purple-400 animate-pulse'
                    : orbState === 'speaking'
                    ? 'bg-rose animate-pulse'
                    : 'bg-white/30'
                }`}
              />
              <span className="capitalize">{orbState}</span>
            </div>

            {/* Right Controls: Mute toggle + Close button */}
            <div className="flex items-center gap-3">
              {/* Mute toggle button */}
              <button
                type="button"
                onClick={toggleMute}
                className={`grid h-10 w-10 place-items-center rounded-full transition-all ${
                  isMuted
                    ? 'bg-rose/20 text-rose border border-rose/30'
                    : 'bg-white/10 hover:bg-white/20 text-white/90'
                }`}
                title={isMuted || orbState === 'idle' ? 'Start microphone' : 'Mute microphone'}
              >
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>

              {/* Close (X) button — Crisp blue circle matching reference image */}
              <button
                type="button"
                onClick={onClose}
                className="grid h-10 w-10 place-items-center rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-lg shadow-blue-600/30 transition-transform hover:scale-105 active:scale-95"
                title="Exit Voice Mode"
              >
                <X className="h-5 w-5 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
