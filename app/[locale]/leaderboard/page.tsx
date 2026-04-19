"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Trophy, ArrowUpDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Address } from "@/components/common/Address";
import { Pagination } from "@/components/common/Pagination";
import { useNetwork } from "@/lib/network-context";
import { useRichlist, useValidators } from "@/lib/hooks";
import { formatNumber } from "@/lib/format";

type SortKey = "balance" | "none";
const PAGE_SIZE = 25;

export default function LeaderboardPage() {
  const t = useTranslations("leaderboard");
  const { network } = useNetwork();
  const { data: holders, loading } = useRichlist(network, 100);
  const { data: validators } = useValidators(network);
  const [sortKey, setSortKey] = useState<SortKey>("balance");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  // Cross-reference validator names onto known addresses for nicer display
  const nameByAddress = useMemo(() => {
    const map: Record<string, string> = {};
    (validators ?? []).forEach((v) => {
      if (v.name) map[v.address.toLowerCase()] = v.name;
    });
    return map;
  }, [validators]);

  const sorted = useMemo(() => {
    if (!holders || sortKey === "none") return holders ?? [];
    const dir = sortDir === "asc" ? 1 : -1;
    return [...holders].sort((a, b) => (a.balance - b.balance) * dir);
  }, [holders, sortKey, sortDir]);

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
        {holders && holders.length > 0 && (
          <span className="text-xs px-2 py-1 rounded-md bg-muted/60 border border-border text-muted-foreground font-mono">
            Top {holders.length}
          </span>
        )}
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
                  {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" style={{ opacity: 1 - i * 0.08 }} />)}
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
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60 row-hover">
                        {paged.map((r) => {
                          const name = nameByAddress[r.address.toLowerCase()];
                          return (
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
                                  {name && <span className="font-medium text-sm">{name}</span>}
                                  <Address address={r.address} muted className="text-xs" />
                                </div>
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono">
                                {formatNumber(r.balance)} SRX
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono hidden md:table-cell text-muted-foreground">
                                {r.share.toFixed(4)}%
                              </td>
                            </tr>
                          );
                        })}
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
