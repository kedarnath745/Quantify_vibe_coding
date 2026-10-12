// Prism theme for react-syntax-highlighter. Colours come from the --code-*/--syntax-* tokens,
// which are the same in both themes because code blocks always stay dark.
const mono = '"JetBrains Mono", ui-monospace, Consolas, monospace';

const base = {
  color: "var(--code-text)",
  background: "none",
  fontFamily: mono,
  fontSize: "13px",
  lineHeight: 1.7,
  textAlign: "left",
  whiteSpace: "pre",
  wordSpacing: "normal",
  wordBreak: "normal",
  tabSize: 2,
  hyphens: "none",
};

const keyword = { color: "var(--syntax-keyword)" };
const literal = { color: "var(--syntax-literal)" };
const fn = { color: "var(--syntax-function)" };

export default {
  'code[class*="language-"]': base,
  'pre[class*="language-"]': {
    ...base,
    margin: 0,
    padding: "14px 16px",
    overflow: "auto",
    background: "var(--code-bg)",
  },
  comment: { color: "var(--syntax-comment)", fontStyle: "italic" },
  prolog: { color: "var(--syntax-comment)" },
  doctype: { color: "var(--syntax-comment)" },
  cdata: { color: "var(--syntax-comment)" },
  punctuation: { color: "var(--code-muted)" },
  keyword,
  atrule: keyword,
  important: keyword,
  tag: keyword,
  selector: keyword,
  "attr-name": fn,
  boolean: literal,
  constant: literal,
  number: literal,
  string: literal,
  char: literal,
  "attr-value": literal,
  "template-string": literal,
  regex: literal,
  url: literal,
  function: fn,
  "class-name": fn,
  builtin: fn,
  operator: { color: "var(--syntax-operator)" },
  property: { color: "var(--code-text)" },
  variable: { color: "var(--code-text)" },
  deleted: { color: "var(--syntax-deleted)" },
  inserted: { color: "var(--syntax-function)" },
  bold: { fontWeight: 700 },
  italic: { fontStyle: "italic" },
};
