import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HudBar } from "@/components/site/hud-bar";
import { HudFooter } from "@/components/site/hud-footer";
import { CommandMenu } from "@/components/site/command-menu";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "CLUBUFO // ARCHIVE OF DECLASSIFIED UAP DOCUMENTS",
    template: "%s · CLUBUFO",
  },
  description:
    "Public archive of declassified UAP / UFO documents — 119 files, 4,000+ pages, page-by-page transcribed and indexed. Browse the corpus or query it directly.",
  metadataBase: new URL("https://clubufo.com"),
  openGraph: {
    title: "CLUBUFO",
    description: "Public archive of declassified UAP / UFO documents.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`dark ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh flex flex-col bg-background text-foreground scanlines crt grain">
        <TooltipProvider delay={200}>
          <HudBar />
          <main className="flex-1 flex flex-col min-h-0">{children}</main>
          <HudFooter />
          <CommandMenu />
          <Toaster
            position="bottom-right"
            theme="dark"
            toastOptions={{
              className: "font-mono text-[11px] uppercase tracking-wider",
            }}
          />
        </TooltipProvider>
      </body>
    </html>
  );
}
