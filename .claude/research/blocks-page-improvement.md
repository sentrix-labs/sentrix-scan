# Discovery — /blocks Page Improvement

**Slug:** `blocks-page-improvement`
**Date:** 2026-04-19
**Problem frames (updated after user feedback):**
1. Users confuse "block height" vs "block index" terminology.
2. Homepage "Block Time" stat shows **"0.0s"** — broken.
3. Homepage missing a **"Total Transactions"** stat (Etherscan/Solscan parity).

Scope spans `/` (homepage) + `/blocks` + `/blocks/[height]` — terminology audit is chain-wide, homepage fixes are localized.

## Context: Where the confusion comes from

Terminology drift across the stack:

| Layer | Term used | Evidence |
|---|---|---|
| Backend API (`/chain/blocks`) | `index` | `Block.index` in `lib/api.ts:230` |
| Tx endpoint (`/transactions/{txid}`) | `block_index` | `lib/api.ts:154, 334` |
| Frontend normalization | `block_height` | `lib/api.ts:184, 258, 355` |
| URL | `/blocks/{height}` | `components/common/BlockHeight.tsx:38` |
| Table column header | `t("block")` | `app/[locale]/blocks/page.tsx:66` |
| Component prop | `height` | `BlockHeight height={block.index}` — `page.tsx:77` |

A user cross-referencing raw API responses with the UI sees `index` in one place and `height` in another and assumes they're different values. **They're the same number.** The explorer just renames it.

This is a **terminology / IA problem**, not a data problem.

---

## 1. User Persona

Four users touch /blocks, confusion lands differently on each:

- **Developer** (primary, ~high confusion risk)
  - Technical, reads API responses and UI side-by-side
  - Sees `block_index` in JSON, `Block` in UI header, `/blocks/{n}` in URL
  - Desktop-first, may have API docs open in another tab
  - Bahasa: campur EN/ID, technical terms in English

- **Validator** (secondary)
  - Monitors block production; cares about *which blocks they produced*
  - Desktop-first (staking dashboard context)
  - Low confusion risk on terminology — treats the number as just "block #"

- **Token holder / observer** (tertiary)
  - Glances at /blocks to confirm chain is alive
  - Mobile-heavy
  - Doesn't care about the term — "block number" is the mental model

- **New user** (landing from search / social)
  - May not know what a "block" is at all
  - No expectation — whatever term we pick, they'll learn it

## 2. Job-To-Be-Done

**Primary (developer):**
> When I'm debugging a transaction against the chain, I want to find a block by its number and trust that the number I see in the UI matches what the API returns, so I can cross-reference data without second-guessing terminology.

**Secondary (validator/observer):**
> When I open /blocks, I want to see the latest blocks and who produced them, so I can confirm the chain is healthy and track production.

## 3. User Journey

**Entry points**
- Direct nav from header
- From homepage "recent blocks" → "view all"
- From a tx detail page (crumb/link back to block)
- Deep link shared in Discord/Telegram

**Steps (current page)**
1. Land on /blocks
2. Scan table for a block number
3. Click a number → /blocks/{n}
4. (Sometimes) copy the number to paste in API/CLI — this is where confusion bites

**Exit / success**
- User clicks into a block detail, OR
- User confirms latest height + validators and leaves, OR
- User copies a block number and uses it successfully against the API

## 4. Information Architecture

### Canonical decision to make

**Pick one term and use it everywhere the user sees it.** Recommendation: **"Block"** as the user-facing label, **`height`** as the technical term when we must expose one. Reasons:

- Etherscan uses "Block" / "Block Height" — matches reference
- Blockscout uses "Block Height"
- `height` is industry standard for PoW/PoS explorers
- Backend's `index` is an internal implementation detail — we already normalize on tx endpoints

### Primary content (must be visible)
1. **Block number** — labeled consistently, monospace, tabular-nums
2. **Age** (relative + absolute tooltip)
3. **Tx count**
4. **Validator** (who produced it)
5. **Block hash** (shortened + copy)

### Secondary content (nice-to-have)
- Gas used / size (once backend exposes)
- Reward (once backend exposes)
- "Finalized" indicator — PoE claims instant finality, but confirming dot helps observers trust it

### Hierarchy (reads first, second, third)
1. Page header: "Blocks" + latest height badge (reassurance: chain is live)
2. Table: newest first, block number is the left-most, visually heaviest column
3. Validator column reads as secondary context (muted)
4. Hash is smallest — it's for copy, not scanning

### Terminology fix — concrete changes
- **Column header:** "Block" (keep current) — NOT "Index", NOT "Height" (too technical for scanning)
- **Tooltip on column header:** "Block height — the block's position in the chain. Also called `index` in the raw API."
- **Detail page URL:** `/blocks/{height}` (keep — SEO + shareable)
- **Detail page H1:** "Block #{height}"
- **Label above the number on detail:** "Block Height"
- **API response mapping:** keep `block_height` in frontend types; document the alias in a code comment at the `index → height` mapping site

## 5. States to Handle

