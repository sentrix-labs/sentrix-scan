import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Globe, FileText, Code2 } from "lucide-react";

export function Footer() {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border mt-auto bg-card/30 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-8 lg:py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="font-semibold tracking-tight">
                Sentrix<span className="text-blue-500 ml-0.5">Scan</span>
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Block explorer for Sentrix Chain (SRX). Browse blocks, transactions, addresses, validators, and SRC-20 tokens.
            </p>
          </div>

          {/* Explorer */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Explorer</h3>
            <nav className="flex flex-col gap-2 text-sm">
              <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">Home</Link>
              <Link href="/blocks" className="text-muted-foreground hover:text-foreground transition-colors">Blocks</Link>
              <Link href="/validators" className="text-muted-foreground hover:text-foreground transition-colors">Validators</Link>
              <Link href="/tokens" className="text-muted-foreground hover:text-foreground transition-colors">Tokens</Link>
            </nav>
          </div>

          {/* Network */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Network</h3>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Mainnet</span>
                <span className="font-mono text-xs">7119</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Testnet</span>
                <span className="font-mono text-xs">7120</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Currency</span>
                <span className="font-mono text-xs">SRX</span>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Resources</h3>
            <nav className="flex flex-col gap-2 text-sm">
              <a href="https://sentrix.sentriscloud.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                <Globe className="h-3.5 w-3.5" /> {t("chain")}
              </a>
              <a href="https://github.com/sentrix-labs" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                <Code2 className="h-3.5 w-3.5" /> {t("github")}
              </a>
              <a href="https://sentrix.sentriscloud.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                <FileText className="h-3.5 w-3.5" /> {t("docs")}
              </a>
            </nav>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">{t("copyright", { year })}</p>
          <p className="text-xs text-muted-foreground font-mono">v0.2.0</p>
        </div>
      </div>
    </footer>
  );
}
