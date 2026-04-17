"use client";

import Link from "next/link";
import { Coins } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CopyButton } from "@/components/copy-button";
import { useNetwork } from "@/lib/network-context";
import { useTokens } from "@/lib/hooks";
import { formatNumber, shortenAddress } from "@/lib/format";

export default function TokensPage() {
  const { network } = useNetwork();
  const { data: tokens, loading } = useTokens(network);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Coins className="h-6 w-6 text-blue-500" />
        <h1 className="text-2xl font-bold">SRC-20 Tokens</h1>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-muted-foreground font-normal">
            Deployed tokens on {network === "mainnet" ? "Mainnet" : "Testnet"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : tokens && tokens.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-4 py-3 font-medium">#</th>
                    <th className="px-4 py-3 font-medium">Token</th>
                    <th className="px-4 py-3 font-medium">Contract</th>
                    <th className="px-4 py-3 font-medium text-right">Decimals</th>
                    <th className="px-4 py-3 font-medium text-right">Total Supply</th>
                    <th className="px-4 py-3 font-medium text-right hidden md:table-cell">Holders</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {tokens.map((token, i) => (
                    <tr key={token.contract_address} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                      <td className="px-4 py-3">
                        <div>
                          <span className="font-medium">{token.name}</span>
                          <span className="text-muted-foreground ml-1 text-xs">({token.symbol})</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Link href={`/tokens/${token.contract_address}`} className="font-mono text-xs text-blue-500 hover:underline">
                            {shortenAddress(token.contract_address)}
                          </Link>
                          <CopyButton text={token.contract_address} />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono">{token.decimals}</td>
                      <td className="px-4 py-3 text-right font-mono">{formatNumber(token.total_supply)}</td>
                      <td className="px-4 py-3 text-right font-mono hidden md:table-cell">{token.holders ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No SRC-20 tokens deployed yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
