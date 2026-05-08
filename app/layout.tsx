import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { CommandMenu } from "@/components/site/command-menu";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-serif",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ClubUFO — A reading room for the unexplained",
    template: "%s · ClubUFO",
  },
  description:
    "A curated archive of declassified UFO documents, sightings, and field reports. Browse 161+ files or chat with the corpus.",
  metadataBase: new URL("https://clubufo.com"),
  openGraph: {
    title: "ClubUFO",
    description:
      "A curated archive of declassified UFO documents. Browse the library or chat with the corpus.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh flex flex-col">
        <TooltipProvider delay={200}>
          <SiteHeader />
          <main className="flex-1 flex flex-col">{children}</main>
          <SiteFooter />
          <CommandMenu />
          <Toaster
            position="bottom-right"
            theme="dark"
            toastOptions={{ className: "font-sans" }}
          />
        </TooltipProvider>
      </body>
    </html>
  );
}
