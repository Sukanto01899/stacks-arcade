import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const contractName = "scoreboard-v2";

describe("scoreboard-v2", () => {
  it("allows admin to set and add scores", () => {
    simnet.callPublicFn(contractName, "init-admin", [], wallet1);
    const set = simnet.callPublicFn(
      contractName,
      "set-score",
      [Cl.standardPrincipal(wallet2), Cl.uint(10)],
      wallet1,
    );
    expect(set.result).toBeOk(Cl.bool(true));

    const add = simnet.callPublicFn(
      contractName,
      "add-score",
      [Cl.standardPrincipal(wallet2), Cl.uint(5)],
      wallet1,
    );
    expect(add.result).toBeOk(Cl.bool(true));

    const score = simnet.callReadOnlyFn(
      contractName,
      "get-score",
      [Cl.standardPrincipal(wallet2)],
      wallet1,
    );
    expect(score.result).toBeUint(15n);
  });

  it("rejects non-admin updates", () => {
    simnet.callPublicFn(contractName, "init-admin", [], wallet1);
    const res = simnet.callPublicFn(
      contractName,
      "set-score",
      [Cl.standardPrincipal(wallet2), Cl.uint(1)],
      wallet2,
    );
    expect(res.result).toBeErr(Cl.uint(900));
  });
});
