import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const contractName = "cosmetics-v9";

describe("cosmetics-v9", () => {
  it("enforces badge gating for direct claims and permit claims", () => {
    expect(simnet.callPublicFn(contractName, "init-admin", [], deployer).result).toBeOk(Cl.bool(true));

    const createDrop = simnet.callPublicFn(
      contractName,
      "create-drop",
      [Cl.uint(2), Cl.uint(7), Cl.uint(5), Cl.uint(1)],
      deployer,
    );
    expect(createDrop.result).toBeOk(Cl.uint(0));

    const directClaim = simnet.callPublicFn(contractName, "claim-drop", [Cl.uint(0)], wallet1);
    expect(directClaim.result).toBeErr(Cl.uint(707));

    const permitClaim = simnet.callPublicFn(
      contractName,
      "claim-with-permit",
      [Cl.uint(0), Cl.uint(1), Cl.buffer(Buffer.alloc(65, 0))],
      wallet1,
    );
    expect(permitClaim.result).toBeErr(Cl.uint(707));

    expect(
      simnet.callPublicFn(contractName, "grant-badge", [Cl.principal(wallet1), Cl.uint(1)], deployer).result,
    ).toBeOk(Cl.bool(true));

    const allowedClaim = simnet.callPublicFn(contractName, "claim-drop", [Cl.uint(0)], wallet1);
    expect(allowedClaim.result).toBeOk(Cl.uint(0));
  });
});
