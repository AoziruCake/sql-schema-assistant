"use client";

import { useEffect, useState, type ComponentType } from "react";

const preClassName =
  "m-0 bg-transparent p-3 text-[0.75rem] leading-[1.6] font-mono text-slate-300 whitespace-pre-wrap break-all overflow-x-hidden";

type InnerProps = { code: string };

/**
 * Loads react-syntax-highlighter only in the browser so the OpenNext / Cloudflare
 * Worker bundle does not execute Prism (avoids Worker runtime exceptions).
 */
export default function SqlPreview({ sql }: { sql: string }) {
  const [Inner, setInner] = useState<ComponentType<InnerProps> | null>(null);

  useEffect(() => {
    let cancelled = false;
    void import("./sql-syntax-highlighter-inner").then((m) => {
      if (!cancelled) setInner(() => m.default);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!Inner) {
    return <pre className={preClassName}>{sql}</pre>;
  }

  return <Inner code={sql} />;
}
