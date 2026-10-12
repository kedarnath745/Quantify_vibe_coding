import { useState } from "react";
import { Menu, Trash2 } from "lucide-react";

function MenuButton({ onMenu }) {
  return (
    <button type="button" className="icon-btn menu-btn" aria-label="Open conversations" onClick={onMenu}>
      <Menu size={20} />
    </button>
  );
}

function ChatHeader({ conversation, onMenu, onRename, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [confirming, setConfirming] = useState(false);

  // Without an open conversation the header only exists for the mobile menu button.
  if (!conversation) {
    return (
      <header className="chat-header chat-header--bare">
        <MenuButton onMenu={onMenu} />
      </header>
    );
  }

  const save = () => {
    setEditing(false);
    const next = title.trim();
    if (next && next !== conversation.title) onRename(conversation._id, next);
  };

  const count = conversation.messageCount ?? 0;

  return (
    <header className="chat-header">
      <MenuButton onMenu={onMenu} />
      <div className="chat-header__info">
        {editing ? (
          <input
            className="chat-header__input"
            aria-label="Conversation title"
            value={title}
            maxLength={100}
            autoFocus
            onChange={(e) => setTitle(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") setEditing(false);
            }}
          />
        ) : (
          <button
            type="button"
            className="chat-header__title"
            title="Rename conversation"
            onClick={() => {
              setTitle(conversation.title);
              setEditing(true);
            }}
          >
            {conversation.title}
          </button>
        )}
        <p className="chat-header__meta">
          {count} {count === 1 ? "message" : "messages"} · Started {conversation.startedTime}
        </p>
      </div>
      {confirming ? (
        <div className="chat-header__confirm" onMouseLeave={() => setConfirming(false)}>
          <button type="button" className="text-btn text-btn--danger" onClick={() => onDelete(conversation._id)}>
            Delete
          </button>
          <button type="button" className="text-btn" onClick={() => setConfirming(false)}>
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="icon-btn icon-btn--outlined"
          aria-label="Delete conversation"
          title="Delete conversation"
          onClick={() => setConfirming(true)}
        >
          <Trash2 size={18} />
        </button>
      )}
    </header>
  );
}

export default ChatHeader;
