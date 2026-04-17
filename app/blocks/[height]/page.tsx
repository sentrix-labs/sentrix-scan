"use client";

import { use } from "react";
import Link from "next/link";
import { Blocks, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CopyButton } from "@/components/copy-button";
import { useNetwork } from "@/lib/network-context";
import { useBlock } from "@/lib/hooks";
import { formatTimestamp, shortenHash, shortenAddress, timeAgo } from "@/lib/format";

export default function BlockDetailPage({ params }: { params: Promise<{ height: string }> }) {
  const { height } = use(params);
  const { network } = useNetwork();
  const blockHeight = parseInt(height, 10);
  const { data: block, loading } = useBlock(network, blockHeight);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!block) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Block #{height} not found</p>
            <Link href="/blocks" className="text-blue-500 hover:underline text-sm mt-2 inline-block">Back to blocks</Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Blocks className="h-6 w-6 text-blue-500" />
          <h1 className="text-2xl font-bold">Block #{block.index.toLocaleString()}</h1>
        </div>
        <div className="flex gap-2">
          {blockHeight > 0 && (
            <Link href={`/blocks/${blockHeight - 1}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5">
              <ChevronLeft className="h-4 w-4" /> Prev
            </Link>
          )}
          <Link href={`/blocks/${blockHeight + 1}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5">
            Next <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Block info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoRow label="Block Height" value={block.index.toLocaleString()} />
          <InfoRow label="Timestamp" value={`${formatTimestamp(block.timestamp)} (${timeAgo(block.timestamp)})`} />
          <InfoRow label="Transactions" value={String(block.transactions?.length || 0)} />
          <div className="flex flex-col sm:flex-row gap-2 py-2 border-b border-border">
            <span className="text-sm text-muted-foreground sm:w-48 shrink-0">Block Hash</span>
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-sm font-mono break-all">{block.hash}</span>
              <CopyButton text={block.hash} />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 py-2 border-b border-border">
            <span className="text-sm text-muted-foreground sm:w-48 shrink-0">Parent Hash</span>
            <div className="flex items-center gap-1 min-w-0">
              <Link href={blockHeight > 0 ? `/blocks/${blockHeight - 1}` : "#"} className="text-sm font-mono text-blue-500 hover:underline break-all">
                {block.previous_hash}
              </Link>
              <CopyButton text={block.previous_hash} />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 py-2 border-b border-border">
            <span className="text-sm text-muted-foreground sm:w-48 shrink-0">Validator</span>
            <div className="flex items-center gap-2">
              <Link href={`/address/${block.validator}`} className="text-sm font-mono text-blue-500 hover:underline">
                {block.validator}
              </Link>
              {block.validator_name && <Badge variant="secondary">{block.validator_name}</Badge>}
              <CopyButton text={block.validator} />
            </div>
          </div>
          <InfoRow label="Merkle Root" value={block.merkle_root} mono />
        </CardContent>
      </Card>

      {/* Transactions */}
      {block.transactions && block.transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Transactions ({block.transactions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Tx Hash</th>
                    <th className="px-4 py-3 font-medium">From</th>
                    <th className="px-4 py-3 font-medium">To</th>
                    <th className="px-4 py-3 font-medium text-right">Amount</th>
                    <th className="px-4 py-3 font-medium text-right">Fee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {block.transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 font-mono">
                        <Link href={`/tx/${tx.id}`} className="text-blue-500 hover:underline">{shortenHash(tx.id)}</Link>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        <Link href={`/address/${tx.from}`} className="text-muted-foreground hover:text-blue-500">{shortenAddress(tx.from)}</Link>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        <Link href={`/address/${tx.to}`} className="text-muted-foreground hover:text-blue-500">{shortenAddress(tx.to)}</Link>
                      </td>
                      <td className="px-4 py-3 text-right">{tx.amount} SRX</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{tx.fee} SRX</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 py-2 border-b border-border">
      <span className="text-sm text-muted-foreground sm:w-48 shrink-0">{label}</span>
      <span className={`text-sm ${mono ? "font-mono break-all" : ""}`}>{value}</span>
    </div>
  );
}
