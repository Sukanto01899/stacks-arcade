# Stacks Arcade Frontend

Next.js 16 app for the Stacks Arcade games. The main UI lives in
`game-frontend/app/home-client.tsx` and the server wrapper is
`game-frontend/app/page.tsx`.

## Requirements

- Node.js 18+

## Install

```bash
cd game-frontend
npm install
```

## Dev / Build

```bash
npm run dev
npm run build
npm run start
```

## Network and contract configuration

The UI supports both testnet and mainnet with a toggle. Defaults and overrides are
read from environment variables.

### Required

- `NEXT_PUBLIC_DEFAULT_NETWORK` = `testnet` or `mainnet`
- `NEXT_PUBLIC_TESTNET_DEPLOYER_ADDRESS`
- `NEXT_PUBLIC_MAINNET_DEPLOYER_ADDRESS`

### Optional contract name overrides

If you did not rename contracts, you can skip these.

- `NEXT_PUBLIC_COIN_FLIP_NAME`
- `NEXT_PUBLIC_GUESS_THE_NUMBER_NAME`
- `NEXT_PUBLIC_HIGHER_LOWER_NAME`
- `NEXT_PUBLIC_EMOJI_BATTLE_NAME`
- `NEXT_PUBLIC_ROCK_PAPER_SCISSORS_NAME`
- `NEXT_PUBLIC_HOT_POTATO_NAME`
- `NEXT_PUBLIC_LOTTERY_NAME`
- `NEXT_PUBLIC_SCOREBOARD_NAME`
- `NEXT_PUBLIC_TIC_TAC_TOE_NAME`
- `NEXT_PUBLIC_TODO_LIST_NAME`

### Optional full contract principal overrides

Use these when contract names or deployer addresses differ per network. Format:
`ST123...contract-name`.

- `NEXT_PUBLIC_TESTNET_COIN_FLIP_CONTRACT`
- `NEXT_PUBLIC_TESTNET_GUESS_THE_NUMBER_CONTRACT`
- `NEXT_PUBLIC_TESTNET_HIGHER_LOWER_CONTRACT`
- `NEXT_PUBLIC_TESTNET_EMOJI_BATTLE_CONTRACT`
- `NEXT_PUBLIC_TESTNET_ROCK_PAPER_SCISSORS_CONTRACT`
- `NEXT_PUBLIC_TESTNET_HOT_POTATO_CONTRACT`
- `NEXT_PUBLIC_TESTNET_LOTTERY_CONTRACT`
- `NEXT_PUBLIC_TESTNET_SCOREBOARD_CONTRACT`
- `NEXT_PUBLIC_TESTNET_TIC_TAC_TOE_CONTRACT`
- `NEXT_PUBLIC_TESTNET_TODO_LIST_CONTRACT`
- `NEXT_PUBLIC_MAINNET_COIN_FLIP_CONTRACT`
- `NEXT_PUBLIC_MAINNET_GUESS_THE_NUMBER_CONTRACT`
- `NEXT_PUBLIC_MAINNET_HIGHER_LOWER_CONTRACT`
- `NEXT_PUBLIC_MAINNET_EMOJI_BATTLE_CONTRACT`
- `NEXT_PUBLIC_MAINNET_ROCK_PAPER_SCISSORS_CONTRACT`
- `NEXT_PUBLIC_MAINNET_HOT_POTATO_CONTRACT`
- `NEXT_PUBLIC_MAINNET_LOTTERY_CONTRACT`
- `NEXT_PUBLIC_MAINNET_SCOREBOARD_CONTRACT`
- `NEXT_PUBLIC_MAINNET_TIC_TAC_TOE_CONTRACT`
- `NEXT_PUBLIC_MAINNET_TODO_LIST_CONTRACT`

### Example `.env.local`

```bash
NEXT_PUBLIC_DEFAULT_NETWORK=testnet
NEXT_PUBLIC_TESTNET_DEPLOYER_ADDRESS=ST2J7...TESTNET
NEXT_PUBLIC_MAINNET_DEPLOYER_ADDRESS=SP2J7...MAINNET
```

## Wallet connection

The app uses `@stacks/connect` with `authenticate` and `openContractCall`.
WalletConnect is stubbed to avoid bundling issues with Next 16 in this project.
If you want WalletConnect support, remove the alias for
`@reown/appkit-universal-connector` in `game-frontend/next.config.ts` and add a
real WalletConnect integration.
