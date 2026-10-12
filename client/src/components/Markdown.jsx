import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
// Async build loads each language grammar on demand instead of bundling them all.
import { PrismAsyncLight as SyntaxHighlighter } from "react-syntax-highlighter";
import { Copy } from "lucide-react";
import codeTheme from "./codeTheme.js";

function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be unavailable (insecure context); nothing useful to do.
    }
  };

  return (
    <div className="code-block">
      <div className="code-block__header">
        <span className="code-block__lang">{language || "code"}</span>
        <button type="button" className="code-block__copy" onClick={copy}>
          <Copy size={14} />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <SyntaxHighlighter language={language || "text"} style={codeTheme}>
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

const components = {
  // Code blocks render their own container, so drop the wrapping <pre>.
  pre: ({ children }) => <>{children}</>,
  code({ className, children }) {
    const text = String(children ?? "");
    const match = /language-([\w+-]+)/.exec(className || "");
    if (match || text.includes("\n")) {
      return <CodeBlock language={match?.[1]} code={text.replace(/\n$/, "")} />;
    }
    return <code className="inline-code">{children}</code>;
  },
  a: ({ children, ...props }) => (
    <a {...props} target="_blank" rel="noreferrer">
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="table-wrap">
      <table>{children}</table>
    </div>
  ),
};

function Markdown({ children, streaming }) {
  return (
    <div className={`markdown ${streaming ? "markdown--streaming" : ""}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}

export default Markdown;
