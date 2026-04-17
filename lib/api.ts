import { getApiUrl, type NetworkId } from "./chain";

async function apiFetch<T>(network: NetworkId, path: string): Promise<T | null> {
  try {
    const base = getApiUrl(network);
    const res = await fetch(`${base}${path}`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export interface ChainInfo {
  total_blocks: number;
  height: number;
  total_minted_srx: number;
  total_burned_srx: number;
  mempool_size: number;
  active_validators: number;
  deployed_tokens: number;
  next_block_reward_srx: number;
}

export interface BlockData {
  index: number;
  hash: string;
  previous_hash: string;
  timestamp: string;
  validator: string;
  validator_name?: string;
  transactions: TransactionData[];
  merkle_root: string;
  nonce: number;
  difficulty: number;
}

export interface TransactionData {
  id: string;
  from: string;
  to: string;
  amount: number;
  fee: number;
  timestamp: string;
  nonce: number;
  signature: string;
  tx_type?: string;
  status?: string;
  gas_used?: number;
  gas_price?: number;
  input_data?: string;
  contract_address?: string;
}

export interface ValidatorData {
  address: string;
  name: string;
  status?: string;
  blocks_produced?: number;
  stake?: number;
  commission?: number;
  uptime?: number;
  rewards_earned?: number;
}

export interface AccountBalance {
  address: string;
  balance: number;
  nonce: number;
}

export interface TokenData {
  contract_address: string;
  name: string;
  symbol: string;
  decimals: number;
  total_supply: number;
  owner: string;
  holders?: number;
  transfers?: number;
}

export function fetchChainInfo(network: NetworkId) {
  return apiFetch<ChainInfo>(network, "/chain/info");
}

export function fetchBlock(network: NetworkId, index: number) {
  return apiFetch<BlockData>(network, `/chain/blocks/${index}`);
}

export function fetchLatestBlocks(network: NetworkId, count = 10) {
  return apiFetch<BlockData[]>(network, `/chain/blocks?limit=${count}`);
}

export function fetchTransaction(network: NetworkId, txId: string) {
  return apiFetch<TransactionData>(network, `/transactions/${txId}`);
}

export function fetchLatestTransactions(network: NetworkId, count = 10) {
  return apiFetch<TransactionData[]>(network, `/transactions?limit=${count}`);
}

export function fetchAccountBalance(network: NetworkId, address: string) {
  return apiFetch<AccountBalance>(network, `/accounts/${address}/balance`);
}

export function fetchAccountHistory(network: NetworkId, address: string, page = 1) {
  return apiFetch<TransactionData[]>(network, `/accounts/${address}/history?page=${page}`);
}

export function fetchValidators(network: NetworkId) {
  return apiFetch<ValidatorData[]>(network, "/validators");
}

export function fetchTokens(network: NetworkId) {
  return apiFetch<TokenData[]>(network, "/tokens");
}

export function fetchToken(network: NetworkId, address: string) {
  return apiFetch<TokenData>(network, `/tokens/${address}`);
}
