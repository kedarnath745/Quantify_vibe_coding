import { useEffect, useRef, useState } from "react";
import {
  AlignLeft,
  Briefcase,
  Check,
  Code,
  Copy,
  CornerDownRight,
  Database,
  Sparkles,
  Square,
} from "lucide-react";
import Markdown from "./Markdown.jsx";
import ErrorBoundary from "./ErrorBoundary.jsx";

const STARTERS = [
  {
    icon: Code,
    tile: "#1F2330",
    color: "#9AA4FF",
    title: "Explain how React hooks work",
    subtitle: "useState, useEffect and when to use them",
  },
  {
    icon: AlignLeft,
    tile: "#2A2219",
    color: "#F0A35E",
    title: "Write a Python script to rename files",
    subtitle: "Batch-rename everything in a folder",
  },
  {
    icon: Database,
    tile: "#16302B",
    color: "#6FD3BE",
    title: "What's the difference between SQL and NoSQL?",
    subtitle: "Schemas, scaling and relationships",
  },
  {
    icon: Briefcase,
    tile: "#2A1F33",
    color: "#C9A2F2",
    title: "Give me tips for a technical interview",
    subtitle: "Preparation, structure and common pitfalls",
  },
];

// Formats the server's timestamp for display; no date arithmetic happens here.
const formatTime = (iso) =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : null;

function CopyResponseButton({ text }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be unavailable (insecure context); nothing useful to do.
    }
  };

  return (
    <button
      type="button"
      className="icon-btn"
      aria-label={copied ? "Response copied" : "Copy response"}
      title={copied ? "Copied" : "Copy response"}
      onClick={copy}
    >
      {copied ? <Check size={16} /> : <Copy size={16} />}
    </button>
  );
}

function UserMessage({ message }) {
  return (
    <div className="message message--user">
      <div className="message__bubble">{message.content}</div>
      {message.createdAt && <span className="message__time">{formatTime(message.createdAt)}</span>}
    </div>
  );
}

function AssistantMessage({ message, tone, latest, onFollowUp }) {
  const typing = message.streaming && !message.content;

  return (
    <div className="message message--assistant">
      <div className="avatar" aria-hidden="true">
        <Sparkles size={15} />
      </div>
      <div className="message__body">
        <div className="message__meta">
          <span className="message__author">Assistant</span>
          {tone && <span className={`tone-badge tone--${tone.id}`}>{tone.label}</span>}
          {message.createdAt && <span className="message__time">{formatTime(message.createdAt)}</span>}
        </div>
        <div className="message__bubble">
          {typing ? (
            <div className="typing" role="status" aria-label="Assistant is typing">
              <span />
              <span />
              <span />
            </div>
          ) : (
            <ErrorBoundary fallback={<p className="message__plain">{message.content}</p>}>
              <Markdown streaming={message.streaming}>{message.content}</Markdown>
            </ErrorBoundary>
          )}
        </div>
        {message.incomplete && (
          <p className="message__stopped">
            <Square size={13} />
            Response stopped · partial answer saved
          </p>
        )}
        {latest && (
          <div className="message__extras">
            <CopyResponseButton text={message.content} />
            {message.followUps?.length > 0 && (
              <div className="follow-ups">
                <p className="follow-ups__label">Suggested follow-ups</p>
                <div className="follow-ups__list">
                  {message.followUps.map((q) => (
                    <button key={q} type="button" className="follow-up" onClick={() => onFollowUp(q)}>
                      <CornerDownRight size={14} className="follow-up__icon" />
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ onStart }) {
  return (
    <div className="chat chat--center">
      <div className="empty">
        <div className="empty__tile">
          <Sparkles size={24} />
        </div>
        <div>
          <h1 className="empty__title">How can I help you today?</h1>
          <p className="empty__subtitle">Pick a tone below, then ask anything or start from a suggestion.</p>
        </div>
        <div className="starters">
          {STARTERS.map(({ icon: Icon, tile, color, title, subtitle }) => (
            <button key={title} type="button" className="starter" onClick={() => onStart(title)}>
              <span className="starter__icon" style={{ background: tile, color }}>
                <Icon size={18} />
              </span>
              <span className="starter__text">
                <span className="starter__title">{title}</span>
                <span className="starter__subtitle">{subtitle}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChatView({ messages, loading, tones, streaming, onSuggestion }) {
  const scrollRef = useRef(null);
  const pinnedRef = useRef(true);

  const innerRef = useRef(null);
  const hasMessages = messages.length > 0;

  // Follow new content only while the user is already at the bottom.
  useEffect(() => {
    const el = scrollRef.current;
    if (el && pinnedRef.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // Content can also grow after render (code highlighting loads its grammar lazily).
  useEffect(() => {
    const inner = innerRef.current;
    if (!inner) return;
    const observer = new ResizeObserver(() => {
      const el = scrollRef.current;
      if (el && pinnedRef.current) el.scrollTop = el.scrollHeight;
    });
    observer.observe(inner);
    return () => observer.disconnect();
  }, [hasMessages, loading]);

  const onScroll = () => {
    const el = scrollRef.current;
    pinnedRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  if (loading) {
    return <div className="chat chat--center chat--loading">Loading conversation…</div>;
  }

  if (messages.length === 0) return <EmptyState onStart={onSuggestion} />;

  const toneById = Object.fromEntries(tones.map((t) => [t.id, t]));
  const last = messages[messages.length - 1];

  return (
    <div className="chat" ref={scrollRef} onScroll={onScroll}>
      <div className="chat__inner" ref={innerRef}>
        {messages.map((m) =>
          m.role === "user" ? (
            <UserMessage key={m._id} message={m} />
          ) : (
            <AssistantMessage
              key={m._id}
              message={m}
              tone={toneById[m.tone]}
              // Only the latest completed reply offers copy and follow-ups.
              latest={m === last && !streaming && !m.streaming}
              onFollowUp={onSuggestion}
            />
          )
        )}
      </div>
    </div>
  );
}

export default ChatView;
