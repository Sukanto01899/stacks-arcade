import { createNetwork } from "@stacks/network";
import {
  boolCV,
  cvToJSON,
  fetchCallReadOnlyFunction,
  standardPrincipalCV,
  stringUtf8CV,
  uintCV,
  type ClarityValue,
} from "@stacks/transactions";
import type {
  ArcadeCallDescriptor,
  ArcadeClientConfig,
  ArcadeReadOnlyParams,
  ContractKey,
  UIntLike,
} from "./types.js";
import {
  bufferCvFromHex,
  getStacksNetwork,
  requireAddress,
  resolveContracts,
  toUint,
} from "./utils.js";

function uint(value: UIntLike): ClarityValue {
  return uintCV(toUint(value));
}

function principal(value: string): ClarityValue {
  return standardPrincipalCV(value);
}

type ReadOnlyJson = ReturnType<typeof cvToJSON>;

export function createArcadeClient(config: ArcadeClientConfig) {
  const contracts = resolveContracts(config);
  const network = config.stacksNetwork ?? getStacksNetwork(config.network);

  const makeCall = (
    contractKey: ContractKey,
    functionName: string,
    functionArgs: ClarityValue[],
  ): ArcadeCallDescriptor => {
    const contract = contracts[contractKey];
    return {
      contractKey,
      contractAddress: requireAddress(contract.address, contract.name),
      contractName: contract.name,
      functionName,
      functionArgs,
    };
  };

  const callReadOnly = async ({
    contractKey,
    functionName,
    functionArgs,
    senderAddress,
  }: ArcadeReadOnlyParams): Promise<ReadOnlyJson> => {
    const contract = contracts[contractKey];
    const contractAddress = requireAddress(contract.address, contract.name);
    const response = await fetchCallReadOnlyFunction({
      contractAddress,
      contractName: contract.name,
      functionName,
      functionArgs,
      senderAddress: senderAddress ?? config.senderAddress ?? contractAddress,
      network,
    });
    return cvToJSON(response);
  };

  return {
    config: {
      ...config,
      network: config.network,
      stacksNetwork: network,
    },
    contracts,
    makeCall,
    readOnly: callReadOnly,
    coinFlip: {
      createGame: (params: { wager: UIntLike; commitHex: string }) =>
        makeCall("coinFlip", "create-game", [
          uint(params.wager),
          bufferCvFromHex(params.commitHex, 32, "Commit"),
        ]),
      reveal: (params: { gameId: UIntLike; pick: UIntLike; secretHex: string }) =>
        makeCall("coinFlip", "reveal", [
          uint(params.gameId),
          uint(params.pick),
          bufferCvFromHex(params.secretHex, 32, "Secret"),
        ]),
      expireGame: (params: { gameId: UIntLike }) =>
        makeCall("coinFlip", "expire-game", [uint(params.gameId)]),
    },
    guessTheNumber: {
      createGame: (params: { wager: UIntLike; commitHex: string }) =>
        makeCall("guessTheNumber", "create-game", [
          uint(params.wager),
          bufferCvFromHex(params.commitHex, 32, "Commit"),
        ]),
      reveal: (params: { gameId: UIntLike; guess: UIntLike; secretHex: string }) =>
        makeCall("guessTheNumber", "reveal", [
          uint(params.gameId),
          uint(params.guess),
          bufferCvFromHex(params.secretHex, 32, "Secret"),
        ]),
      expireGame: (params: { gameId: UIntLike }) =>
        makeCall("guessTheNumber", "expire-game", [uint(params.gameId)]),
    },
    higherLower: {
      createGame: (params: { wager: UIntLike; commitHex: string }) =>
        makeCall("higherLower", "create-game", [
          uint(params.wager),
          bufferCvFromHex(params.commitHex, 32, "Commit"),
        ]),
      reveal: (params: {
        gameId: UIntLike;
        choice: UIntLike;
        target: UIntLike;
        secretHex: string;
      }) =>
        makeCall("higherLower", "reveal", [
          uint(params.gameId),
          uint(params.choice),
          uint(params.target),
          bufferCvFromHex(params.secretHex, 32, "Secret"),
        ]),
      expireGame: (params: { gameId: UIntLike }) =>
        makeCall("higherLower", "expire-game", [uint(params.gameId)]),
    },
    emojiBattle: {
      createGame: (params: { stake: UIntLike; commitHex: string }) =>
        makeCall("emojiBattle", "create-game", [
          uint(params.stake),
          bufferCvFromHex(params.commitHex, 32, "Commit"),
        ]),
      joinGame: (params: { gameId: UIntLike; commitHex: string }) =>
        makeCall("emojiBattle", "join-game", [
          uint(params.gameId),
          bufferCvFromHex(params.commitHex, 32, "Commit"),
        ]),
      reveal: (params: { gameId: UIntLike; choice: UIntLike; secretHex: string }) =>
        makeCall("emojiBattle", "reveal", [
          uint(params.gameId),
          uint(params.choice),
          bufferCvFromHex(params.secretHex, 32, "Secret"),
        ]),
      expireGame: (params: { gameId: UIntLike }) =>
        makeCall("emojiBattle", "expire-game", [uint(params.gameId)]),
    },
    rockPaperScissors: {
      createGame: (params: { stake: UIntLike; commitHex: string }) =>
        makeCall("rockPaperScissors", "create-game", [
          uint(params.stake),
          bufferCvFromHex(params.commitHex, 32, "Commit"),
        ]),
      joinGame: (params: { gameId: UIntLike; commitHex: string }) =>
        makeCall("rockPaperScissors", "join-game", [
          uint(params.gameId),
          bufferCvFromHex(params.commitHex, 32, "Commit"),
        ]),
      reveal: (params: { gameId: UIntLike; choice: UIntLike; secretHex: string }) =>
        makeCall("rockPaperScissors", "reveal", [
          uint(params.gameId),
          uint(params.choice),
          bufferCvFromHex(params.secretHex, 32, "Secret"),
        ]),
      expireGame: (params: { gameId: UIntLike }) =>
        makeCall("rockPaperScissors", "expire-game", [uint(params.gameId)]),
    },
    hotPotato: {
      createGame: (params: { stake: UIntLike }) =>
        makeCall("hotPotato", "create-game", [uint(params.stake)]),
      takePotato: (params: { gameId: UIntLike }) =>
        makeCall("hotPotato", "take-potato", [uint(params.gameId)]),
      settle: (params: { gameId: UIntLike }) =>
        makeCall("hotPotato", "settle", [uint(params.gameId)]),
      cancelGame: (params: { gameId: UIntLike }) =>
        makeCall("hotPotato", "cancel-game", [uint(params.gameId)]),
    },
    lottery: {
      createRound: (params: { ticketPrice: UIntLike; duration: UIntLike }) =>
        makeCall("lottery", "create-round", [
          uint(params.ticketPrice),
          uint(params.duration),
        ]),
      buyTicket: (params: { roundId: UIntLike }) =>
        makeCall("lottery", "buy-ticket", [uint(params.roundId)]),
      draw: (params: { roundId: UIntLike }) =>
        makeCall("lottery", "draw", [uint(params.roundId)]),
      cancelRound: (params: { roundId: UIntLike }) =>
        makeCall("lottery", "cancel-round", [uint(params.roundId)]),
    },
    tournament: {
      createTournament: (params: {
        entryFee: UIntLike;
        maxPlayers: UIntLike;
        startHeight: UIntLike;
        endHeight: UIntLike;
        winnersPaid: UIntLike;
      }) =>
        makeCall("tournament", "create-tournament", [
          uint(params.entryFee),
          uint(params.maxPlayers),
          uint(params.startHeight),
          uint(params.endHeight),
          uint(params.winnersPaid),
        ]),
      joinTournament: (params: { tournamentId: UIntLike }) =>
        makeCall("tournament", "join-tournament", [uint(params.tournamentId)]),
      lockTournament: (params: { tournamentId: UIntLike }) =>
        makeCall("tournament", "lock-tournament", [uint(params.tournamentId)]),
      cancelTournament: (params: { tournamentId: UIntLike }) =>
        makeCall("tournament", "cancel-tournament", [uint(params.tournamentId)]),
      claimRefund: (params: { tournamentId: UIntLike }) =>
        makeCall("tournament", "claim-refund", [uint(params.tournamentId)]),
      settleSingle: (params: { tournamentId: UIntLike; winner: string }) =>
        makeCall("tournament", "settle-single", [
          uint(params.tournamentId),
          principal(params.winner),
        ]),
      settleTop3: (params: {
        tournamentId: UIntLike;
        winner1: string;
        winner2: string;
        winner3: string;
      }) =>
        makeCall("tournament", "settle-top3", [
          uint(params.tournamentId),
          principal(params.winner1),
          principal(params.winner2),
          principal(params.winner3),
        ]),
    },
    cosmetics: {
      createDrop: (params: {
        category: UIntLike;
        skinId: UIntLike;
        maxSupply: UIntLike;
        requiredBadge: UIntLike;
      }) =>
        makeCall("cosmetics", "create-drop", [
          uint(params.category),
          uint(params.skinId),
          uint(params.maxSupply),
          uint(params.requiredBadge),
        ]),
      setDropUri: (params: { dropId: UIntLike; uri: string }) =>
        makeCall("cosmetics", "set-drop-uri", [
          uint(params.dropId),
          stringUtf8CV(params.uri),
        ]),
      setDropActive: (params: { dropId: UIntLike; active: boolean }) =>
        makeCall("cosmetics", "set-drop-active", [
          uint(params.dropId),
          boolCV(params.active),
        ]),
      setClaimSigner: (params: { publicKeyHex: string }) =>
        makeCall("cosmetics", "set-claim-signer", [
          bufferCvFromHex(params.publicKeyHex, 33, "Signer public key"),
        ]),
      grantBadge: (params: { player: string; badgeId: UIntLike }) =>
        makeCall("cosmetics", "grant-badge", [
          principal(params.player),
          uint(params.badgeId),
        ]),
      claimDrop: (params: { dropId: UIntLike }) =>
        makeCall("cosmetics", "claim-drop", [uint(params.dropId)]),
      claimWithPermit: (params: {
        dropId: UIntLike;
        nonce: UIntLike;
        signatureHex: string;
      }) =>
        makeCall("cosmetics", "claim-with-permit", [
          uint(params.dropId),
          uint(params.nonce),
          bufferCvFromHex(params.signatureHex, 65, "Permit signature"),
        ]),
      transfer: (params: { tokenId: UIntLike; from: string; to: string }) =>
        makeCall("cosmetics", "transfer", [
          uint(params.tokenId),
          principal(params.from),
          principal(params.to),
        ]),
      getDrop: (params: { dropId: UIntLike; senderAddress?: string }) =>
        callReadOnly({
          contractKey: "cosmetics",
          functionName: "get-drop",
          functionArgs: [uint(params.dropId)],
          senderAddress: params.senderAddress,
        }),
      getToken: (params: { tokenId: UIntLike; senderAddress?: string }) =>
        callReadOnly({
          contractKey: "cosmetics",
          functionName: "get-token",
          functionArgs: [uint(params.tokenId)],
          senderAddress: params.senderAddress,
        }),
      getTokenUri: (params: { tokenId: UIntLike; senderAddress?: string }) =>
        callReadOnly({
          contractKey: "cosmetics",
          functionName: "get-token-uri",
          functionArgs: [uint(params.tokenId)],
          senderAddress: params.senderAddress,
        }),
      getBadge: (params: {
        player: string;
        badgeId: UIntLike;
        senderAddress?: string;
      }) =>
        callReadOnly({
          contractKey: "cosmetics",
          functionName: "get-badge",
          functionArgs: [principal(params.player), uint(params.badgeId)],
          senderAddress: params.senderAddress,
        }),
    },
    scoreboard: {
      setScore: (params: { player: string; score: UIntLike }) =>
        makeCall("scoreboard", "set-score", [
          principal(params.player),
          uint(params.score),
        ]),
      addScore: (params: { player: string; delta: UIntLike }) =>
        makeCall("scoreboard", "add-score", [
          principal(params.player),
          uint(params.delta),
        ]),
      getScore: (params: { player: string; senderAddress?: string }) =>
        callReadOnly({
          contractKey: "scoreboard",
          functionName: "get-score",
          functionArgs: [principal(params.player)],
          senderAddress: params.senderAddress,
        }),
    },
    ticTacToe: {
      createGame: () => makeCall("ticTacToe", "create-game", []),
      joinGame: (params: { gameId: UIntLike }) =>
        makeCall("ticTacToe", "join-game", [uint(params.gameId)]),
      play: (params: { gameId: UIntLike; position: UIntLike }) =>
        makeCall("ticTacToe", "play", [
          uint(params.gameId),
          uint(params.position),
        ]),
      cancelGame: (params: { gameId: UIntLike }) =>
        makeCall("ticTacToe", "cancel-game", [uint(params.gameId)]),
    },
    todoList: {
      createTask: () => makeCall("todoList", "create-task", []),
      setCompleted: (params: { taskId: UIntLike; completed: boolean }) =>
        makeCall("todoList", "set-completed", [
          uint(params.taskId),
          boolCV(params.completed),
        ]),
      deleteTask: (params: { taskId: UIntLike }) =>
        makeCall("todoList", "delete-task", [uint(params.taskId)]),
      getTask: (params: { taskId: UIntLike; senderAddress?: string }) =>
        callReadOnly({
          contractKey: "todoList",
          functionName: "get-task",
          functionArgs: [uint(params.taskId)],
          senderAddress: params.senderAddress,
        }),
    },
  };
}

export type ArcadeClient = ReturnType<typeof createArcadeClient>;

export function getDefaultNetworkConfig(network: "mainnet" | "testnet") {
  return createNetwork(network);
}
