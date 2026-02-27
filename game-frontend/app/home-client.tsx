"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AppConfig,
  UserSession,
  authenticate,
  openContractCall,
} from "@stacks/connect";
import { createNetwork, type StacksNetworkName } from "@stacks/network";
import {
  AnchorMode,
  PostConditionMode,
  boolCV,
  bufferCV,
  cvToJSON,
  fetchCallReadOnlyFunction,
  stringUtf8CV,
  standardPrincipalCV,
  uintCV,
} from "@stacks/transactions";

const appConfig = new AppConfig(["store_write", "publish_data"]);
const userSession = new UserSession({ appConfig });

const DEFAULT_NETWORK = (() => {
  const value = (
    process.env.NEXT_PUBLIC_DEFAULT_NETWORK ?? "testnet"
  ).toLowerCase();
  if (value === "mainnet" || value === "testnet")
    return value as StacksNetworkName;
  return "testnet";
})();

const CONTRACT_NAMES = {
  coinFlip: process.env.NEXT_PUBLIC_COIN_FLIP_NAME ?? "coin-flip-v5",
  guessTheNumber:
    process.env.NEXT_PUBLIC_GUESS_THE_NUMBER_NAME ?? "guess-the-number-v5",
  higherLower: process.env.NEXT_PUBLIC_HIGHER_LOWER_NAME ?? "higher-lower-v5",
  emojiBattle: process.env.NEXT_PUBLIC_EMOJI_BATTLE_NAME ?? "emoji-battle-v5",
  rockPaperScissors:
    process.env.NEXT_PUBLIC_ROCK_PAPER_SCISSORS_NAME ??
    "rock-paper-scissors-v5",
  hotPotato: process.env.NEXT_PUBLIC_HOT_POTATO_NAME ?? "hot-potato-v5",
  lottery: process.env.NEXT_PUBLIC_LOTTERY_NAME ?? "lottery-demo-v5",
  tournament: process.env.NEXT_PUBLIC_TOURNAMENT_NAME ?? "tournament-v5",
  cosmetics: process.env.NEXT_PUBLIC_COSMETICS_NAME ?? "cosmetics-v5",
  scoreboard: process.env.NEXT_PUBLIC_SCOREBOARD_NAME ?? "scoreboard-v5",
  ticTacToe: process.env.NEXT_PUBLIC_TIC_TAC_TOE_NAME ?? "tic-tac-toe-v5",
  todoList: process.env.NEXT_PUBLIC_TODO_LIST_NAME ?? "todo-list-v5",
};

const CONTRACT_OVERRIDES = {
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

type NetworkKey = "testnet" | "mainnet";

type ContractMeta = {
  address: string;
  name: string;
};

const appDetails = {
  name: "Stacks Arcade",
  icon: "/favicon.ico",
};

function parseContractOverride(
  value: string,
  fallbackName: string,
  fallbackAddress: string,
): ContractMeta {
  if (!value) {
    return { address: fallbackAddress, name: fallbackName };
  }
  const pieces = value.split(".");
  if (pieces.length === 2) {
    return { address: pieces[0], name: pieces[1] };
  }
  return { address: fallbackAddress, name: value };
}

function useContracts(network: NetworkKey) {
  const overrides = CONTRACT_OVERRIDES[network];
  return {
    deployer: overrides.deployer,
    coinFlip: parseContractOverride(
      overrides.coinFlip,
      CONTRACT_NAMES.coinFlip,
      overrides.deployer,
    ),
    guessTheNumber: parseContractOverride(
      overrides.guessTheNumber,
      CONTRACT_NAMES.guessTheNumber,
      overrides.deployer,
    ),
    higherLower: parseContractOverride(
      overrides.higherLower,
      CONTRACT_NAMES.higherLower,
      overrides.deployer,
    ),
    emojiBattle: parseContractOverride(
      overrides.emojiBattle,
      CONTRACT_NAMES.emojiBattle,
      overrides.deployer,
    ),
    rockPaperScissors: parseContractOverride(
      overrides.rockPaperScissors,
      CONTRACT_NAMES.rockPaperScissors,
      overrides.deployer,
    ),
    hotPotato: parseContractOverride(
      overrides.hotPotato,
      CONTRACT_NAMES.hotPotato,
      overrides.deployer,
    ),
    lottery: parseContractOverride(
      overrides.lottery,
      CONTRACT_NAMES.lottery,
      overrides.deployer,
    ),
    tournament: parseContractOverride(
      overrides.tournament,
      CONTRACT_NAMES.tournament,
      overrides.deployer,
    ),
    cosmetics: parseContractOverride(
      overrides.cosmetics,
      CONTRACT_NAMES.cosmetics,
      overrides.deployer,
    ),
    scoreboard: parseContractOverride(
      overrides.scoreboard,
      CONTRACT_NAMES.scoreboard,
      overrides.deployer,
    ),
    ticTacToe: parseContractOverride(
      overrides.ticTacToe,
      CONTRACT_NAMES.ticTacToe,
      overrides.deployer,
    ),
    todoList: parseContractOverride(
      overrides.todoList,
      CONTRACT_NAMES.todoList,
      overrides.deployer,
    ),
  };
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string) {
  const normalized = hex.trim().toLowerCase();
  if (!/^[0-9a-f]*$/.test(normalized) || normalized.length % 2 !== 0) {
    return null;
  }
  const bytes = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < normalized.length; i += 2) {
    bytes[i / 2] = parseInt(normalized.slice(i, i + 2), 16);
  }
  return bytes;
}

async function sha256(bytes: Uint8Array) {
  const view = new Uint8Array(bytes);
  const hash = await crypto.subtle.digest("SHA-256", view.buffer);
  return new Uint8Array(hash);
}

function makeSecret() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

function clampByte(value: number) {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 255) return 255;
  return Math.floor(value);
}

async function makeCommit(secretHex: string, extraBytes: number[]) {
  const secretBytes = hexToBytes(secretHex);
  if (!secretBytes || secretBytes.length !== 32) return null;
  const payload = new Uint8Array(secretBytes.length + extraBytes.length);
  payload.set(secretBytes, 0);
  payload.set(extraBytes.map(clampByte), secretBytes.length);
  const hash = await sha256(payload);
  return bytesToHex(hash);
}

function toUint(value: string) {
  try {
    return BigInt(value || "0");
  } catch {
    return BigInt(0);
  }
}

function PageSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-[0_22px_45px_-28px_rgba(29,26,43,0.55)] ring-1 ring-white/50 backdrop-blur-sm transition-transform duration-300 ease-out hover:-translate-y-0.5 sm:p-6">
      <div className="mb-5 flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-[#1d1a2b] sm:text-2xl">
          {title}
        </h2>
        <p className="text-sm text-[#4a4763] sm:text-base">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-[#1d1a2b]">
      <span>{label}</span>
      <input
        className="h-11 rounded-2xl border border-[#ffe0b8] bg-white/90 px-4 text-sm text-[#1d1a2b] shadow-sm outline-none transition duration-200 focus:border-[#ffbe3d] focus:ring-2 focus:ring-[#ffbe3d]/30 sm:h-12"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-[#1d1a2b]">
      <span>{label}</span>
      <select
        className="h-11 rounded-2xl border border-[#ffe0b8] bg-white/90 px-4 text-sm text-[#1d1a2b] shadow-sm outline-none transition duration-200 focus:border-[#ffbe3d] focus:ring-2 focus:ring-[#ffbe3d]/30 sm:h-12"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ActionButton({
  label,
  onClick,
  tone = "primary",
}: {
  label: string;
  onClick: () => void;
  tone?: "primary" | "secondary";
}) {
  const base =
    "inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold transition-all duration-200 ease-out sm:h-12 sm:px-6";
  const styles =
    tone === "primary"
      ? "bg-gradient-to-r from-[#ff7a59] via-[#ff9b54] to-[#ffbe3d] text-white shadow-[0_18px_35px_-22px_rgba(255,122,89,0.9)] hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0"
      : "border border-[#ffd3a3] bg-white/70 text-[#1d1a2b] shadow-sm hover:-translate-y-0.5 hover:border-[#ffbe3d] hover:text-[#1d1a2b] active:translate-y-0";
  return (
    <button className={`${base} ${styles}`} onClick={onClick} type="button">
      {label}
    </button>
  );
}

export default function Home() {
  const [networkName, setNetworkName] = useState<NetworkKey>(
    DEFAULT_NETWORK as NetworkKey,
  );
  const [status, setStatus] = useState({
    tone: "info",
    message: "Connect a wallet to begin.",
  });
  const [lastTxId, setLastTxId] = useState<string | null>(null);
  const [readOnlyResult, setReadOnlyResult] = useState<string>("");
  const [activeGame, setActiveGame] = useState("all");

  const [coinWager, setCoinWager] = useState("1000000");
  const [coinPick, setCoinPick] = useState("0");
  const [coinSecret, setCoinSecret] = useState("");
  const [coinCommit, setCoinCommit] = useState("");
  const [coinGameId, setCoinGameId] = useState("");

  const [guessWager, setGuessWager] = useState("1000000");
  const [guessValue, setGuessValue] = useState("0");
  const [guessSecret, setGuessSecret] = useState("");
  const [guessCommit, setGuessCommit] = useState("");
  const [guessGameId, setGuessGameId] = useState("");

  const [higherWager, setHigherWager] = useState("1000000");
  const [higherChoice, setHigherChoice] = useState("0");
  const [higherTarget, setHigherTarget] = useState("5");
  const [higherSecret, setHigherSecret] = useState("");
  const [higherCommit, setHigherCommit] = useState("");
  const [higherGameId, setHigherGameId] = useState("");

  const [emojiStake, setEmojiStake] = useState("1000000");
  const [emojiChoice, setEmojiChoice] = useState("0");
  const [emojiSecret, setEmojiSecret] = useState("");
  const [emojiCommit, setEmojiCommit] = useState("");
  const [emojiGameId, setEmojiGameId] = useState("");

  const [rpsStake, setRpsStake] = useState("1000000");
  const [rpsChoice, setRpsChoice] = useState("0");
  const [rpsSecret, setRpsSecret] = useState("");
  const [rpsCommit, setRpsCommit] = useState("");
  const [rpsGameId, setRpsGameId] = useState("");

  const [hotStake, setHotStake] = useState("1000000");
  const [hotGameId, setHotGameId] = useState("");

  const [lotteryTicket, setLotteryTicket] = useState("1000000");
  const [lotteryDuration, setLotteryDuration] = useState("144");
  const [lotteryRoundId, setLotteryRoundId] = useState("");

  const [tournamentEntry, setTournamentEntry] = useState("1000000");
  const [tournamentMaxPlayers, setTournamentMaxPlayers] = useState("8");
  const [tournamentStartHeight, setTournamentStartHeight] = useState("");
  const [tournamentEndHeight, setTournamentEndHeight] = useState("");
  const [tournamentWinners, setTournamentWinners] = useState("3");
  const [tournamentId, setTournamentId] = useState("");
  const [tournamentWinner1, setTournamentWinner1] = useState("");
  const [tournamentWinner2, setTournamentWinner2] = useState("");
  const [tournamentWinner3, setTournamentWinner3] = useState("");

  const [cosmeticsCategory, setCosmeticsCategory] = useState("0");
  const [cosmeticsSkin, setCosmeticsSkin] = useState("0");
  const [cosmeticsMaxSupply, setCosmeticsMaxSupply] = useState("100");
  const [cosmeticsRequiredBadge, setCosmeticsRequiredBadge] = useState("0");
  const [cosmeticsDropUri, setCosmeticsDropUri] = useState("");
  const [cosmeticsDropId, setCosmeticsDropId] = useState("");
  const [cosmeticsActive, setCosmeticsActive] = useState("true");
  const [cosmeticsClaimSigner, setCosmeticsClaimSigner] = useState("");
  const [cosmeticsBadgePlayer, setCosmeticsBadgePlayer] = useState("");
  const [cosmeticsBadgeId, setCosmeticsBadgeId] = useState("0");
  const [cosmeticsPermitNonce, setCosmeticsPermitNonce] = useState("");
  const [cosmeticsPermitSig, setCosmeticsPermitSig] = useState("");
  const [cosmeticsTokenId, setCosmeticsTokenId] = useState("");
  const [cosmeticsTransferTo, setCosmeticsTransferTo] = useState("");

  const [scorePlayer, setScorePlayer] = useState("");
  const [scoreValue, setScoreValue] = useState("0");
  const [scoreDelta, setScoreDelta] = useState("1");

  const [ticGameId, setTicGameId] = useState("");
  const [ticPos, setTicPos] = useState("0");

  const [todoTaskId, setTodoTaskId] = useState("");
  const [todoCompleted, setTodoCompleted] = useState("true");

  const network = useMemo(() => createNetwork(networkName), [networkName]);
  const contracts = useContracts(networkName);

  const signedIn = userSession.isUserSignedIn();
  const userData = signedIn ? userSession.loadUserData() : null;
  const stxAddress = signedIn
    ? networkName === "mainnet"
      ? userData?.profile?.stxAddress?.mainnet
      : userData?.profile?.stxAddress?.testnet
    : undefined;

  const senderAddress = stxAddress || contracts.deployer;

  const resolveContractAddress = (contract: ContractMeta) =>
    contract.address || stxAddress || "";

  const txExplorerUrl = (txId: string) => {
    const chain = networkName === "testnet" ? "?chain=testnet" : "";
    return `https://explorer.hiro.so/txid/${txId}${chain}`;
  };

  const networkWarning =
    signedIn && !stxAddress
      ? `Wallet connected, but no ${networkName} address is available. Switch your wallet network, then reconnect.`
      : null;

  const setStatusMessage = (
    tone: "info" | "error" | "success",
    message: string,
  ) => {
    setStatus({ tone, message });
  };

  const handleConnect = () => {
    authenticate({
      appDetails,
      userSession,
      onFinish: () => setStatusMessage("success", "Wallet connected."),
      onCancel: () => setStatusMessage("info", "Connection cancelled."),
    });
  };

  const handleReconnect = () => {
    authenticate({
      appDetails,
      userSession,
      onFinish: () => setStatusMessage("success", "Wallet reconnected."),
      onCancel: () => setStatusMessage("info", "Reconnect cancelled."),
    });
  };

  const handleSignOut = () => {
    userSession.signUserOut();
    setStatusMessage("info", "Signed out.");
  };

  const assertReady = (contract: ContractMeta) => {
    if (!signedIn) {
      setStatusMessage(
        "error",
        "Connect a wallet before sending transactions.",
      );
      return false;
    }
    if (!stxAddress) {
      setStatusMessage(
        "error",
        `Wallet is on the wrong network. Switch to ${networkName} in your wallet and reconnect.`,
      );
      return false;
    }
    if (!resolveContractAddress(contract)) {
      setStatusMessage(
        "error",
        "Missing contract address. Set NEXT_PUBLIC_*_DEPLOYER_ADDRESS or connect with the deployer wallet.",
      );
      return false;
    }
    return true;
  };

  const runContractCall = (
    contract: ContractMeta,
    functionName: string,
    functionArgs: any[],
  ) => {
    if (!assertReady(contract)) return;
    const contractAddress = resolveContractAddress(contract);
    setStatusMessage("info", "Transaction submitted to wallet.");
    setLastTxId(null);
    openContractCall({
      contractAddress,
      contractName: contract.name,
      functionName,
      functionArgs,
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      onFinish: (data) => {
        setLastTxId(data.txId);
        setStatusMessage("success", "Transaction broadcasted.");
      },
      onCancel: () => setStatusMessage("info", "Transaction cancelled."),
    });
  };

  const callReadOnly = async (
    contract: ContractMeta,
    functionName: string,
    functionArgs: any[],
  ) => {
    const contractAddress = resolveContractAddress(contract);
    if (!contractAddress) {
      setStatusMessage(
        "error",
        "Missing contract address. Set NEXT_PUBLIC_*_DEPLOYER_ADDRESS or connect with the deployer wallet.",
      );
      return;
    }
    try {
      const response = await fetchCallReadOnlyFunction({
        contractAddress,
        contractName: contract.name,
        functionName,
        functionArgs,
        senderAddress: senderAddress || contractAddress,
        network,
      });
      setReadOnlyResult(JSON.stringify(cvToJSON(response), null, 2));
      setStatusMessage("success", "Read-only call success.");
    } catch (error) {
      setStatusMessage("error", "Read-only call failed.");
    }
  };

  const commitFrom = async (
    secret: string,
    extra: number[],
    setValue: (value: string) => void,
  ) => {
    const commit = await makeCommit(secret, extra);
    if (!commit) {
      setStatusMessage("error", "Secret must be 32 bytes of hex.");
      return;
    }
    setValue(commit);
    setStatusMessage("success", "Commit created.");
  };

  const commitArgFromHex = (value: string) => {
    const bytes = hexToBytes(value);
    if (!bytes || bytes.length !== 32) {
      setStatusMessage("error", "Commit must be 32 bytes of hex.");
      return null;
    }
    return bufferCV(bytes);
  };

  const gameMenu = [
    { id: "all", label: "All Games", emoji: "?" },
    { id: "coin-flip", label: "Coin Flip", emoji: "??" },
    { id: "guess", label: "Guess the Number", emoji: "??" },
    { id: "higher", label: "Higher / Lower", emoji: "??" },
    { id: "emoji", label: "Emoji Battle", emoji: "??" },
    { id: "rps", label: "Rock Paper Scissors", emoji: "??" },
    { id: "hot-potato", label: "Hot Potato", emoji: "??" },
    { id: "lottery", label: "Lottery", emoji: "???" },
    { id: "tournament", label: "Tournaments", emoji: "??" },
    { id: "cosmetics", label: "Cosmetics", emoji: "??" },
    { id: "scoreboard", label: "Scoreboard", emoji: "??" },
    { id: "tic-tac-toe", label: "Tic Tac Toe", emoji: "?" },
    { id: "todo", label: "Todo List", emoji: "?" },
  ];

  const shouldShow = (id: string) => activeGame === "all" || activeGame === id;

  useEffect(() => {
    if (networkWarning) {
      setStatusMessage(
        "info",
        `Select ${networkName} in your wallet, then reconnect.`,
      );
    }
  }, [networkWarning, networkName]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#ffffff,transparent_42%),radial-gradient(circle_at_18%_70%,#ffe6cf,transparent_55%),radial-gradient(circle_at_82%_10%,#dff8f1,transparent_40%)] px-4 pb-16 pt-8 text-[#1d1a2b] sm:px-6 sm:pt-10 lg:px-10">
      <div className="pointer-events-none absolute -left-16 top-10 h-44 w-44 rounded-full bg-[radial-gradient(circle,#ffbe3d,transparent_65%)] opacity-70 blur-sm animate-[floaty_8s_ease-in-out_infinite]" />
      <div className="pointer-events-none absolute right-[-60px] top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,#7b6cff,transparent_65%)] opacity-50 blur-md animate-[floaty_10s_ease-in-out_infinite]" />
      <div className="pointer-events-none absolute bottom-[-40px] left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,#3dd6b2,transparent_70%)] opacity-40 blur-md animate-[floaty_9s_ease-in-out_infinite]" />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 sm:gap-10">
        <div className="flex flex-col gap-3">
          <p className="w-fit rounded-full border border-white/70 bg-white/80 px-3 py-1 text-[11px] uppercase tracking-[0.35em] text-[#4a4763] shadow-sm">
            Stacks Arcade
          </p>
          <div className="flex flex-wrap items-start justify-between gap-4 sm:items-end">
            <div>
              <h1 className="text-3xl font-semibold leading-tight tracking-tight text-[#1d1a2b] sm:text-4xl lg:text-5xl">
                Pick a game. Let the giggles begin.
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-[#4a4763] sm:text-base">
                A bright, bouncy control room for every Stacks mini-game. Choose
                a title on the left, connect your wallet, then hop into testnet
                or mainnet in a few clicks.
              </p>
            </div>
            <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
              <div className="flex w-full rounded-full border border-white/70 bg-white/80 p-1 text-sm shadow-sm sm:w-auto">
                <button
                  className={`flex-1 rounded-full px-4 py-2 transition sm:flex-none ${
                    networkName === "testnet"
                      ? "bg-[#1d1a2b] text-white shadow-sm"
                      : "text-[#4a4763] hover:text-[#1d1a2b]"
                  }`}
                  onClick={() => setNetworkName("testnet")}
                  type="button"
                >
                  Testnet
                </button>
                <button
                  className={`flex-1 rounded-full px-4 py-2 transition sm:flex-none ${
                    networkName === "mainnet"
                      ? "bg-[#1d1a2b] text-white shadow-sm"
                      : "text-[#4a4763] hover:text-[#1d1a2b]"
                  }`}
                  onClick={() => setNetworkName("mainnet")}
                  type="button"
                >
                  Mainnet
                </button>
              </div>
              {signedIn ? (
                <>
                  <span className="w-full max-w-[220px] truncate rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-medium text-[#1d1a2b] shadow-sm sm:w-auto sm:max-w-none">
                    {stxAddress ?? "No address"}
                  </span>
                  <ActionButton
                    label="Sign out"
                    onClick={handleSignOut}
                    tone="secondary"
                  />
                </>
              ) : (
                <ActionButton label="Connect wallet" onClick={handleConnect} />
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 rounded-[26px] border border-white/70 bg-white/75 px-4 py-4 text-sm text-[#4a4763] shadow-[0_20px_45px_-35px_rgba(29,26,43,0.45)] ring-1 ring-white/50 backdrop-blur sm:px-6 md:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#1d1a2b]">
              Network
            </p>
            <p className="mt-1 font-medium text-[#1d1a2b]">{networkName}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#1d1a2b]">
              Deployer
            </p>
            <p className="mt-1 break-all font-medium text-[#1d1a2b]">
              {contracts.deployer || "Set NEXT_PUBLIC_*_DEPLOYER_ADDRESS"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#1d1a2b]">
              Status
            </p>
            <p className="mt-1 font-medium text-[#1d1a2b]">{status.message}</p>
            {networkWarning ? (
              <div className="mt-2 flex flex-col gap-2">
                <p className="rounded-2xl border border-[#ffd3a3] bg-[#fff4e6] px-3 py-2 text-xs font-medium text-[#7a3c00]">
                  {networkWarning}
                </p>
                <div>
                  <ActionButton
                    label="Reconnect wallet"
                    onClick={handleReconnect}
                    tone="secondary"
                  />
                </div>
              </div>
            ) : null}
            {lastTxId ? (
              <a
                className="mt-1 inline-flex items-center gap-2 text-xs font-medium text-[#ff7a59] hover:text-[#1d1a2b]"
                href={txExplorerUrl(lastTxId)}
                target="_blank"
                rel="noreferrer"
              >
                View tx
                <span className="max-w-[220px] truncate text-[#4a4763]">
                  ({lastTxId})
                </span>
              </a>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 rounded-[26px] border border-white/70 bg-white/85 px-4 py-5 text-sm text-[#4a4763] shadow-[0_20px_45px_-35px_rgba(29,26,43,0.45)] ring-1 ring-white/50 backdrop-blur sm:px-6 md:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#1d1a2b]">
              How to start
            </p>
            <p className="mt-2">
              Connect a wallet, pick a network, then choose a game from the
              sidebar. Use the quick actions (create, join, reveal) to play.
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#1d1a2b]">
              How to play
            </p>
            <p className="mt-2">
              Most games are commit-reveal. Generate a secret, create a commit,
              then reveal it to finish the round. Match the other player's move
              or the random outcome.
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#1d1a2b]">
              Need help?
            </p>
            <p className="mt-2">
              Watch the status bar for transaction updates. The latest tx link
              appears after every broadcast so you can track confirmations.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="h-fit rounded-[26px] border border-white/70 bg-white/85 p-4 shadow-[0_22px_45px_-35px_rgba(29,26,43,0.45)] ring-1 ring-white/50 backdrop-blur sm:p-5 lg:sticky lg:top-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-[#4a4763]">
                  Game Menu
                </p>
                <p className="text-lg font-semibold text-[#1d1a2b]">
                  Choose your giggle
                </p>
              </div>
              <span className="text-xl">??</span>
            </div>
            <nav className="mt-4 flex flex-col gap-2">
              {gameMenu.map((item) => {
                const active = activeGame === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveGame(item.id)}
                    className={`flex items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-medium transition-all duration-200 ease-out ${
                      active
                        ? "bg-[#1d1a2b] text-white shadow-[0_14px_26px_-18px_rgba(29,26,43,0.8)]"
                        : "border border-[#ffe0b8] bg-white/70 text-[#4a4763] hover:-translate-y-0.5 hover:border-[#ffbe3d] hover:text-[#1d1a2b]"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{item.emoji}</span>
                      {item.label}
                    </span>
                    <span
                      className={`text-xs ${active ? "text-white/70" : "text-[#4a4763]"}`}
                    >
                      {active ? "Now playing" : "Pick me"}
                    </span>
                  </button>
                );
              })}
            </nav>
            <div className="mt-6 rounded-2xl border border-[#ffe0b8] bg-white/80 px-4 py-3 text-xs text-[#4a4763]">
              Tip: Pick a game, then scroll less. We keep the fun focused.
            </div>
          </aside>

          <div className="grid gap-8">
            <div className="grid gap-8 lg:grid-cols-2">
              {shouldShow("coin-flip") && (
                <PageSection
                  title="Coin Flip"
                  subtitle="Commit-reveal coin flip with treasury-backed wagers."
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      label="Wager (microstacks)"
                      value={coinWager}
                      onChange={setCoinWager}
                    />
                    <SelectField
                      label="Pick"
                      value={coinPick}
                      onChange={setCoinPick}
                      options={[
                        { label: "Heads (0)", value: "0" },
                        { label: "Tails (1)", value: "1" },
                      ]}
                    />
                    <Field
                      label="Secret (hex, 32 bytes)"
                      value={coinSecret}
                      onChange={setCoinSecret}
                    />
                    <Field
                      label="Commit (hex, 32 bytes)"
                      value={coinCommit}
                      onChange={setCoinCommit}
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <ActionButton
                      label="Generate secret"
                      onClick={() => setCoinSecret(makeSecret())}
                      tone="secondary"
                    />
                    <ActionButton
                      label="Create commit"
                      onClick={() =>
                        commitFrom(
                          coinSecret,
                          [Number(coinPick)],
                          setCoinCommit,
                        )
                      }
                      tone="secondary"
                    />
                    <ActionButton
                      label="Create game"
                      onClick={() => {
                        const commitArg = commitArgFromHex(coinCommit);
                        if (!commitArg) return;
                        runContractCall(contracts.coinFlip, "create-game", [
                          uintCV(toUint(coinWager)),
                          commitArg,
                        ]);
                      }}
                    />
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <Field
                      label="Game id"
                      value={coinGameId}
                      onChange={setCoinGameId}
                    />
                    <ActionButton
                      label="Reveal"
                      onClick={() => {
                        const commitSecret = hexToBytes(coinSecret);
                        if (!commitSecret || commitSecret.length !== 32) {
                          setStatusMessage(
                            "error",
                            "Secret must be 32 bytes of hex.",
                          );
                          return;
                        }
                        runContractCall(contracts.coinFlip, "reveal", [
                          uintCV(toUint(coinGameId)),
                          uintCV(toUint(coinPick)),
                          bufferCV(commitSecret),
                        ]);
                      }}
                    />
                    <ActionButton
                      label="Expire"
                      onClick={() =>
                        runContractCall(contracts.coinFlip, "expire-game", [
                          uintCV(toUint(coinGameId)),
                        ])
                      }
                      tone="secondary"
                    />
                  </div>
                </PageSection>
              )}

              {shouldShow("guess") && (
                <PageSection
                  title="Guess the Number"
                  subtitle="Commit-reveal, pick 0-9 and try your luck."
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      label="Wager (microstacks)"
                      value={guessWager}
                      onChange={setGuessWager}
                    />
                    <Field
                      label="Guess (0-9)"
                      value={guessValue}
                      onChange={setGuessValue}
                    />
                    <Field
                      label="Secret (hex, 32 bytes)"
                      value={guessSecret}
                      onChange={setGuessSecret}
                    />
                    <Field
                      label="Commit (hex, 32 bytes)"
                      value={guessCommit}
                      onChange={setGuessCommit}
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <ActionButton
                      label="Generate secret"
                      onClick={() => setGuessSecret(makeSecret())}
                      tone="secondary"
                    />
                    <ActionButton
                      label="Create commit"
                      onClick={() =>
                        commitFrom(
                          guessSecret,
                          [Number(guessValue)],
                          setGuessCommit,
                        )
                      }
                      tone="secondary"
                    />
                    <ActionButton
                      label="Create game"
                      onClick={() => {
                        const commitArg = commitArgFromHex(guessCommit);
                        if (!commitArg) return;
                        runContractCall(
                          contracts.guessTheNumber,
                          "create-game",
                          [uintCV(toUint(guessWager)), commitArg],
                        );
                      }}
                    />
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <Field
                      label="Game id"
                      value={guessGameId}
                      onChange={setGuessGameId}
                    />
                    <ActionButton
                      label="Reveal"
                      onClick={() => {
                        const commitSecret = hexToBytes(guessSecret);
                        if (!commitSecret || commitSecret.length !== 32) {
                          setStatusMessage(
                            "error",
                            "Secret must be 32 bytes of hex.",
                          );
                          return;
                        }
                        runContractCall(contracts.guessTheNumber, "reveal", [
                          uintCV(toUint(guessGameId)),
                          uintCV(toUint(guessValue)),
                          bufferCV(commitSecret),
                        ]);
                      }}
                    />
                    <ActionButton
                      label="Expire"
                      onClick={() =>
                        runContractCall(
                          contracts.guessTheNumber,
                          "expire-game",
                          [uintCV(toUint(guessGameId))],
                        )
                      }
                      tone="secondary"
                    />
                  </div>
                </PageSection>
              )}

              {shouldShow("higher") && (
                <PageSection
                  title="Higher / Lower"
                  subtitle="Commit on lower or higher, then reveal target."
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      label="Wager (microstacks)"
                      value={higherWager}
                      onChange={setHigherWager}
                    />
                    <SelectField
                      label="Choice"
                      value={higherChoice}
                      onChange={setHigherChoice}
                      options={[
                        { label: "Lower (0)", value: "0" },
                        { label: "Higher (1)", value: "1" },
                      ]}
                    />
                    <Field
                      label="Target (0-9)"
                      value={higherTarget}
                      onChange={setHigherTarget}
                    />
                    <Field
                      label="Secret (hex, 32 bytes)"
                      value={higherSecret}
                      onChange={setHigherSecret}
                    />
                    <Field
                      label="Commit (hex, 32 bytes)"
                      value={higherCommit}
                      onChange={setHigherCommit}
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <ActionButton
                      label="Generate secret"
                      onClick={() => setHigherSecret(makeSecret())}
                      tone="secondary"
                    />
                    <ActionButton
                      label="Create commit"
                      onClick={() =>
                        commitFrom(
                          higherSecret,
                          [Number(higherChoice), Number(higherTarget)],
                          setHigherCommit,
                        )
                      }
                      tone="secondary"
                    />
                    <ActionButton
                      label="Create game"
                      onClick={() => {
                        const commitArg = commitArgFromHex(higherCommit);
                        if (!commitArg) return;
                        runContractCall(contracts.higherLower, "create-game", [
                          uintCV(toUint(higherWager)),
                          commitArg,
                        ]);
                      }}
                    />
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <Field
                      label="Game id"
                      value={higherGameId}
                      onChange={setHigherGameId}
                    />
                    <ActionButton
                      label="Reveal"
                      onClick={() => {
                        const commitSecret = hexToBytes(higherSecret);
                        if (!commitSecret || commitSecret.length !== 32) {
                          setStatusMessage(
                            "error",
                            "Secret must be 32 bytes of hex.",
                          );
                          return;
                        }
                        runContractCall(contracts.higherLower, "reveal", [
                          uintCV(toUint(higherGameId)),
                          uintCV(toUint(higherChoice)),
                          uintCV(toUint(higherTarget)),
                          bufferCV(commitSecret),
                        ]);
                      }}
                    />
                    <ActionButton
                      label="Expire"
                      onClick={() =>
                        runContractCall(contracts.higherLower, "expire-game", [
                          uintCV(toUint(higherGameId)),
                        ])
                      }
                      tone="secondary"
                    />
                  </div>
                </PageSection>
              )}

              {shouldShow("emoji") && (
                <PageSection
                  title="Emoji Battle"
                  subtitle="Fire, water, leaf. Commit-reveal duel."
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      label="Stake (microstacks)"
                      value={emojiStake}
                      onChange={setEmojiStake}
                    />
                    <SelectField
                      label="Choice"
                      value={emojiChoice}
                      onChange={setEmojiChoice}
                      options={[
                        { label: "Fire (0)", value: "0" },
                        { label: "Water (1)", value: "1" },
                        { label: "Leaf (2)", value: "2" },
                      ]}
                    />
                    <Field
                      label="Secret (hex, 32 bytes)"
                      value={emojiSecret}
                      onChange={setEmojiSecret}
                    />
                    <Field
                      label="Commit (hex, 32 bytes)"
                      value={emojiCommit}
                      onChange={setEmojiCommit}
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <ActionButton
                      label="Generate secret"
                      onClick={() => setEmojiSecret(makeSecret())}
                      tone="secondary"
                    />
                    <ActionButton
                      label="Create commit"
                      onClick={() =>
                        commitFrom(
                          emojiSecret,
                          [Number(emojiChoice)],
                          setEmojiCommit,
                        )
                      }
                      tone="secondary"
                    />
                    <ActionButton
                      label="Create game"
                      onClick={() => {
                        const commitArg = commitArgFromHex(emojiCommit);
                        if (!commitArg) return;
                        runContractCall(contracts.emojiBattle, "create-game", [
                          uintCV(toUint(emojiStake)),
                          commitArg,
                        ]);
                      }}
                    />
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <Field
                      label="Game id"
                      value={emojiGameId}
                      onChange={setEmojiGameId}
                    />
                    <ActionButton
                      label="Join game"
                      onClick={() => {
                        const commitArg = commitArgFromHex(emojiCommit);
                        if (!commitArg) return;
                        runContractCall(contracts.emojiBattle, "join-game", [
                          uintCV(toUint(emojiGameId)),
                          commitArg,
                        ]);
                      }}
                      tone="secondary"
                    />
                    <ActionButton
                      label="Reveal"
                      onClick={() => {
                        const commitSecret = hexToBytes(emojiSecret);
                        if (!commitSecret || commitSecret.length !== 32) {
                          setStatusMessage(
                            "error",
                            "Secret must be 32 bytes of hex.",
                          );
                          return;
                        }
                        runContractCall(contracts.emojiBattle, "reveal", [
                          uintCV(toUint(emojiGameId)),
                          uintCV(toUint(emojiChoice)),
                          bufferCV(commitSecret),
                        ]);
                      }}
                    />
                    <ActionButton
                      label="Expire"
                      onClick={() =>
                        runContractCall(contracts.emojiBattle, "expire-game", [
                          uintCV(toUint(emojiGameId)),
                        ])
                      }
                      tone="secondary"
                    />
                  </div>
                </PageSection>
              )}

              {shouldShow("rps") && (
                <PageSection
                  title="Rock Paper Scissors"
                  subtitle="Commit-reveal duel. Two players, one winner."
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      label="Stake (microstacks)"
                      value={rpsStake}
                      onChange={setRpsStake}
                    />
                    <SelectField
                      label="Choice"
                      value={rpsChoice}
                      onChange={setRpsChoice}
                      options={[
                        { label: "Rock (0)", value: "0" },
                        { label: "Paper (1)", value: "1" },
                        { label: "Scissors (2)", value: "2" },
                      ]}
                    />
                    <Field
                      label="Secret (hex, 32 bytes)"
                      value={rpsSecret}
                      onChange={setRpsSecret}
                    />
                    <Field
                      label="Commit (hex, 32 bytes)"
                      value={rpsCommit}
                      onChange={setRpsCommit}
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <ActionButton
                      label="Generate secret"
                      onClick={() => setRpsSecret(makeSecret())}
                      tone="secondary"
                    />
                    <ActionButton
                      label="Create commit"
                      onClick={() =>
                        commitFrom(rpsSecret, [Number(rpsChoice)], setRpsCommit)
                      }
                      tone="secondary"
                    />
                    <ActionButton
                      label="Create game"
                      onClick={() => {
                        const commitArg = commitArgFromHex(rpsCommit);
                        if (!commitArg) return;
                        runContractCall(
                          contracts.rockPaperScissors,
                          "create-game",
                          [uintCV(toUint(rpsStake)), commitArg],
                        );
                      }}
                    />
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <Field
                      label="Game id"
                      value={rpsGameId}
                      onChange={setRpsGameId}
                    />
                    <ActionButton
                      label="Join game"
                      onClick={() => {
                        const commitArg = commitArgFromHex(rpsCommit);
                        if (!commitArg) return;
                        runContractCall(
                          contracts.rockPaperScissors,
                          "join-game",
                          [uintCV(toUint(rpsGameId)), commitArg],
                        );
                      }}
                      tone="secondary"
                    />

                    <ActionButton
                      label="Reveal"
                      onClick={() => {
                        const commitSecret = hexToBytes(rpsSecret);
                        if (!commitSecret || commitSecret.length !== 32) {
                          setStatusMessage(
                            "error",
                            "Secret must be 32 bytes of hex",
                          );
                          return;
                        }
                        runContractCall(contracts.rockPaperScissors, "reveal", [
                          uintCV(toUint(rpsGameId)),
                          uintCV(toUint(rpsChoice)),
                          bufferCV(commitSecret),
                        ]);
                      }}
                    />
                    <ActionButton
                      label="Expire"
                      onClick={() =>
                        runContractCall(
                          contracts.rockPaperScissors,
                          "expire-game",
                          [uintCV(toUint(rpsGameId))],
                        )
                      }
                      tone="secondary"
                    />
                  </div>
                </PageSection>
              )}

              {shouldShow("hot-potato") && (
                <PageSection
                  title="Hot Potato"
                  subtitle="Pass the potato before the timer ends."
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      label="Stake (microstacks)"
                      value={hotStake}
                      onChange={setHotStake}
                    />
                    <Field
                      label="Game id"
                      value={hotGameId}
                      onChange={setHotGameId}
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <ActionButton
                      label="Create game"
                      onClick={() =>
                        runContractCall(contracts.hotPotato, "create-game", [
                          uintCV(toUint(hotStake)),
                        ])
                      }
                    />
                    <ActionButton
                      label="Take potato"
                      onClick={() =>
                        runContractCall(contracts.hotPotato, "take-potato", [
                          uintCV(toUint(hotGameId)),
                        ])
                      }
                      tone="secondary"
                    />
                    <ActionButton
                      label="Settle"
                      onClick={() =>
                        runContractCall(contracts.hotPotato, "settle", [
                          uintCV(toUint(hotGameId)),
                        ])
                      }
                    />
                    <ActionButton
                      label="Cancel"
                      onClick={() =>
                        runContractCall(contracts.hotPotato, "cancel-game", [
                          uintCV(toUint(hotGameId)),
                        ])
                      }
                      tone="secondary"
                    />
                  </div>
                </PageSection>
              )}

              {shouldShow("lottery") && (
                <PageSection
                  title="Lottery"
                  subtitle="Create rounds, sell tickets, draw winners."
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      label="Ticket price (microstacks)"
                      value={lotteryTicket}
                      onChange={setLotteryTicket}
                    />
                    <Field
                      label="Round duration (blocks)"
                      value={lotteryDuration}
                      onChange={setLotteryDuration}
                    />
                    <Field
                      label="Round id"
                      value={lotteryRoundId}
                      onChange={setLotteryRoundId}
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <ActionButton
                      label="Create round"
                      onClick={() =>
                        runContractCall(contracts.lottery, "create-round", [
                          uintCV(toUint(lotteryTicket)),
                          uintCV(toUint(lotteryDuration)),
                        ])
                      }
                    />
                    <ActionButton
                      label="Buy ticket"
                      onClick={() =>
                        runContractCall(contracts.lottery, "buy-ticket", [
                          uintCV(toUint(lotteryRoundId)),
                        ])
                      }
                      tone="secondary"
                    />
                    <ActionButton
                      label="Draw"
                      onClick={() =>
                        runContractCall(contracts.lottery, "draw", [
                          uintCV(toUint(lotteryRoundId)),
                        ])
                      }
                    />
                    <ActionButton
                      label="Cancel round"
                      onClick={() =>
                        runContractCall(contracts.lottery, "cancel-round", [
                          uintCV(toUint(lotteryRoundId)),
                        ])
                      }
                      tone="secondary"
                    />
                  </div>
                </PageSection>
              )}

              {shouldShow("tournament") && (
                <PageSection
                  title="Tournaments"
                  subtitle="Scheduled brackets or ladders with pooled payouts."
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      label="Entry fee (microstacks)"
                      value={tournamentEntry}
                      onChange={setTournamentEntry}
                    />
                    <Field
                      label="Max players"
                      value={tournamentMaxPlayers}
                      onChange={setTournamentMaxPlayers}
                    />
                    <Field
                      label="Start height (block)"
                      value={tournamentStartHeight}
                      onChange={setTournamentStartHeight}
                    />
                    <Field
                      label="End height (block)"
                      value={tournamentEndHeight}
                      onChange={setTournamentEndHeight}
                    />
                    <SelectField
                      label="Winners paid"
                      value={tournamentWinners}
                      onChange={setTournamentWinners}
                      options={[
                        { label: "Top 1", value: "1" },
                        { label: "Top 3", value: "3" },
                      ]}
                    />
                    <Field
                      label="Tournament id"
                      value={tournamentId}
                      onChange={setTournamentId}
                    />
                    <Field
                      label="Winner 1 (principal)"
                      value={tournamentWinner1}
                      onChange={setTournamentWinner1}
                    />
                    <Field
                      label="Winner 2 (principal)"
                      value={tournamentWinner2}
                      onChange={setTournamentWinner2}
                    />
                    <Field
                      label="Winner 3 (principal)"
                      value={tournamentWinner3}
                      onChange={setTournamentWinner3}
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <ActionButton
                      label="Create tournament"
                      onClick={() =>
                        runContractCall(
                          contracts.tournament,
                          "create-tournament",
                          [
                            uintCV(toUint(tournamentEntry)),
                            uintCV(toUint(tournamentMaxPlayers)),
                            uintCV(toUint(tournamentStartHeight)),
                            uintCV(toUint(tournamentEndHeight)),
                            uintCV(toUint(tournamentWinners)),
                          ],
                        )
                      }
                    />
                    <ActionButton
                      label="Join tournament"
                      onClick={() =>
                        runContractCall(
                          contracts.tournament,
                          "join-tournament",
                          [uintCV(toUint(tournamentId))],
                        )
                      }
                      tone="secondary"
                    />
                    <ActionButton
                      label="Lock tournament"
                      onClick={() =>
                        runContractCall(
                          contracts.tournament,
                          "lock-tournament",
                          [uintCV(toUint(tournamentId))],
                        )
                      }
                      tone="secondary"
                    />
                    <ActionButton
                      label="Cancel tournament"
                      onClick={() =>
                        runContractCall(
                          contracts.tournament,
                          "cancel-tournament",
                          [uintCV(toUint(tournamentId))],
                        )
                      }
                      tone="secondary"
                    />
                    <ActionButton
                      label="Claim refund"
                      onClick={() =>
                        runContractCall(contracts.tournament, "claim-refund", [
                          uintCV(toUint(tournamentId)),
                        ])
                      }
                      tone="secondary"
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <ActionButton
                      label="Settle top 1"
                      onClick={() =>
                        runContractCall(contracts.tournament, "settle-single", [
                          uintCV(toUint(tournamentId)),
                          standardPrincipalCV(tournamentWinner1),
                        ])
                      }
                    />
                    <ActionButton
                      label="Settle top 3"
                      onClick={() =>
                        runContractCall(contracts.tournament, "settle-top3", [
                          uintCV(toUint(tournamentId)),
                          standardPrincipalCV(tournamentWinner1),
                          standardPrincipalCV(tournamentWinner2),
                          standardPrincipalCV(tournamentWinner3),
                        ])
                      }
                      tone="secondary"
                    />
                  </div>
                </PageSection>
              )}

              {shouldShow("cosmetics") && (
                <PageSection
                  title="Cosmetics"
                  subtitle="NFT skins for coins, tables, and avatars."
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <SelectField
                      label="Category"
                      value={cosmeticsCategory}
                      onChange={setCosmeticsCategory}
                      options={[
                        { label: "Coin (0)", value: "0" },
                        { label: "Table (1)", value: "1" },
                        { label: "Avatar (2)", value: "2" },
                      ]}
                    />
                    <Field
                      label="Skin id"
                      value={cosmeticsSkin}
                      onChange={setCosmeticsSkin}
                    />
                    <Field
                      label="Max supply"
                      value={cosmeticsMaxSupply}
                      onChange={setCosmeticsMaxSupply}
                    />
                    <Field
                      label="Required badge (0 = none)"
                      value={cosmeticsRequiredBadge}
                      onChange={setCosmeticsRequiredBadge}
                    />
                    <Field
                      label="Drop URI"
                      value={cosmeticsDropUri}
                      onChange={setCosmeticsDropUri}
                    />
                    <Field
                      label="Drop id"
                      value={cosmeticsDropId}
                      onChange={setCosmeticsDropId}
                    />
                    <SelectField
                      label="Active"
                      value={cosmeticsActive}
                      onChange={setCosmeticsActive}
                      options={[
                        { label: "True", value: "true" },
                        { label: "False", value: "false" },
                      ]}
                    />
                    <Field
                      label="Claim signer pubkey (hex)"
                      value={cosmeticsClaimSigner}
                      onChange={setCosmeticsClaimSigner}
                    />
                    <Field
                      label="Badge player"
                      value={cosmeticsBadgePlayer}
                      onChange={setCosmeticsBadgePlayer}
                    />
                    <Field
                      label="Badge id"
                      value={cosmeticsBadgeId}
                      onChange={setCosmeticsBadgeId}
                    />
                    <Field
                      label="Permit nonce"
                      value={cosmeticsPermitNonce}
                      onChange={setCosmeticsPermitNonce}
                    />
                    <Field
                      label="Permit signature (hex)"
                      value={cosmeticsPermitSig}
                      onChange={setCosmeticsPermitSig}
                    />
                    <Field
                      label="Token id"
                      value={cosmeticsTokenId}
                      onChange={setCosmeticsTokenId}
                    />
                    <Field
                      label="Transfer to"
                      value={cosmeticsTransferTo}
                      onChange={setCosmeticsTransferTo}
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <ActionButton
                      label="Create drop"
                      onClick={() =>
                        runContractCall(contracts.cosmetics, "create-drop", [
                          uintCV(toUint(cosmeticsCategory)),
                          uintCV(toUint(cosmeticsSkin)),
                          uintCV(toUint(cosmeticsMaxSupply)),
                          uintCV(toUint(cosmeticsRequiredBadge)),
                        ])
                      }
                    />
                    <ActionButton
                      label="Set drop URI"
                      onClick={() =>
                        runContractCall(contracts.cosmetics, "set-drop-uri", [
                          uintCV(toUint(cosmeticsDropId)),
                          stringUtf8CV(cosmeticsDropUri),
                        ])
                      }
                      tone="secondary"
                    />
                    <ActionButton
                      label="Set drop active"
                      onClick={() =>
                        runContractCall(
                          contracts.cosmetics,
                          "set-drop-active",
                          [
                            uintCV(toUint(cosmeticsDropId)),
                            boolCV(cosmeticsActive === "true"),
                          ],
                        )
                      }
                      tone="secondary"
                    />
                    <ActionButton
                      label="Set claim signer"
                      onClick={() => {
                        const pubkeyBytes = hexToBytes(cosmeticsClaimSigner);
                        if (!pubkeyBytes || pubkeyBytes.length !== 33) {
                          setStatusMessage(
                            "error",
                            "Signer pubkey must be 33 bytes of hex.",
                          );
                          return;
                        }
                        runContractCall(
                          contracts.cosmetics,
                          "set-claim-signer",
                          [bufferCV(pubkeyBytes)],
                        );
                      }}
                      tone="secondary"
                    />
                    <ActionButton
                      label="Grant badge"
                      onClick={() =>
                        runContractCall(contracts.cosmetics, "grant-badge", [
                          standardPrincipalCV(cosmeticsBadgePlayer),
                          uintCV(toUint(cosmeticsBadgeId)),
                        ])
                      }
                      tone="secondary"
                    />
                    <ActionButton
                      label="Claim drop"
                      onClick={() =>
                        runContractCall(contracts.cosmetics, "claim-drop", [
                          uintCV(toUint(cosmeticsDropId)),
                        ])
                      }
                    />
                    <ActionButton
                      label="Claim with permit"
                      onClick={() => {
                        const sigBytes = hexToBytes(cosmeticsPermitSig);
                        if (!sigBytes || sigBytes.length !== 65) {
                          setStatusMessage(
                            "error",
                            "Signature must be 65 bytes of hex.",
                          );
                          return;
                        }
                        runContractCall(
                          contracts.cosmetics,
                          "claim-with-permit",
                          [
                            uintCV(toUint(cosmeticsDropId)),
                            uintCV(toUint(cosmeticsPermitNonce)),
                            bufferCV(sigBytes),
                          ],
                        );
                      }}
                      tone="secondary"
                    />
                    <ActionButton
                      label="Transfer token"
                      onClick={() => {
                        if (!stxAddress) {
                          setStatusMessage(
                            "error",
                            "Connect a wallet before transferring.",
                          );
                          return;
                        }
                        runContractCall(contracts.cosmetics, "transfer", [
                          uintCV(toUint(cosmeticsTokenId)),
                          standardPrincipalCV(stxAddress),
                          standardPrincipalCV(cosmeticsTransferTo),
                        ]);
                      }}
                      tone="secondary"
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <ActionButton
                      label="Get drop"
                      onClick={() =>
                        callReadOnly(contracts.cosmetics, "get-drop", [
                          uintCV(toUint(cosmeticsDropId)),
                        ])
                      }
                      tone="secondary"
                    />
                    <ActionButton
                      label="Get token"
                      onClick={() =>
                        callReadOnly(contracts.cosmetics, "get-token", [
                          uintCV(toUint(cosmeticsTokenId)),
                        ])
                      }
                      tone="secondary"
                    />
                    <ActionButton
                      label="Get token URI"
                      onClick={() =>
                        callReadOnly(contracts.cosmetics, "get-token-uri", [
                          uintCV(toUint(cosmeticsTokenId)),
                        ])
                      }
                      tone="secondary"
                    />
                    <ActionButton
                      label="Get badge"
                      onClick={() =>
                        callReadOnly(contracts.cosmetics, "get-badge", [
                          standardPrincipalCV(cosmeticsBadgePlayer),
                          uintCV(toUint(cosmeticsBadgeId)),
                        ])
                      }
                      tone="secondary"
                    />
                  </div>
                </PageSection>
              )}

              {shouldShow("scoreboard") && (
                <PageSection
                  title="Scoreboard"
                  subtitle="Manage player scores across games."
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      label="Player principal"
                      value={scorePlayer}
                      onChange={setScorePlayer}
                    />
                    <Field
                      label="Score"
                      value={scoreValue}
                      onChange={setScoreValue}
                    />
                    <Field
                      label="Delta"
                      value={scoreDelta}
                      onChange={setScoreDelta}
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <ActionButton
                      label="Set score"
                      onClick={() =>
                        runContractCall(contracts.scoreboard, "set-score", [
                          standardPrincipalCV(scorePlayer),
                          uintCV(toUint(scoreValue)),
                        ])
                      }
                    />
                    <ActionButton
                      label="Add score"
                      onClick={() =>
                        runContractCall(contracts.scoreboard, "add-score", [
                          standardPrincipalCV(scorePlayer),
                          uintCV(toUint(scoreDelta)),
                        ])
                      }
                      tone="secondary"
                    />
                    <ActionButton
                      label="Get score"
                      onClick={() =>
                        callReadOnly(contracts.scoreboard, "get-score", [
                          standardPrincipalCV(scorePlayer),
                        ])
                      }
                      tone="secondary"
                    />
                  </div>
                </PageSection>
              )}

              {shouldShow("tic-tac-toe") && (
                <PageSection
                  title="Tic Tac Toe"
                  subtitle="Classic grid battle for two players."
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      label="Game id"
                      value={ticGameId}
                      onChange={setTicGameId}
                    />
                    <Field
                      label="Position (0-8)"
                      value={ticPos}
                      onChange={setTicPos}
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <ActionButton
                      label="Create game"
                      onClick={() =>
                        runContractCall(contracts.ticTacToe, "create-game", [])
                      }
                    />
                    <ActionButton
                      label="Join game"
                      onClick={() =>
                        runContractCall(contracts.ticTacToe, "join-game", [
                          uintCV(toUint(ticGameId)),
                        ])
                      }
                      tone="secondary"
                    />
                    <ActionButton
                      label="Play"
                      onClick={() =>
                        runContractCall(contracts.ticTacToe, "play", [
                          uintCV(toUint(ticGameId)),
                          uintCV(toUint(ticPos)),
                        ])
                      }
                    />
                    <ActionButton
                      label="Cancel"
                      onClick={() =>
                        runContractCall(contracts.ticTacToe, "cancel-game", [
                          uintCV(toUint(ticGameId)),
                        ])
                      }
                      tone="secondary"
                    />
                  </div>
                </PageSection>
              )}

              {shouldShow("todo") && (
                <PageSection
                  title="Todo List"
                  subtitle="Simple on-chain task tracker."
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      label="Task id"
                      value={todoTaskId}
                      onChange={setTodoTaskId}
                    />
                    <SelectField
                      label="Completed"
                      value={todoCompleted}
                      onChange={setTodoCompleted}
                      options={[
                        { label: "True", value: "true" },
                        { label: "False", value: "false" },
                      ]}
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <ActionButton
                      label="Create task"
                      onClick={() =>
                        runContractCall(contracts.todoList, "create-task", [])
                      }
                    />
                    <ActionButton
                      label="Set completed"
                      onClick={() =>
                        runContractCall(contracts.todoList, "set-completed", [
                          uintCV(toUint(todoTaskId)),
                          boolCV(todoCompleted === "true"),
                        ])
                      }
                      tone="secondary"
                    />
                    <ActionButton
                      label="Delete task"
                      onClick={() =>
                        runContractCall(contracts.todoList, "delete-task", [
                          uintCV(toUint(todoTaskId)),
                        ])
                      }
                      tone="secondary"
                    />
                    <ActionButton
                      label="Get task"
                      onClick={() =>
                        callReadOnly(contracts.todoList, "get-task", [
                          uintCV(toUint(todoTaskId)),
                        ])
                      }
                      tone="secondary"
                    />
                  </div>
                </PageSection>
              )}
            </div>

            <PageSection
              title="Read-only console"
              subtitle="Inspect responses from read-only calls here. Click 'Get' buttons in the sections above to test."
            >
              <div className="rounded-2xl border border-[#ffe0b8] bg-[#1d1a2b] px-6 py-4 text-xs text-white shadow-inner">
                <pre className="whitespace-pre-wrap">
                  {readOnlyResult || "No read-only calls yet."}
                </pre>
              </div>
            </PageSection>
          </div>
        </div>
      </div>
    </div>
  );
}
