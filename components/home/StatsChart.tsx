"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Activity } from "lucide-react";
import type { BlockData } from "@/lib/api";
import { toMillis } from "@/lib/format";

type Range = "1m" | "5m" | "15m" | "1h";

const RANGE_MS: Record<Range, number> = {
  "1m":  60_000,
  "5m":  5 * 60_000,
  "15m": 15 * 60_000,
  "1h":  60 * 60_000,
};

const BUCKET_COUNT = 30;

// DECISION: no /chain/performance endpoint. We derive TPS from the block window the explorer
// already polls. Each block carries `tx_count` (coinbase = 1, plus any user tx). Bucket the
// span into BUCKET_COUNT slices of equal duration over the selected window and emit
// `tx_in_bucket / bucket_seconds` as the TPS point.
// TODO(api): needs GET /chain/performance?range=1m|5m|15m|1h — this is a fallback.
function buildSeries(blocks: BlockData[] | null, range: Range): { t: string; tps: number }[] {
  const windowMs = RANGE_MS[range];
  const bucketMs = windowMs / BUCKET_COUNT;
  const bucketSec = bucketMs / 1000;
  const now = Date.now();
  const series = new Array<number>(BUCKET_COUNT).fill(0);

  if (blocks) {
    for (const b of blocks) {
      const ts = toMillis(b.timestamp);
      const ageMs = now - ts;
      if (ageMs < 0 || ageMs > windowMs) continue;
      const bucket = Math.min(BUCKET_COUNT - 1, Math.floor(ageMs / bucketMs));
      const txCount = b.tx_count ?? b.transactions?.length ?? 0;
      series[bucket] += txCount;
    }
  }

  // Label each bucket by its center time — "5m ago", "now", etc.
  const out: { t: string; tps: number }[] = [];
  for (let i = BUCKET_COUNT - 1; i >= 0; i--) {
    const centerAgoMs = (i + 0.5) * bucketMs;
    const label = formatAgo(centerAgoMs);
    out.push({ t: label, tps: series[i] / bucketSec });
  }
  return out;
}

function formatAgo(ms: number): string {
  const s = ms / 1000;
  if (s < 60) return s < 2 ? "now" : `${Math.round(s)}s`;
  const m = s / 60;
  if (m < 60) return `${Math.round(m)}m`;
  const h = m / 60;
  return `${h.toFixed(1)}h`;
}

function formatAge(seconds: number): string {
  if (seconds < 60) return `${Math.max(1, Math.round(seconds))}s ago`;
  const m = seconds / 60;
  if (m < 60) return `${Math.round(m)}m ago`;
  const h = m / 60;
  if (h < 24) return `${h.toFixed(1)}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function StatsChart({ blocks }: { blocks: BlockData[] | null }) {
  const [range, setRange] = useState<Range>("5m");
  const data = useMemo(() => buildSeries(blocks, range), [blocks, range]);
  const peak = useMemo(() => (data.length ? Math.max(...data.map((d) => d.tps)) : 0), [data]);
  const avg = useMemo(() => {
    if (!data.length) return 0;
    const sum = data.reduce((s, d) => s + d.tps, 0);
    return sum / data.length;
  }, [data]);
  const hasSignal = data.some((d) => d.tps > 0);

  // Idle detection: when the most recent block is older than the selected window, the chain
  // either paused or we fetched stale state. Tell the user that directly instead of a
  // generic "no throughput".
  const lastBlockAgeSec = useMemo(() => {
    if (!blocks || blocks.length === 0) return null;
    const newest = blocks.reduce((m, b) => Math.max(m, toMillis(b.timestamp)), 0);
    return Math.floor((Date.now() - newest) / 1000);
  }, [blocks]);
  const isIdle = lastBlockAgeSec !== null && lastBlockAgeSec * 1000 > RANGE_MS[range];

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between gap-3 flex-wrap">
        <CardTitle className="flex items-center gap-3">
          <TrendingUp className="h-4 w-4 text-[var(--gold)]" />
          <span className="font-mono text-[10px] tracking-[.22em] uppercase text-[var(--tx-d)]">
            Transactions Per Second
          </span>
          <span className="hidden sm:inline text-[11px] text-muted-foreground font-mono">
            peak <span className="text-[var(--gold)]">{peak.toFixed(2)}</span> · avg{" "}
            <span className="text-[var(--tx-m)]">{avg.toFixed(2)}</span>
          </span>
        </CardTitle>
        <div className="flex items-center gap-1">
          {(["1m", "5m", "15m", "1h"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`text-[10px] px-2.5 py-1 rounded-md border transition-colors uppercase tracking-[.1em] ${
                range === r
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "border-border text-muted-foreground hover:bg-accent"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {!hasSignal ? (
          <div className="h-48 flex flex-col items-center justify-center text-center gap-2 border border-dashed border-[var(--brd)] rounded-lg bg-[color-mix(in_oklab,var(--muted)_30%,transparent)]">
            <Activity className="h-6 w-6 text-muted-foreground/40" />
            {isIdle && lastBlockAgeSec !== null ? (
              <>
                <p className="text-sm text-[var(--orange)] font-medium">Chain appears idle</p>
                <p className="text-xs text-muted-foreground font-mono">
                  Last block {formatAge(lastBlockAgeSec)} · longer than the selected {range} window
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">No throughput in the last {range}</p>
                <p className="text-xs text-muted-foreground/70 font-mono">
                  Chart populates once the polled block window falls inside the selected range.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="tps-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--gold)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--gold)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="t" fontSize={10} stroke="var(--tx-d)" tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis fontSize={10} stroke="var(--tx-d)" tickLine={false} axisLine={false} width={28} />
                <Tooltip
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--brd)", borderRadius: 8, fontSize: 12 }}
                  formatter={(value) => [`${Number(value).toFixed(2)} tps`, "TPS"]}
                />
                <Area type="monotone" dataKey="tps" stroke="var(--gold)" strokeWidth={2} fill="url(#tps-grad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
