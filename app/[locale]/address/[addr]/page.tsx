"use client";

import { use, useState } from "react";
import { Wallet, ArrowDown, ArrowUp, ArrowLeftRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Address } from "@/components/common/Address";
import { TxHash } from "@/components/common/TxHash";
import { Timestamp } from "@/components/common/Timestamp";
import { Copyable } from "@/components/common/Copyable";
import { Pagination } from "@/components/common/Pagination";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useNetwork } from "@/lib/network-context";
import { useAddress, useAddressHistory } from "@/lib/hooks";
import { formatSRX } from "@/lib/format";

type DirFilter = "all" | "in" | "out";

export default function AddressDetailPage({ params }: { params: Promise<{ addr: string }> }) {
  const { addr } = use(params);
  const { network } = useNetwork();
  const [page, setPage] = useState(1);
  const [dirFilter, setDirFilter] = useState<DirFilter>("all");
  const { data: account, loading: accountLoading } = useAddress(network, addr);
  const { data: history, loading: historyLoading } = useAddressHistory(network, addr, page);

  const filtered = (history ?? []).filter((tx) => {
    if (dirFilter === "all") return true;
    const isIn = tx.to.toLowerCase() === addr.toLowerCase();
    return dirFilter === "in" ? isIn : !isIn;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
          <Wallet className="h-5 w-5 text-blue-500" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Address</p>
          <h1 className="text-2xl font-bold tracking-tight">Account</h1>
        </div>
      </div>

      {/* Address bar */}
      <div className="flex items-center gap-2 bg-muted/40 rounded-lg p-3 border border-border/60">
        <span className="text-sm font-mono break-all flex-1" data-address={addr}>{addr}</span>
        <Copyable text={addr} bare />
      </div>

      {/* Balance card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Balance</p>
            {accountLoading ? (
              <Skeleton className="h-6 w-32" />
            ) : (
              <p className="text-xl font-semibold font-mono">
                {account ? formatSRX(account.balance) : "0 SRX"}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Nonce</p>
            {accountLoading ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <p className="text-xl font-semibold font-mono">
                {account ? account.nonce : 0}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="history" className="space-y-4">
        <TabsList>
          <TabsTrigger value="history">Transactions</TabsTrigger>
          <TabsTrigger value="tokens">Tokens</TabsTrigger>
        </TabsList>

        <TabsContent value="history">
          <Card>
            <CardContent className="p-0">
              {/* Filter bar */}
              <div className="flex items-center gap-2 p-3 border-b border-border">
                <span className="text-xs text-muted-foreground mr-2">Filter:</span>
                {(["all", "in", "out"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setDirFilter(f)}
                    className={`text-xs px-3 py-1 rounded-md border transition-colors ${
                      dirFilter === f
                        ? "bg-blue-500/10 text-blue-500 border-blue-500/30"
                        : "border-border text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {f === "all" ? "All" : f === "in" ? "Inbound" : "Outbound"}
                  </button>
                ))}
              </div>
              {historyLoading && !history ? (
                <div className="p-4 space-y-2">
                  {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : filtered.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-xs text-muted-foreground bg-muted/30">
                          <th className="px-4 py-2.5 font-medium"></th>
                          <th className="px-4 py-2.5 font-medium">Tx Hash</th>
                          <th className="px-4 py-2.5 font-medium">Age</th>
                          <th className="px-4 py-2.5 font-medium">From</th>
                          <th className="px-4 py-2.5 font-medium">To</th>
                          <th className="px-4 py-2.5 font-medium">Status</th>
                          <th className="px-4 py-2.5 font-medium text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60 row-hover">
                        {filtered.map((tx) => {
                          const isIn = tx.to.toLowerCase() === addr.toLowerCase();
                          const isSelf = isIn && tx.from.toLowerCase() === addr.toLowerCase();
                          const dirIcon = isSelf ? <ArrowLeftRight className="h-3.5 w-3.5 text-muted-foreground" /> : isIn ? <ArrowDown className="h-3.5 w-3.5 text-green-500" /> : <ArrowUp className="h-3.5 w-3.5 text-red-500" />;
                          const success = tx.status !== "failed";
                          return (
                            <tr key={tx.id}>
                              <td className="px-3 py-2.5">{dirIcon}</td>
                              <td className="px-4 py-2.5"><TxHash hash={tx.id} /></td>
                              <td className="px-4 py-2.5 text-muted-foreground text-xs">
                                <Timestamp timestamp={tx.timestamp} />
                              </td>
                              <td className="px-4 py-2.5">
                                {tx.from.toLowerCase() === addr.toLowerCase() ? (
                                  <span className="font-mono text-xs text-muted-foreground" data-address={tx.from} title={tx.from}>
                                    {tx.from.slice(0, 8)}...{tx.from.slice(-6)}
                                  </span>
                                ) : (
                                  <Address address={tx.from} showCopy={false} className="text-xs" />
                                )}
                              </td>
                              <td className="px-4 py-2.5">
                                {tx.to.toLowerCase() === addr.toLowerCase() ? (
                                  <span className="font-mono text-xs text-muted-foreground" data-address={tx.to} title={tx.to}>
                                    {tx.to.slice(0, 8)}...{tx.to.slice(-6)}
                                  </span>
                                ) : (
                                  <Address address={tx.to} showCopy={false} className="text-xs" />
                                )}
                              </td>
                              <td className="px-4 py-2.5">
                                <StatusBadge status={success ? "success" : "failed"} />
                              </td>
                              <td className="px-4 py-2.5 text-right">
                                <span className={isSelf ? "" : isIn ? "text-green-500 font-mono" : "text-red-500 font-mono"}>
                                  {isSelf ? "" : isIn ? "+" : "-"}{tx.amount} SRX
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="border-t border-border">
                    <Pagination
                      page={page}
                      hasMore={history ? history.length >= 20 : false}
                      onPageChange={setPage}
                    />
                  </div>
                </>
              ) : (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No transactions found for this address.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tokens">
          <Card>
            <CardContent className="p-8 text-center">
              {/* TODO(api): needs GET /accounts/{address}/tokens — using placeholder */}
              <p className="text-sm text-muted-foreground">No SRC-20 token holdings found.</p>
              <p className="text-xs text-muted-foreground mt-2">Token balance tracking is being wired up on the backend.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
