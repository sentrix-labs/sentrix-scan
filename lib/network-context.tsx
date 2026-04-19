"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { toast } from "sonner";
import type { NetworkId } from "./chain";

interface NetworkContextValue {
  network: NetworkId;
  setNetwork: (n: NetworkId) => void;
  toggle: () => void;
}

const NetworkContext = createContext<NetworkContextValue>({
  network: "mainnet",
  setNetwork: () => {},
  toggle: () => {},
});

// DECISION: network switch fires a sonner toast and persists to localStorage.
// The initial state is read lazily from localStorage (SSR-safe guard).
export function NetworkProvider({ children }: { children: ReactNode }) {
  const [network, setNetwork] = useState<NetworkId>(
    () => (typeof window !== "undefined" && (localStorage.getItem("sentrix-network") as NetworkId)) || "mainnet",
  );

  const handleSet = useCallback((n: NetworkId) => {
    setNetwork(n);
    if (typeof window !== "undefined") localStorage.setItem("sentrix-network", n);
    toast.success(`Switched to ${n === "mainnet" ? "Mainnet (Chain ID 7119)" : "Testnet (Chain ID 7120)"}`);
  }, []);

  const toggle = useCallback(() => {
    handleSet(network === "mainnet" ? "testnet" : "mainnet");
  }, [network, handleSet]);

  return (
    <NetworkContext.Provider value={{ network, setNetwork: handleSet, toggle }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  return useContext(NetworkContext);
}
