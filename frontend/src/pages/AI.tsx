import { useState, useRef, useEffect, useCallback, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowUp,
  Bookmark,
  Bot,
  Check,
  ChevronDown,
  CircleStop,
  Clock,
  Copy,
  ExternalLink,
  Filter,
  Languages,
  Loader2,
  Lock,
  LockKeyhole,
  Menu,
  Mic,
  MicOff,
  PanelLeft,
  PanelLeftClose,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  User,
  UserRound,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Seo } from '@/components/Seo';
import { api, streamAi, type AiSource, type ChatLanguage } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { NayaVoiceMode } from '@/components/ai/NayaVoiceMode';

type ChatMessageUI = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  sources?: AiSource[];
};

type ConversationSummary = { id: string; title: string; updatedAt: string };

type ModelMode = 'Naya Care' | 'Clinical Reason' | 'Relationship Guide';

const suggestionsByLang = {
  en: [
    { text: 'I feel anxious about intimacy. Where do I start?', icon: Stethoscope },
    { text: 'How do I know if I need a doctor or a counsellor?', icon: UserRound },
    { text: 'Help me find the right specialist for low desire.', icon: Sparkles },
    { text: 'What happens in a first confidential consultation?', icon: Clock },
  ],
  ta: [
    { text: 'உடலுறவு குறித்த பதற்றம் எனக்கு உள்ளது. எங்கு தொடங்குவது?', icon: Stethoscope },
    { text: 'எனக்கு மருத்துவர் தேவையா அல்லது ஆலோசகரா?', icon: UserRound },
    { text: 'குறைந்த பாலியல் விருப்பத்திற்கு சரியான நிபுணரை அறிய உதவுங்கள்.', icon: Sparkles },
    { text: 'முதல் ஆலோசனையில் என்ன நடக்கும்?', icon: Clock },
  ],
  tanglish: [
    { text: 'Intimacy pathi anxiety irukku. Enga start pannalaam?', icon: Stethoscope },
    { text: 'Doctor-a paakanuma illa counsellor-a?', icon: UserRound },
    { text: 'Low desire-ku endha specialist-a paakanum?', icon: Sparkles },
    { text: 'First consultation-la enna nadakkum?', icon: Clock },
  ],
};

