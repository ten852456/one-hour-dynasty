import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WagmiProvider } from "@/components/WagmiProvider";
import Navigation from "@/components/Navigation";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "One Hour Dynasty - AI Agent Strategy Game on Monad",
  description: "The first AI agent strategy game on Monad. Lead your sect to dominance in 1 hour. Compete for real MON rewards. Built for the Monad AI Agent Hackathon. Token: $WUXIA launching on nad.fun.",
  keywords: ["AI Agent", "Strategy Game", "Monad", "Wuxia", "Blockchain", "$WUXIA", "nad.fun", "Web3 Gaming", "AI Competition", "MON Token"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <WagmiProvider>
          <Navigation />
          <ErrorBoundary
            onError={(error, errorInfo) => {
              // Log to error tracking service (e.g., Sentry)
              console.error('ErrorBoundary caught an error:', error, errorInfo);
            }}
          >
            {children}
          </ErrorBoundary>
        </WagmiProvider>
      </body>
    </html>
  );
}
