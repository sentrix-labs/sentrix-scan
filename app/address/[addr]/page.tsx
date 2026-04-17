"use client";

import { use, useState } from "react";
import Link from "next/link";
import { Wallet, ArrowUpDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CopyButton } from "@/components/copy-button";
import { useNetwork } from "@/lib/network-context";
import { useAddress, useAddressHistory } from "@/lib/hooks";
import { formatSRX, shortenHash, shortenAddress, timeAgo } from "@/lib/format";

export default function AddressDetailPage({ params }: { params: Promise<{ addr: string }> }) {
  const { addr } = use(params);
  const { network } = useNetwork();
  const [page, setPage] = useState(1);
  const { data: account, loading: accountLoading } = useAddress(network, addr);
  const { data: history, loading: historyLoading } = useAddressHistory(network, addr, page);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Wallet className="h-6 w-6 text-blue-500" />
        <h1 className="text-2xl font-bold">Address</h1>
      </div>

      {/* Address bar */}
      <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-3">
        <span className="text-sm font-mono break-all">{addr}</span>
        <CopyButton text={addr} />
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

      {/* Transaction history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-blue-500" />
            Transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {historyLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : history && history.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="px-4 py-3 font-medium">Tx Hash</th>
                      <th className="px-4 py-3 font-medium">Age</th>
                      <th className="px-4 py-3 font-medium">From</th>
                      <th className="px-4 py-3 font-medium">To</th>
                      <th className="px-4 py-3 font-medium text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {history.map((tx) => {
                      const isIn = tx.to.toLowerCase() === addr.toLowerCase();
                      return (
                        <tr key={tx.id} className="hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-3 font-mono">
                            <Link href={`/tx/${tx.id}`} className="text-blue-500 hover:underline">{shortenHash(tx.id)}</Link>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{timeAgo(tx.timestamp)}</td>
                          <td className="px-4 py-3 font-mono text-xs">
                            {tx.from.toLowerCase() === addr.toLowerCase()
                              ? <span className="text-muted-foreground">{shortenAddress(tx.from)}</span>
                              : <Link href={`/address/${tx.from}`} className="text-blue-500 hover:underline">{shortenAddress(tx.from)}</Link>
                            }
                          </td>
                          <td className="px-4 py-3 font-mono text-xs">
                            {tx.to.toLowerCase() === addr.toLowerCase()
                              ? <span className="text-muted-foreground">{shortenAddress(tx.to)}</span>
                              : <Link href={`/address/${tx.to}`} className="text-blue-500 hover:underline">{shortenAddress(tx.to)}</Link>
                            }
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={isIn ? "text-green-500" : "text-red-500"}>
                              {isIn ? "+" : "-"}{tx.amount} SRX
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-center gap-2 p-4 border-t border-border">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-1.5 text-xs text-muted-foreground">Page {page}</span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={!history || history.length < 20}
                  className="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No transactions found for this address.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
