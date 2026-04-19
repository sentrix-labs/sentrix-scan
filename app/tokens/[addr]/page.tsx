"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Address } from "@/components/common/Address";
import { InfoRow } from "@/components/common/InfoRow";
import { Copyable } from "@/components/common/Copyable";
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
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold shrink-0">
          {token.symbol.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {token.name}
            <span className="text-base text-muted-foreground font-normal">({token.symbol})</span>
          </h1>
          <div className="flex items-center gap-1 text-xs mt-0.5">
            <Address address={token.contract_address} muted className="text-xs" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Total Supply</p>
          <p className="text-lg font-semibold font-mono mt-1">{formatNumber(token.total_supply)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Holders</p>
          <p className="text-lg font-semibold font-mono mt-1">{token.holders !== undefined ? formatNumber(token.holders) : "-"}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Transfers</p>
          <p className="text-lg font-semibold font-mono mt-1">{token.transfers !== undefined ? formatNumber(token.transfers) : "-"}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Decimals</p>
          <p className="text-lg font-semibold font-mono mt-1">{token.decimals}</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="transfers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transfers">Transfers</TabsTrigger>
          <TabsTrigger value="holders">Holders</TabsTrigger>
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="contract">Contract</TabsTrigger>
        </TabsList>

        <TabsContent value="transfers">
          <Card>
            <CardContent className="p-8 text-center">
              {/* TODO(api): needs GET /tokens/{address}/transfers — using placeholder */}
              <p className="text-sm text-muted-foreground">Transfer history is not yet available.</p>
              <p className="text-xs text-muted-foreground mt-2">Endpoint pending on the Sentrix Chain API.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="holders">
          <Card>
            <CardContent className="p-8 text-center">
              {/* TODO(api): needs GET /tokens/{address}/holders — using placeholder */}
              <p className="text-sm text-muted-foreground">Top holders list is not yet available.</p>
              <p className="text-xs text-muted-foreground mt-2">
                Total holders: <span className="font-mono">{token.holders !== undefined ? formatNumber(token.holders) : "-"}</span>
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="info">
          <Card>
            <CardContent className="px-6 py-0">
              <InfoRow label="Name" value={token.name} />
              <InfoRow label="Symbol" value={<span className="font-mono">{token.symbol}</span>} />
              <InfoRow label="Decimals" value={<span className="font-mono">{token.decimals}</span>} />
              <InfoRow label="Total Supply" value={<span className="font-mono">{formatNumber(token.total_supply)}</span>} />
              <InfoRow
                label="Contract"
                value={
                  <span className="inline-flex items-center gap-2 font-mono break-all">
                    <Address address={token.contract_address} truncate={false} />
                  </span>
                }
              />
              <InfoRow
                label="Owner"
                value={<Address address={token.owner} truncate={false} />}
                last
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contract">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Contract address</p>
                <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-3">
                  <span className="text-sm font-mono break-all flex-1">{token.contract_address}</span>
                  <Copyable text={token.contract_address} bare />
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Owner</p>
                <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-3">
                  <span className="text-sm font-mono break-all flex-1">{token.owner}</span>
                  <Copyable text={token.owner} bare />
                </div>
              </div>
              {/* TODO(api): needs GET /accounts/{address}/code — contract bytecode pending */}
              <p className="text-xs text-muted-foreground text-center pt-2">Contract bytecode viewer coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
