"use client";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { okaidia } from "react-syntax-highlighter/dist/esm/styles/prism";

const customStyle = {
  margin: 0,
  background: "transparent",
  fontSize: "0.75rem",
  lineHeight: 1.6,
  padding: "0.75rem 0.9rem",
  fontFamily:
    'ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace',
  whiteSpace: "pre-wrap" as const,
  wordBreak: "break-all" as const,
  overflowX: "hidden" as const
};

export default function SqlSyntaxHighlighterInner({ code }: { code: string }) {
  return (
    <SyntaxHighlighter
      language="sql"
      style={okaidia}
      customStyle={customStyle}
      wrapLongLines
    >
      {code}
    </SyntaxHighlighter>
  );
}
