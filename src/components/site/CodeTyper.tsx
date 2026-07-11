import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

export function CodeTyper({ code, filename }: { code: string; filename: string }) {
  const [out, setOut] = useState("");
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    setOut("");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setOut(code);
      return;
    }
    let i = 0;
    const step = Math.max(2, Math.floor(code.length / 400));
    const id = window.setInterval(() => {
      i += step;
      setOut(code.slice(0, i));
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      if (i >= code.length) window.clearInterval(id);
    }, 12);
    return () => window.clearInterval(id);
  }, [code]);

  function copy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const done = out.length >= code.length;

  return (
    <div className="folder-tab-solid overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-2.5 pt-4">
        <span className="label-mono text-acid">{filename}</span>
        <button
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded border border-white/10 bg-white/[0.02] px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-muted-ink transition-colors hover:border-acid/40 hover:text-acid"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre
        ref={scrollRef}
        className="max-h-[440px] overflow-auto p-5 font-mono text-[12.5px] leading-[1.7] text-ink/90"
      >
        <code className={done ? "" : "blink-cursor"}>{out}</code>
      </pre>
    </div>
  );
}
