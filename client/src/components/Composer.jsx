import { useEffect, useRef, useState } from "react";
import { ArrowUp, Square } from "lucide-react";
import ToneToggle from "./ToneToggle.jsx";

function Composer({ onSend, onStop, streaming, maxLength, tones, tone, onToneChange }) {
  const [text, setText] = useState("");
  const ref = useRef(null);

  // Grow the textarea with its content, up to the CSS max-height.
  useEffect(() => {
    const el = ref.current;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [text]);

  // Hand focus back once the reply finishes (the textarea is disabled while streaming).
  useEffect(() => {
    if (!streaming) ref.current?.focus();
  }, [streaming]);

  const tooLong = text.length > maxLength;
  const canSend = text.trim() && !tooLong && !streaming;

  const submit = (e) => {
    e?.preventDefault();
    if (!canSend) return;
    onSend(text.trim());
    setText("");
  };

  return (
    <div className="composer-wrap">
      <form className="composer" onSubmit={submit}>
        <ToneToggle tones={tones} value={tone} onChange={onToneChange} />
        <div className="composer__input-row">
          <label htmlFor="composer-input" className="visually-hidden">
            Message
          </label>
          <textarea
            id="composer-input"
            ref={ref}
            rows={1}
            value={text}
            disabled={streaming}
            placeholder={streaming ? "Waiting for the response to finish…" : "Message the assistant…"}
            autoFocus
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) submit(e);
            }}
          />
          {text.length > maxLength * 0.8 && (
            <span className={`composer__count ${tooLong ? "composer__count--over" : ""}`}>
              {text.length} / {maxLength}
            </span>
          )}
          {streaming ? (
            <button type="button" className="stop-btn" onClick={onStop}>
              <Square size={14} fill="currentColor" />
              Stop
            </button>
          ) : (
            <button type="submit" className="send-btn" aria-label="Send message" disabled={!canSend}>
              <ArrowUp size={20} />
            </button>
          )}
        </div>
      </form>
      <p className="hint">Enter to send · Shift + Enter for a new line</p>
    </div>
  );
}

export default Composer;
