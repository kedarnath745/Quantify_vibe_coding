import { useState } from "react";
import { Moon, Plus, Sparkles, Sun, Trash2 } from "lucide-react";

function ConversationItem({ conversation, active, onSelect, onDelete }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <li
      className={`conv-item ${active ? "conv-item--active" : ""}`}
      onMouseLeave={() => setConfirming(false)}
    >
      <button
        type="button"
        className="conv-item__main"
        onClick={() => onSelect(conversation._id)}
        title={conversation.title}
        aria-current={active ? "page" : undefined}
      >
        <span className="conv-item__title">{conversation.title}</span>
        <span className="conv-item__time">{conversation.relativeTime}</span>
      </button>
      {confirming ? (
        <div className="conv-item__confirm">
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
          className="icon-btn conv-item__delete"
          aria-label={`Delete "${conversation.title}"`}
          title="Delete"
          onClick={() => setConfirming(true)}
        >
          <Trash2 size={16} />
        </button>
      )}
    </li>
  );
}

function Sidebar({
  conversations,
  activeId,
  modelLabel,
  theme,
  onToggleTheme,
  open,
  onClose,
  onNew,
  onSelect,
  onDelete,
}) {
  // The server already sorts newest first and labels each group.
  const groups = [];
  for (const c of conversations) {
    const last = groups[groups.length - 1];
    if (last?.label === c.group) last.items.push(c);
    else groups.push({ label: c.group, items: [c] });
  }

  return (
    <>
      <aside className={`sidebar ${open ? "sidebar--open" : ""}`}>
        <div className="brand">
          <span className="brand__tile">
            <Sparkles size={16} />
          </span>
          <span className="brand__name">AI Chat Assistant</span>
          <button
            type="button"
            className="icon-btn brand__theme"
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            onClick={onToggleTheme}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        <button type="button" className="new-chat" onClick={onNew}>
          <Plus size={16} />
          New chat
        </button>

        <nav className="history" aria-label="Conversations">
          {conversations.length === 0 ? (
            <p className="history__empty">No conversations yet</p>
          ) : (
            groups.map((g) => (
              <section key={g.label} className="history__group">
                <h2 className="history__label">{g.label}</h2>
                <ul>
                  {g.items.map((c) => (
                    <ConversationItem
                      key={c._id}
                      conversation={c}
                      active={c._id === activeId}
                      onSelect={onSelect}
                      onDelete={onDelete}
                    />
                  ))}
                </ul>
              </section>
            ))
          )}
        </nav>

        {modelLabel && (
          <footer className="sidebar__footer">
            <span className="status-dot" aria-hidden="true" />
            {modelLabel}
          </footer>
        )}
      </aside>
      {open && <div className="sidebar-backdrop" onClick={onClose} />}
    </>
  );
}

export default Sidebar;
