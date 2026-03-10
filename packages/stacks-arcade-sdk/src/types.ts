import type { ClarityValue } from "@stacks/transactions";
import type { createNetwork } from "@stacks/network";

export type ArcadeNetwork = "mainnet" | "testnet";

export type ContractKey =
  | "coinFlip"
  | "guessTheNumber"
  | "higherLower"
  | "emojiBattle"
  | "rockPaperScissors"
  | "hotPotato"
  | "lottery"
  | "tournament"
  | "cosmetics"
  | "scoreboard"
  | "ticTacToe"
  | "todoList";

export type ContractMeta = {
  address: string;
  name: string;
};

export type ContractOverride = string | Partial<ContractMeta>;

export type ArcadeContracts = Record<ContractKey, ContractMeta>;

export type UIntLike = bigint | number | string;

export type ArcadeCallDescriptor = {
  contractKey: ContractKey;
  contractAddress: string;
  contractName: string;
  functionName: string;
  functionArgs: ClarityValue[];
};

export type ArcadeReadOnlyParams = {
  contractKey: ContractKey;
  functionName: string;
  functionArgs: ClarityValue[];
  senderAddress?: string;
};

export type ArcadeClientConfig = {
  network: ArcadeNetwork;
  deployer?: string;
  senderAddress?: string;
  stacksNetwork?: ReturnType<typeof createNetwork>;
  contracts?: Partial<Record<ContractKey, ContractOverride>>;
};
