import { Cl, ClarityType, SomeCV, TupleCV } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { makeCommit, makeSecret, mineBlocks, secretCv } from "./helpers";

const accounts = simnet.getAccounts();
const wallet1 = accounts.get("wallet_1")!;
const contractName = "guess-the-number";
const contractPrincipal = `${simnet.deployer}.guess-the-number`;

const getGame = (id: number) => {
  const entry = simnet.getMapEntry(contractName, "games", Cl.tuple({ id: Cl.uint(id) }));
  expect(entry).toHaveClarityType(ClarityType.OptionalSome);
  return (entry as SomeCV<TupleCV>).value;
};

describe("guess-the-number", () => {
  it("creates and reveals with a valid commit", () => {
    simnet.transferSTX(5_000_000n, contractPrincipal, simnet.deployer);
    const secret = makeSecret(1);
    const guess = 4;
    const commit = makeCommit(secret, [guess]);

    const create = simnet.callPublicFn(
      contractName,
      "create-game",
      [Cl.uint(1_000_000n), commit],
      wallet1,
    );
    const gameId = Number((create.result as any).value.value);
    simnet.mineEmptyStacksBlock();

    const reveal = simnet.callPublicFn(
      contractName,
      "reveal",
      [Cl.uint(gameId), Cl.uint(guess), secretCv(secret)],
      wallet1,
    );
    expect(reveal.result).toHaveClarityType(ClarityType.ResponseOk);

    const game = getGame(gameId);
    expect(game.value.status).toEqual(Cl.uint(1));
    expect(game.value.draw).not.toBeNone();
  });

  it("rejects invalid guesses", () => {
    const secret = makeSecret(2);
    const commit = makeCommit(secret, [0]);
    const create = simnet.callPublicFn(
      contractName,
      "create-game",
      [Cl.uint(1_000_000n), commit],
      wallet1,
    );
    const gameId = Number((create.result as any).value.value);
    simnet.mineEmptyStacksBlock();
    const reveal = simnet.callPublicFn(
      contractName,
      "reveal",
      [Cl.uint(gameId), Cl.uint(99), secretCv(secret)],
      wallet1,
    );
    expect(reveal.result).toBeErr(Cl.uint(400));
  });

  it("expires a game after reveal window", () => {
    const secret = makeSecret(3);
    const commit = makeCommit(secret, [1]);
    const create = simnet.callPublicFn(
      contractName,
      "create-game",
      [Cl.uint(1_000_000n), commit],
      wallet1,
    );
    const gameId = Number((create.result as any).value.value);
    mineBlocks(200);
    const expire = simnet.callPublicFn(contractName, "expire-game", [Cl.uint(gameId)], wallet1);
    expect(expire.result).toBeOk(Cl.bool(true));
    const game = getGame(gameId);
    expect(game.value.status).toEqual(Cl.uint(2));
  });
});
