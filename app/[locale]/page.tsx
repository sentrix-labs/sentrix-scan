"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import dynamic from "next/dynamic";
import { Link } from "@/i18n/navigation";
import { Blocks, ArrowUpDown, Search, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCardSkeleton } from "@/components/common/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { Address } from "@/components/common/Address";
import { TxHash } from "@/components/common/TxHash";
import { BlockHeight } from "@/components/common/BlockHeight";
import { Timestamp } from "@/components/common/Timestamp";
import { StatCard } from "@/components/common/StatCard";
import { LiveTicker } from "@/components/home/LiveTicker";
import { useNetwork } from "@/lib/network-context";

// DECISION: lazy-load StatsChart to keep Home bundle below the 500 kB gzipped target.
// Chart is below the fold on most viewports — OK to defer.
const StatsChart = dynamic(() => import("@/components/home/StatsChart").then((m) => m.StatsChart), {
  ssr: false,
  loading: () => <Skeleton className="h-72 w-full" />,
});
import { useStats, useBlocks, useTransactions, useChainPerformance, useMempool, useCurrentEpoch, useChainStatus } from "@/lib/hooks";
import { formatNumber, formatSRX, toMillis } from "@/lib/format";
import { detectSearchType } from "@/lib/format";
import type { ChainPerformance } from "@/lib/api";

// DECISION: StatCard moved to components/common/StatCard.tsx so detail pages share it.

// Compute block time from last N blocks.
// DECISION: API sends block_timestamp as unix seconds (10-digit number). `toMillis` normalizes
// to ms first. Average = span / (N-1) across the window — works even at second precision
// because the sum of integer-second diffs equals the true span.
const CHAIN_TARGET_BLOCK_TIME = "~0.5s";
function computeBlockTime(timestamps: Array<string | number>): string {
  if (timestamps.length < 2) return CHAIN_TARGET_BLOCK_TIME;
  const ms = timestamps.map(toMillis).sort((a, b) => b - a);
  const spanMs = ms[0] - ms[ms.length - 1];
  const avgMs = spanMs / (ms.length - 1);
  if (!isFinite(avgMs) || avgMs <= 0) return CHAIN_TARGET_BLOCK_TIME;
  if (avgMs < 1000) return `${avgMs.toFixed(0)}ms`;
  const s = avgMs / 1000;
  return s < 10 ? `${s.toFixed(1)}s` : `${Math.round(s)}s`;
}

// DECISION: Total Burned needs 3 modes so it reads right at every scale:
//   0           → "0.0000 SRX"  (precision signal — user wanted 4 zeros shown on mainnet)
//   0 < x < 1   → "0.0123 SRX"  (small-coin precision)
//   1 ≤ x < 1k  → "600.04 SRX"  (2 decimals fits card)
//   ≥ 1000      → "1.20K SRX"   (prevents overflow on testnet's 1200 SRX burned)
// Full precision still available via the StatCard tooltip (title attr).
function formatBurnedSrx(amount: number): string {
  if (!isFinite(amount)) return "— SRX";
  if (amount === 0) return "0.0000 SRX";
  if (amount < 1) return `${amount.toFixed(4)} SRX`;
  if (amount < 1000) return `${amount.toFixed(2)} SRX`;
  if (amount < 1_000_000) return `${(amount / 1000).toFixed(2)}K SRX`;
  return `${(amount / 1_000_000).toFixed(2)}M SRX`;
}

// DECISION: backend /chain/info has no total_transactions — estimate as total_blocks ×
// avg_tx_per_block from the polled window. User wanted no "est." suffix since the derived
// number *is* the best available truth until the backend ships /chain/stats.
// TODO(api): add total_transactions to /chain/info — swap the estimate out once shipped.
function estimateTotalTransactions(
  totalBlocks: number | undefined,
  blocks: { transactions?: unknown[]; tx_count?: number }[] | null,
): string {
  if (!totalBlocks) return "—";
  if (!blocks || blocks.length === 0) return formatNumber(totalBlocks);
  const txs = blocks.reduce((n, b) => n + (b.tx_count ?? b.transactions?.length ?? 0), 0);
  const avg = txs / blocks.length;
  if (avg <= 0) return formatNumber(totalBlocks);
  return formatNumber(Math.round(totalBlocks * avg));
}

