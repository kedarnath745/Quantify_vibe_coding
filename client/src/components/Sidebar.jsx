import { useState } from "react";

function ConversationItem({ conversation, active, onSelect, onRename, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(conversation.title);
  const [confirming, setConfirming] = useState(false);

  const save = () => {
    setEditing(false);
    const next = title.trim();
    if (next && next !== conversation.title) onRename(conversation._id, next);
    else setTitle(conversation.title);
  };

  if (editing) {
    return (
      <li className="conv-item conv-item--active">
        <input
          className="conv-item__input"
          value={title}
          maxLength={100}
          autoFocus
          onChange={(e) => setTitle(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") {
              setTitle(conversation.title);
              setEditing(false);
            }
          }}
        />
      </li>
    );
  }

  return (
    <li
      className={`conv-item ${active ? "conv-item--active" : ""}`}
      onMouseLeave={() => setConfirming(false)}
    >
      <button
        type="button"
        className="conv-item__title"
        onClick={() => onSelect(conversation._id)}
        title={conversation.title}
      >
        {/* Buttons don't reliably clip with an ellipsis, so the span does it. */}
        <span className="conv-item__label">{conversation.title}</span>
      </button>
      <div className="conv-item__actions">
        {confirming ? (
          <>
            <button type="button" className="danger" onClick={() => onDelete(conversation._id)}>
              Delete
            </button>
            <button type="button" onClick={() => setConfirming(false)}>
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              aria-label="Rename"
              title="Rename"
              onClick={() => {
                setTitle(conversation.title);
                setEditing(true);
              }}
            >
              ✎
            </button>
            <button type="button" aria-label="Delete" title="Delete" onClick={() => setConfirming(true)}>
              ✕
            </button>
          </>
        )}
      </div>
    </li>
  );
}

function Sidebar({ conversations, activeId, open, onClose, onNew, onSelect, onRename, onDelete }) {
  return (
    <>
      <aside className={`sidebar ${open ? "sidebar--open" : ""}`}>
        <button type="button" className="new-chat" onClick={onNew}>
          + New chat
        </button>
        <nav className="conv-list" aria-label="Conversations">
          {conversations.length === 0 ? (
            <p className="conv-empty">No conversations yet</p>
          ) : (
            <ul>
              {conversations.map((c) => (
                <ConversationItem
                  key={c._id}
                  conversation={c}
                  active={c._id === activeId}
                  onSelect={onSelect}
                  onRename={onRename}
                  onDelete={onDelete}
                />
              ))}
            </ul>
          )}
        </nav>
      </aside>
      {open && <div className="sidebar-backdrop" onClick={onClose} />}
    </>
  );
}

export default Sidebar;
