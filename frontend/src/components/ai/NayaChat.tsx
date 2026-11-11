import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowUp,
  Bot,
  Check,
  ChevronRight,
  CircleStop,
  Clock3,
  History,
  Languages,
  Loader2,
  LockKeyhole,
  Plus,
  ShieldAlert,
  Sparkles,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api, streamAi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/layout/Logo';

type ChatMessageUI = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
};
type ConversationSummary = { id: string; title: string; updatedAt: string };

const suggestions = {
  en: [
    'I feel anxious about intimacy. Where do I start?',
    'How do I know if I need a doctor or a counsellor?',
    'Help me find the right specialist for low desire.',
    'What happens in a first consultation?',
  ],
  ta: [
    'உடலுறவு குறித்த பதற்றம் எனக்கு உள்ளது. எங்கு தொடங்குவது?',
    'எனக்கு மருத்துவரா அல்லது ஆலோசகரா தேவை?',
    'குறைந்த பாலியல் விருப்பத்திற்கு சரியான நிபுணரைக் கண்டறிய உதவுங்கள்.',
    'முதல் ஆலோசனையில் என்ன நடக்கும்?',
  ],
};

const greeting = {
  en: {
    title: 'A private place to begin.',
    body: "I'm Naya, an AI wellness companion — not a doctor. I can explain general sexual wellness topics, help you understand consultation options, and guide you to the right kind of specialist. I can't diagnose, prescribe, or promise outcomes.",
  },
  ta: {
    title: 'ஒரு தனிப்பட்ட தொடக்கம்.',
    body: 'நான் நயா — ஓர் AI நலவாழ்வு துணை. நான் மருத்துவர் அல்ல. பொதுவான பாலியல் நலவாழ்வு தகவல்களை விளக்கவும், சரியான நிபுணரைத் தேர்ந்தெடுக்கவும் உதவ முடியும். நோயறிதல், மருந்து பரிந்துரை அல்லது சிகிச்சை உறுதிமொழி என்னால் முடியாது.',
  },
};

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function RichText({ text }: { text: string }) {
  return (
    <div className="space-y-2 font-body text-[13px] leading-[1.75] sm:text-[13.5px]">
      {text.split('\n').map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        const isBullet = /^[-•]\s/.test(line);
        return (
          <p key={i} className={cn(isBullet && 'flex gap-2 pl-1')}>
            {isBullet && <span className="mt-[2px] text-rose">•</span>}
            <span>
              {parts.map((part, j) =>
                part.startsWith('**') && part.endsWith('**') ? (
                  <strong key={j} className="font-semibold text-ivory">
                    {part.slice(2, -2)}
                  </strong>
                ) : (
                  <span key={j}>{part.replace(/^[-•]\s/, '')}</span>
                ),
              )}
            </span>
          </p>
        );
      })}
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1" aria-label="Naya is typing">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-lavender"
          animate={{ opacity: [0.25, 1, 0.25], y: [0, -2, 0] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.16 }}
        />
      ))}
    </span>
  );
}

