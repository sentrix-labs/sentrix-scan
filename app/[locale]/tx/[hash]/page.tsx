"use client";

import { use } from "react";
import { Link } from "@/i18n/navigation";
import { ArrowUpDown, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Address } from "@/components/common/Address";
import { BlockHeight } from "@/components/common/BlockHeight";
import { Timestamp } from "@/components/common/Timestamp";
import { InfoRow } from "@/components/common/InfoRow";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Copyable } from "@/components/common/Copyable";
import { PageHeader } from "@/components/common/PageHeader";
import { useNetwork } from "@/lib/network-context";
import { useTransaction } from "@/lib/hooks";

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
            <Link href="/" className="text-primary hover:underline text-sm mt-4 inline-block">Back to home</Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const success = tx.status !== "failed";

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
      <PageHeader
        icon={ArrowUpDown}
        eyebrow="Transaction"
        title={`${tx.id.slice(0, 10)}...${tx.id.slice(-6)}`}
        mono
        tone="muted"
        actions={<StatusBadge status={success ? "success" : "failed"} size="md" />}
      />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="input">Input Data</TabsTrigger>
          <TabsTrigger value="raw">Raw JSON</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardContent className="px-6 py-0">
              <InfoRow
                label="Transaction Hash"
                value={
                  <span className="inline-flex items-center gap-2 font-mono break-all">
                    {tx.id}
                    <Copyable text={tx.id} bare />
                  </span>
                }
              />
              <InfoRow label="Status" value={<StatusBadge status={success ? "success" : "failed"} />} />
              {tx.block_height !== undefined && (
                <InfoRow
                  label="Block"
                  value={<BlockHeight height={tx.block_height} prefix="#" />}
                />
              )}
              <InfoRow label="Timestamp" value={<Timestamp timestamp={tx.timestamp} absolute />} />
              <InfoRow
                label="From"
                value={<Address address={tx.from} truncate={false} />}
              />
              <InfoRow
                label="To"
                value={
                  <div className="flex items-center gap-2 flex-wrap">
                    <Address address={tx.from} muted showCopy={false} className="text-xs" />
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <Address address={tx.to} truncate={false} />
                  </div>
                }
              />
              <InfoRow
                label="Value"
                value={<span className="font-mono font-semibold">{tx.amount} SRX</span>}
              />
              <InfoRow
                label="Transaction Fee"
                value={<span className="font-mono">{tx.fee} SRX</span>}
              />
              {tx.gas_used !== undefined && (
                <InfoRow label="Gas Used" value={<span className="font-mono">{tx.gas_used.toLocaleString()}</span>} />
              )}
              {tx.gas_price !== undefined && (
                <InfoRow label="Gas Price" value={<span className="font-mono">{tx.gas_price}</span>} />
              )}
              {tx.nonce !== undefined && (
                <InfoRow label="Nonce" value={<span className="font-mono">{tx.nonce}</span>} />
              )}
              {tx.tx_type && (
                <InfoRow
                  label="Type"
                  value={
                    <span className="text-xs px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                      {tx.tx_type}
                    </span>
                  }
                />
              )}
              {tx.contract_address && (
                <InfoRow
                  label="Contract"
                  value={<Address address={tx.contract_address} truncate={false} />}
                />
              )}
              <InfoRow
                label="Signature"
                value={
                  <span className="inline-flex items-center gap-2 font-mono break-all text-xs text-muted-foreground">
                    {tx.signature}
                    <Copyable text={tx.signature} bare />
                  </span>
                }
                last
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="input">
          <Card>
            <CardContent className="p-6">
              {tx.input_data && tx.input_data !== "0x" ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Raw input data</p>
                    <Copyable text={tx.input_data} bare />
                  </div>
                  <pre className="text-xs font-mono bg-muted p-4 rounded-lg overflow-auto max-h-96 break-all whitespace-pre-wrap">
                    {tx.input_data}
                  </pre>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No input data for this transaction.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="raw">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-muted-foreground">Full transaction JSON</p>
                <Copyable text={JSON.stringify(tx, null, 2)} bare />
              </div>
              <pre className="text-xs font-mono bg-muted p-4 rounded-lg overflow-auto max-h-[32rem]">
                {JSON.stringify(tx, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
