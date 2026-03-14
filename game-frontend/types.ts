import { PostCondition } from "@stacks/transactions";

export type NetworkKey = "testnet" | "mainnet";

export type ContractMeta = {
  address: string;
  name: string;
};

export type ContractCallOptions = {
  postConditions?: PostCondition[] | (() => Promise<PostCondition[]>);
};
