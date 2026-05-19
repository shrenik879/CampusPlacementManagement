import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Trash2, Bot, User, Loader2, ChevronDown, Sparkles } from 'lucide-react';
import api from '../services/api';

/* ── Suggested quick queries per role ──────────────────────────────── */
const SUGGESTIONS = {
  STUDENT: [
    'Show my applications',
    'Show recommended jobs',
    'What is my application status?',
    'How many jobs have I applied to?',
  ],
  COMPANY: [
    'Show all applicants',
    'Show selected candidates',
    'How many pending applicants?',
    'List my job postings',
  ],
  ADMIN: [
    'Show platform stats',
    'List pending company approvals',
    'How many blocked users?',
    'How many students and companies?',
  ],
};

/* ── Single message bubble ──────────────────────────────────────────── */
function MessageBubble({ msg }) {
  const isBot = msg.role === 'bot';
  const isError = msg.isError;

  return (
    <div className={`flex items-end gap-2 ${isBot ? 'justify-start' : 'justify-end'}`}>
      {isBot && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
          <Bot size={14} className="text-white" />
        </div>
      )}
      <div
        className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
          isBot
            ? isError
              ? 'bg-red-50 text-red-700 border border-red-100 rounded-bl-sm'
              : 'bg-white text-slate-700 border border-slate-100 rounded-bl-sm'
            : 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-sm'
        }`}
        style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
      >
        {msg.text}
      </div>
      {!isBot && (
        <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
          <User size={14} className="text-slate-500" />
        </div>
      )}
    </div>
  );
}

/* ── Typing indicator ───────────────────────────────────────────────── */
function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 justify-start">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
        <Bot size={14} className="text-white" />
      </div>
      <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center">
          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

/* ── Main Chatbot component ─────────────────────────────────────────── */
export default function Chatbot({ userRole }) {
  const [open, setOpen]           = useState(false);
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  const suggestions = SUGGESTIONS[userRole] || SUGGESTIONS.STUDENT;

  // Greet on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      const roleLabel = userRole === 'STUDENT' ? 'Student'
                      : userRole === 'COMPANY' ? 'Recruiter'
                      : 'Admin';
      setMessages([{
        id: Date.now(),
        role: 'bot',
        text: `👋 Hi ${roleLabel}! I'm **PlacementBot**, your AI assistant.\n\nI can help you with applications, jobs, and platform insights. What would you like to know?`,
      }]);
    }
  }, [open]);

  // Auto-scroll on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  const sendMessage = useCallback(async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;

    setInput('');
    setShowSuggestions(false);
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: trimmed }]);
    setLoading(true);

    try {
      const res = await api.post('/chat', { message: trimmed });
      const reply = res.data?.reply || 'Sorry, I could not process that.';
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'bot', text: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'bot',
        text: '⚠️ Something went wrong. Please try again.',
        isError: true,
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setShowSuggestions(true);
    setTimeout(() => {
      const roleLabel = userRole === 'STUDENT' ? 'Student'
                      : userRole === 'COMPANY' ? 'Recruiter' : 'Admin';
      setMessages([{
        id: Date.now(),
        role: 'bot',
        text: `👋 Hi ${roleLabel}! Chat cleared. How can I help you?`,
      }]);
    }, 100);
  };

  return (
    <>
      {/* ── Floating button ──────────────────────────────────────── */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          open
            ? 'bg-slate-700 hover:bg-slate-800 rotate-0'
            : 'bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 hover:-translate-y-1'
        }`}
        aria-label="Open chatbot"
      >
        {open
          ? <X size={22} className="text-white" />
          : <MessageCircle size={22} className="text-white" />}
      </button>

      {/* ── Chat window ──────────────────────────────────────────── */}
      <div
        className={`fixed bottom-24 right-6 z-50 w-[360px] max-h-[560px] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 transition-all duration-300 origin-bottom-right ${
          open
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-95 pointer-events-none'
        }`}
        style={{ maxHeight: '560px' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-none">PlacementBot</p>
              <p className="text-xs text-blue-100 mt-0.5">AI-powered assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={clearChat}
              className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Clear chat"
            >
              <Trash2 size={14} />
            </button>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <ChevronDown size={16} />
            </button>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50" style={{ minHeight: 0 }}>
          {messages.map(msg => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}
          {loading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {/* Quick suggestions */}
        {showSuggestions && messages.length <= 1 && !loading && (
          <div className="px-4 pb-2 pt-1 bg-slate-50 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium mb-1.5">Quick questions</p>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map(s => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-xs bg-white border border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-full px-2.5 py-1 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input area */}
        <div className="px-3 py-3 border-t border-slate-100 bg-white rounded-b-2xl">
          <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything…"
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm text-slate-700 placeholder-slate-400 focus:outline-none leading-relaxed"
              style={{ maxHeight: '80px', overflowY: 'auto' }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="w-8 h-8 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center shrink-0 transition-colors"
            >
              {loading
                ? <Loader2 size={14} className="animate-spin" />
                : <Send size={14} />}
            </button>
          </div>
          <p className="text-[10px] text-slate-400 text-center mt-1.5">Powered by Gemini AI · Press Enter to send</p>
        </div>
      </div>
    </>
  );
}
