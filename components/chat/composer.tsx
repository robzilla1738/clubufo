"use client";

import { useEffect, useRef } from "react";
import { ArrowUp, Square } from "lucide-react";
import { cn } from "@/lib/utils";

export function Composer({
  value,
  onChange,
  onSubmit,
  onStop,
  disabled,
  status,
  placeholder = "Ask about the corpus…",
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
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [value]);

  const busy = status === "submitted" || status === "streaming";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!busy && value.trim()) onSubmit();
      }}
      className="relative rounded-xl border border-border/60 bg-card/60 focus-within:border-border focus-within:ring-1 focus-within:ring-primary/40 transition-shadow"
    >
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
        className="block w-full resize-none bg-transparent border-0 outline-none px-4 py-3.5 pr-14 text-[15px] leading-6 placeholder:text-muted-foreground/60"
      />
      <button
        type={busy ? "button" : "submit"}
        onClick={busy ? onStop : undefined}
        disabled={!busy && (!value.trim() || disabled)}
        className={cn(
          "absolute right-2 bottom-2 size-9 rounded-md flex items-center justify-center transition-all",
          busy
            ? "bg-foreground text-background hover:bg-foreground/90"
            : "bg-primary text-primary-foreground disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-105",
        )}
        aria-label={busy ? "Stop" : "Send"}
      >
        {busy ? <Square className="size-3.5 fill-current" /> : <ArrowUp className="size-4" />}
      </button>
    </form>
  );
}
