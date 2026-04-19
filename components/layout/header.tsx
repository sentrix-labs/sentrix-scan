"use client";

import { Link, useRouter, usePathname } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState, useRef, useEffect } from "react";
import { Search, Sun, Moon, Menu, X, Globe, Check } from "lucide-react";
import { useTheme } from "next-themes";
import { useNetwork } from "@/lib/network-context";
import { detectSearchType } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { routing } from "@/i18n/routing";

const LOCALE_LABELS: Record<string, { flag: string; label: string }> = {
  id: { flag: "🇮🇩", label: "Bahasa Indonesia" },
  en: { flag: "🇺🇸", label: "English" },
};

export function Header() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const { network, toggle } = useNetwork();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // DECISION: Cmd+K / Ctrl+K focuses the search input (Etherscan/Linear convention)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Close language dropdown on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    const type = detectSearchType(q);
    if (type === "block") router.push(`/blocks/${q}`);
    else if (type === "tx") router.push(`/tx/${q}`);
    else if (type === "address") router.push(`/address/${q}`);
    else router.push(`/search?q=${encodeURIComponent(q)}`);
    setQuery("");
    setMobileOpen(false);
  }

  function switchLocale(next: string) {
    if (next === locale) return;
    router.replace(pathname, { locale: next as "id" | "en" });
    setLangOpen(false);
  }

  const NAV_LINKS: { href: "/blocks" | "/validators" | "/tokens" | "/leaderboard" | "/"; key: keyof IntlMessages["nav"] }[] = [
    { href: "/", key: "home" },
    { href: "/blocks", key: "blocks" },
    { href: "/validators", key: "validators" },
    { href: "/tokens", key: "tokens" },
    { href: "/leaderboard", key: "leaderboard" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="font-semibold text-lg hidden sm:inline tracking-tight">
            Sentrix<span className="text-blue-500 ml-0.5">Scan</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-2 text-sm transition-colors rounded-md ${
                  active
                    ? "text-foreground bg-accent/80 font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                {t(l.key)}
              </Link>
            );
          })}
        </nav>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md hidden md:flex">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              ref={searchRef}
              type="text"
              placeholder={t("search_placeholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-12 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground bg-background/80 border border-border rounded px-1.5 py-0.5 hidden lg:inline-block">
              ⌘K
            </kbd>
          </div>
        </form>

        {/* Right controls */}
        <div className="flex items-center gap-2 ml-auto md:ml-0">
          {/* Language switcher */}
          <div className="relative" ref={langRef}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLangOpen(!langOpen)}
              className="h-8 gap-1 px-2"
              aria-label="Switch language"
            >
              <Globe className="h-3.5 w-3.5" />
              <span className="hidden sm:inline text-xs uppercase">{locale}</span>
            </Button>
            {langOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-popover border border-border rounded-lg shadow-lg py-1 z-50">
                {routing.locales.map((l) => (
                  <button
                    key={l}
                    onClick={() => switchLocale(l)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent"
                  >
                    <span className="text-base leading-none">{LOCALE_LABELS[l].flag}</span>
                    <span className="flex-1 text-left">{LOCALE_LABELS[l].label}</span>
                    {l === locale && <Check className="h-3.5 w-3.5 text-blue-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Network switcher */}
          <Button variant="outline" size="sm" onClick={toggle} className="text-xs h-8 gap-1.5">
            <span className={`w-2 h-2 rounded-full ${network === "mainnet" ? "bg-green-500" : "bg-orange-500"}`} />
            <span className="hidden sm:inline">{network === "mainnet" ? "Mainnet" : "Testnet"}</span>
            <span className="text-[10px] font-mono text-muted-foreground hidden lg:inline ml-0.5">
              {network === "mainnet" ? "7119" : "7120"}
            </span>
          </Button>

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-8 w-8 p-0"
            aria-label="Toggle theme"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {/* Mobile menu */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="h-8 w-8 p-0 md:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background p-4 space-y-3">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={t("search_placeholder")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-4 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
          </form>
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-md hover:bg-accent"
              >
                {t(l.key)}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
