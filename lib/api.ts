import { getApiUrl, type NetworkId } from "./chain";

// DECISION: Backend amounts are in "sentri" (1 SRX = 1e8 sentri). The UI displays SRX.
// All fetchers do the conversion at the edge so downstream code can treat numbers as SRX.
const SENTRI_PER_SRX = 100_000_000;
const toSrx = (sentri: number): number => sentri / SENTRI_PER_SRX;

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
  block_height?: number;
}

export interface ValidatorData {
  address: string;
  name: string;
  status?: string;
  is_active?: boolean;
  registered_at?: number;
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
  tx_count?: number;
}

interface RawAccountBalance {
  address: string;
  balance?: number;
  balance_srx?: number;
  balance_sentri?: number;
  nonce?: number;
}

interface RawAccountInfo {
  address: string;
  balance_srx?: number;
  balance_sentri?: number;
  nonce?: number;
  tx_count?: { window_tx_count?: number; is_partial?: boolean; window_start_block?: number };
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

export interface TopHolder {
  rank: number;
  address: string;
  balance: number;
  share: number;
}

export interface TokenHolder {
  address: string;
  balance: number;
  share: number;
}

export interface TokenTransfer {
  tx_hash: string;
  from: string;
  to: string;
  amount: number;
  timestamp: number;
  block_height?: number;
}

export interface DailyStat {
  date: string;
  blocks: number;
  transactions: number;
}

export function fetchChainInfo(network: NetworkId) {
  return apiFetch<ChainInfo>(network, "/chain/info");
}

export function fetchBlock(network: NetworkId, index: number) {
  return apiFetch<BlockData>(network, `/chain/blocks/${index}`);
}

export async function fetchLatestBlocks(network: NetworkId, count = 10) {
  const res = await apiFetch<{ blocks: BlockData[] }>(network, `/chain/blocks?limit=${count}`);
  return res?.blocks ?? [];
}

// DECISION: backend /transactions/{txid} wraps the tx in { block_hash, block_index,
// block_timestamp, transaction: {...} }. Flatten here so downstream code sees a single
// TransactionData with block_height, and sentri → SRX amount/fee conversion applied.
interface RawTxDetail {
  block_hash?: string;
  block_index?: number;
  block_timestamp?: number;
  transaction?: {
    txid?: string;
    from_address?: string;
    to_address?: string;
    amount?: number;
    fee?: number;
    timestamp?: number;
    nonce?: number;
    signature?: string;
    public_key?: string;
    data?: string;
    chain_id?: number;
  };
}

function normalizeTx(raw: RawTxDetail): TransactionData | null {
  const tx = raw.transaction;
  if (!tx) return null;
  return {
    id: tx.txid ?? "",
    from: tx.from_address ?? "",
    to: tx.to_address ?? "",
    amount: toSrx(tx.amount ?? 0),
    fee: toSrx(tx.fee ?? 0),
    timestamp: String(tx.timestamp ?? raw.block_timestamp ?? 0),
    nonce: tx.nonce ?? 0,
    signature: tx.signature ?? "",
    input_data: tx.data,
    block_height: raw.block_index,
  };
}

export async function fetchTransaction(network: NetworkId, txId: string): Promise<TransactionData | null> {
  const res = await apiFetch<RawTxDetail>(network, `/transactions/${txId}`);
  if (!res) return null;
  return normalizeTx(res);
}

export async function fetchLatestTransactions(network: NetworkId, count = 10) {
  const res = await apiFetch<{ transactions: TransactionData[] } | TransactionData[]>(
    network,
    `/transactions?limit=${count}`,
  );
  if (!res) return [];
  return Array.isArray(res) ? res : (res.transactions ?? []);
}

// DECISION: use /address/{addr}/info which returns balance_srx, nonce, and a windowed tx_count.
// Falls back to /accounts/{addr}/balance if the info endpoint is missing.
export async function fetchAccountBalance(network: NetworkId, address: string): Promise<AccountBalance | null> {
  const info = await apiFetch<RawAccountInfo>(network, `/address/${address}/info`);
  if (info) {
    return {
      address: info.address,
      balance: info.balance_srx ?? (info.balance_sentri ? toSrx(info.balance_sentri) : 0),
      nonce: info.nonce ?? 0,
      tx_count: info.tx_count?.window_tx_count,
    };
  }
  const bal = await apiFetch<RawAccountBalance>(network, `/accounts/${address}/balance`);
  if (!bal) return null;
  return {
    address: bal.address,
    balance: bal.balance ?? bal.balance_srx ?? 0,
    nonce: bal.nonce ?? 0,
  };
}

interface RawHistoryItem {
  txid: string;
  from: string;
  to: string;
  amount: number;
  fee: number;
  block_index: number;
  block_timestamp: number;
  direction?: "in" | "out" | "self";
}

// DECISION: backend path is /address/{addr}/history (not /accounts/...), uses offset-based
// pagination. Mapping: txid→id, block_index→block_height, sentri→SRX conversion. Page size 20.
export async function fetchAccountHistory(
  network: NetworkId,
  address: string,
  page = 1,
  limit = 20,
): Promise<TransactionData[]> {
  const offset = (page - 1) * limit;
  const res = await apiFetch<{ transactions: RawHistoryItem[] }>(
    network,
    `/address/${address}/history?limit=${limit}&offset=${offset}`,
  );
  if (!res?.transactions) return [];
  return res.transactions.map((t) => ({
    id: t.txid,
    from: t.from,
    to: t.to,
    amount: toSrx(t.amount),
    fee: toSrx(t.fee),
    timestamp: String(t.block_timestamp),
    nonce: 0,
    signature: "",
    block_height: t.block_index,
  }));
}

export async function fetchValidators(network: NetworkId) {
  const res = await apiFetch<{ validators: ValidatorData[] } | ValidatorData[]>(network, "/validators");
  if (!res) return [];
  const list = Array.isArray(res) ? res : (res.validators ?? []);
  return list.map((v) => ({
    ...v,
    status: v.status ?? (v.is_active === false ? "inactive" : "active"),
  }));
}

export async function fetchTokens(network: NetworkId) {
  const res = await apiFetch<{ tokens: TokenData[] } | TokenData[]>(network, "/tokens");
  if (!res) return [];
  return Array.isArray(res) ? res : (res.tokens ?? []);
}

export function fetchToken(network: NetworkId, address: string) {
  return apiFetch<TokenData>(network, `/tokens/${address}`);
}

// ── New endpoints wired from existing backend routes ──────────────────────
interface RawRichlistEntry {
  address: string;
  balance_sentri?: number;
  balance_srx?: number;
  percent_of_supply?: number;
}

export async function fetchRichlist(network: NetworkId, limit = 100): Promise<TopHolder[]> {
  const res = await apiFetch<{ holders: RawRichlistEntry[] }>(network, `/richlist?limit=${limit}`);
  if (!res?.holders) return [];
  return res.holders.map((h, i) => ({
    rank: i + 1,
    address: h.address,
    balance: h.balance_srx ?? (h.balance_sentri ? toSrx(h.balance_sentri) : 0),
    share: h.percent_of_supply ?? 0,
  }));
}

interface RawTokenHolder {
  address: string;
  balance?: number;
  balance_sentri?: number;
  percent?: number;
  percent_of_supply?: number;
}

export async function fetchTokenHolders(
  network: NetworkId,
  contract: string,
  limit = 50,
): Promise<TokenHolder[]> {
  const res = await apiFetch<{ holders: RawTokenHolder[] }>(
    network,
    `/tokens/${contract}/holders?limit=${limit}`,
  );
  if (!res?.holders) return [];
  return res.holders.map((h) => ({
    address: h.address,
    balance: h.balance ?? h.balance_sentri ?? 0,
    share: h.percent ?? h.percent_of_supply ?? 0,
  }));
}

interface RawTokenTrade {
  txid?: string;
  tx_hash?: string;
  from: string;
  to: string;
  amount: number;
  timestamp?: number;
  block_timestamp?: number;
  block_index?: number;
}

export async function fetchTokenTrades(
  network: NetworkId,
  contract: string,
  page = 1,
  limit = 20,
): Promise<TokenTransfer[]> {
  const offset = (page - 1) * limit;
  const res = await apiFetch<{ trades: RawTokenTrade[] }>(
    network,
    `/tokens/${contract}/trades?limit=${limit}&offset=${offset}`,
  );
  if (!res?.trades) return [];
  return res.trades.map((t) => ({
    tx_hash: t.txid ?? t.tx_hash ?? "",
    from: t.from,
    to: t.to,
    amount: t.amount,
    timestamp: t.timestamp ?? t.block_timestamp ?? 0,
    block_height: t.block_index,
  }));
}

export async function fetchDailyStats(network: NetworkId): Promise<DailyStat[]> {
  const res = await apiFetch<DailyStat[]>(network, "/stats/daily");
  return res ?? [];
}
