# `@stacks-arcade/sdk`

TypeScript SDK for the Stacks Arcade `v9` contracts.

It provides:

- default contract name resolution for the current contract set
- typed contract call descriptors for every game module
- read-only helpers for the modules that expose reads in the frontend
- commit-reveal utilities for coin flip, guess-the-number, higher/lower, emoji battle, and rock-paper-scissors

## Install

```bash
npm install @stacks-arcade/sdk
```

## Usage

```ts
import { createArcadeClient, makeCommitHex, makeSecretHex } from "@stacks-arcade/sdk";

const arcade = createArcadeClient({
  network: "testnet",
  deployer: "ST2J7...TESTNET",
});

const secretHex = makeSecretHex();
const commitHex = await makeCommitHex(secretHex, [1]);

const createGame = arcade.coinFlip.createGame({
  wager: 1_000_000n,
  commitHex,
});

console.log(createGame.contractName, createGame.functionName);
```

## Contract overrides

If a contract address or name differs from the default `v9` map, pass a full
principal string or a `{ address, name }` object:

```ts
const arcade = createArcadeClient({
  network: "mainnet",
  contracts: {
    coinFlip: "SP123....coin-flip-v9",
    tournament: {
      address: "SP123....",
      name: "tournament-v9",
    },
  },
});
```

## Read-only example

```ts
const score = await arcade.scoreboard.getScore({
  player: "ST123...",
});
```
