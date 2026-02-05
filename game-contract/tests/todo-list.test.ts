import { Cl, ClarityType } from "@stacks/transactions";
import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const contractName = "todo-list-v4";

describe("todo-list-v4", () => {
  it("creates, updates, and deletes a task", () => {
    const create = simnet.callPublicFn(contractName, "create-task", [], wallet1);
    const taskId = Number((create.result as any).value.value);

    const setDone = simnet.callPublicFn(
      contractName,
      "set-completed",
      [Cl.uint(taskId), Cl.bool(true)],
      wallet1,
    );
    expect(setDone.result).toBeOk(Cl.bool(true));

    const task = simnet.callReadOnlyFn(
      contractName,
      "get-task",
      [Cl.uint(taskId)],
      wallet1,
    );
    expect(task.result).toHaveClarityType(ClarityType.OptionalSome);

    const del = simnet.callPublicFn(contractName, "delete-task", [Cl.uint(taskId)], wallet1);
    expect(del.result).toBeOk(Cl.bool(true));
  });

  it("rejects non-owner updates", () => {
    const create = simnet.callPublicFn(contractName, "create-task", [], wallet1);
    const taskId = Number((create.result as any).value.value);
    const res = simnet.callPublicFn(
      contractName,
      "set-completed",
      [Cl.uint(taskId), Cl.bool(true)],
      wallet2,
    );
    expect(res.result).toBeErr(Cl.uint(400));
  });
});

