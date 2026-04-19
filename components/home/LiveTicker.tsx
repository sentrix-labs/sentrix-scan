"use client";

import type { ChainInfo } from "@/lib/api";
import { formatNumber, formatSRX } from "@/lib/format";

interface LiveTickerProps {
  stats: ChainInfo | null;
  blockTime: string;
  network: "mainnet" | "testnet";
}

// DECISION: Etherscan/Solscan keep a thin "live" strip above the hero showing the numbers
// that matter most — block height, tx pulse, gas/block time. One horizontal scroll-safe
// rail of mono key/value pairs. Draws the eye before the big serif title.
export function LiveTicker({ stats, blockTime, network }: LiveTickerProps) {
  const items = [
    { label: "Chain", value: network === "mainnet" ? "MAINNET" : "TESTNET", color: network === "mainnet" ? "text-[var(--green)]" : "text-[var(--orange)]" },
    { label: "Block", value: stats ? `#${stats.height.toLocaleString()}` : "—" },
    { label: "Block Time", value: blockTime },
    { label: "Validators", value: stats ? String(stats.active_validators) : "—" },
    { label: "Mempool", value: stats ? `${stats.mempool_size} tx` : "—" },
    { label: "Circulating", value: stats ? formatSRX(stats.total_minted_srx) : "—" },
    { label: "Tokens", value: stats ? String(stats.deployed_tokens) : "—" },
    { label: "Reward", value: stats ? `${stats.next_block_reward_srx} SRX` : "—" },
    { label: "Supply Cap", value: stats ? formatNumber(210_000_000) : "—" },
  ];

  return (
    <div className="border-b border-[var(--brd)] bg-[color-mix(in_oklab,var(--card)_40%,transparent)] backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-2.5 overflow-x-auto">
        <div className="flex items-center gap-5 text-[11px] whitespace-nowrap">
          <span className="inline-flex items-center gap-1.5 shrink-0">
            <span className={`w-1.5 h-1.5 rounded-full ${network === "mainnet" ? "bg-[var(--green)]" : "bg-[var(--orange)]"} animate-pulse-live`} />
            <span className="font-mono uppercase tracking-[.15em] text-[var(--tx-d)]">Live</span>
          </span>
          {items.map((it, i) => (
            <div key={it.label} className="flex items-center gap-1.5 shrink-0">
              {i > 0 && <span className="w-px h-3 bg-[var(--brd)]" />}
              <span className="font-mono uppercase tracking-[.12em] text-[var(--tx-d)] text-[10px]">
                {it.label}
              </span>
              <span className={`font-mono font-medium tabular-nums ${it.color ?? "text-[var(--tx-m)]"}`}>
                {it.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
