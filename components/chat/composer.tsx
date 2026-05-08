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
  placeholder = "QUERY THE ARCHIVE…",
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
      className="border hairline bg-card/40 focus-within:border-cyan focus-within:bg-card/60 transition-colors"
    >
      <div className="flex items-start">
        <span className="pl-3 pt-3 text-cyan text-[14px] select-none">&gt;</span>
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
          className="block w-full resize-none bg-transparent border-0 outline-none px-2 py-3 pr-3 text-[14px] leading-[1.6] placeholder:text-muted-foreground/60 placeholder:uppercase placeholder:tracking-[0.16em] placeholder:text-[12px]"
        />
        <button
          type={busy ? "button" : "submit"}
          onClick={busy ? onStop : undefined}
          disabled={!busy && (!value.trim() || disabled)}
          className={cn(
            "shrink-0 m-2 px-3 h-9 text-[10px] uppercase tracking-[0.18em] transition-colors",
            busy
              ? "border border-foreground text-foreground hover:bg-foreground hover:text-background"
              : "border border-cyan text-cyan disabled:opacity-30 disabled:cursor-not-allowed hover:bg-cyan hover:text-black",
          )}
          aria-label={busy ? "Stop" : "Send"}
        >
          {busy ? "STOP" : "SEND ⏎"}
        </button>
      </div>
    </form>
  );
}