- **Loading** — skeleton rows (already implemented, 12 rows)
- **Empty** — "No blocks yet" (already implemented, but should never happen on a live chain; may happen on testnet reset)
- **Error** — network fetch fails → show retry affordance (currently no explicit error state)
- **Success** — table renders
- **Edge cases**
  - Block with 0 txs — show "0" not "—" (it's a real value, not missing)
  - Block with huge tx count (100+) — keep centered, no overflow
  - Very long validator name — truncate with title/tooltip
  - Pagination past available data — backend has no server pagination; current client-slice caps at 100 blocks. User navigating page 5+ hits nothing. **Flag:** should we hide pagination when `blocks.length <= PAGE_SIZE`? (currently we already do this)
  - Network toggle mid-view — `useBlocks` resets on network change (fixed in 9f5b08d)
  - Deep link `/blocks` with `?page=3` — not currently wired; page state is local

## 6. Success Metric

How we know this "works":
- **Zero terminology questions** in Discord/support about "index vs height" after rollout (qualitative)
- **Copy-paste round-trip works**: user copies a block number from /blocks, pastes into API call, gets matching data (no mental translation needed)
- **Time-to-first-click** on /blocks stays low — users shouldn't hesitate on which number to click

## 7a. Homepage — Block Time bug (added 2026-04-19)

**Symptom:** `StatCard label="Block Time" value="0.0s"` on `/`.
**Source:** `app/[locale]/page.tsx:87` — `computeBlockTime(timestamps)`.

**Hypothesis (most likely):** `block_timestamp` from backend is a Unix **integer** (seconds). When passed through `String(t.block_timestamp)` → `new Date("1713456789").getTime()`, V8 returns `NaN` for non-ISO numeric strings → all diffs NaN → `!isFinite` guard catches and returns `"~3s"` — so this path does NOT produce "0.0s".

**Alternative hypothesis (more likely given observed "0.0s"):** timestamps parse fine but arrive with second-level precision. PoE = 500ms blocks, so most consecutive blocks share a unix second → many diffs are exactly `0`, a few are `1000`ms. Average ends up sub-100ms (e.g. 0.04s) → `.toFixed(1)` rounds to `"0.0s"`. The guard `avg <= 0` misses positive-but-tiny values.

**Fix direction (not implementing yet):**
- Use a longer window (current = 30 blocks) so a single 1s jump doesn't dominate a second-precision sample
- OR request backend to send `block_timestamp` in **milliseconds** (proper fix — PoE needs ms resolution anyway)
- OR clamp display: if `avg < 0.1`, render `"<0.1s"` or fall back to chain target `"~0.5s"` (cosmetic, hides truth)

**Recommendation:** ship cosmetic clamp now + open a backend ticket for ms timestamps. Do not stringify numeric timestamps in `lib/api.ts:255` either — that's a latent bug.

## 7b. Homepage — Total Transactions card (added 2026-04-19)

**User ask:** "total total, kayak ethscan, solscan, ya gak putus lah" → an all-time cumulative counter, not a windowed value.

**Blocker:** `ChainInfo` interface (`lib/api.ts:19-28`) has `total_blocks` but **no** `total_transactions`. Backend endpoint `/chain/stats` doesn't return it.

**Options:**
- (A) **Backend adds `total_transactions`** to `/chain/stats` — canonical, cheap query if backend keeps a counter, correct forever. **Recommended.**
- (B) Frontend sums `transactions.length` across the cached 100-block batch — but that's NOT "total ever", it's "txs in last 100 blocks". Mislabels. Reject.
- (C) Frontend shows "Txs (24h)" instead of "Total" — honest but not what user asked for.

**Placement:** homepage stat grid. Currently 8 cards (2×4 on desktop). Options:
- Replace `tokens_deployed` or `block_reward` (demote to secondary surface)
- Go to 9 cards (breaks the 2×4 symmetry)
- Go to 10 cards (2×5 on desktop, 2×5 on mobile)

**Recommendation:** 2×5 grid, add "Total Transactions" next to "Block Height" (thematic pairing).

## 8. Open Questions (need user input before building)

1. **Canonical term.** Confirm we're standardizing on **"Block Height"** (not "Block Index" or "Block Number"). This drives copy + docs.
2. **Should we expose the `index` alias anywhere?** Options:
   - (a) Hide it entirely, rename in API docs too
   - (b) Show it as a small "also known as" note on the block detail page
   - (c) Leave as-is in API, only fix UI — **my recommendation**
3. **Scope of this task:**
   - Just /blocks list page? Or
   - /blocks + /blocks/[height] detail + any other surface that shows block numbers (home, tx detail)?
   - **Recommendation:** audit all surfaces in one pass, change is cheap once we pick the term
4. **Error state design.** Today there's no explicit error UI. In-scope to add, or separate task?
5. **Finalized indicator.** Worth adding a "final" dot given PoE = instant finality, or is that noise?
6. **Server-side pagination.** `TODO(api)` in the file says backend has no paginated endpoint. Out of scope for this task, or do we want to push backend now?
7. **"Live" updating.** Should the table auto-refresh (websocket or polling) or stay static until user refreshes? Current: static on mount + polling via `useBlocks`.

---

## Assumptions flagged (will bake into design if no objection)

- Keep URL as `/blocks/{n}`
- Keep table columns as-is (block / age / txs / hash / validator)
- "Block Height" is the winning term
- Scope includes both list page *and* detail page header terminology
- No new API dependencies in this pass

---

## Revised open questions (post-feedback)

**Must answer before build:**

1. **Total Transactions source** — green-light backend to add `total_transactions` to `/chain/stats`? (Blocker — without it the card can't be honest.) If backend not available, fallback to (C) "Txs (24h)" window label?
2. **Block Time fix strategy** — cosmetic clamp now + backend ticket for ms-precision timestamps, or wait for backend and ship together?
3. **Is the original /blocks terminology task still in scope?** User only confirmed homepage fixes; terminology audit hasn't been re-confirmed.
4. **Grid layout** — OK with 2×5 (10 cards) on homepage, or demote an existing card?

**STOP. Awaiting your answers before moving to `sentris-design` + build.**
