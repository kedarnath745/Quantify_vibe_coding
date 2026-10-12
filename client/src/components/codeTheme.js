// Prism theme for react-syntax-highlighter, matched to the app's palette.
const mono = '"JetBrains Mono", ui-monospace, Consolas, monospace';

const base = {
  color: "#DDE1E8",
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

const keyword = { color: "#9AA4FF" };
const literal = { color: "#F0B37E" };
const fn = { color: "#6FD3BE" };

export default {
  'code[class*="language-"]': base,
  'pre[class*="language-"]': {
    ...base,
    margin: 0,
    padding: "14px 16px",
    overflow: "auto",
    background: "var(--code-bg)",
  },
  comment: { color: "#7E8696", fontStyle: "italic" },
  prolog: { color: "#7E8696" },
  doctype: { color: "#7E8696" },
  cdata: { color: "#7E8696" },
  punctuation: { color: "#A3AAB8" },
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
  operator: { color: "#C3C9FF" },
  property: { color: "#DDE1E8" },
  variable: { color: "#DDE1E8" },
  deleted: { color: "#F49AA6" },
  inserted: { color: "#6FD3BE" },
  bold: { fontWeight: 700 },
  italic: { fontStyle: "italic" },
};
