import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ThemeProvider } from "@/components/theme-provider";
import { NetworkProvider } from "@/lib/network-context";
import { LabelBootstrap } from "@/components/layout/label-bootstrap";
import { Header, MobileBottomNav } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Toaster } from "@/components/layout/toaster";
import { routing } from "@/i18n/routing";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="antialiased min-h-screen flex flex-col">
        <NextIntlClientProvider>
          <ThemeProvider>
            <NetworkProvider>
              <LabelBootstrap>
                <Header />
                <main className="flex-1 pb-16 md:pb-0">{children}</main>
                <Footer />
                <MobileBottomNav />
                <Toaster />
              </LabelBootstrap>
            </NetworkProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
