import { Cl, ClarityType, SomeCV, TupleCV } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { mineBlocks } from "./helpers";

const accounts = simnet.getAccounts();
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const contractName = "hot-potato-v4";

const getGame = (id: number) => {
  const entry = simnet.getMapEntry(contractName, "games", Cl.tuple({ id: Cl.uint(id) }));
  expect(entry).toHaveClarityType(ClarityType.OptionalSome);
  return (entry as SomeCV<TupleCV>).value;
};

describe("hot-potato-v4", () => {
  it("creates, passes, and settles after timeout", () => {
    const create = simnet.callPublicFn(contractName, "create-game", [Cl.uint(1_000_000n)], wallet1);
    const gameId = Number((create.result as any).value.value);

    const pass = simnet.callPublicFn(contractName, "take-potato", [Cl.uint(gameId)], wallet2);
    expect(pass.result).toBeOk(Cl.bool(true));

    mineBlocks(40);
    const settle = simnet.callPublicFn(contractName, "settle", [Cl.uint(gameId)], wallet1);
    expect(settle.result).toBeOk(Cl.bool(true));
    const game = getGame(gameId);
    expect(game.value.status).toEqual(Cl.uint(1));
  });

  it("prevents cancel after a pass", () => {
    const create = simnet.callPublicFn(contractName, "create-game", [Cl.uint(1_000_000n)], wallet1);
    const gameId = Number((create.result as any).value.value);
    simnet.callPublicFn(contractName, "take-potato", [Cl.uint(gameId)], wallet2);
    const cancel = simnet.callPublicFn(contractName, "cancel-game", [Cl.uint(gameId)], wallet1);
    expect(cancel.result).toBeErr(Cl.uint(403));
  });
});

