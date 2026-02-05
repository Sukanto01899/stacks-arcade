import { Cl, ClarityType, SomeCV, TupleCV } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { makeCommit, makeSecret, secretCv } from "./helpers";

const accounts = simnet.getAccounts();
const wallet1 = accounts.get("wallet_1")!;
const contractName = "higher-lower-v4";
const contractPrincipal = `${simnet.deployer}.higher-lower-v4`;

const getGame = (id: number) => {
  const entry = simnet.getMapEntry(contractName, "games", Cl.tuple({ id: Cl.uint(id) }));
  expect(entry).toHaveClarityType(ClarityType.OptionalSome);
  return (entry as SomeCV<TupleCV>).value;
};

describe("higher-lower-v4", () => {
  it("creates and reveals a game", () => {
    simnet.transferSTX(5_000_000n, contractPrincipal, simnet.deployer);
    const secret = makeSecret(1);
    const choice = 1;
    const target = 4;
    const commit = makeCommit(secret, [choice, target]);

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
      [Cl.uint(gameId), Cl.uint(choice), Cl.uint(target), secretCv(secret)],
      wallet1,
    );
    expect(reveal.result).toHaveClarityType(ClarityType.ResponseOk);

    const game = getGame(gameId);
    expect(game.value.status).toEqual(Cl.uint(1));
    expect(game.value.draw).not.toBeNone();
  });

  it("rejects invalid targets", () => {
    const secret = makeSecret(2);
    const commit = makeCommit(secret, [0, 0]);
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
      [Cl.uint(gameId), Cl.uint(0), Cl.uint(99), secretCv(secret)],
      wallet1,
    );
    expect(reveal.result).toBeErr(Cl.uint(400));
  });
});

