"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
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

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [network, setNetwork] = useState<NetworkId>(
    () => (typeof window !== "undefined" && localStorage.getItem("sentrix-network") as NetworkId) || "mainnet"
  );

  const handleSet = useCallback((n: NetworkId) => {
    setNetwork(n);
    if (typeof window !== "undefined") localStorage.setItem("sentrix-network", n);
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
