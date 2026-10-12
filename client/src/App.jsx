import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, X } from "lucide-react";
import { api, sendMessage } from "./api.js";
import Sidebar from "./components/Sidebar.jsx";
import ChatHeader from "./components/ChatHeader.jsx";
import ChatView from "./components/ChatView.jsx";
import Composer from "./components/Composer.jsx";

const STREAMING_ID = "streaming";
const DEFAULT_TONE = "professional";
// Relative times come from the server, so refresh the list now and then to keep them current.
const LIST_REFRESH_MS = 60 * 1000;

const toError = (err) => ({ message: err.message, status: err.status });

function ErrorAlert({ error, onDismiss }) {
  return (
    <div className="error" role="alert">
      <AlertCircle size={18} className="error__icon" />
      <div className="error__body">
        <p className="error__title">{error.status === 429 ? "Rate limit reached" : "Something went wrong"}</p>
        <p className="error__message">{error.message}</p>
      </div>
      <button type="button" className="icon-btn error__dismiss" aria-label="Dismiss error" onClick={onDismiss}>
        <X size={16} />
      </button>
    </div>
  );
}

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
  const [modelLabel, setModelLabel] = useState("");

  // Refs let async callbacks see the latest selection and cancel stale work.
  const activeRef = useRef(null);
  const abortRef = useRef(null);

  const selectActive = (id) => {
    activeRef.current = id;
    setActiveId(id);
  };

  const upsertConversation = (conversation) =>
    setConversations((cs) => [conversation, ...cs.filter((c) => c._id !== conversation._id)]);

  const replaceConversation = (conversation) =>
    setConversations((cs) => cs.map((c) => (c._id === conversation._id ? conversation : c)));

  const refreshList = useCallback(() => {
    api.listConversations().then(setConversations).catch((err) => setError(toError(err)));
  }, []);

  useEffect(() => {
    api.getConfig().then((c) => setMaxLength(c.maxMessageLength)).catch(() => {});
    api.getTones().then(setTones).catch(() => {});
    api.getMeta().then((m) => setModelLabel(m.modelLabel)).catch(() => {});
    refreshList();

    const timer = setInterval(() => {
      api.listConversations().then(setConversations).catch(() => {});
    }, LIST_REFRESH_MS);
    return () => clearInterval(timer);
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
      replaceConversation(data.conversation);
      if (activeRef.current === id) {
        setMessages(data.messages);
        setTone(data.conversation.tone || DEFAULT_TONE);
      }
    } catch (err) {
      if (activeRef.current === id) setError(toError(err));
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
      replaceConversation(await api.renameConversation(id, title));
    } catch (err) {
      setConversations(previous);
      setError(toError(err));
    }
  };

  const deleteConversation = async (id) => {
    try {
      await api.deleteConversation(id);
      setConversations((cs) => cs.filter((c) => c._id !== id));
      if (activeRef.current === id) newChat();
    } catch (err) {
      setError(toError(err));
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
        setError(toError(err));
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
          onError: (message, status) => isCurrent() && setError({ message, status }),
          onDone: ({ message, conversation }) => {
            if (conversation) upsertConversation(conversation);
            if (!isCurrent()) return;
            if (message) updateStreaming(() => message);
            else dropEmptyStreaming();
          },
        },
        controller.signal
      );
    } catch (err) {
      if (err.name !== "AbortError" && isCurrent()) setError(toError(err));
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

  const activeConversation = conversations.find((c) => c._id === activeId) || null;

  return (
    <div className="app">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        modelLabel={modelLabel}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNew={newChat}
        onSelect={openConversation}
        onDelete={deleteConversation}
      />
      <main className="main">
        <ChatHeader
          key={activeId || "none"}
          conversation={activeConversation}
          onMenu={() => setSidebarOpen(true)}
          onRename={renameConversation}
          onDelete={deleteConversation}
        />
        <ChatView
          messages={messages}
          loading={loading}
          tones={tones}
          streaming={streaming}
          onSuggestion={send}
        />
        <div className="bottom">
          {error && <ErrorAlert error={error} onDismiss={() => setError(null)} />}
          <Composer
            onSend={send}
            onStop={stopStreaming}
            streaming={streaming}
            maxLength={maxLength}
            tones={tones}
            tone={tone}
            onToneChange={setTone}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
