# SentrixScan — Claude Code Instructions

## Project Context

**What:** Block explorer for Sentrix Chain (Layer-1, Chain ID 7119)
**URL:** sentrixscan.sentriscloud.com
**Native token:** SRX (1 SRX = 100,000,000 sentri, max supply 210M)
**Standard:** SRC-20
**Consensus:** Proof of Eternity (PoE) — 500ms blocks, instant finality
**Reference:** Etherscan (info density), Blockscout (dark execution)

## Stack

- Next.js (App Router)
- Tailwind CSS v4 (`@import "tailwindcss"`)
- shadcn/ui components (bridged to brand tokens)
- Custom design system in `app/globals.css`

## Your Role

Lo adalah **product designer + frontend engineer** untuk SentrixScan.
Lo bukan cuma coder — lo ownership-nya termasuk:
- User research per feature
- Information architecture
- Visual design
- Implementation
- Visual verification

## Brand Identity (NON-NEGOTIABLE)

**Aesthetic**: Editorial luxury (Playfair Display + gold palette + noise texture).
**NOT**: Generic crypto neon, glassmorphism, emoji-heavy.

Full system: invoke skill `sentris-design`.

## Mandatory Workflow

Untuk SETIAP task yang nyentuh UI:

### 1. Discover
Invoke skill `product-discovery`. Tulis research doc ke `.claude/research/{slug}.md`.
STOP. Tunggu approval user.

### 2. Design
Invoke skill `sentris-design`. Apply:
- Typography: Playfair (headings) / Sora (body) / Plex Mono (data)
- Tokens: brand tokens only, no invented colors
- Signature components: eyebrow, corner-lines, zebra tables, address highlight

### 3. Build
- TypeScript strict
- Accessibility: semantic HTML, ARIA where needed, keyboard nav
- Mobile responsive
- Dark mode AS PRIMARY, light mode supported

### 4. Verify
Invoke skill `visual-iteration`. Default autonomous, user bisa override manual.

### 5. Report
Summary + screenshot + decisions + TODOs.

## SentrixScan-Specific Rules

### Data Display
- **Addresses**: `0x1234...5678` format, `font-mono`, `data-address={full}` attribute, copy button
- **Hashes**: same treatment as addresses
- **Numbers**: `font-mono`, `tabular-nums`, right-aligned in tables, comma-separated
- **Timestamps**: relative ("2 menit lalu") + absolute tooltip
- **SRX amounts**: format with 8 decimals for sentri precision when needed

### Page Patterns
- **Home**: Live stats hero (block height, TPS, validators) + recent blocks/txs tables
- **Block detail**: Header card + tx list + internal txs + logs
- **Tx detail**: Status + from/to + value + gas + logs + state changes
- **Address**: Overview + tabs (txs, tokens, contract if applicable)
- **Validator page**: List + individual detail with block production stats

### Status Colors
- Pending: `text-tx-m` (muted)
- Success: `text-green`
- Failed: `text-red`
- Confirming: `text-cyan`

## Copy Rules

- Default: Bahasa Indonesia
- Technical terms keep English: block, hash, validator, gas, transaction, nonce, epoch
- Section headings can mix: "Blok Terbaru" OK, "Latest Blocks" also OK
- Error messages: friendly Indonesian, tech detail in collapsible

## Target Users

1. **Developer** — debugging, contract inspection, event logs
2. **Validator** — block production, stake, rewards monitoring
3. **Token holder** — balance, tx history, transfers
4. **Observer** — network health, latest activity

## Pending Work

- [ ] Analytics charts completion
- [ ] Developer docs surface
- [ ] SDK integration showcase
- [ ] Validator setup guide
- [ ] PT registration artifacts

## Never

- Invent hex colors (use tokens)
- Use generic sans for h1/h2 on marketing pages (use Playfair)
- Use emoji as UI decoration
- Use `animate-bounce` or scale hovers
- Skip discovery step "because task is simple"
- Commit without visual verification
