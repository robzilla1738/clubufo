"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen } from "lucide-react";

export function Hero({ docCount }: { docCount: number }) {
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      {/* layered background */}
      <div className="absolute inset-0 starfield opacity-50" aria-hidden />
      <div
        className="absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 0%, color-mix(in oklch, var(--primary) 22%, transparent), transparent 70%)",
        }}
      />
      <div
        className="absolute inset-x-0 top-0 h-px"
        aria-hidden
        style={{
          background:
            "linear-gradient(90deg, transparent, color-mix(in oklch, var(--primary) 60%, transparent), transparent)",
        }}
      />
      <div className="grain" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8 py-24 md:py-36 flex flex-col items-start gap-8">
        <motion.span
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/40 backdrop-blur px-3 py-1 text-[11px] font-mono uppercase tracking-widest text-muted-foreground"
        >
          <span className="size-1.5 rounded-full bg-primary animate-pulse" />
          {docCount.toLocaleString()} declassified documents indexed
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05 }}
          className="font-display text-5xl sm:text-6xl md:text-7xl leading-[0.95] tracking-tight max-w-3xl text-balance"
        >
          A reading room for{" "}
          <span className="italic text-primary">the unexplained.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="text-muted-foreground text-lg leading-relaxed max-w-xl text-pretty"
        >
          ClubUFO is a curated archive of declassified files, sightings, and
          field reports — organized, citable, and chat-ready. Browse the
          stacks, or ask a question and get answers grounded in the source.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="flex flex-col sm:flex-row gap-3 pt-2"
        >
          <Button asChild size="lg" className="gap-1.5 h-11 px-5">
            <Link href="/chat">
              Ask the corpus
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="gap-1.5 h-11 px-5"
          >
            <Link href="/library">
              <BookOpen className="size-4" />
              Browse the library
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
