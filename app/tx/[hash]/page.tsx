"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowUpDown, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CopyButton } from "@/components/copy-button";
import { useNetwork } from "@/lib/network-context";
import { useTransaction } from "@/lib/hooks";
import { formatTimestamp, timeAgo } from "@/lib/format";

export default function TxDetailPage({ params }: { params: Promise<{ hash: string }> }) {
  const { hash } = use(params);
  const { network } = useNetwork();
  const { data: tx, loading } = useTransaction(network, hash);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (!tx) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Transaction not found</p>
            <p className="text-xs font-mono text-muted-foreground mt-2 break-all">{hash}</p>
            <Link href="/" className="text-blue-500 hover:underline text-sm mt-4 inline-block">Back to home</Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isSuccess = tx.status !== "failed";

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <ArrowUpDown className="h-6 w-6 text-blue-500" />
        <h1 className="text-2xl font-bold">Transaction Details</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2 py-2 border-b border-border">
            <span className="text-sm text-muted-foreground sm:w-48 shrink-0">Transaction Hash</span>
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-sm font-mono break-all">{tx.id}</span>
              <CopyButton text={tx.id} />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 py-2 border-b border-border">
            <span className="text-sm text-muted-foreground sm:w-48 shrink-0">Status</span>
            <Badge variant={isSuccess ? "default" : "destructive"} className="w-fit gap-1.5">
              {isSuccess ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
              {isSuccess ? "Success" : "Failed"}
            </Badge>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 py-2 border-b border-border">
            <span className="text-sm text-muted-foreground sm:w-48 shrink-0">Timestamp</span>
            <span className="text-sm">{formatTimestamp(tx.timestamp)} ({timeAgo(tx.timestamp)})</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 py-2 border-b border-border">
            <span className="text-sm text-muted-foreground sm:w-48 shrink-0">From</span>
            <div className="flex items-center gap-1">
              <Link href={`/address/${tx.from}`} className="text-sm font-mono text-blue-500 hover:underline break-all">{tx.from}</Link>
              <CopyButton text={tx.from} />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 py-2 border-b border-border">
            <span className="text-sm text-muted-foreground sm:w-48 shrink-0">To</span>
            <div className="flex items-center gap-1">
              <Link href={`/address/${tx.to}`} className="text-sm font-mono text-blue-500 hover:underline break-all">{tx.to}</Link>
              <CopyButton text={tx.to} />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 py-2 border-b border-border">
            <span className="text-sm text-muted-foreground sm:w-48 shrink-0">Value</span>
            <span className="text-sm font-semibold">{tx.amount} SRX</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 py-2 border-b border-border">
            <span className="text-sm text-muted-foreground sm:w-48 shrink-0">Transaction Fee</span>
            <span className="text-sm">{tx.fee} SRX</span>
          </div>

          {tx.nonce !== undefined && (
            <div className="flex flex-col sm:flex-row gap-2 py-2 border-b border-border">
              <span className="text-sm text-muted-foreground sm:w-48 shrink-0">Nonce</span>
              <span className="text-sm font-mono">{tx.nonce}</span>
            </div>
          )}

          {tx.tx_type && (
            <div className="flex flex-col sm:flex-row gap-2 py-2 border-b border-border">
              <span className="text-sm text-muted-foreground sm:w-48 shrink-0">Type</span>
              <Badge variant="secondary">{tx.tx_type}</Badge>
            </div>
          )}

          {tx.input_data && tx.input_data !== "0x" && (
            <div className="flex flex-col gap-2 py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Input Data</span>
              <pre className="text-xs font-mono bg-muted p-3 rounded-lg overflow-x-auto break-all whitespace-pre-wrap">{tx.input_data}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
