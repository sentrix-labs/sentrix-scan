# Sentrix Scan — moved

> ## ⚠ This repository has moved.
>
> SentrixScan now lives in the SentrisCloud frontend monorepo:
>
> **[`sentriscloud/frontend`](https://github.com/Sentriscloud/frontend) → [`apps/scan/`](https://github.com/Sentriscloud/frontend/tree/main/apps/scan)**
>
> All future development, issues, and pull requests should go there.
> This repository is kept read-only for historical reference.

---

## Why the move

Per the SentrisCloud architecture decision (April 2026), all user-facing TypeScript apps consolidate into a single `pnpm` + Turborepo monorepo at `sentriscloud/frontend`. The `sentrix-labs` org is reserved for the protocol foundation (chain core, SDKs, brand assets); products live under the `sentriscloud` org.

## Live deployments

These continue to run from the new location:

- **Mainnet:** https://sentrixscan.sentriscloud.com
- **Testnet:** https://testnet-scan.sentriscloud.com

## Where to find what was here

| Old path | New path |
| --- | --- |
| `sentrix-labs/sentrix-scan` (root) | `sentriscloud/frontend/apps/scan/` |
| `app/`, `components/`, `lib/` | same, under `apps/scan/` |
| `package.json` (`"name": "sentrix-scan"`) | `apps/scan/package.json` (`"name": "@sentriscloud/scan"`) |
| Standalone `pnpm install` | Workspace-level: `pnpm install` at monorepo root |

Git history is preserved in the monorepo as a squashed migration commit.
