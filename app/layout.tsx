import type { Metadata } from "next";
import { Playfair_Display, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MoodTune | Emotional Music Discovery",
  description: "Conversational music search built around emotional texture. Describe your mood and discover tracks that match how you feel.",
  keywords: ["music", "mood", "emotional", "discovery", "playlist", "AI"],
  authors: [{ name: "Krish" }],
  openGraph: {
    title: "MoodTune | Emotional Music Discovery",
    description: "Conversational music search built around emotional texture",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased selection:bg-white/10 selection:text-white">
        {children}
        <Toaster />
      </body>
    </html>
  );
}