"use client";

// DECISION: single registry that maps address → human label (e.g., "Sentrix Foundation").
// Data source: /validators (names), /accounts/top (names on top accounts), /tokens (contract).
// Any address resolved here gets a colored tag next to its short-hash display, Solscan-style.
//
// Design goals:
// - Read-only React context populated once per network + refreshed with the underlying hooks.
// - O(1) lookup via a lower-cased Map.
// - No coupling to individual pages; components call `useAddressLabel(addr)`.

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { NetworkId } from "./chain";
import { fetchValidators, fetchAccountsTop, fetchTokens } from "./api";

export type LabelKind = "validator" | "account" | "token" | "treasury";

export interface LabelEntry {
  name: string;
  kind: LabelKind;
}

type LabelMap = Map<string, LabelEntry>;

const LabelContext = createContext<LabelMap>(new Map());

function buildMap(entries: Array<[string, LabelEntry]>): LabelMap {
  const m = new Map<string, LabelEntry>();
  for (const [addr, entry] of entries) {
    if (!addr) continue;
    m.set(addr.toLowerCase(), entry);
  }
  return m;
}

export function LabelProvider({ network, children }: { network: NetworkId; children: ReactNode }) {
  const [map, setMap] = useState<LabelMap>(() => new Map());

  useEffect(() => {
    let cancelled = false;
    // When network flips, clear the existing map immediately so stale mainnet labels don't
    // render on testnet pages (and vice versa) during the brief refetch window.
    setMap(new Map());

    async function load() {
      // DECISION: load sequentially with a small gap between calls. Previously used
      // Promise.all which added 3 concurrent requests on top of the ~10 polling hooks that
      // also mount on first paint, blowing past the backend's rate-limit and triggering a
      // cascade of 429/CORS errors in the console. Sequential reads keep the registry fresh
      // without competing with real-time hooks.
      const gap = () => new Promise((r) => setTimeout(r, 200));
      const validators = await fetchValidators(network);
      await gap();
      const top = await fetchAccountsTop(network, 50);
      await gap();
      const tokens = await fetchTokens(network);

      const entries: Array<[string, LabelEntry]> = [];

      for (const v of validators ?? []) {
        if (v.address && v.name) {
          const kind: LabelKind = v.name.toLowerCase().includes("treasury") ? "treasury" : "validator";
          entries.push([v.address, { name: v.name, kind }]);
        }
      }
      for (const a of top ?? []) {
        if (a.address && a.label) {
          entries.push([a.address, { name: a.label, kind: "account" }]);
        }
      }
      for (const t of tokens ?? []) {
        if (t.contract_address && t.symbol) {
          entries.push([t.contract_address, { name: t.symbol, kind: "token" }]);
        }
      }

      if (!cancelled) setMap(buildMap(entries));
    }

    load();
    const id = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [network]);

  return <LabelContext.Provider value={map}>{children}</LabelContext.Provider>;
}

export function useAddressLabel(address: string | undefined | null): LabelEntry | undefined {
  const map = useContext(LabelContext);
  if (!address) return undefined;
  return map.get(address.toLowerCase());
}

export function toneForKind(kind: LabelKind): { bg: string; fg: string; border: string } {
  switch (kind) {
    case "validator":
      return { bg: "bg-[var(--purple)]/10", fg: "text-[var(--purple)]", border: "border-[var(--purple)]/25" };
    case "treasury":
      return { bg: "bg-[var(--gold)]/10", fg: "text-[var(--gold)]", border: "border-[var(--gold)]/25" };
    case "token":
      return { bg: "bg-[var(--teal)]/10", fg: "text-[var(--teal)]", border: "border-[var(--teal)]/25" };
    case "account":
    default:
      return { bg: "bg-[var(--blue)]/10", fg: "text-[var(--blue)]", border: "border-[var(--blue)]/25" };
  }
}
