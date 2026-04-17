"use client";

import Link from "next/link";
import { Users, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CopyButton } from "@/components/copy-button";
import { useNetwork } from "@/lib/network-context";
import { useValidators } from "@/lib/hooks";
import { formatNumber, shortenAddress } from "@/lib/format";

function StatusIcon({ status }: { status?: string }) {
  if (status === "jailed") return <AlertTriangle className="h-4 w-4 text-orange-500" />;
  if (status === "inactive") return <XCircle className="h-4 w-4 text-red-500" />;
  return <CheckCircle className="h-4 w-4 text-green-500" />;
}

export default function ValidatorsPage() {
  const { network } = useNetwork();
  const { data: validators, loading } = useValidators(network);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6 text-blue-500" />
        <h1 className="text-2xl font-bold">Validators</h1>
        {validators && (
          <Badge variant="secondary">{validators.length} total</Badge>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-muted-foreground font-normal">
            Active validators on {network === "mainnet" ? "Mainnet (Chain ID 7119)" : "Testnet (Chain ID 7120)"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : validators && validators.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-4 py-3 font-medium">#</th>
                    <th className="px-4 py-3 font-medium">Validator</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Blocks Produced</th>
                    <th className="px-4 py-3 font-medium text-right hidden md:table-cell">Stake</th>
                    <th className="px-4 py-3 font-medium text-right hidden lg:table-cell">Uptime</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {validators.map((v, i) => (
                    <tr key={v.address} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          {v.name && <span className="font-medium text-sm">{v.name}</span>}
                          <div className="flex items-center gap-1">
                            <Link href={`/address/${v.address}`} className="font-mono text-xs text-blue-500 hover:underline">
                              {shortenAddress(v.address)}
                            </Link>
                            <CopyButton text={v.address} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <StatusIcon status={v.status} />
                          <span className="text-xs capitalize">{v.status || "active"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {v.blocks_produced !== undefined ? formatNumber(v.blocks_produced) : "-"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono hidden md:table-cell">
                        {v.stake !== undefined ? `${v.stake} SRX` : "-"}
                      </td>
                      <td className="px-4 py-3 text-right hidden lg:table-cell">
                        {v.uptime !== undefined ? (
                          <span className={v.uptime >= 99 ? "text-green-500" : v.uptime >= 95 ? "text-yellow-500" : "text-red-500"}>
                            {v.uptime.toFixed(1)}%
                          </span>
                        ) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No validators found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
