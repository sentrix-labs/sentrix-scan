"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ChainPerformance } from "@/lib/api";

interface Props {
  perf: ChainPerformance | null;
  daily: Array<{ date: string; blocks: number; transactions: number }> | null;
  validatorShare: Array<{ name: string; blocks: number; share: number }>;
}

export function AnalyticsCharts({ perf, daily }: Props) {
  // TPS series from backend /chain/performance (24h).
  const tpsSeries = (perf?.points ?? []).map((p) => ({
    t: formatTime(p.timestamp),
    tps: p.tps,
    blockTime: p.block_time_sec,
  }));

  // Daily blocks + tx — backend sends as array of `{ date, blocks, transactions }`.
  const dailySeries = (daily ?? []).map((d) => ({
    date: d.date,
    blocks: d.blocks,
    transactions: d.transactions,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="eyebrow">TPS · last 24h</CardTitle></CardHeader>
        <CardContent className="p-4 pt-0 h-64">
          {tpsSeries.length === 0 ? (
            <EmptyChart text="No throughput data in the selected window." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tpsSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="a-tps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--gold)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--gold)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--brd)" strokeDasharray="2 4" />
                <XAxis dataKey="t" fontSize={10} stroke="var(--tx-d)" tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis fontSize={10} stroke="var(--tx-d)" tickLine={false} axisLine={false} width={32} />
                <Tooltip
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--brd)", borderRadius: 8, fontSize: 12 }}
                  formatter={(value) => [`${Number(value).toFixed(2)} tps`, "TPS"]}
                />
                <Area type="monotone" dataKey="tps" stroke="var(--gold)" strokeWidth={2} fill="url(#a-tps)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="eyebrow">Block Time · last 24h</CardTitle></CardHeader>
        <CardContent className="p-4 pt-0 h-64">
          {tpsSeries.length === 0 ? (
            <EmptyChart text="No block time data available." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tpsSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="a-bt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--cyan)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--cyan)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--brd)" strokeDasharray="2 4" />
                <XAxis dataKey="t" fontSize={10} stroke="var(--tx-d)" tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis fontSize={10} stroke="var(--tx-d)" tickLine={false} axisLine={false} width={32} />
                <Tooltip
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--brd)", borderRadius: 8, fontSize: 12 }}
                  formatter={(value) => [`${Number(value).toFixed(2)}s`, "Block Time"]}
                />
                <Area type="monotone" dataKey="blockTime" stroke="var(--cyan)" strokeWidth={2} fill="url(#a-bt)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader className="pb-2"><CardTitle className="eyebrow">Blocks & Transactions · last 14 days</CardTitle></CardHeader>
        <CardContent className="p-4 pt-0 h-72">
          {dailySeries.length === 0 ? (
            <EmptyChart text="No daily data available yet." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailySeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--brd)" strokeDasharray="2 4" />
                <XAxis dataKey="date" fontSize={10} stroke="var(--tx-d)" tickLine={false} axisLine={false} />
                <YAxis fontSize={10} stroke="var(--tx-d)" tickLine={false} axisLine={false} width={36} />
                <Tooltip
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--brd)", borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="blocks" fill="var(--gold)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="transactions" fill="var(--purple)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function formatTime(unixSec: number): string {
  const d = new Date(unixSec * 1000);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="h-full flex items-center justify-center border border-dashed border-[var(--brd)] rounded-lg bg-[color-mix(in_oklab,var(--muted)_30%,transparent)]">
      <p className="text-xs text-muted-foreground font-mono">{text}</p>
    </div>
  );
}
