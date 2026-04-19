import type { Metadata } from "next";
import { Bebas_Neue, DM_Mono, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const dmMono = DM_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  weight: "400",
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
    <html
      lang="en"
      className={`${inter.variable} ${dmMono.variable} ${bebasNeue.variable}`}
    >
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased selection:bg-white/10 selection:text-white">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
