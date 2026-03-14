import { StacksNetworkName } from "@stacks/network";

export const DEFAULT_NETWORK = (() => {
  const value = (
    process.env.NEXT_PUBLIC_DEFAULT_NETWORK ?? "testnet"
  ).toLowerCase();
  if (value === "mainnet" || value === "testnet")
    return value as StacksNetworkName;
  return "testnet";
})();

export const CONTRACT_NAMES = {
  coinFlip: process.env.NEXT_PUBLIC_COIN_FLIP_NAME ?? "coin-flip-v10",
  guessTheNumber:
    process.env.NEXT_PUBLIC_GUESS_THE_NUMBER_NAME ?? "guess-the-number-v10",
  higherLower: process.env.NEXT_PUBLIC_HIGHER_LOWER_NAME ?? "higher-lower-v10",
  emojiBattle: process.env.NEXT_PUBLIC_EMOJI_BATTLE_NAME ?? "emoji-battle-v10",
  rockPaperScissors:
    process.env.NEXT_PUBLIC_ROCK_PAPER_SCISSORS_NAME ??
    "rock-paper-scissors-v10",
  hotPotato: process.env.NEXT_PUBLIC_HOT_POTATO_NAME ?? "hot-potato-v10",
  lottery: process.env.NEXT_PUBLIC_LOTTERY_NAME ?? "lottery-demo-v10",
  tournament: process.env.NEXT_PUBLIC_TOURNAMENT_NAME ?? "tournament-v10",
  cosmetics: process.env.NEXT_PUBLIC_COSMETICS_NAME ?? "cosmetics-v10",
  scoreboard: process.env.NEXT_PUBLIC_SCOREBOARD_NAME ?? "scoreboard-v10",
  ticTacToe: process.env.NEXT_PUBLIC_TIC_TAC_TOE_NAME ?? "tic-tac-toe-v10",
  todoList: process.env.NEXT_PUBLIC_TODO_LIST_NAME ?? "todo-list-v10",
};
