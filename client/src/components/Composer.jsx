import { useEffect, useRef, useState } from "react";

function Composer({ onSend, onStop, streaming, maxLength }) {
  const [text, setText] = useState("");
  const ref = useRef(null);

  // Grow the textarea with its content, up to the CSS max-height.
  useEffect(() => {
    const el = ref.current;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [text]);

  const tooLong = text.length > maxLength;
  const canSend = text.trim() && !tooLong && !streaming;

  const submit = (e) => {
    e?.preventDefault();
    if (!canSend) return;
    onSend(text.trim());
    setText("");
  };

  return (
    <form className="composer" onSubmit={submit}>
      <textarea
        ref={ref}
        rows={1}
        value={text}
        placeholder="Message the assistant…"
        aria-label="Message"
        autoFocus
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) submit(e);
        }}
      />
      <div className="composer__footer">
        <span className={`composer__count ${tooLong ? "composer__count--over" : ""}`}>
          {text.length > maxLength * 0.8 && `${text.length} / ${maxLength}`}
        </span>
        {streaming ? (
          <button type="button" className="btn btn--stop" onClick={onStop}>
            Stop
          </button>
        ) : (
          <button type="submit" className="btn" disabled={!canSend}>
            Send
          </button>
        )}
      </div>
    </form>
  );
}

export default Composer;
