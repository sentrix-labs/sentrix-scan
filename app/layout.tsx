import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { NetworkProvider } from "@/lib/network-context";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Toaster } from "@/components/layout/toaster";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Sentrix Scan — Block Explorer",
    template: "%s | Sentrix Scan",
  },
  description:
    "Block explorer for Sentrix Chain (SRX). Browse blocks, transactions, addresses, validators, and SRC-20 tokens on Chain ID 7119.",
  keywords: ["sentrix", "block explorer", "blockchain", "SRX", "chain id 7119", "EVM", "sentrix scan"],
  applicationName: "Sentrix Scan",
  authors: [{ name: "Sentrix Labs" }],
  creator: "Sentrix Labs",
  publisher: "Sentrix Labs",
  openGraph: {
    type: "website",
    siteName: "Sentrix Scan",
    title: "Sentrix Scan — Block Explorer",
    description: "Browse blocks, transactions, addresses, and validators on Sentrix Chain.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sentrix Scan — Block Explorer",
    description: "Block explorer for Sentrix Chain (SRX).",
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://sentrixscan.sentriscloud.com"),
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0E1A" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <ThemeProvider>
          <NetworkProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <Toaster />
          </NetworkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