const greetings = {
  en: 'Your Space Your Conversation',
  ta: 'எங்கு தொடங்கலாம்?',
  tanglish: 'Enga start pannalaam?',
};

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function RichText({ text }: { text: string }) {
  return (
    <div className="space-y-2.5 font-body text-[14px] leading-[1.8] text-ivory/90 sm:text-[14.5px]">
      {text.split('\n').map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1.5" />;
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        const isBullet = /^[-•*]\s/.test(line);
        return (
          <p key={i} className={cn(isBullet && 'flex items-start gap-2 pl-2')}>
            {isBullet && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose" />}
            <span>
              {parts.map((part, j) =>
                part.startsWith('**') && part.endsWith('**') ? (
                  <strong key={j} className="font-semibold text-ivory">
                    {part.slice(2, -2)}
                  </strong>
                ) : (
                  <span key={j}>{part.replace(/^[-•*]\s/, '')}</span>
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
    <span className="inline-flex items-center gap-1.5 py-1" aria-label="Naya is thinking">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-2 w-2 rounded-full bg-lavender"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18 }}
        />
      ))}
    </span>
  );
}

export default function AI() {
  const { user } = useAuth();
  const { push } = useToast();

  // Core state
  const [messages, setMessages] = useState<ChatMessageUI[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState<ChatLanguage>('en');
  const [selectedModel, setSelectedModel] = useState<ModelMode>('Naya Care');
  const [activeTab, setActiveTab] = useState<'chat' | 'task'>('chat');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchActive, setSearchActive] = useState(false);

  // History & API state
  const [history, setHistory] = useState<ConversationSummary[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [consent] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [safetyModalOpen, setSafetyModalOpen] = useState(false);
  const [libraryModalOpen, setLibraryModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceModeOpen, setVoiceModeOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<any>(null);

  const loadHistory = useCallback(async () => {
    if (!user) return;
    setHistoryLoading(true);
    try {
      const data = await api<{ conversations: ConversationSummary[] }>('/ai/conversations');
      setHistory(data.conversations);
    } catch {
      /* non-critical */
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
    document.body.classList.add('fullscreen-app');
    inputRef.current?.focus();
    return () => {
      document.body.classList.remove('fullscreen-app');
    };
  }, []);

  // Speech Recognition Setup
  const toggleListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      push({
        title: 'Speech not supported',
        description: 'Speech recognition is not supported in this browser.',
        tone: 'error',
      });
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'ta' ? 'ta-IN' : 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  function resetToNewChat() {
    abortRef.current?.abort();
    setMessages([]);
    setConversationId(null);
    setInput('');
    setClearModalOpen(false);
    inputRef.current?.focus();
  }

  const handleSendVoiceQuery = async (queryText: string, signal: AbortSignal): Promise<string> => {
    let answer = '';
    let replySources: AiSource[] | undefined;
    const newConvId = await streamAi(
      { message: queryText, conversationId, language, consent: Boolean(user && consent), voice: true },
      (token) => { answer += token; },
      signal,
      (sources) => { replySources = sources; },
    );
    if (signal.aborted || !answer.trim()) return '';
    const createdAt = new Date().toISOString();
    setMessages((previous) => [
      ...previous,
      { id: uid(), role: 'user', content: queryText, createdAt },
      { id: uid(), role: 'assistant', content: answer, createdAt, sources: replySources },
    ]);
    if (newConvId) setConversationId(newConvId);
    void loadHistory();
    return answer;
  };

  async function send(text?: string) {
    const message = (text ?? input).trim();
    if (!message || sending) return;
    if (message.length > 2000) {
      push({
        title: 'Message too long',
        description: 'Naya can read up to 2,000 characters at a time.',
        tone: 'error',
      });
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
        { message, conversationId, language, consent: Boolean(user) },
        (token) => {
          setMessages((prev) =>
            prev.map((item) =>
              item.id === assistantId ? { ...item, content: item.content + token } : item,
            ),
          );
        },
        controller.signal,
        (sources) =>
          setMessages((prev) =>
            prev.map((item) => (item.id === assistantId ? { ...item, sources } : item)),
          ),
      );
      if (id) {
        setConversationId(id);
      }
      void loadHistory();
    } catch (err) {
      if (controller.signal.aborted) return;
      setMessages((prev) =>
        prev.map((item) =>
          item.id === assistantId
            ? {
                ...item,
                content:
                  'I could not reach the clinical wellness service just now. Please try again in a moment. If this is an emergency, contact emergency medical services or a licensed doctor directly.',
              }
            : item,
        ),
      );
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
      const savedLang = data.conversation.language;
      setLanguage(savedLang === 'ta' || savedLang === 'tanglish' ? savedLang : 'en');
      setMessages(
        data.messages.map((m) => ({
          id: m.id,
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content,
          createdAt: m.createdAt,
        })),
      );
    } catch {
      push({ title: 'Could not load conversation', tone: 'error' });
    }
  }

  async function deleteConversation(id: string) {
    try {
      await api(`/ai/conversations/${id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      setHistory((prev) => prev.filter((item) => item.id !== id));
      if (conversationId === id) resetToNewChat();
      push({ title: 'Conversation deleted', tone: 'success' });
    } catch {
      push({ title: 'Could not delete conversation', tone: 'error' });
    }
  }

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredHistory = history.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const hasMessages = messages.length > 0;

  return (
    <>
      <Seo
        title="Naya AI — Private Clinical Wellness Companion"
        description="A private, confidential AI companion for sensitive sexual health and relationship questions. Modeled for peace of mind."
        path="/ai"
      />

      <div id="ai-workspace" className="relative flex h-dvh w-full overflow-hidden bg-midnight font-sans text-ivory">
        {/* ================= LEFT SIDEBAR (Gemini Style) ================= */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/[0.08] bg-[#0c0814] transition-all duration-300 ease-in-out lg:static',
            sidebarOpen ? 'w-[260px]' : 'w-0 -translate-x-full lg:w-0 lg:translate-x-0',
          )}
        >
          <div className="flex h-full w-[260px] flex-col overflow-hidden">
            {/* Sidebar Top: Logo + Controls */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.06]">
              <Link to="/ai" onClick={resetToNewChat} className="flex items-center gap-2 group">
                <img
                  src="/images/nayacura-logo.png"
                  alt="Nayacura"
                  className="h-6 w-auto object-contain brightness-110"
                />
                <span className="rounded bg-lavender/20 px-1.5 py-0.5 font-sans text-[10px] font-bold uppercase tracking-wider text-lavender">
                  AI
                </span>
              </Link>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSearchActive(!searchActive)}
                  className="rounded-lg p-1.5 text-mauve hover:bg-white/[0.06] hover:text-ivory transition-colors"
                  title="Search chats"
                >
                  <Search className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="rounded-lg p-1.5 text-mauve hover:bg-white/[0.06] hover:text-ivory transition-colors"
                  title="Collapse sidebar"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Sidebar "+ New chat" Button */}
            <div className="p-3">
              <button
                type="button"
                onClick={resetToNewChat}
                className="flex w-full items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-left font-sans text-xs font-semibold text-ivory transition-all hover:border-lavender/40 hover:bg-white/[0.08] shadow-sm"
              >
                <Plus className="h-4 w-4 text-lavender" />
                <span>New chat</span>
              </button>
            </div>

            {/* Quick Links List */}
            <div className="px-3 py-1 space-y-0.5 border-b border-white/[0.06]">
              <button
                type="button"
                onClick={() => setLibraryModalOpen(true)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left font-sans text-xs text-mauve hover:bg-white/[0.04] hover:text-ivory transition-colors"
              >
                <Bookmark className="h-3.5 w-3.5 text-lavender" />
                <span>Library & Insights</span>
              </button>
              <Link
                to="/doctors"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left font-sans text-xs text-mauve hover:bg-white/[0.04] hover:text-ivory transition-colors"
              >
                <Stethoscope className="h-3.5 w-3.5 text-rose" />
                <span>Find Specialists</span>
              </Link>
              <button
                type="button"
                onClick={() => setSafetyModalOpen(true)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left font-sans text-xs text-mauve hover:bg-white/[0.04] hover:text-ivory transition-colors"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-lavender" />
                <span>Clinical Safety</span>
              </button>
            </div>

            {/* Search input (if toggled) */}
            {searchActive && (
              <div className="px-3 pt-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-mauve/60" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search recent conversations..."
                    className="w-full rounded-lg border border-white/10 bg-white/[0.03] pl-8 pr-2.5 py-1.5 font-body text-xs text-ivory placeholder:text-mauve/50 focus:border-lavender/50 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Chat History List */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1" data-lenis-prevent>
              <div className="flex items-center justify-between px-2 py-1.5 text-[11px] font-sans font-semibold uppercase tracking-[0.14em] text-mauve/70">
                <span>Recent Chats</span>
                <Filter className="h-3 w-3" />
              </div>

              {historyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-4 w-4 animate-spin text-mauve" />
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="px-2 py-6 text-center">
                  <p className="text-[11px] text-mauve/60">No stored conversations</p>
                  <p className="mt-1 text-[10px] text-mauve/40">
                    Your conversations appear here when saved to your account.
                  </p>
                </div>
              ) : (
                filteredHistory.map((item) => {
                  const isActive = conversationId === item.id;
                  return (
                    <div key={item.id} className="group relative flex items-center">
                      <button
                        type="button"
                        onClick={() => void loadConversation(item.id)}
                        className={cn(
                          'flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-sans text-xs transition-colors pr-8 truncate',
                          isActive
                            ? 'bg-white/[0.09] text-ivory font-medium'
                            : 'text-mauve hover:bg-white/[0.04] hover:text-ivory',
                        )}
                      >
                        <span className="truncate">{item.title}</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(item.id);
                        }}
                        className="absolute right-1.5 p-1 text-mauve/40 hover:text-rose transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete chat"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Sidebar Bottom: User Profile */}
            <div className="border-t border-white/[0.06] p-3">
              <div className="flex items-center justify-between rounded-xl p-2 hover:bg-white/[0.03] transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-royal/60 to-rose/50 font-sans text-xs font-bold text-ivory">
                    {user?.name ? user.name[0].toUpperCase() : 'P'}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-sans text-xs font-semibold text-ivory">
                      {user?.name || 'Private Guest'}
                    </p>
                    <p className="truncate font-sans text-[10px] text-mauve/60">
                      {user ? 'Nayacura Member' : 'Guest Session'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSafetyModalOpen(true)}
                  className="rounded-lg p-1.5 text-mauve hover:bg-white/[0.06] hover:text-ivory transition-colors"
                  title="Settings & Privacy"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Backdrop for mobile sidebar */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ================= MAIN CHAT WORKSPACE ================= */}
        <div className="relative flex flex-1 flex-col overflow-hidden bg-gradient-to-b from-[#11091a]/40 via-midnight to-midnight">
          {/* Top Navbar */}
          <header className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5 sm:px-6">
            <div className="flex items-center gap-3">
              {!sidebarOpen && (
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className="rounded-lg p-1.5 text-mauve hover:bg-white/[0.06] hover:text-ivory transition-colors"
                  title="Expand sidebar"
                >
                  <PanelLeft className="h-4 w-4" />
                </button>
              )}
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-mauve hover:text-ivory transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Nayacura
              </Link>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Model Mode Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                  className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-sans text-xs text-ivory hover:border-white/20 transition-colors"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-lavender" />
                  <span>{selectedModel}</span>
                  <ChevronDown className="h-3 w-3 text-mauve" />
                </button>

                {modelDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-52 rounded-2xl border border-white/15 bg-[#170c24] p-1.5 shadow-2xl z-30">
                    {(['Naya Care', 'Clinical Reason', 'Relationship Guide'] as ModelMode[]).map(
                      (mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => {
                            setSelectedModel(mode);
                            setModelDropdownOpen(false);
                          }}
                          className={cn(
                            'flex w-full items-center justify-between rounded-xl px-3 py-2 text-left font-sans text-xs transition-colors',
                            selectedModel === mode
                              ? 'bg-lavender/15 text-lavender font-medium'
                              : 'text-ivory hover:bg-white/[0.05]',
                          )}
                        >
                          <span>{mode}</span>
                          {selectedModel === mode && <Check className="h-3.5 w-3.5" />}
                        </button>
                      ),
                    )}
                  </div>
                )}
              </div>

              {/* Language Switcher */}
              <div className="flex items-center rounded-full border border-white/10 bg-white/[0.03] p-0.5 text-xs text-mauve">
                {(['en', 'ta', 'tanglish'] as ChatLanguage[]).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setLanguage(lang)}
                    className={cn(
                      'rounded-full px-2.5 py-1 text-[11px] font-sans transition-all',
                      language === lang
                        ? 'bg-lavender/20 text-lavender font-semibold shadow-sm'
                        : 'hover:text-ivory',
                    )}
                  >
                    {lang === 'en' ? 'English' : lang === 'ta' ? 'தமிழ்' : 'Tanglish'}
                  </button>
                ))}
              </div>

              {/* Consultation Link */}
              <Link
                to="/book"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-lavender/30 bg-gradient-to-r from-rose/20 to-lavender/20 px-3.5 py-1 font-sans text-xs font-semibold text-ivory hover:border-lavender/60 transition-all"
              >
                Book a doctor ↗
              </Link>
            </div>
          </header>

          {/* ================= CHAT STREAM OR ZERO-STATE ================= */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-6 sm:px-8"
            data-lenis-prevent
          >
            {!hasMessages ? (
              /* ================= ZERO STATE: GEMINI MODEL ================= */
              <div className="flex min-h-[calc(100dvh-130px)] flex-col items-center justify-center max-w-2xl mx-auto py-8 text-center animate-fade-up">
                {/* Greeting Title */}
                <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-sans font-normal tracking-tight text-ivory mb-7">
                  {greetings[language]}
                </h1>

                {/* Gemini Signature Prompt Capsule */}
                <div className="w-full rounded-full border border-white/15 bg-[#170e22] px-4 py-2 sm:py-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.55)] transition-all focus-within:border-lavender/60 focus-within:bg-[#1c112a] hover:border-white/25">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void send();
                    }}
                    className="flex items-center gap-2"
                  >
                    <button
                      type="button"
                      onClick={() => setLibraryModalOpen(true)}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-mauve hover:bg-white/10 hover:text-ivory transition-colors"
                      title="Attach or explore library"
                    >
                      <Plus className="h-5 w-5" />
                    </button>

                    <input
                      ref={inputRef as any}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={
                        language === 'tanglish'
                          ? 'Ask Naya something private...'
                          : language === 'ta'
                            ? 'நயாவிடம் தனிப்பட்டதாகக் கேளுங்கள்...'
                            : 'Ask Naya...'
                      }
                      className="flex-1 bg-transparent px-2 font-body text-sm sm:text-base text-ivory placeholder:text-mauve/50 focus:outline-none"
                    />

                    {/* Model Tag Indicator */}
                    <button
                      type="button"
                      onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                      className="hidden sm:flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1 font-sans text-xs text-mauve hover:text-ivory transition-colors"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-lavender" />
                      <span>{selectedModel}</span>
                      <ChevronDown className="h-3 w-3 text-mauve" />
                    </button>

                    {/* Mic button (Opens ChatGPT-style Voice Mode) */}
                    <button
                      type="button"
                      onClick={() => setVoiceModeOpen(true)}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-mauve hover:bg-white/10 hover:text-rose transition-all group"
                      title="Open Naya Voice Mode"
                    >
                      <Mic className="h-4 w-4 transition-transform group-hover:scale-110" />
                    </button>

                    {/* Send button */}
                    <button
                      type="submit"
                      disabled={!input.trim()}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-rose to-lavender text-midnight transition-all hover:scale-105 disabled:opacity-30 disabled:hover:scale-100"
                    >
                      <ArrowUp className="h-4 w-4 stroke-[2.5]" />
                    </button>
                  </form>
                </div>

                {/* Gemini Mode Switcher Tabs (Chat | Specialist Guide) */}
                <div className="flex items-center gap-2 mt-5">
                  <button
                    type="button"
                    onClick={() => setActiveTab('chat')}
                    className={cn(
                      'rounded-full px-4 py-1.5 font-sans text-xs font-medium transition-all',
                      activeTab === 'chat'
                        ? 'bg-white/15 text-ivory shadow-sm'
                        : 'text-mauve hover:text-ivory',
                    )}
                  >
                    Chat
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('task')}
                    className={cn(
                      'rounded-full px-4 py-1.5 font-sans text-xs font-medium transition-all',
                      activeTab === 'task'
                        ? 'bg-white/15 text-ivory shadow-sm'
                        : 'text-mauve hover:text-ivory',
                    )}
                  >
                    Specialist Guide
                  </button>
                </div>

                {/* Gemini Suggestion Prompts List */}
                <div className="w-full max-w-xl mt-6 space-y-2 text-left">
                  {suggestionsByLang[language].map(({ text, icon: Icon }) => (
                    <button
                      key={text}
                      type="button"
                      onClick={() => void send(text)}
                      className="group flex w-full items-center gap-3.5 rounded-full border border-white/[0.08] bg-white/[0.025] px-4 py-3 text-left transition-all hover:border-lavender/35 hover:bg-white/[0.06]"
                    >
                      <Icon className="h-4 w-4 text-mauve group-hover:text-lavender transition-colors shrink-0" />
                      <span className="font-body text-xs sm:text-[13px] text-ivory/80 group-hover:text-ivory transition-colors">
                        {text}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* ================= ACTIVE CONVERSATION STREAM (Gemini Canvas Style) ================= */
              <div className="max-w-3xl mx-auto space-y-7 py-6 pb-28">
                {messages.map((message) => {
                  const isUser = message.role === 'user';
                  return (
                    <div key={message.id} className="w-full">
                      {isUser ? (
                        <div className="flex w-full justify-end">
                          <div className="max-w-[80%] rounded-3xl rounded-tr-md bg-[#251532] border border-white/10 px-5 py-3 text-ivory text-sm sm:text-[14.5px] shadow-sm">
                            <p className="whitespace-pre-wrap">{message.content}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex w-full items-start gap-4">
                          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-lavender/30 bg-gradient-to-br from-royal via-plum to-burgundy text-rose shadow-md mt-0.5">
                            <Sparkles className="h-4 w-4 text-lavender" />
                          </div>

                          <div className="flex-1 min-w-0 text-ivory/95 font-body leading-relaxed text-sm sm:text-[15px]">
                            {!message.content ? (
                              <TypingDots />
                            ) : (
                              <RichText text={message.content} />
                            )}

                            {/* Citations / Sources */}
                            {message.sources && message.sources.length > 0 && (
                              <div className="mt-4 border-t border-white/10 pt-3">
                                <p className="font-sans text-[11px] font-semibold text-lavender uppercase tracking-wider">
                                  Related Clinical References
                                </p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {message.sources.map(({ title, url }, idx) => (
                                    <a
                                      key={idx}
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 font-body text-xs text-lavender hover:border-lavender/40 hover:text-rose transition-colors"
                                    >
                                      <span>{title}</span>
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Message Action Toolbar (Gemini Style) */}
                            {message.content && (
                              <div className="mt-3 flex items-center gap-1 text-mauve/70">
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(message.id, message.content)}
                                  className="rounded-lg p-1.5 hover:bg-white/[0.06] hover:text-ivory transition-colors"
                                  title="Copy response"
                                >
                                  {copiedId === message.id ? (
                                    <Check className="h-4 w-4 text-lavender" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  className="rounded-lg p-1.5 hover:bg-white/[0.06] hover:text-ivory transition-colors"
                                  title="Good response"
                                >
                                  <ThumbsUp className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  className="rounded-lg p-1.5 hover:bg-white/[0.06] hover:text-ivory transition-colors"
                                  title="Poor response"
                                >
                                  <ThumbsDown className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {sending && messages[messages.length - 1]?.content && (
                  <div className="flex items-center gap-2 pl-12 text-xs text-mauve font-sans">
                    <TypingDots />
                    <span>Naya is reflecting on your question…</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ================= DOCKED BOTTOM INPUT BAR (Active Chat Mode) ================= */}
          {hasMessages && (
            <div className="sticky bottom-0 w-full bg-gradient-to-t from-[#09060f] via-[#09060f]/95 to-transparent pt-3 pb-3 px-4 sm:px-8 z-20">
              <div className="max-w-3xl mx-auto space-y-2">
                <div className="rounded-full border border-white/15 bg-[#170e22] px-4 py-2 shadow-2xl transition-all focus-within:border-lavender/60 focus-within:bg-[#1c112a]">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void send();
                    }}
                    className="flex items-center gap-2"
                  >
                    <button
                      type="button"
                      onClick={() => setLibraryModalOpen(true)}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-mauve hover:bg-white/10 hover:text-ivory transition-colors"
                      title="Attach or explore library"
                    >
                      <Plus className="h-5 w-5" />
                    </button>

                    <textarea
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
                      placeholder="Ask Naya a follow up question..."
                      className="max-h-[120px] min-h-[36px] flex-1 resize-none bg-transparent px-2 py-1.5 font-body text-sm text-ivory placeholder:text-mauve/50 focus:outline-none"
                    />

                    <button
                      type="button"
                      onClick={() => setVoiceModeOpen(true)}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-mauve hover:bg-white/10 hover:text-rose transition-all group"
                      title="Open Naya Voice Mode"
                    >
                      <Mic className="h-4 w-4 transition-transform group-hover:scale-110" />
                    </button>

                    {sending ? (
                      <button
                        type="button"
                        onClick={() => abortRef.current?.abort()}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-ivory hover:bg-white/20 transition-colors"
                        title="Stop generating"
                      >
                        <CircleStop className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={!input.trim()}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-rose to-lavender text-midnight transition-all hover:scale-105 disabled:opacity-30 disabled:hover:scale-100"
                        title="Send message"
                      >
                        <ArrowUp className="h-4 w-4 stroke-[2.5]" />
                      </button>
                    )}
                  </form>
                </div>

                <div className="flex items-center justify-between text-[10px] text-mauve/60 px-2 font-sans">
                  <span>Naya is an AI companion — not a doctor. It cannot diagnose or prescribe.</span>
                  <button
                    type="button"
                    onClick={() => setClearModalOpen(true)}
                    className="text-mauve/60 hover:text-rose hover:underline transition-colors"
                  >
                    Clear conversation
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= CLINICAL SAFETY MODAL ================= */}
      <Modal
        open={safetyModalOpen}
        onClose={() => setSafetyModalOpen(false)}
        title="Clinical Safety & What Naya Can Do"
        description="Nayacura is committed to medical rigor, confidentiality, and clear clinical boundaries."
      >
        <div className="space-y-4 text-xs font-body text-mauve">
          <div className="rounded-xl border border-lavender/20 bg-lavender/[0.05] p-3.5 space-y-2">
            <p className="font-sans font-semibold text-ivory flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-lavender" /> What Naya Can Do
            </p>
            <ul className="space-y-1 list-disc pl-4 text-ivory/80 leading-relaxed">
              <li>Explain sexual health terminology, reproductive wellness, and emotional intimacy.</li>
              <li>Help guide you toward the right specialist category (Sexologist, Psychiatrist, Gynecologist, Counsellor).</li>
              <li>Assist in English, Tamil, and Tanglish.</li>
            </ul>
          </div>

          <div className="rounded-xl border border-rose/20 bg-burgundy/20 p-3.5 space-y-2">
            <p className="font-sans font-semibold text-rose flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-rose" /> What Naya Cannot Do
            </p>
            <ul className="space-y-1 list-disc pl-4 text-ivory/80 leading-relaxed">
              <li>Cannot diagnose any clinical illness or psychological disorder.</li>
              <li>Cannot prescribe pharmaceuticals or alter medications.</li>
              <li>Cannot replace direct consultations with a verified Nayacura doctor.</li>
              <li>Not for emergency situations or acute crises.</li>
            </ul>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="primary" size="sm" onClick={() => setSafetyModalOpen(false)}>
              Understood
            </Button>
          </div>
        </div>
      </Modal>

      {/* ================= LIBRARY MODAL ================= */}
      <Modal
        open={libraryModalOpen}
        onClose={() => setLibraryModalOpen(false)}
        title="Nayacura Wellness Library"
        description="Explore verified clinical topics and guides."
      >
        <div className="space-y-3 text-xs">
          {[
            { title: 'Intimacy and Anxiety', desc: 'Understanding performance concerns and emotional safety.' },
            { title: 'Choosing Between Doctor vs Counsellor', desc: 'When medical therapy is needed vs relational therapy.' },
            { title: 'Consultation Privacy Protocol', desc: 'How Nayacura protects your consultation records and video rooms.' },
          ].map((topic, i) => (
            <div
              key={i}
              onClick={() => {
                setLibraryModalOpen(false);
                void send(`Tell me about ${topic.title}`);
              }}
              className="group cursor-pointer rounded-xl border border-white/10 bg-white/[0.03] p-3.5 hover:border-lavender/40 hover:bg-white/[0.06] transition-all"
            >
              <p className="font-sans font-semibold text-ivory group-hover:text-lavender transition-colors">
                {topic.title}
              </p>
              <p className="mt-1 font-body text-mauve/80">{topic.desc}</p>
            </div>
          ))}
          <div className="flex justify-end pt-2">
            <Button variant="secondary" size="sm" onClick={() => setLibraryModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* ================= CLEAR CHAT MODAL ================= */}
      <Modal
        open={clearModalOpen}
        onClose={() => setClearModalOpen(false)}
        title="Clear this conversation?"
        description="This will clear the current messages on your screen."
      >
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" size="sm" onClick={() => setClearModalOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={resetToNewChat}
            icon={<Trash2 className="h-3.5 w-3.5" />}
          >
            Clear Messages
          </Button>
        </div>
      </Modal>

      {/* ================= DELETE STORED CHAT MODAL ================= */}
      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete conversation permanently?"
        description="This permanently removes this conversation from your private account history."
      >
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" size="sm" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => deleteTarget && void deleteConversation(deleteTarget)}
            icon={<Trash2 className="h-3.5 w-3.5" />}
          >
            Delete Permanently
          </Button>
        </div>
      </Modal>
      {/* ================= CHATGPT STYLE VOICE MODE ================= */}
      <NayaVoiceMode
        isOpen={voiceModeOpen}
        onClose={() => setVoiceModeOpen(false)}
        language={language}
        onSendQuery={handleSendVoiceQuery}
      />
    </>
  );
}
