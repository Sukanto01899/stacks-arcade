import { Cl, ClarityType, SomeCV, TupleCV } from "@stacks/transactions";
import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const contractName = "tic-tac-toe-v3";

const getGame = (id: number) => {
  const entry = simnet.getMapEntry(contractName, "games", Cl.tuple({ id: Cl.uint(id) }));
  expect(entry).toHaveClarityType(ClarityType.OptionalSome);
  return (entry as SomeCV<TupleCV>).value;
};

describe("tic-tac-toe-v3", () => {
  it("plays a full game and declares a winner", () => {
    const create = simnet.callPublicFn(contractName, "create-game", [], wallet1);
    const gameId = Number((create.result as any).value.value);
    const join = simnet.callPublicFn(contractName, "join-game", [Cl.uint(gameId)], wallet2);
    expect(join.result).toBeOk(Cl.bool(true));

    simnet.callPublicFn(contractName, "play", [Cl.uint(gameId), Cl.uint(0)], wallet1);
    simnet.callPublicFn(contractName, "play", [Cl.uint(gameId), Cl.uint(3)], wallet2);
    simnet.callPublicFn(contractName, "play", [Cl.uint(gameId), Cl.uint(1)], wallet1);
    simnet.callPublicFn(contractName, "play", [Cl.uint(gameId), Cl.uint(4)], wallet2);
    const win = simnet.callPublicFn(contractName, "play", [Cl.uint(gameId), Cl.uint(2)], wallet1);
    expect(win.result).toBeOk(Cl.bool(true));

    const game = getGame(gameId);
    expect(game.value.status).toEqual(Cl.uint(2));
    expect(game.value.winner).toEqual(Cl.some(Cl.standardPrincipal(wallet1)));
  });

  it("rejects invalid moves and wrong turns", () => {
    const create = simnet.callPublicFn(contractName, "create-game", [], wallet1);
    const gameId = Number((create.result as any).value.value);
    simnet.callPublicFn(contractName, "join-game", [Cl.uint(gameId)], wallet2);

    const wrongTurn = simnet.callPublicFn(contractName, "play", [Cl.uint(gameId), Cl.uint(0)], wallet2);
    expect(wrongTurn.result).toBeErr(Cl.uint(402));

    simnet.callPublicFn(contractName, "play", [Cl.uint(gameId), Cl.uint(0)], wallet1);
    const invalidMove = simnet.callPublicFn(contractName, "play", [Cl.uint(gameId), Cl.uint(0)], wallet2);
    expect(invalidMove.result).toBeErr(Cl.uint(403));
  });
});
