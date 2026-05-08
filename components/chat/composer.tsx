"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export function Composer({
  value,
  onChange,
  onSubmit,
  onStop,
  disabled,
  status,
  placeholder = "ASK THE ARCHIVE…",
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onStop?: () => void;
  disabled?: boolean;
  status: "submitted" | "streaming" | "ready" | "error";
  placeholder?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = Math.min(el.scrollHeight, 180) + "px";
  }, [value]);

  const busy = status === "submitted" || status === "streaming";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!busy && value.trim()) onSubmit();
      }}
      className="border hairline bg-card/40 transition-[background-color,border-color] focus-within:border-cyan focus-within:bg-card/60"
    >
      <div className="flex min-h-24 items-center gap-3 px-4 py-3">
        <span className="shrink-0 text-cyan text-[14px] select-none">&gt;</span>
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={1}
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (!busy && value.trim()) onSubmit();
            }
          }}
          className="block min-h-[24px] w-full resize-none border-0 bg-transparent px-0 py-0 pr-2 text-[14px] leading-[1.6] outline-none placeholder:text-[12px] placeholder:uppercase placeholder:tracking-[0.16em] placeholder:text-muted-foreground/60"
        />
        <button
          type={busy ? "button" : "submit"}
          onClick={busy ? onStop : undefined}
          disabled={!busy && (!value.trim() || disabled)}
          className={cn(
            "hit-target shrink-0 px-5 text-[10px] uppercase tracking-[0.18em] transition-[background-color,color,scale] active:scale-[0.96] focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 sm:min-h-16",
            busy
              ? "border border-foreground text-foreground hover:bg-foreground hover:text-background"
              : "border border-cyan text-cyan disabled:cursor-not-allowed disabled:opacity-30 hover:bg-cyan hover:text-background",
          )}
          aria-label={busy ? "Stop" : "Send"}
        >
          {busy ? "STOP" : "SEND ⏎"}
        </button>
      </div>
    </form>
  );
}
