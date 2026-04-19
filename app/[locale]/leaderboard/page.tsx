"use client";

import { useMemo, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Trophy, ArrowUpDown, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Address } from "@/components/common/Address";
import { Pagination } from "@/components/common/Pagination";
import { useNetwork } from "@/lib/network-context";
import { useStats, useValidators } from "@/lib/hooks";
import { fetchAccountBalance, type AccountBalance } from "@/lib/api";
import { formatNumber } from "@/lib/format";

type SortKey = "balance" | "txs" | "none";
const PAGE_SIZE = 25;

interface LeaderboardRow {
  rank: number;
  address: string;
  name?: string;
  balance: number;
  share: number;
  txCount?: number;
  isMock: boolean;
}

// DECISION: Backend has no /accounts/top endpoint yet, so we live-fetch balances for the known
// validator addresses and pad with deterministic mock rows to demo the page. Total supply comes
// from /chain/info to keep the % share column truthful for real rows.
// TODO(api): needs GET /accounts/top?sort=balance&limit=N — replace useLeaderboard() when shipped.
function useLeaderboard() {
  const { network } = useNetwork();
  const { data: validators } = useValidators(network);
  const { data: stats } = useStats(network);
  const [balances, setBalances] = useState<Record<string, AccountBalance | null>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!validators || validators.length === 0) return;
    let cancelled = false;
    Promise.all(
      validators.map(async (v) => [v.address, await fetchAccountBalance(network, v.address)] as const),
    ).then((pairs) => {
      if (cancelled) return;
      setBalances(Object.fromEntries(pairs));
      setLoaded(true);
    });
    return () => { cancelled = true; };
  }, [validators, network]);

  const totalSupply = stats?.total_minted_srx ?? 210_000_000;

  const rows = useMemo<LeaderboardRow[]>(() => {
    // DECISION: only show real validator balances. Skip mock padding — it read as fake on first
    // look and made the page feel broken. Real ranking will replace this when /accounts/top ships.
    return (validators ?? [])
      .map((v) => {
        const bal = balances[v.address];
        const balance = bal?.balance ?? 0;
        return {
          rank: 0,
          address: v.address,
          name: v.name,
          balance,
          share: totalSupply > 0 ? (balance / totalSupply) * 100 : 0,
          txCount: v.blocks_produced,
          isMock: false,
        };
      })
      .filter((r) => r.balance > 0)
      .sort((a, b) => b.balance - a.balance)
      .map((r, i) => ({ ...r, rank: i + 1 }));
  }, [validators, balances, totalSupply]);

  return { rows, loading: !loaded && rows.length === 0 };
}

export default function LeaderboardPage() {
  const t = useTranslations("leaderboard");
  const { rows, loading } = useLeaderboard();
  const [sortKey, setSortKey] = useState<SortKey>("balance");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    if (sortKey === "none") return rows;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = sortKey === "balance" ? a.balance : (a.txCount ?? 0);
      const bv = sortKey === "balance" ? b.balance : (b.txCount ?? 0);
      return (av - bv) * dir;
    });
  }, [rows, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir("desc"); }
  }

  function SortHeader({ label, k }: { label: string; k: SortKey }) {
    const active = sortKey === k;
    return (
      <button
        onClick={() => toggleSort(k)}
        className={`inline-flex items-center gap-1 text-xs font-medium justify-end w-full hover:text-foreground ${active ? "text-foreground" : "text-muted-foreground"}`}
      >
        {label}
        <ArrowUpDown className="h-3 w-3 opacity-50" />
      </button>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
          <Trophy className="h-5 w-5 text-amber-500" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("eyebrow")}</p>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        </div>
      </div>

      {/* Notice */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 text-sm">
        <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
        <div className="text-xs text-muted-foreground leading-relaxed">
          {t("partial_notice")}
        </div>
      </div>

      <Tabs defaultValue="holders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="holders">{t("tab_holders")}</TabsTrigger>
          <TabsTrigger value="active">{t("tab_active")}</TabsTrigger>
        </TabsList>

        <TabsContent value="holders">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground font-normal">{t("subtitle")}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-4 space-y-2">
                  {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" style={{ opacity: 1 - i * 0.08 }} />)}
                </div>
              ) : sorted.length === 0 ? (
                <div className="p-12 text-center">
                  <Trophy className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">{t("empty_title")}</p>
                  <p className="text-xs text-muted-foreground/80 mt-1">{t("empty_hint")}</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-xs text-muted-foreground bg-muted/30">
                          <th className="px-4 py-2.5 font-medium w-14">{t("rank")}</th>
                          <th className="px-4 py-2.5 font-medium">{t("account")}</th>
                          <th className="px-4 py-2.5 font-medium text-right"><SortHeader label={t("balance")} k="balance" /></th>
                          <th className="px-4 py-2.5 font-medium text-right hidden md:table-cell">{t("share")}</th>
                          <th className="px-4 py-2.5 font-medium text-right hidden lg:table-cell"><SortHeader label={t("txs")} k="txs" /></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60 row-hover">
                        {paged.map((r) => (
                          <tr key={r.address}>
                            <td className="px-4 py-2.5">
                              <span className={`inline-flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold ${
                                r.rank === 1 ? "bg-amber-500/15 text-amber-500"
                                : r.rank === 2 ? "bg-gray-400/15 text-gray-400"
                                : r.rank === 3 ? "bg-orange-600/15 text-orange-500"
                                : "bg-muted text-muted-foreground"
                              }`}>
                                {r.rank}
                              </span>
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="flex flex-col gap-0.5">
                                {r.name && (
                                  <span className="font-medium text-sm">{r.name}</span>
                                )}
                                <Address address={r.address} muted className="text-xs" />
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-right font-mono">
                              {formatNumber(r.balance)} SRX
                            </td>
                            <td className="px-4 py-2.5 text-right font-mono hidden md:table-cell text-muted-foreground">
                              {r.share.toFixed(4)}%
                            </td>
                            <td className="px-4 py-2.5 text-right font-mono hidden lg:table-cell text-muted-foreground">
                              {r.txCount !== undefined ? formatNumber(r.txCount) : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {sorted.length > PAGE_SIZE && (
                    <div className="border-t border-border">
                      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active">
          <Card>
            <CardContent className="p-12 text-center">
              {/* TODO(api): needs GET /accounts/top?sort=tx_count — placeholder */}
              <Trophy className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{t("active_soon")}</p>
              <p className="text-xs text-muted-foreground/80 mt-1">{t("active_soon_hint")}</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
