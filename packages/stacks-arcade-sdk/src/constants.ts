import type { ContractKey } from "./types.js";

export const DEFAULT_CONTRACT_NAMES: Record<ContractKey, string> = {
  coinFlip: "coin-flip-v9",
  guessTheNumber: "guess-the-number-v9",
  higherLower: "higher-lower-v9",
  emojiBattle: "emoji-battle-v9",
  rockPaperScissors: "rock-paper-scissors-v9",
  hotPotato: "hot-potato-v9",
  lottery: "lottery-demo-v9",
  tournament: "tournament-v9",
  cosmetics: "cosmetics-v9",
  scoreboard: "scoreboard-v9",
  ticTacToe: "tic-tac-toe-v9",
  todoList: "todo-list-v9",
};

export const CONTRACT_KEYS = Object.keys(DEFAULT_CONTRACT_NAMES) as ContractKey[];
