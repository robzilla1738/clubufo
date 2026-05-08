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
    default: "ChatUFO // ARCHIVE OF DECLASSIFIED UAP DOCUMENTS",
    template: "%s · CHATUFO",
  },
  description:
    "Chat with the UAP archive. 119 declassified files, 4,000+ pages — page-by-page transcribed, claim-cited, and queryable. Every answer points back to its source page.",
  metadataBase: new URL("https://chatufo.com"),
  openGraph: {
    title: "ChatUFO",
    description: "Chat with the declassified UAP archive — answers cite their source page.",
    type: "website",
    siteName: "ChatUFO",
  },
  twitter: {
    card: "summary_large_image",
    title: "ChatUFO",
    description: "Chat with the declassified UAP archive.",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
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
