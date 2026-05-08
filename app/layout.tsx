import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HudBar } from "@/components/site/hud-bar";
import { HudFooter } from "@/components/site/hud-footer";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

const previewImage = {
  url: "/alienlinkprev.png",
  width: 1731,
  height: 909,
  alt: "ChatUFO public archive link preview",
};

export const metadata: Metadata = {
  title: {
    default: "ChatUFO // DECLASSIFIED UAP FILES",
    template: "%s · CHATUFO",
  },
  description:
    "Ask questions across declassified UAP files. Every answer cites the page it came from.",
  metadataBase: new URL("https://chatufo.space"),
  openGraph: {
    title: "ChatUFO",
    description: "Ask declassified UAP files and check every answer against its source page.",
    type: "website",
    siteName: "ChatUFO",
    images: [previewImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "ChatUFO",
    description: "Ask declassified UAP files and check the source.",
    images: [previewImage],
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
