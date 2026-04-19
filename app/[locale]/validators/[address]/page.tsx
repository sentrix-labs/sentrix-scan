"use client";

import { use, useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { Users, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Address } from "@/components/common/Address";
import { BlockHeight } from "@/components/common/BlockHeight";
import { Timestamp } from "@/components/common/Timestamp";
import { InfoRow } from "@/components/common/InfoRow";
import { Pagination } from "@/components/common/Pagination";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { EmptyState } from "@/components/common/EmptyState";
import { useNetwork } from "@/lib/network-context";
import { useValidators, useBlocks } from "@/lib/hooks";
import { formatNumber } from "@/lib/format";

// DECISION: lazy-load Recharts to keep initial bundle below 500 kB gzipped target.
const ValidatorChart = dynamic(() => import("./chart").then((m) => m.ValidatorChart), {
  ssr: false,
  loading: () => <Skeleton className="h-56 w-full" />,
});

const PAGE_SIZE = 20;

function statusLabel(s?: string) {
  if (s === "jailed") return { icon: <AlertTriangle className="h-4 w-4 text-orange-500" />, text: "Jailed", color: "text-orange-500" };
  if (s === "inactive") return { icon: <XCircle className="h-4 w-4 text-red-500" />, text: "Inactive", color: "text-red-500" };
  return { icon: <CheckCircle className="h-4 w-4 text-green-500" />, text: "Active", color: "text-green-500" };
}

export default function ValidatorDetailPage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = use(params);
  const { network } = useNetwork();
  const { data: validators, loading } = useValidators(network);
  const { data: recentBlocks } = useBlocks(network, 100);
  const [blockPage, setBlockPage] = useState(1);

  const validator = useMemo(
    () => validators?.find((v) => v.address.toLowerCase() === address.toLowerCase()) ?? null,
    [validators, address],
  );

  const producedBlocks = useMemo(() => {
    if (!recentBlocks) return [];
    return recentBlocks.filter((b) => b.validator.toLowerCase() === address.toLowerCase());
  }, [recentBlocks, address]);

  const pagedBlocks = producedBlocks.slice((blockPage - 1) * PAGE_SIZE, blockPage * PAGE_SIZE);
  const totalBlockPages = Math.max(1, Math.ceil(producedBlocks.length / PAGE_SIZE));

  // Build chart series from recent blocks grouped by hour.
  // TODO(api): needs GET /validators/{address}/blocks-over-time — using recent blocks for now
  const chartData = useMemo(() => {
    const buckets: Record<string, number> = {};
    producedBlocks.forEach((b) => {
      const d = new Date(b.timestamp);
      const key = `${d.getUTCHours()}:00`;
      buckets[key] = (buckets[key] || 0) + 1;
    });
    return Object.entries(buckets).map(([hour, count]) => ({ hour, count }));
  }, [producedBlocks]);

  if (loading && !validators) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!validator) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Validator not found</p>
            <p className="text-xs font-mono text-muted-foreground mt-2 break-all">{address}</p>
            <Link href="/validators" className="text-primary hover:underline text-sm mt-4 inline-block">Back to validators</Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const st = statusLabel(validator.status);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
      <PageHeader
        icon={Users}
        eyebrow="Validator"
        title={validator.name || "Unnamed"}
        actions={
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${st.color}`}>
            {st.icon}
            {st.text}
          </span>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Stake"
          value={validator.stake !== undefined ? `${formatNumber(validator.stake)} SRX` : "—"}
          accent="var(--gold)"
        />
        <StatCard
          label="Commission"
          value={validator.commission !== undefined ? `${validator.commission}%` : "—"}
          accent="var(--cyan)"
        />
        <StatCard
          label="Uptime"
          value={validator.uptime !== undefined ? `${validator.uptime.toFixed(1)}%` : "—"}
          accent={
            validator.uptime === undefined ? "var(--tx-d)" :
            validator.uptime >= 99 ? "var(--green)" :
            validator.uptime >= 95 ? "var(--orange)" :
            "var(--red)"
          }
        />
        <StatCard
          label="Blocks Produced"
          value={validator.blocks_produced !== undefined ? formatNumber(validator.blocks_produced) : "—"}
          accent="var(--purple)"
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="blocks">Produced Blocks</TabsTrigger>
          <TabsTrigger value="delegators">Delegators</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardContent className="px-6 py-0">
              <InfoRow label="Name" value={validator.name ?? "-"} />
              <InfoRow label="Address" value={<Address address={validator.address} truncate={false} />} />
              <InfoRow label="Status" value={<span className={`inline-flex items-center gap-1.5 text-sm ${st.color}`}>{st.icon}{st.text}</span>} />
              <InfoRow label="Stake" value={<span className="font-mono">{validator.stake !== undefined ? `${formatNumber(validator.stake)} SRX` : "-"}</span>} />
              <InfoRow label="Commission" value={<span className="font-mono">{validator.commission !== undefined ? `${validator.commission}%` : "-"}</span>} />
              <InfoRow label="Uptime" value={<span className="font-mono">{validator.uptime !== undefined ? `${validator.uptime.toFixed(1)}%` : "-"}</span>} />
              <InfoRow label="Blocks Produced" value={<span className="font-mono">{validator.blocks_produced !== undefined ? formatNumber(validator.blocks_produced) : "-"}</span>} />
              <InfoRow
                label="Rewards Earned"
                value={<span className="font-mono">{validator.rewards_earned !== undefined ? `${formatNumber(validator.rewards_earned)} SRX` : "-"}</span>}
                last
              />
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader><CardTitle className="text-base">Recent Block Activity</CardTitle></CardHeader>
            <CardContent className="p-4">
              {chartData.length > 0 ? (
                <ValidatorChart data={chartData} />
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No recent blocks from this validator in the last window.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blocks">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Blocks Produced <span className="text-muted-foreground font-normal text-sm ml-1">({producedBlocks.length} in last 100)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {producedBlocks.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">No blocks produced in the last window.</div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-xs text-muted-foreground bg-muted/30">
                          <th className="px-4 py-2.5 font-medium">Block</th>
                          <th className="px-4 py-2.5 font-medium">Age</th>
                          <th className="px-4 py-2.5 font-medium text-right">Transactions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60 row-hover">
                        {pagedBlocks.map((b) => (
                          <tr key={b.index}>
                            <td className="px-4 py-2.5"><BlockHeight height={b.index} /></td>
                            <td className="px-4 py-2.5 text-muted-foreground text-xs"><Timestamp timestamp={b.timestamp} /></td>
                            <td className="px-4 py-2.5 text-right">{b.tx_count ?? b.transactions?.length ?? 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {producedBlocks.length > PAGE_SIZE && (
                    <div className="border-t border-border">
                      <Pagination page={blockPage} totalPages={totalBlockPages} onPageChange={setBlockPage} />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="delegators">
          <Card>
            <CardContent className="p-0">
              {/* TODO(api): needs GET /validators/{address}/delegators */}
              <EmptyState
                icon={Users}
                title="Delegator list not yet available"
                hint="Endpoint /validators/{address}/delegators pending on the Sentrix Chain API."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards">
          <Card>
            <CardContent className="p-0">
              {/* TODO(api): needs GET /validators/{address}/rewards */}
              <EmptyState
                icon={Users}
                title="Rewards history not yet available"
                hint={`Total earned: ${validator.rewards_earned !== undefined ? `${formatNumber(validator.rewards_earned)} SRX` : "—"}`}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
