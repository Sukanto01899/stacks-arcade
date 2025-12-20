import { Cl, ClarityType, SomeCV, TupleCV } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { makeCommit, makeSecret, mineBlocks, secretCv } from "./helpers";

const accounts = simnet.getAccounts();
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const contractName = "emoji-battle";

const getGame = (id: number) => {
  const entry = simnet.getMapEntry(contractName, "games", Cl.tuple({ id: Cl.uint(id) }));
  expect(entry).toHaveClarityType(ClarityType.OptionalSome);
  return (entry as SomeCV<TupleCV>).value;
};

describe("emoji-battle", () => {
  it("creates, joins, and settles after both reveals", () => {
    const secret1 = makeSecret(1);
    const secret2 = makeSecret(2);
    const commit1 = makeCommit(secret1, [0]);
    const commit2 = makeCommit(secret2, [2]);

    const create = simnet.callPublicFn(
      contractName,
      "create-game",
      [Cl.uint(1_000_000n), commit1],
      wallet1,
    );
    const gameId = Number((create.result as any).value.value);
    const join = simnet.callPublicFn(
      contractName,
      "join-game",
      [Cl.uint(gameId), commit2],
      wallet2,
    );
    expect(join.result).toBeOk(Cl.bool(true));

    const reveal1 = simnet.callPublicFn(
      contractName,
      "reveal",
      [Cl.uint(gameId), Cl.uint(0), secretCv(secret1)],
      wallet1,
    );
    expect(reveal1.result).toBeOk(Cl.tuple({ result: Cl.uint(0) }));

    const reveal2 = simnet.callPublicFn(
      contractName,
      "reveal",
      [Cl.uint(gameId), Cl.uint(2), secretCv(secret2)],
      wallet2,
    );
    expect(reveal2.result).toHaveClarityType(ClarityType.ResponseOk);

    const game = getGame(gameId);
    expect(game.value.status).toEqual(Cl.uint(2));
  });

  it("expires and awards if only one player reveals", () => {
    const secret1 = makeSecret(3);
    const secret2 = makeSecret(4);
    const commit1 = makeCommit(secret1, [1]);
    const commit2 = makeCommit(secret2, [2]);
    const create = simnet.callPublicFn(
      contractName,
      "create-game",
      [Cl.uint(1_000_000n), commit1],
      wallet1,
    );
    const gameId = Number((create.result as any).value.value);
    simnet.callPublicFn(contractName, "join-game", [Cl.uint(gameId), commit2], wallet2);

    const reveal1 = simnet.callPublicFn(
      contractName,
      "reveal",
      [Cl.uint(gameId), Cl.uint(1), secretCv(secret1)],
      wallet1,
    );
    expect(reveal1.result).toBeOk(Cl.tuple({ result: Cl.uint(0) }));

    mineBlocks(200);
    const expire = simnet.callPublicFn(contractName, "expire-game", [Cl.uint(gameId)], wallet2);
    expect(expire.result).toBeOk(Cl.bool(true));
    const game = getGame(gameId);
    expect(game.value.status).toEqual(Cl.uint(3));
  });

  it("rejects invalid emoji choices", () => {
    const secret = makeSecret(5);
    const commit = makeCommit(secret, [0]);
    const create = simnet.callPublicFn(
      contractName,
      "create-game",
      [Cl.uint(1_000_000n), commit],
      wallet1,
    );
    const gameId = Number((create.result as any).value.value);
    simnet.callPublicFn(contractName, "join-game", [Cl.uint(gameId), commit], wallet2);

    const reveal = simnet.callPublicFn(
      contractName,
      "reveal",
      [Cl.uint(gameId), Cl.uint(9), secretCv(secret)],
      wallet1,
    );
    expect(reveal.result).toBeErr(Cl.uint(400));
  });
});
