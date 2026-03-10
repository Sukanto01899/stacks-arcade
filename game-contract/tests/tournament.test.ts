import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";
import { mineBlocks } from "./helpers";

const accounts = simnet.getAccounts();
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const contractName = "tournament-v9";

describe("tournament-v9", () => {
  it("creates, fills, locks, and settles a single-winner tournament", () => {
    const startHeight = simnet.blockHeight + 5;
    const endHeight = startHeight + 3;

    const create = simnet.callPublicFn(
      contractName,
      "create-tournament",
      [Cl.uint(1_000_000n), Cl.uint(2), Cl.uint(startHeight), Cl.uint(endHeight), Cl.uint(1)],
      wallet1,
    );
    expect(create.result).toBeOk(Cl.uint(0));

    const join = simnet.callPublicFn(contractName, "join-tournament", [Cl.uint(0)], wallet2);
    expect(join.result).toBeOk(Cl.bool(true));

    mineBlocks(4);

    const lock = simnet.callPublicFn(contractName, "lock-tournament", [Cl.uint(0)], wallet1);
    expect(lock.result).toBeOk(Cl.bool(true));

    mineBlocks(3);

    const settle = simnet.callPublicFn(
      contractName,
      "settle-single",
      [Cl.uint(0), Cl.principal(wallet2)],
      wallet1,
    );
    expect(settle.result).toBeOk(Cl.bool(true));
  });
});
