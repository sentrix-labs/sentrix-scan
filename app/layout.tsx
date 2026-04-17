import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { NetworkProvider } from "@/lib/network-context";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Sentrix Scan — Block Explorer",
    template: "%s | Sentrix Scan",
  },
  description: "Block explorer for Sentrix Chain (SRX). Browse blocks, transactions, addresses, validators, and SRC-20 tokens on Chain ID 7119.",
  keywords: ["sentrix", "block explorer", "blockchain", "SRX", "chain id 7119", "EVM"],
  openGraph: {
    type: "website",
    siteName: "Sentrix Scan",
    title: "Sentrix Scan — Block Explorer",
    description: "Browse blocks, transactions, addresses, and validators on Sentrix Chain.",
  },
  metadataBase: new URL("https://sentrixscan.sentriscloud.com"),
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
          </NetworkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
