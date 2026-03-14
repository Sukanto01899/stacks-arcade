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

export const CONTRACT_OVERRIDES = {
  testnet: {
    coinFlip: process.env.NEXT_PUBLIC_TESTNET_COIN_FLIP_CONTRACT ?? "",
    guessTheNumber:
      process.env.NEXT_PUBLIC_TESTNET_GUESS_THE_NUMBER_CONTRACT ?? "",
    higherLower: process.env.NEXT_PUBLIC_TESTNET_HIGHER_LOWER_CONTRACT ?? "",
    emojiBattle: process.env.NEXT_PUBLIC_TESTNET_EMOJI_BATTLE_CONTRACT ?? "",
    rockPaperScissors:
      process.env.NEXT_PUBLIC_TESTNET_ROCK_PAPER_SCISSORS_CONTRACT ?? "",
    hotPotato: process.env.NEXT_PUBLIC_TESTNET_HOT_POTATO_CONTRACT ?? "",
    lottery: process.env.NEXT_PUBLIC_TESTNET_LOTTERY_CONTRACT ?? "",
    tournament: process.env.NEXT_PUBLIC_TESTNET_TOURNAMENT_CONTRACT ?? "",
    cosmetics: process.env.NEXT_PUBLIC_TESTNET_COSMETICS_CONTRACT ?? "",
    scoreboard: process.env.NEXT_PUBLIC_TESTNET_SCOREBOARD_CONTRACT ?? "",
    ticTacToe: process.env.NEXT_PUBLIC_TESTNET_TIC_TAC_TOE_CONTRACT ?? "",
    todoList: process.env.NEXT_PUBLIC_TESTNET_TODO_LIST_CONTRACT ?? "",
    deployer: process.env.NEXT_PUBLIC_TESTNET_DEPLOYER_ADDRESS ?? "",
  },
  mainnet: {
    coinFlip: process.env.NEXT_PUBLIC_MAINNET_COIN_FLIP_CONTRACT ?? "",
    guessTheNumber:
      process.env.NEXT_PUBLIC_MAINNET_GUESS_THE_NUMBER_CONTRACT ?? "",
    higherLower: process.env.NEXT_PUBLIC_MAINNET_HIGHER_LOWER_CONTRACT ?? "",
    emojiBattle: process.env.NEXT_PUBLIC_MAINNET_EMOJI_BATTLE_CONTRACT ?? "",
    rockPaperScissors:
      process.env.NEXT_PUBLIC_MAINNET_ROCK_PAPER_SCISSORS_CONTRACT ?? "",
    hotPotato: process.env.NEXT_PUBLIC_MAINNET_HOT_POTATO_CONTRACT ?? "",
    lottery: process.env.NEXT_PUBLIC_MAINNET_LOTTERY_CONTRACT ?? "",
    tournament: process.env.NEXT_PUBLIC_MAINNET_TOURNAMENT_CONTRACT ?? "",
    cosmetics: process.env.NEXT_PUBLIC_MAINNET_COSMETICS_CONTRACT ?? "",
    scoreboard: process.env.NEXT_PUBLIC_MAINNET_SCOREBOARD_CONTRACT ?? "",
    ticTacToe: process.env.NEXT_PUBLIC_MAINNET_TIC_TAC_TOE_CONTRACT ?? "",
    todoList: process.env.NEXT_PUBLIC_MAINNET_TODO_LIST_CONTRACT ?? "",
    deployer: process.env.NEXT_PUBLIC_MAINNET_DEPLOYER_ADDRESS ?? "",
  },
};
