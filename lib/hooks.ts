"use client";

import { useState, useEffect, useCallback } from "react";
import type { NetworkId } from "./chain";
import {
  fetchChainInfo, fetchLatestBlocks, fetchLatestTransactions,
  fetchBlock, fetchTransaction, fetchAccountBalance,
  fetchAccountHistory, fetchValidators, fetchTokens,
  type ChainInfo, type BlockData, type TransactionData,
  type ValidatorData, type AccountBalance, type TokenData,
} from "./api";

function usePolling<T>(
  fetcher: () => Promise<T | null>,
  interval: number,
  deps: unknown[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refetch = useCallback(async () => {
    try {
      const result = await fetcher();
      if (result !== null) {
        setData(result);
        setError(false);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    refetch();
    if (interval > 0) {
      const id = setInterval(refetch, interval);
      return () => clearInterval(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refetch, interval]);

  return { data, loading, error, refetch };
}

export function useStats(network: NetworkId) {
  return usePolling<ChainInfo>(
    () => fetchChainInfo(network),
    5000,
    [network]
  );
}

export function useBlocks(network: NetworkId, count = 10) {
  return usePolling<BlockData[]>(
    () => fetchLatestBlocks(network, count),
    5000,
    [network, count]
  );
}

export function useBlock(network: NetworkId, height: number) {
  return usePolling<BlockData>(
    () => fetchBlock(network, height),
    0,
    [network, height]
  );
}

export function useTransactions(network: NetworkId, count = 10) {
  return usePolling<TransactionData[]>(
    () => fetchLatestTransactions(network, count),
    5000,
    [network, count]
  );
}

export function useTransaction(network: NetworkId, hash: string) {
  return usePolling<TransactionData>(
    () => fetchTransaction(network, hash),
    0,
    [network, hash]
  );
}

export function useAddress(network: NetworkId, address: string) {
  return usePolling<AccountBalance>(
    () => fetchAccountBalance(network, address),
    10000,
    [network, address]
  );
}

export function useAddressHistory(network: NetworkId, address: string, page = 1) {
  return usePolling<TransactionData[]>(
    () => fetchAccountHistory(network, address, page),
    0,
    [network, address, page]
  );
}

export function useValidators(network: NetworkId) {
  return usePolling<ValidatorData[]>(
    () => fetchValidators(network),
    15000,
    [network]
  );
}

export function useTokens(network: NetworkId) {
  return usePolling<TokenData[]>(
    () => fetchTokens(network),
    30000,
    [network]
  );
}
