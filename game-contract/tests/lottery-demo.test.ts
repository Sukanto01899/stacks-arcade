import { Cl, ClarityType, SomeCV, TupleCV } from "@stacks/transactions";
import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const contractName = "lottery-demo-v3";

const getRound = (id: number) => {
  const entry = simnet.getMapEntry(contractName, "rounds", Cl.tuple({ id: Cl.uint(id) }));
  expect(entry).toHaveClarityType(ClarityType.OptionalSome);
  return (entry as SomeCV<TupleCV>).value;
};

describe("lottery-demo-v3", () => {
  it("creates a round, sells tickets, and draws a winner", () => {
    simnet.callPublicFn(contractName, "init-admin", [], wallet1);
    const create = simnet.callPublicFn(
      contractName,
      "create-round",
      [Cl.uint(1_000_000n), Cl.uint(1)],
      wallet1,
    );
    const roundId = Number((create.result as any).value.value);

    const buy = simnet.callPublicFn(contractName, "buy-ticket", [Cl.uint(roundId)], wallet2);
    expect(buy.result).toBeOk(Cl.bool(true));

    simnet.mineEmptyStacksBlock(2);
    const draw = simnet.callPublicFn(contractName, "draw", [Cl.uint(roundId)], wallet1);
    expect(draw.result).toHaveClarityType(ClarityType.ResponseOk);

    const round = getRound(roundId);
    expect(round.value.status).toEqual(Cl.uint(1));
  });

  it("allows admin to cancel a round with no tickets", () => {
    simnet.callPublicFn(contractName, "init-admin", [], wallet1);
    const create = simnet.callPublicFn(
      contractName,
      "create-round",
      [Cl.uint(1_000_000n), Cl.uint(5)],
      wallet1,
    );
    const roundId = Number((create.result as any).value.value);
    const cancel = simnet.callPublicFn(contractName, "cancel-round", [Cl.uint(roundId)], wallet1);
    expect(cancel.result).toBeOk(Cl.bool(true));
    const round = getRound(roundId);
    expect(round.value.status).toEqual(Cl.uint(2));
  });
});
