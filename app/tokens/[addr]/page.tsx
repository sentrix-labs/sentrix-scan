"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Coins } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CopyButton } from "@/components/copy-button";
import { useNetwork } from "@/lib/network-context";
import { fetchToken, type TokenData } from "@/lib/api";
import { formatNumber } from "@/lib/format";

export default function TokenDetailPage({ params }: { params: Promise<{ addr: string }> }) {
  const { addr } = use(params);
  const { network } = useNetwork();
  const [token, setToken] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchToken(network, addr).then((t) => {
      setToken(t);
      setLoading(false);
    });
  }, [network, addr]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!token) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Token not found</p>
            <Link href="/tokens" className="text-blue-500 hover:underline text-sm mt-2 inline-block">Back to tokens</Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Coins className="h-6 w-6 text-blue-500" />
        <h1 className="text-2xl font-bold">{token.name} ({token.symbol})</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Token Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoRow label="Name" value={token.name} />
          <InfoRow label="Symbol" value={token.symbol} />
          <InfoRow label="Decimals" value={String(token.decimals)} />
          <InfoRow label="Total Supply" value={formatNumber(token.total_supply)} />
          <div className="flex flex-col sm:flex-row gap-2 py-2 border-b border-border">
            <span className="text-sm text-muted-foreground sm:w-48 shrink-0">Contract</span>
            <div className="flex items-center gap-1">
              <Link href={`/address/${token.contract_address}`} className="text-sm font-mono text-blue-500 hover:underline break-all">{token.contract_address}</Link>
              <CopyButton text={token.contract_address} />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 py-2 border-b border-border">
            <span className="text-sm text-muted-foreground sm:w-48 shrink-0">Owner</span>
            <div className="flex items-center gap-1">
              <Link href={`/address/${token.owner}`} className="text-sm font-mono text-blue-500 hover:underline break-all">{token.owner}</Link>
              <CopyButton text={token.owner} />
            </div>
          </div>
          {token.holders !== undefined && <InfoRow label="Holders" value={formatNumber(token.holders)} />}
          {token.transfers !== undefined && <InfoRow label="Transfers" value={formatNumber(token.transfers)} />}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 py-2 border-b border-border">
      <span className="text-sm text-muted-foreground sm:w-48 shrink-0">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}
