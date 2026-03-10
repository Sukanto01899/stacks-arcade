import test from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const sdk = await import(pathToFileURL(resolve(process.cwd(), "dist/index.js")).href);

test("makeCommitHex returns a stable sha256 commit", async () => {
  const secretHex = "11".repeat(32);
  const commitHex = await sdk.makeCommitHex(secretHex, [1, 9]);

  assert.equal(
    commitHex,
    "4d60bae897827a316bfa9257e17bf3b4a4203ff80c9c7159df856e29af3e2073",
  );
});

test("createArcadeClient resolves default v9 contracts", () => {
  const arcade = sdk.createArcadeClient({
    network: "testnet",
    deployer: "STTESTADDRESS123",
  });

  assert.equal(arcade.contracts.coinFlip.name, "coin-flip-v9");
  assert.equal(arcade.contracts.tournament.name, "tournament-v9");
  assert.equal(arcade.contracts.cosmetics.address, "STTESTADDRESS123");
});

test("coin flip createGame builds the expected call descriptor", () => {
  const arcade = sdk.createArcadeClient({
    network: "testnet",
    deployer: "STTESTADDRESS123",
  });

  const call = arcade.coinFlip.createGame({
    wager: 1_000_000n,
    commitHex: "22".repeat(32),
  });

  assert.equal(call.contractName, "coin-flip-v9");
  assert.equal(call.functionName, "create-game");
  assert.equal(call.contractAddress, "STTESTADDRESS123");
  assert.equal(call.functionArgs.length, 2);
});

test("contract overrides accept full principals", () => {
  const arcade = sdk.createArcadeClient({
    network: "mainnet",
    contracts: {
      scoreboard: "SP3ABC.scoreboard-v9",
    },
  });

  assert.equal(arcade.contracts.scoreboard.address, "SP3ABC");
  assert.equal(arcade.contracts.scoreboard.name, "scoreboard-v9");
});
