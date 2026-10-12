import { useEffect, useRef } from "react";
import Markdown from "./Markdown.jsx";
import ErrorBoundary from "./ErrorBoundary.jsx";

const SUGGESTIONS = [
  "Explain how React hooks work",
  "Write a Python script to rename files in a folder",
  "What's the difference between SQL and NoSQL?",
  "Give me tips for a technical interview",
];

function Message({ message, toneLabel, followUps, onFollowUp }) {
  const isUser = message.role === "user";
  return (
    <div className={`message message--${message.role}`}>
      <div className="message__bubble">
        {isUser ? (
          <p className="message__text">{message.content}</p>
        ) : message.streaming && !message.content ? (
          <div className="typing" aria-label="Assistant is typing">
            <span />
            <span />
            <span />
          </div>
        ) : (
          <ErrorBoundary fallback={<p className="message__text">{message.content}</p>}>
            <Markdown>{message.content}</Markdown>
          </ErrorBoundary>
        )}
        {message.incomplete && <p className="message__note">Response stopped before it finished.</p>}
        {!isUser && toneLabel && <span className="tone-badge">{toneLabel}</span>}
        {followUps?.length > 0 && (
          <div className="follow-ups" aria-label="Suggested follow-up questions">
            {followUps.map((q) => (
              <button key={q} type="button" className="follow-up" onClick={() => onFollowUp(q)}>
                {q}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ChatView({ messages, loading, tones, streaming, onSuggestion }) {
  const scrollRef = useRef(null);
  const pinnedRef = useRef(true);

  // Follow new content only while the user is already at the bottom.
  useEffect(() => {
    const el = scrollRef.current;
    if (el && pinnedRef.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const onScroll = () => {
    const el = scrollRef.current;
    pinnedRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  if (loading) {
    return <div className="chat chat--center">Loading conversation…</div>;
  }

  if (messages.length === 0) {
    return (
      <div className="chat chat--center">
        <div className="empty">
          <h1>How can I help you today?</h1>
          <div className="suggestions">
            {SUGGESTIONS.map((s) => (
              <button key={s} type="button" onClick={() => onSuggestion(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const toneLabels = Object.fromEntries(tones.map((t) => [t.id, t.label]));
  const last = messages[messages.length - 1];

  return (
    <div className="chat" ref={scrollRef} onScroll={onScroll}>
      <div className="chat__inner">
        {messages.map((m) => (
          <Message
            key={m._id}
            message={m}
            toneLabel={toneLabels[m.tone]}
            // Only the latest reply offers follow-ups, and not while another is streaming.
            followUps={m === last && m.role === "assistant" && !streaming ? m.followUps : null}
            onFollowUp={onSuggestion}
          />
        ))}
      </div>
    </div>
  );
}

export default ChatView;
