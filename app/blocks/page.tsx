"use client";

import Link from "next/link";
import { Blocks } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useNetwork } from "@/lib/network-context";
import { useBlocks } from "@/lib/hooks";
import { formatNumber, shortenAddress, shortenHash, timeAgo } from "@/lib/format";

export default function BlocksPage() {
  const { network } = useNetwork();
  const { data: blocks, loading } = useBlocks(network, 50);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Blocks className="h-6 w-6 text-blue-500" />
        <h1 className="text-2xl font-bold">Blocks</h1>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-muted-foreground font-normal">
            Latest blocks on {network === "mainnet" ? "Mainnet" : "Testnet"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Block</th>
                    <th className="px-4 py-3 font-medium">Age</th>
                    <th className="px-4 py-3 font-medium">Txs</th>
                    <th className="px-4 py-3 font-medium hidden md:table-cell">Hash</th>
                    <th className="px-4 py-3 font-medium">Validator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {blocks?.map((block) => (
                    <tr key={block.index} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/blocks/${block.index}`} className="text-blue-500 hover:underline font-mono">
                          {formatNumber(block.index)}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{timeAgo(block.timestamp)}</td>
                      <td className="px-4 py-3">{block.transactions?.length || 0}</td>
                      <td className="px-4 py-3 font-mono text-muted-foreground hidden md:table-cell">{shortenHash(block.hash)}</td>
                      <td className="px-4 py-3 font-mono text-xs">
                        <Link href={`/address/${block.validator}`} className="text-muted-foreground hover:text-blue-500">
                          {block.validator_name || shortenAddress(block.validator)}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!blocks || blocks.length === 0) && (
                <div className="p-8 text-center text-sm text-muted-foreground">No blocks found.</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
