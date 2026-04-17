"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import {
  Blocks, ArrowUpDown, Users, Clock, Search, Activity, Layers,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CopyButton } from "@/components/copy-button";
import { useNetwork } from "@/lib/network-context";
import { useStats, useBlocks, useTransactions } from "@/lib/hooks";
import { formatNumber, formatSRX, shortenHash, shortenAddress, timeAgo } from "@/lib/format";
import { detectSearchType } from "@/lib/format";

function StatCard({ icon: Icon, label, value, loading }: {
  icon: React.ElementType; label: string; value: string; loading: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5 text-blue-500" />
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

export default function HomePage() {
  const { network } = useNetwork();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { data: stats, loading: statsLoading } = useStats(network);
  const { data: blocks, loading: blocksLoading } = useBlocks(network, 8);
  const { data: txs, loading: txsLoading } = useTransactions(network, 8);

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
          Sentrix <span className="text-blue-500">Scan</span>
        </h1>
        <p className="text-muted-foreground text-sm">
          Block explorer for Sentrix Chain
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
              placeholder="Search by block height, tx hash, or address..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>
        </form>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Blocks} label="Block Height" value={stats ? formatNumber(stats.height) : "-"} loading={statsLoading} />
        <StatCard icon={Clock} label="Block Time" value="~3s" loading={false} />
        <StatCard icon={Users} label="Active Validators" value={stats ? String(stats.active_validators) : "-"} loading={statsLoading} />
        <StatCard icon={Activity} label="Mempool" value={stats ? `${stats.mempool_size} tx` : "-"} loading={statsLoading} />
        <StatCard icon={Layers} label="Total Minted" value={stats ? formatSRX(stats.total_minted_srx) : "-"} loading={statsLoading} />
        <StatCard icon={ArrowUpDown} label="Total Burned" value={stats ? `${stats.total_burned_srx.toFixed(4)} SRX` : "-"} loading={statsLoading} />
        <StatCard icon={Layers} label="Tokens Deployed" value={stats ? String(stats.deployed_tokens) : "-"} loading={statsLoading} />
        <StatCard icon={ArrowUpDown} label="Block Reward" value={stats ? `${stats.next_block_reward_srx} SRX` : "-"} loading={statsLoading} />
      </div>

      {/* Latest blocks + transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Blocks */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Blocks className="h-4 w-4 text-blue-500" />
                Latest Blocks
              </CardTitle>
              <Link href="/blocks" className="text-xs text-blue-500 hover:underline">View all</Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-0 p-0">
            {blocksLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : blocks && blocks.length > 0 ? (
              <div className="divide-y divide-border">
                {blocks.map((block) => (
                  <div key={block.index} className="px-4 py-3 flex items-center justify-between gap-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                        <Blocks className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="min-w-0">
                        <Link href={`/blocks/${block.index}`} className="text-sm font-medium text-blue-500 hover:underline">
                          #{formatNumber(block.index)}
                        </Link>
                        <p className="text-xs text-muted-foreground">{timeAgo(block.timestamp)}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">{block.transactions?.length || 0} txs</p>
                      <p className="text-xs font-mono text-muted-foreground">{block.validator_name || shortenAddress(block.validator)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">No blocks available. Chain might be unreachable.</div>
            )}
          </CardContent>
        </Card>

        {/* Latest Transactions */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-blue-500" />
                Latest Transactions
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-0 p-0">
            {txsLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : txs && txs.length > 0 ? (
              <div className="divide-y divide-border">
                {txs.map((tx) => (
                  <div key={tx.id} className="px-4 py-3 flex items-center justify-between gap-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                        <ArrowUpDown className="h-4 w-4 text-green-500" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <Link href={`/tx/${tx.id}`} className="text-sm font-mono text-blue-500 hover:underline">{shortenHash(tx.id)}</Link>
                          <CopyButton text={tx.id} />
                        </div>
                        <p className="text-xs text-muted-foreground">{timeAgo(tx.timestamp)}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-mono">
                        <Link href={`/address/${tx.from}`} className="text-muted-foreground hover:text-blue-500">{shortenAddress(tx.from)}</Link>
                      </p>
                      <p className="text-xs font-semibold">{tx.amount} SRX</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">No transactions yet.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
