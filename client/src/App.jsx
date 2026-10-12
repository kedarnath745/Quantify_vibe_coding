import { useCallback, useEffect, useRef, useState } from "react";
import { api, sendMessage } from "./api.js";
import Sidebar from "./components/Sidebar.jsx";
import ChatView from "./components/ChatView.jsx";
import Composer from "./components/Composer.jsx";
import ToneToggle from "./components/ToneToggle.jsx";

const STREAMING_ID = "streaming";
const DEFAULT_TONE = "professional";

function App() {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [maxLength, setMaxLength] = useState(4000);
  const [tones, setTones] = useState([]);
  const [tone, setTone] = useState(DEFAULT_TONE);

  // Refs let async callbacks see the latest selection and cancel stale work.
  const activeRef = useRef(null);
  const abortRef = useRef(null);

  const selectActive = (id) => {
    activeRef.current = id;
    setActiveId(id);
  };

  const refreshList = useCallback(() => {
    api.listConversations().then(setConversations).catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    api.getConfig().then((c) => setMaxLength(c.maxMessageLength)).catch(() => {});
    api.getTones().then(setTones).catch(() => {});
    refreshList();
  }, [refreshList]);

  const stopStreaming = () => abortRef.current?.abort();

  const openConversation = async (id) => {
    if (id === activeRef.current) return setSidebarOpen(false);
    stopStreaming();
    selectActive(id);
    setSidebarOpen(false);
    setError(null);
    setLoading(true);
    try {
      const data = await api.getConversation(id);
      if (activeRef.current === id) {
        setMessages(data.messages);
        setTone(data.conversation.tone || DEFAULT_TONE);
      }
    } catch (err) {
      if (activeRef.current === id) setError(err.message);
    } finally {
      if (activeRef.current === id) setLoading(false);
    }
  };

  const newChat = () => {
    stopStreaming();
    selectActive(null);
    setMessages([]);
    setError(null);
    setLoading(false);
    setSidebarOpen(false);
  };

  const renameConversation = async (id, title) => {
    const previous = conversations;
    setConversations((cs) => cs.map((c) => (c._id === id ? { ...c, title } : c)));
    try {
      await api.renameConversation(id, title);
    } catch (err) {
      setConversations(previous);
      setError(err.message);
    }
  };

  const deleteConversation = async (id) => {
    try {
      await api.deleteConversation(id);
      setConversations((cs) => cs.filter((c) => c._id !== id));
      if (activeRef.current === id) newChat();
    } catch (err) {
      setError(err.message);
    }
  };

  const send = async (content) => {
    setError(null);

    let id = activeRef.current;
    if (!id) {
      try {
        const conversation = await api.createConversation();
        id = conversation._id;
        setConversations((cs) => [conversation, ...cs]);
        selectActive(id);
      } catch (err) {
        setError(err.message);
        return;
      }
    }

    const isCurrent = () => activeRef.current === id;
    const tempId = `temp-${Date.now()}`;
    const updateStreaming = (fn) =>
      setMessages((ms) => ms.map((m) => (m._id === STREAMING_ID ? fn(m) : m)));
    const dropEmptyStreaming = () =>
      setMessages((ms) => ms.filter((m) => m._id !== STREAMING_ID || m.content));

    setMessages((ms) => [
      ...ms,
      { _id: tempId, role: "user", content, tone },
      { _id: STREAMING_ID, role: "assistant", content: "", tone, streaming: true },
    ]);

    const controller = new AbortController();
    abortRef.current = controller;
    setStreaming(true);

    try {
      await sendMessage(
        id,
        content,
        tone,
        {
          onUser: (saved) =>
            isCurrent() && setMessages((ms) => ms.map((m) => (m._id === tempId ? saved : m))),
          onDelta: (text) => isCurrent() && updateStreaming((m) => ({ ...m, content: m.content + text })),
          onError: (message) => isCurrent() && setError(message),
          onDone: ({ message, conversation }) => {
            if (conversation) {
              setConversations((cs) => [conversation, ...cs.filter((c) => c._id !== conversation._id)]);
            }
            if (!isCurrent()) return;
            if (message) updateStreaming(() => message);
            else dropEmptyStreaming();
          },
        },
        controller.signal
      );
    } catch (err) {
      if (err.name !== "AbortError" && isCurrent()) setError(err.message);
      if (isCurrent()) {
        // Keep whatever arrived before the stop, flagged as unfinished; drop it if empty.
        setMessages((ms) =>
          ms.flatMap((m) =>
            m._id !== STREAMING_ID
              ? [m]
              : m.content
                ? [{ ...m, _id: `local-${Date.now()}`, streaming: false, incomplete: true }]
                : []
          )
        );
      }
      if (err.name === "AbortError") refreshList();
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
        setStreaming(false);
      }
    }
  };

  const activeTitle = conversations.find((c) => c._id === activeId)?.title || "New chat";

  return (
    <div className="app">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNew={newChat}
        onSelect={openConversation}
        onRename={renameConversation}
        onDelete={deleteConversation}
      />
      <main className="main">
        <header className="topbar">
          <button
            type="button"
            className="menu-btn"
            aria-label="Open conversations"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>
          <span className="topbar__title">{activeTitle}</span>
        </header>
        <ChatView
          messages={messages}
          loading={loading}
          tones={tones}
          streaming={streaming}
          onSuggestion={send}
        />
        <div className="bottom">
          {error && (
            <div className="error" role="alert">
              <span>{error}</span>
              <button type="button" aria-label="Dismiss" onClick={() => setError(null)}>
                ✕
              </button>
            </div>
          )}
          <ToneToggle tones={tones} value={tone} onChange={setTone} />
          <Composer onSend={send} onStop={stopStreaming} streaming={streaming} maxLength={maxLength} />
          <p className="hint">Enter to send · Shift+Enter for a new line</p>
        </div>
      </main>
    </div>
  );
}

export default App;