export function NayaChat({
  variant = 'panel',
  onClose,
}: {
  variant?: 'panel' | 'page';
  onClose?: () => void;
}) {
  const { user } = useAuth();
  const { push } = useToast();
  const [messages, setMessages] = useState<ChatMessageUI[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState<'en' | 'ta'>('en');
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<ConversationSummary[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [clearOpen, setClearOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const isPage = variant === 'page';

  const loadHistory = useCallback(async () => {
    if (!user) return;
    setHistoryLoading(true);
    try {
      const data = await api<{ conversations: ConversationSummary[] }>('/ai/conversations');
      setHistory(data.conversations);
    } catch {
      /* history is non-critical */
    } finally {
      setHistoryLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) void loadHistory();
  }, [user, loadHistory]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, sending]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function resetConversation() {
    abortRef.current?.abort();
    setMessages([]);
    setConversationId(null);
    setInput('');
    setClearOpen(false);
  }

  async function send(text?: string) {
    const message = (text ?? input).trim();
    if (!message || sending) return;
    if (message.length > 2000) {
      push({ title: 'Please shorten your message', description: 'Naya can read up to 2,000 characters at a time.', tone: 'error' });
      return;
    }

    const userMessage: ChatMessageUI = {
      id: uid(),
      role: 'user',
      content: message,
      createdAt: new Date().toISOString(),
    };
    const assistantId = uid();
    setMessages((prev) => [
      ...prev,
      userMessage,
      { id: assistantId, role: 'assistant', content: '', createdAt: new Date().toISOString() },
    ]);
    setInput('');
    setSending(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const id = await streamAi(
        { message, conversationId, language, consent: consent && Boolean(user) },
        (token) => {
          setMessages((prev) =>
            prev.map((item) =>
              item.id === assistantId ? { ...item, content: item.content + token } : item,
            ),
          );
        },
        controller.signal,
      );
      if (id) {
        setConversationId(id);
        void loadHistory();
      }
    } catch (error) {
      if (controller.signal.aborted) return;
      setMessages((prev) =>
        prev.map((item) =>
          item.id === assistantId
            ? {
                ...item,
                content:
                  'I could not reach the wellness service just now. Please try again in a moment. If this is urgent, contact local emergency services or a qualified clinician directly.',
              }
            : item,
        ),
      );
      push({
        title: 'Naya could not respond',
        description: error instanceof Error ? error.message : 'Please try again.',
        tone: 'error',
      });
    } finally {
      setSending(false);
      abortRef.current = null;
    }
  }

  async function loadConversation(id: string) {
    try {
      const data = await api<{
        conversation: { id: string; language: string };
        messages: { id: string; role: string; content: string; createdAt: string }[];
      }>(`/ai/conversations/${id}`);
      setConversationId(data.conversation.id);
      setLanguage(data.conversation.language === 'ta' ? 'ta' : 'en');
      setMessages(
        data.messages.map((m) => ({
          id: m.id,
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content,
          createdAt: m.createdAt,
        })),
      );
      setHistoryOpen(false);
    } catch {
      push({ title: 'Conversation unavailable', tone: 'error' });
    }
  }

  async function deleteConversation(id: string) {
    try {
      await api(`/ai/conversations/${id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      setHistory((prev) => prev.filter((item) => item.id !== id));
      if (conversationId === id) resetConversation();
      push({ title: 'Conversation deleted', tone: 'success' });
    } catch {
      push({ title: 'Could not delete conversation', tone: 'error' });
    }
  }

  const hasMessages = messages.length > 0;

  return (
    <div
      className={cn(
        'relative flex min-h-0 flex-1 flex-col overflow-hidden',
        isPage ? 'rounded-[28px] border border-white/[0.09] bg-plum/40' : '',
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] px-4 py-3.5 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          {isPage ? <Logo /> : null}
          {!isPage && (
            <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full border border-lavender/25 bg-gradient-to-br from-royal/50 to-burgundy/60">
              <Sparkles className="h-4 w-4 text-rose" />
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-plum bg-lavender" />
            </div>
          )}
          <div className={cn(isPage && 'ml-1 min-w-0')}>
            <div className="flex items-center gap-2">
              <p className="truncate font-sans text-[13px] font-semibold text-ivory">
                {isPage ? 'Naya AI' : 'Naya AI — Private Wellness Companion'}
              </p>
              <span className="rounded-full border border-lavender/20 bg-lavender/[0.08] px-1.5 py-0.5 font-sans text-[8px] font-semibold uppercase tracking-wider text-lavender">
                AI
              </span>
            </div>
            <p className="mt-0.5 flex items-center gap-1.5 font-body text-[10px] text-mauve">
              <LockKeyhole className="h-2.5 w-2.5" />
              {user ? 'Private to your account' : 'Guest session — not stored'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {user && (
            <button
              type="button"
              onClick={() => {
                setHistoryOpen((v) => !v);
                if (!historyOpen) void loadHistory();
              }}
              aria-label="Conversation history"
              aria-expanded={historyOpen}
              className={cn(
                'grid h-8 w-8 place-items-center rounded-full text-mauve transition-colors hover:bg-white/10 hover:text-ivory',
                historyOpen && 'bg-white/10 text-ivory',
              )}
            >
              <History className="h-4 w-4" />
            </button>
          )}
          {hasMessages && (
            <button
              type="button"
              onClick={() => setClearOpen(true)}
              aria-label="Clear this conversation"
              className="grid h-8 w-8 place-items-center rounded-full text-mauve transition-colors hover:bg-white/10 hover:text-rose"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Naya AI"
              className="grid h-8 w-8 place-items-center rounded-full text-mauve transition-colors hover:bg-white/10 hover:text-ivory"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {historyOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-white/[0.08] bg-midnight/40"
          >
            <div className="max-h-52 overflow-y-auto p-2" data-lenis-prevent>
              <button
                type="button"
                onClick={resetConversation}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left font-sans text-[11px] font-semibold text-lavender transition-colors hover:bg-white/[0.05]"
              >
                <Plus className="h-3.5 w-3.5" /> New conversation
              </button>
              {historyLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin text-mauve" />
                </div>
              ) : history.length === 0 ? (
                <p className="px-3 py-5 font-body text-[11px] leading-relaxed text-mauve">
                  No stored conversations yet. Turn on “Remember this conversation” before you
                  send a message to keep a history.
                </p>
              ) : (
                history.map((item) => (
                  <div key={item.id} className="group flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => void loadConversation(item.id)}
                      className="min-w-0 flex-1 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/[0.05]"
                    >
                      <p className="truncate font-sans text-[11.5px] text-ivory/85">{item.title}</p>
                      <p className="mt-0.5 font-body text-[9.5px] text-mauve">
                        {new Date(item.updatedAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(item.id)}
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-mauve/60 opacity-0 transition-all hover:bg-rose/10 hover:text-rose group-hover:opacity-100"
                      aria-label={`Delete conversation ${item.title}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div
        ref={scrollRef}
        className={cn(
          'min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5',
          isPage ? 'min-h-[420px]' : 'max-h-[46vh] sm:max-h-[430px]',
        )}
        data-lenis-prevent
        aria-live="polite"
      >
        {!hasMessages ? (
          <div className="flex flex-col justify-center py-3">
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl border border-lavender/20 bg-gradient-to-br from-royal/40 to-burgundy/50">
              <Sparkles className="h-5 w-5 text-rose" />
            </div>
            <h2 className="font-display text-[27px] leading-tight text-ivory sm:text-[30px]">
              {greeting[language].title}
            </h2>
            <p className="mt-3 font-body text-[12.5px] leading-[1.75] text-mauve">
              {greeting[language].body}
            </p>

            <div className="mt-5 space-y-2">
              {suggestions[language].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => void send(suggestion)}
                  className="group flex w-full items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] px-3.5 py-3 text-left transition-all hover:border-lavender/30 hover:bg-lavender/[0.05]"
                >
                  <span className="font-body text-[11.5px] leading-relaxed text-ivory/75">
                    {suggestion}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-mauve transition-transform group-hover:translate-x-0.5 group-hover:text-lavender" />
                </button>
              ))}
            </div>

            {user ? (
              <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-white/[0.08] p-3.5 transition-colors hover:border-lavender/25">
                <span
                  className={cn(
                    'mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border transition-colors',
                    consent
                      ? 'border-lavender bg-lavender text-midnight'
                      : 'border-white/25 bg-transparent',
                  )}
                >
                  {consent && <Check className="h-3 w-3" strokeWidth={3} />}
                </span>
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="sr-only"
                />
                <span>
                  <span className="block font-sans text-[10.5px] font-semibold text-ivory">
                    Remember this conversation
                  </span>
                  <span className="mt-0.5 block font-body text-[10px] leading-relaxed text-mauve">
                    I consent to Nayacura storing this sensitive conversation in my private account
                    so I can return to it. I can delete it at any time.
                  </span>
                </span>
              </label>
            ) : (
              <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5">
                <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-lavender" />
                <p className="font-body text-[10.5px] leading-relaxed text-mauve">
                  You are chatting as a guest. This conversation is held only in this browser
                  session and is not saved to an account. Sign in to store and manage your history.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-2.5',
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row',
                )}
              >
                <div
                  className={cn(
                    'mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border',
                    message.role === 'user'
                      ? 'border-rose/25 bg-rose/10 text-rose'
                      : 'border-lavender/25 bg-lavender/[0.08] text-lavender',
                  )}
                >
                  {message.role === 'user' ? (
                    <UserRound className="h-3.5 w-3.5" />
                  ) : (
                    <Bot className="h-3.5 w-3.5" />
                  )}
                </div>
                <div
                  className={cn(
                    'max-w-[86%] rounded-2xl px-3.5 py-3',
                    message.role === 'user'
                      ? 'rounded-tr-sm bg-gradient-to-br from-burgundy/80 to-royal/50 text-ivory'
                      : 'rounded-tl-sm border border-white/[0.07] bg-white/[0.045] text-ivory/85',
                  )}
                >
                  {message.role === 'assistant' && !message.content ? (
                    <TypingDots />
                  ) : (
                    <RichText text={message.content} />
                  )}
                </div>
              </div>
            ))}
            {sending && messages[messages.length - 1]?.content && (
              <div className="flex items-center gap-2 pl-10 font-body text-[9.5px] text-mauve">
                <TypingDots /> Naya is reflecting
              </div>
            )}
          </div>
        )}
      </div>

      {/* Composer + safety */}
      <div className="border-t border-white/[0.08] px-3 pb-3 pt-3 sm:px-4">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1 pb-2">
          <button
            type="button"
            onClick={() => setLanguage((l) => (l === 'en' ? 'ta' : 'en'))}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1 font-sans text-[9px] font-semibold uppercase tracking-wider text-mauve transition-colors hover:border-lavender/25 hover:text-lavender"
            aria-label={`Switch language to ${language === 'en' ? 'Tamil' : 'English'}`}
          >
            <Languages className="h-3 w-3" />
            {language === 'en' ? 'English · தமிழ்' : 'தமிழ் · English'}
          </button>
          <span className="inline-flex items-center gap-1 font-body text-[8.5px] text-mauve/60">
            <ShieldAlert className="h-2.5 w-2.5" /> Not for emergencies
          </span>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
          className="relative flex items-end gap-2 rounded-2xl border border-white/10 bg-white/[0.045] p-1.5 transition-colors focus-within:border-lavender/45"
        >
          <label htmlFor="naya-input" className="sr-only">
            Message Naya AI
          </label>
          <textarea
            id="naya-input"
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            maxLength={2000}
            placeholder={language === 'en' ? 'Ask Naya something private…' : 'நயாவிடம் தனிப்பட்டதாகக் கேளுங்கள்…'}
            className="max-h-[120px] min-h-[40px] flex-1 resize-none bg-transparent px-2.5 py-2.5 font-body text-[12.5px] leading-relaxed text-ivory placeholder:text-mauve/55 focus:outline-none"
          />
          {sending ? (
            <button
              type="button"
              onClick={() => abortRef.current?.abort()}
              className="mb-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-ivory transition-colors hover:bg-white/15"
              aria-label="Stop generating response"
            >
              <CircleStop className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="mb-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-rose to-lavender text-midnight transition-all hover:brightness-105 disabled:opacity-30"
              aria-label="Send message"
            >
              <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
            </button>
          )}
        </form>
        <p className="mt-2 px-1 text-center font-body text-[8.5px] leading-relaxed text-mauve/55">
          Naya is AI, not a clinician. It cannot diagnose, prescribe, or replace a consultation.
          Emergency? Call local emergency services or Tele-MANAS on{' '}
          <a href="tel:14416" className="text-lavender underline decoration-lavender/40">
            14416
          </a>
          .
        </p>
      </div>

      {/* Full page: back link / safety warning */}
      {isPage && (
        <div className="hidden border-t border-white/[0.06] px-5 py-3 sm:flex sm:items-center sm:justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 font-sans text-[10px] uppercase tracking-[0.16em] text-mauve hover:text-ivory"
          >
            <ArrowLeft className="h-3 w-3" /> Return to Nayacura
          </Link>
          <span className="inline-flex items-center gap-1.5 font-body text-[9.5px] text-mauve/60">
            <Clock3 className="h-3 w-3" /> Streaming AI · demo fallback when API not configured
          </span>
        </div>
      )}

      <Modal
        open={clearOpen}
        onClose={() => setClearOpen(false)}
        title="Clear this conversation?"
        description="This removes the messages from this screen and deletes any stored copy from your account. This cannot be undone."
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => setClearOpen(false)}>
            Keep conversation
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              if (conversationId) await deleteConversation(conversationId);
              else resetConversation();
              setClearOpen(false);
            }}
            icon={<Trash2 className="h-4 w-4" />}
          >
            Clear conversation
          </Button>
        </div>
      </Modal>

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete stored conversation?"
        description="This permanently removes the conversation from your Nayacura account."
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => deleteTarget && void deleteConversation(deleteTarget)}
            icon={<Trash2 className="h-4 w-4" />}
          >
            Delete permanently
          </Button>
        </div>
      </Modal>
    </div>
  );
}
