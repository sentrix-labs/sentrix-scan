import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Split a formatted value (e.g. "14.2K", "3.1s", "12 tx", "14,109 SRX") into a number part
// and a trailing unit so we can render the unit in accent color (landing-style).
function splitValue(value: string): { num: string; unit: string } {
  const m = /^([\d.,\s-]+)(.*)$/.exec(value);
  if (!m) return { num: value, unit: "" };
  return { num: m[1].trim(), unit: m[2].trim() };
}

interface StatCardProps {
  label: ReactNode;
  value: string;
  loading?: boolean;
  /** CSS color (e.g. `var(--gold)`, `var(--green)`) applied to the trailing unit and hover glow. */
  accent?: string;
  /** Title tooltip on the value (useful when long values truncate). */
  title?: string;
}

// DECISION: the landing-style stat card is the brand's signature numeric treatment —
// Playfair serif number, tinted em-unit, animated gold corner lines on hover. One primitive
// so every page (home + detail summary rows) reads from the same vocabulary instead of
// shadcn's grey `text-lg font-semibold font-mono`.
export function StatCard({ label, value, loading = false, accent = "var(--gold)", title }: StatCardProps) {
  const { num, unit } = splitValue(value);

  return (
    <div className="card-lift group relative overflow-hidden bg-[color-mix(in_oklab,var(--card)_60%,transparent)] hover:bg-[var(--card)] border border-[var(--brd)] rounded-2xl px-4 py-5 md:px-5 md:py-6 min-w-0">
      {/* Animated corner lines */}
      <span
        className="absolute top-0 left-0 h-px w-0 group-hover:w-[60px] transition-all duration-500 opacity-0 group-hover:opacity-70"
        style={{ background: `linear-gradient(to right, ${accent}, transparent)` }}
      />
      <span
        className="absolute top-0 left-0 w-px h-0 group-hover:h-full transition-all duration-500 opacity-0 group-hover:opacity-70"
        style={{ background: `linear-gradient(to bottom, ${accent}, transparent)` }}
      />

      <div
        className="font-serif font-light tracking-tight leading-none mb-2 truncate"
        style={{ fontSize: "clamp(22px, 3.2vw, 38px)" }}
        title={title ?? value}
      >
        {loading ? (
          <Skeleton className="h-9 w-24" />
        ) : (
          <>
            <span>{num}</span>
            {unit && (
              <em
                className="not-italic ml-1 text-[0.7em] transition-all duration-500 group-hover:[text-shadow:0_0_16px_currentColor]"
                style={{ color: accent }}
              >
                {unit}
              </em>
            )}
          </>
        )}
      </div>
      <div className="font-mono text-[10px] text-[var(--tx-d)] tracking-[.22em] uppercase group-hover:text-[var(--tx-m)] transition-colors truncate">
        {label}
      </div>
    </div>
  );
}
