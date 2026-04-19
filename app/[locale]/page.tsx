"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Link } from "@/i18n/navigation";
import {
  Blocks, ArrowUpDown, Users, Clock, Search, Activity, Layers, Coins, Gift,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCardSkeleton } from "@/components/common/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { Address } from "@/components/common/Address";
import { TxHash } from "@/components/common/TxHash";
import { BlockHeight } from "@/components/common/BlockHeight";
import { Timestamp } from "@/components/common/Timestamp";
import { StatsChart } from "@/components/home/StatsChart";
import { useNetwork } from "@/lib/network-context";
import { useStats, useBlocks, useTransactions } from "@/lib/hooks";
import { formatNumber, formatSRX } from "@/lib/format";
import { detectSearchType } from "@/lib/format";

function StatCard({
  icon: Icon,
  label,
  value,
  loading,
  iconColor = "text-blue-500",
  iconBg = "bg-blue-500/10",
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  loading: boolean;
  iconColor?: string;
  iconBg?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className={`h-10 w-10 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="h-5 w-20 mt-1" />
          ) : (
            <p className="text-lg font-semibold font-mono truncate">{value}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// DECISION: compute block time from last N blocks instead of hardcoded "~3s"
function computeBlockTime(timestamps: string[]): string {
  if (timestamps.length < 2) return "~3s";
  const sorted = timestamps.map((t) => new Date(t).getTime()).sort((a, b) => b - a);
  const diffs: number[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    diffs.push(sorted[i] - sorted[i + 1]);
  }
  const avg = diffs.reduce((a, b) => a + b, 0) / diffs.length / 1000;
  if (!isFinite(avg) || avg <= 0) return "~3s";
  return `${avg.toFixed(1)}s`;
}

export default function HomePage() {
  const t = useTranslations("home");
  const { network } = useNetwork();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { data: stats, loading: statsLoading } = useStats(network);
  const { data: blocks, loading: blocksLoading } = useBlocks(network, 30);
  const { data: txs, loading: txsLoading } = useTransactions(network, 10);

  const blockTime = blocks ? computeBlockTime(blocks.map((b) => b.timestamp)) : "~3s";

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
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Hero search */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">
          {t("title_prefix")} <span className="text-blue-500">{t("title_suffix")}</span>
        </h1>
        <p className="text-muted-foreground text-sm">
          {t("description")}
          <span className="inline-flex items-center gap-1.5 ml-2 text-xs px-2 py-0.5 rounded-full bg-muted">
            <span className={`w-1.5 h-1.5 rounded-full ${network === "mainnet" ? "bg-green-500" : "bg-orange-500"}`} />
            {network === "mainnet" ? "Chain ID 7119" : "Chain ID 7120"}
          </span>
        </p>

        <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder={t("search_placeholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>
        </form>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading && !stats ? (
          Array.from({ length: 8 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard icon={Blocks} label={t("stats.block_height")} value={stats ? formatNumber(stats.height) : "-"} loading={statsLoading} />
            <StatCard icon={Clock} label={t("stats.block_time")} value={blockTime} loading={false} iconColor="text-cyan-500" iconBg="bg-cyan-500/10" />
            <StatCard icon={Users} label={t("stats.active_validators")} value={stats ? String(stats.active_validators) : "-"} loading={statsLoading} iconColor="text-purple-500" iconBg="bg-purple-500/10" />
            <StatCard icon={Activity} label={t("stats.mempool")} value={stats ? `${stats.mempool_size} tx` : "-"} loading={statsLoading} iconColor="text-orange-500" iconBg="bg-orange-500/10" />
            <StatCard icon={Layers} label={t("stats.total_minted")} value={stats ? formatSRX(stats.total_minted_srx) : "-"} loading={statsLoading} iconColor="text-green-500" iconBg="bg-green-500/10" />
            <StatCard icon={ArrowUpDown} label={t("stats.total_burned")} value={stats ? `${stats.total_burned_srx.toFixed(4)} SRX` : "-"} loading={statsLoading} iconColor="text-red-500" iconBg="bg-red-500/10" />
            <StatCard icon={Coins} label={t("stats.tokens_deployed")} value={stats ? String(stats.deployed_tokens) : "-"} loading={statsLoading} iconColor="text-yellow-500" iconBg="bg-yellow-500/10" />
            <StatCard icon={Gift} label={t("stats.block_reward")} value={stats ? `${stats.next_block_reward_srx} SRX` : "-"} loading={statsLoading} iconColor="text-pink-500" iconBg="bg-pink-500/10" />
          </>
        )}
      </div>

      {/* TPS chart */}
      <StatsChart blocks={blocks} />

      {/* Latest blocks + transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Blocks */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Blocks className="h-4 w-4 text-blue-500" />
                {t("latest_blocks")}
              </CardTitle>
              <Link href="/blocks" className="text-xs text-blue-500 hover:underline">{t("view_all")}</Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-0 p-0">
            {blocksLoading && !blocks ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : blocks && blocks.length > 0 ? (
              <div className="divide-y divide-border">
                {blocks.slice(0, 10).map((block) => (
                  <div key={block.index} className="px-4 py-3 flex items-center justify-between gap-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                        <Blocks className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="min-w-0">
                        <BlockHeight height={block.index} prefix="#" className="text-sm" />
                        <p className="text-xs text-muted-foreground">
                          <Timestamp timestamp={block.timestamp} />
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">{block.transactions?.length || 0} txs</p>
                      <div className="text-xs font-mono">
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
              <div className="p-8 text-center text-sm text-muted-foreground">{t("no_blocks")}</div>
            )}
          </CardContent>
        </Card>

        {/* Latest Transactions */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-blue-500" />
                {t("latest_transactions")}
              </CardTitle>
              <Link href="/blocks" className="text-xs text-blue-500 hover:underline">{t("view_all")}</Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-0 p-0">
            {txsLoading && !txs ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : txs && txs.length > 0 ? (
              <div className="divide-y divide-border">
                {txs.map((tx) => {
                  const success = tx.status !== "failed";
                  return (
                    <div key={tx.id} className="px-4 py-3 flex items-center justify-between gap-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${success ? "bg-green-500/10" : "bg-red-500/10"}`}>
                          <ArrowUpDown className={`h-4 w-4 ${success ? "text-green-500" : "text-red-500"}`} />
                        </div>
                        <div className="min-w-0">
                          <TxHash hash={tx.id} />
                          <p className="text-xs text-muted-foreground">
                            <Timestamp timestamp={tx.timestamp} />
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-mono">
                          <Address address={tx.from} muted showCopy={false} />
                        </div>
                        <p className="text-xs font-semibold">{tx.amount} SRX</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">{t("no_transactions")}</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
