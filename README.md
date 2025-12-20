# Stacks Arcade

Production-ready Stacks arcade with multiple Clarity mini‑games, automated tests, and a
polished Next.js frontend. This repo contains both on-chain game logic and a responsive
web UI with testnet/mainnet toggles.

## Repo layout

- `game-contract` — Clarity contracts + Vitest/Clarinet tests.
- `game-frontend` — Next.js 16 app that connects wallets and calls contracts.
- `docs` — project notes and references.

## Quick start

### 1) Contracts

```bash
cd game-contract
npm install
npm run test
```

See `game-contract/README.md` for Clarinet configuration, deployment notes, and test
commands.

### 2) Frontend

```bash
cd game-frontend
npm install
npm run dev
```

See `game-frontend/README.md` for environment variables, network toggles, and build
instructions.

## Environment configuration

The frontend reads its network and contract configuration from environment variables.
At minimum, set:

```bash
NEXT_PUBLIC_DEFAULT_NETWORK=testnet
NEXT_PUBLIC_TESTNET_DEPLOYER_ADDRESS=ST2J7...TESTNET
NEXT_PUBLIC_MAINNET_DEPLOYER_ADDRESS=SP2J7...MAINNET
```

Optional per‑network contract overrides are documented in
`game-frontend/README.md`.

## Deployment flow (recommended)

1) Deploy contracts on testnet with Clarinet.
2) Set `NEXT_PUBLIC_TESTNET_DEPLOYER_ADDRESS` and optional contract overrides.
3) Verify UI calls against testnet.
4) Deploy to mainnet and update the mainnet environment values.

## Notes

- Contracts are configured for Clarity 3 / Clarinet 3.8.1.
- The frontend uses `@stacks/connect` for wallet authentication and contract calls.

---

If you want, share your testnet and mainnet contract principals and I can generate a
ready‑to‑drop `.env.local` for the frontend.
