import { createHash } from "crypto";
import { Cl } from "@stacks/transactions";

export const makeSecret = (seed: number) => Buffer.alloc(32, seed);

export const makeCommit = (secret: Buffer, bytes: number[]) => {
  const hash = createHash("sha256");
  hash.update(secret);
  hash.update(Buffer.from(bytes));
  return Cl.buffer(hash.digest());
};

export const secretCv = (secret: Buffer) => Cl.buffer(secret);

export const mineBlocks = (count: number) => {
  for (let i = 0; i < count; i += 1) {
    simnet.mineEmptyStacksBlock();
  }
};
