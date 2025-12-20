# Stacks Arcade Contracts

Clarity contracts and tests for the Stacks Arcade mini-games. The project is configured for
Clarity 3 (epoch 3.0) to match Clarinet 3.8.1.

## Contracts

- coin-flip
- emoji-battle
- guess-the-number
- higher-lower
- hot-potato
- lottery-demo
- rock-paper-scissors
- scoreboard
- tic-tac-toe
- todo-list

See `game-contract/Clarinet.toml` for the full list and paths.

## Requirements

- Clarinet 3.8.1
- Node.js 18+ (for tests)

## Install

```bash
cd game-contract
npm install
```

## Tests

```bash
npm run test
npm run test:report
npm run test:watch
```

Tests live in `game-contract/tests` and use `vitest-environment-clarinet`.

## Deployment notes

- Testnet settings live in `game-contract/settings/Testnet.toml`.
- Generate a deployment plan:

```bash
clarinet deployments generate --testnet --medium-cost
```

Adjust `Clarinet.toml` or the settings file if you rename contracts or change deployer
addresses.
