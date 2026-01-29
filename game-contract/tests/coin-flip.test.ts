import { Cl, ClarityType, SomeCV, TupleCV } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { makeCommit, makeSecret, mineBlocks, secretCv } from "./helpers";

const accounts = simnet.getAccounts();
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const contractName = "coin-flip-v2";
const contractPrincipal = `${simnet.deployer}.coin-flip-v2`;

const getGame = (id: number) => {
  const entry = simnet.getMapEntry(contractName, "games", Cl.tuple({ id: Cl.uint(id) }));
  expect(entry).toHaveClarityType(ClarityType.OptionalSome);
  return (entry as SomeCV<TupleCV>).value;
};

describe("coin-flip-v2", () => {
  it("creates and reveals a game with a valid commit", () => {
    simnet.transferSTX(5_000_000n, contractPrincipal, simnet.deployer);
    const secret = makeSecret(1);
    const pick = 0;
    const commit = makeCommit(secret, [pick]);

    const create = simnet.callPublicFn(
      contractName,
      "create-game",
      [Cl.uint(1_000_000n), commit],
      wallet1,
    );
    expect(create.result).toBeOk(Cl.uint(0));
    const gameId = Number((create.result as any).value.value);

    simnet.mineEmptyStacksBlock();
    const reveal = simnet.callPublicFn(
      contractName,
      "reveal",
      [Cl.uint(gameId), Cl.uint(pick), secretCv(secret)],
      wallet1,
    );
    expect(reveal.result).toHaveClarityType(ClarityType.ResponseOk);

    const game = getGame(gameId);
    expect(game.value.status).toEqual(Cl.uint(1));
    expect(game.value.result).not.toBeNone();
  });

  it("rejects a reveal with a mismatched commit", () => {
    const secret = makeSecret(2);
    const commit = makeCommit(secret, [1]);
    const create = simnet.callPublicFn(
      contractName,
      "create-game",
      [Cl.uint(1_000_000n), commit],
      wallet1,
    );
    const gameId = Number((create.result as any).value.value);
    simnet.mineEmptyStacksBlock();
    const badSecret = makeSecret(3);
    const reveal = simnet.callPublicFn(
      contractName,
      "reveal",
      [Cl.uint(gameId), Cl.uint(1), secretCv(badSecret)],
      wallet1,
    );
    expect(reveal.result).toBeErr(Cl.uint(106));
  });

  it("expires a game after the reveal window", () => {
    const secret = makeSecret(4);
    const commit = makeCommit(secret, [0]);
    const create = simnet.callPublicFn(
      contractName,
      "create-game",
      [Cl.uint(1_000_000n), commit],
      wallet2,
    );
    const gameId = Number((create.result as any).value.value);
    mineBlocks(200);
    const expire = simnet.callPublicFn(
      contractName,
      "expire-game",
      [Cl.uint(gameId)],
      wallet1,
    );
    expect(expire.result).toBeOk(Cl.bool(true));
    const game = getGame(gameId);
    expect(game.value.status).toEqual(Cl.uint(2));
  });
});