export default function HomePage() {
  const t = useTranslations("home");
  const { network } = useNetwork();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [perfRange, setPerfRange] = useState<"1m" | "5m" | "15m" | "1h" | "24h">("1h");
  const { data: stats, loading: statsLoading } = useStats(network);
  // DECISION: TPS chart + Latest Blocks both consume this window. 500 is enough to fill the
  // 1m/5m/15m buckets at 0.5s block time; Latest Blocks only shows the top 10 of the list.
  const { data: blocks, loading: blocksLoading } = useBlocks(network, 500);
  const { data: txs, loading: txsLoading } = useTransactions(network, 10);
  // DECISION: backend /chain/performance now feeds both the Live TPS card and the StatsChart.
  // Replaces the previous client-bucketed estimate — real tps/block_time from the validator.
  const { data: performance, loading: perfLoading } = useChainPerformance(network, perfRange);
  const { data: mempool } = useMempool(network);
  const { data: epoch } = useCurrentEpoch(network);
  const { data: chainStatus } = useChainStatus(network);

  // Prefer backend block_time_sec; fall back to deriving from polled block timestamps.
  const latestPerf = performance?.points?.[performance.points.length - 1];
  const blockTime = latestPerf?.block_time_sec
    ? `${latestPerf.block_time_sec.toFixed(1)}s`
    : (blocks ? computeBlockTime(blocks.map((b) => b.timestamp as unknown as number | string)) : CHAIN_TARGET_BLOCK_TIME);
  const totalTxValue = stats?.total_transactions != null
    ? formatNumber(stats.total_transactions)
    : estimateTotalTransactions(stats?.total_blocks, blocks);

  // Micro-sparkline series from the /chain/performance points. Reused across a few hero cards.
  const tpsSpark = performance?.points?.map((p) => p.tps) ?? [];
  const blockTimeSpark = performance?.points?.map((p) => p.block_time_sec) ?? [];
  const txCountSpark = performance?.points?.map((p) => p.tx_count) ?? [];

  // Idle detection: if the newest polled block is older than 2 minutes, the chain is paused
  // and TPS is genuinely zero — distinguish "idle chain" from "active but 0 tx" so the card
  // reads as "0 — because nothing is happening" rather than "— no data".
  const latestBlockAgeSec = blocks && blocks.length > 0
    ? Math.floor((Date.now() - Math.max(...blocks.map((b) => toMillis(b.timestamp)))) / 1000)
    : null;
  const isChainIdle = latestBlockAgeSec !== null && latestBlockAgeSec > 120;
  const liveTps = isChainIdle
    ? "Idle"
    : latestPerf
      ? `${latestPerf.tps.toFixed(2)} tps`
      : "—";
  const tpsAccent = isChainIdle ? "var(--orange)" : "var(--gold)";

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
  }

  return (
    <>
      <LiveTicker stats={stats} blockTime={blockTime} network={network} epoch={epoch} status={chainStatus} />
      {isChainIdle && latestBlockAgeSec !== null && (
        <div className="border-b border-[var(--orange)]/30 bg-[color-mix(in_oklab,var(--orange)_8%,transparent)]">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 py-2 flex items-center gap-3 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--orange)] animate-pulse-live" />
            <span className="font-mono uppercase tracking-[.15em] text-[var(--orange)]">
              {network === "testnet" ? "Testnet" : "Chain"} paused
            </span>
            <span className="font-mono text-[var(--tx-m)]">
              Last block {latestBlockAgeSec < 3600 ? `${Math.round(latestBlockAgeSec / 60)} minutes` : `${(latestBlockAgeSec / 3600).toFixed(1)} hours`} ago — validator may be offline.
            </span>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-10 lg:py-16 space-y-12 animate-fade-in">
      {/* Editorial hero */}
      <div className="text-center space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-center gap-3 anim-hero-1 opacity-0">
          <span className="w-8 h-px bg-[var(--gold)]" />
          <span className={`w-1.5 h-1.5 rounded-full ${network === "mainnet" ? "bg-[var(--green)]" : "bg-[var(--orange)]"} animate-pulse-live`} />
          <span className="w-8 h-px bg-[var(--gold)]" />
        </div>

        <h1 className="font-serif text-[clamp(38px,6vw,72px)] font-light leading-[.95] tracking-[.08em] text-[var(--gold)] pr-[.08em] anim-hero-2 opacity-0">
          {t("title_prefix").toUpperCase()}
          <span className="text-[var(--gold-l)] font-normal"> {t("title_suffix").toUpperCase()}</span>
        </h1>

        <p className="text-[13px] md:text-[14px] text-[var(--tx-m)] font-light tracking-[.02em] leading-relaxed max-w-xl mx-auto anim-hero-3 opacity-0">
          {t("description")}{" "}
          <span className="font-mono text-[11px] tracking-[.1em] text-[var(--tx-d)] ml-1">
            · Chain ID {network === "mainnet" ? "7119" : "7120"} ·
          </span>
        </p>

        <form onSubmit={handleSearch} className="max-w-2xl mx-auto pt-4 anim-hero-4 opacity-0">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--tx-d)]" />
            <input
              type="text"
              placeholder={t("search_placeholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-12 pl-11 pr-24 text-[13px] tracking-[.02em] bg-[color-mix(in_oklab,var(--foreground)_3%,transparent)] border border-[var(--brd)] rounded-full focus:outline-none focus:border-[var(--gold)] focus:bg-[color-mix(in_oklab,var(--gold)_3%,transparent)] transition-all placeholder:text-[var(--tx-d)]"
            />
            <kbd className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[var(--tx-d)] border border-[var(--brd)] rounded px-1.5 py-0.5">
              ⌘K
            </kbd>
          </div>
        </form>
      </div>

      {/* Stats — 2×4 editorial grid. Row 1 = performance / live signals; Row 2 = chain state. */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
        {statsLoading && !stats ? (
          Array.from({ length: 8 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            {/* Row 1 — live performance */}
            <StatCard
              label={t("stats.tps")}
              value={liveTps}
              loading={!blocks}
              accent={tpsAccent}
              spark={isChainIdle ? undefined : tpsSpark}
              title={isChainIdle && latestBlockAgeSec !== null ? `Chain paused — last block ${latestBlockAgeSec < 3600 ? `${Math.round(latestBlockAgeSec / 60)}m` : `${(latestBlockAgeSec / 3600).toFixed(1)}h`} ago` : undefined}
            />
            <StatCard label={t("stats.block_height")} value={stats ? stats.height.toLocaleString() : "—"} loading={statsLoading} accent="var(--cyan)" />
            <StatCard
              label={t("stats.block_time")}
              value={isChainIdle ? "—" : blockTime}
              loading={!blocks}
              accent={isChainIdle ? "var(--orange)" : "var(--teal)"}
              spark={isChainIdle ? undefined : blockTimeSpark}
              title={isChainIdle ? "Chain paused — block time stale" : undefined}
            />
            <StatCard
              label={t("stats.total_transactions")}
              value={totalTxValue}
              loading={statsLoading && !blocks}
              accent="var(--blue)"
              spark={isChainIdle ? undefined : txCountSpark}
            />
            {/* Row 2 — chain state */}
            <StatCard label={t("stats.active_validators")} value={stats ? String(stats.active_validators) : "—"} loading={statsLoading} accent="var(--purple)" />
            <StatCard label={t("stats.tokens_deployed")} value={stats ? String(stats.deployed_tokens) : "—"} loading={statsLoading} accent="var(--lime)" />
            <StatCard
              label={t("stats.total_burned")}
              value={stats ? formatBurnedSrx(stats.total_burned_srx) : "—"}
              title={stats ? `${stats.total_burned_srx.toLocaleString(undefined, { maximumFractionDigits: 8 })} SRX` : undefined}
              loading={statsLoading}
              accent="var(--red)"
            />
            <StatCard label={t("stats.block_reward")} value={stats ? `${stats.next_block_reward_srx} SRX` : "—"} loading={statsLoading} accent="var(--pink)" />
          </>
        )}
      </div>

      {/* SRX Supply progress — shows circulating / max with Playfair percent + thin bar */}
      {stats && (
        <Card>
          <CardContent className="p-6 md:p-8">
            <div className="flex items-end justify-between gap-4 mb-4 flex-wrap">
              <div className="min-w-0">
                <p className="eyebrow mb-2">Supply in Circulation</p>
                <div className="flex items-baseline gap-3">
                  <span className="font-serif font-light leading-none" style={{ fontSize: "clamp(30px, 4vw, 52px)" }}>
                    {((stats.total_minted_srx / 210_000_000) * 100).toFixed(2)}
                    <em className="not-italic text-[0.6em] ml-1 text-[var(--gold)]">%</em>
                  </span>
                  <span className="font-mono text-xs text-[var(--tx-m)]">
                    {formatSRX(stats.total_minted_srx)} of {formatNumber(210_000_000)} SRX
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-[11px] font-mono text-[var(--tx-d)] uppercase tracking-[.15em]">
                <span>Burned <span className="text-[var(--red)]">{stats.total_burned_srx.toFixed(4)}</span></span>
                <span>Next Reward <span className="text-[var(--gold)]">{stats.next_block_reward_srx} SRX</span></span>
              </div>
            </div>
            <div className="relative h-1.5 w-full rounded-full bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)] overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--gold)] to-[var(--gold-l)] rounded-full"
                style={{ width: `${Math.min(100, (stats.total_minted_srx / 210_000_000) * 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* TPS chart — fed by backend /chain/performance */}
      <StatsChart
        performance={performance}
        range={perfRange}
        onRangeChange={setPerfRange}
        loading={perfLoading}
      />

      {/* Mempool — one-line pulse card, matches the editorial rhythm without stealing the eye */}
      <Card>
        <CardContent className="px-5 py-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <span className={`w-2 h-2 rounded-full shrink-0 ${mempool && mempool.size > 0 ? "bg-[var(--orange)] animate-pulse-live" : "bg-[var(--green)]"}`} />
            <Clock className="h-4 w-4 text-[var(--tx-d)] shrink-0" />
            <span className="font-mono text-[10px] tracking-[.22em] uppercase text-[var(--tx-d)] shrink-0">Mempool</span>
            <span className="font-serif text-lg leading-none">
              {mempool ? mempool.size : "—"}
            </span>
            <span className="font-mono text-[11px] text-[var(--tx-m)]">
              {mempool && mempool.size === 1 ? "pending tx" : "pending txs"}
            </span>
          </div>
          <span className="font-mono text-[10px] text-[var(--tx-d)] tracking-[.12em] uppercase">
            {mempool && mempool.size === 0 ? "clear" : "awaiting inclusion"}
          </span>
        </CardContent>
      </Card>

      {/* Latest blocks + transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Blocks */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Blocks className="h-4 w-4 text-primary" />
                {t("latest_blocks")}
              </CardTitle>
              <Link href="/blocks" className="text-xs text-primary hover:underline">{t("view_all")}</Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-0 p-0">
            {blocksLoading && !blocks ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" style={{ opacity: 1 - i * 0.08 }} />)}
              </div>
            ) : blocks && blocks.length > 0 ? (
              <div className="divide-y divide-border/60">
                {blocks.slice(0, 10).map((block) => (
                  <div key={block.index} className="px-4 py-2.5 flex items-center justify-between gap-3 hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                        <Blocks className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <BlockHeight height={block.index} prefix="#" className="text-sm" />
                        <p className="text-[11px] text-muted-foreground">
                          <Timestamp timestamp={block.timestamp} />
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 min-w-0">
                      <p className="text-[11px] text-muted-foreground">{block.tx_count ?? block.transactions?.length ?? 0} txs</p>
                      <div className="text-[11px] font-mono truncate">
                        {block.validator_name ? (
                          <Address address={block.validator} label={block.validator_name} muted showCopy={false} />
                        ) : (
                          <Address address={block.validator} muted showCopy={false} />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <Blocks className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{t("no_blocks")}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Latest Transactions */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-primary" />
                {t("latest_transactions")}
              </CardTitle>
              <Link href="/blocks" className="text-xs text-primary hover:underline">{t("view_all")}</Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-0 p-0">
            {txsLoading && !txs ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" style={{ opacity: 1 - i * 0.08 }} />)}
              </div>
            ) : txs && txs.length > 0 ? (
              <div className="divide-y divide-border/60">
                {txs.map((tx) => {
                  const success = tx.status !== "failed";
                  return (
                    <div key={tx.id} className="px-4 py-2.5 flex items-center justify-between gap-3 hover:bg-muted/40 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`h-8 w-8 rounded-md flex items-center justify-center shrink-0 ${success ? "bg-green-500/10" : "bg-red-500/10"}`}>
                          <ArrowUpDown className={`h-3.5 w-3.5 ${success ? "text-green-500" : "text-red-500"}`} />
                        </div>
                        <div className="min-w-0">
                          <TxHash hash={tx.id} />
                          <p className="text-[11px] text-muted-foreground">
                            <Timestamp timestamp={tx.timestamp} />
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 min-w-0">
                        <div className="text-[11px] font-mono truncate">
                          <Address address={tx.from} muted showCopy={false} />
                        </div>
                        <p className="text-xs font-semibold font-mono">{tx.amount} SRX</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center">
                <ArrowUpDown className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{t("no_transactions")}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </div>
    </>
  );
}
