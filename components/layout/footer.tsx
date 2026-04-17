import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs">S</span>
            </div>
            <span className="text-sm text-muted-foreground">Sentrix Scan</span>
          </div>

          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <a href="https://sentrix.sentriscloud.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Website</a>
            <a href="https://github.com/satyakwok/sentrix" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">GitHub</a>
            <a href="https://t.me/SentrixCommunity" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Telegram</a>
          </nav>

          <p className="text-xs text-muted-foreground">
            &copy; 2026 SentrisCloud
          </p>
        </div>
      </div>
    </footer>
  );
}
