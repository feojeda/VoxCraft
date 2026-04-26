import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/providers";
import { TopNav } from "@/components/top-nav";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ttsQwen",
  description: "Text-to-Speech powered by Qwen3-TTS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} min-h-screen bg-[var(--background)] text-[var(--text-primary)] antialiased`}
      >
        <Providers>
          <TopNav />
          {children}
        </Providers>
      </body>
    </html>
  );
}
