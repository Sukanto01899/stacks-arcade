"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  AppConfig,
  UserSession,
  authenticate,
  openContractCall,
} from "@stacks/connect";
import { createNetwork, type StacksNetworkName } from "@stacks/network";
import {
  AnchorMode,
  type ClarityValue,
  type PostCondition,
  PostConditionMode,
  boolCV,
  bufferCV,
  cvToJSON,
  fetchCallReadOnlyFunction,
  stringUtf8CV,
  standardPrincipalCV,
  uintCV,
} from "@stacks/transactions";
import {
  CONTRACT_NAMES,
  CONTRACT_OVERRIDES,
  DEFAULT_NETWORK,
} from "@/lib/config";

const appConfig = new AppConfig(["store_write", "publish_data"]);
const userSession = new UserSession({ appConfig });

type NetworkKey = "testnet" | "mainnet";

type ContractMeta = {
  address: string;
  name: string;
};

type ContractCallOptions = {
  postConditions?: PostCondition[] | (() => Promise<PostCondition[]>);
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

function readJsonValue(value: unknown): unknown {
  if (value && typeof value === "object" && "value" in value) {
    return readJsonValue((value as { value: unknown }).value);
  }
  return value;
}

function readTupleUint(
  value: Record<string, unknown> | null | undefined,
  key: string,
) {
  const entry = value?.[key];
  if (!entry || typeof entry !== "object" || !("value" in entry)) {
    throw new Error(`Missing tuple uint field: ${key}`);
  }
  return BigInt(String((entry as { value: unknown }).value));
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
    <section className="relative overflow-hidden rounded-[30px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,247,235,0.88))] p-5 shadow-[0_28px_60px_-34px_rgba(19,24,42,0.45)] ring-1 ring-white/55 backdrop-blur-sm transition-transform duration-300 ease-out hover:-translate-y-0.5 sm:p-6">
      <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(255,168,76,0.22),transparent_70%)]" />
      <div className="mb-5 flex flex-col gap-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#7a6853]">
          Control Module
        </p>
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
      <span className="text-[13px] uppercase tracking-[0.14em] text-[#6a6179]">
        {label}
      </span>
      <input
        className="h-11 rounded-2xl border border-[#f2d5af] bg-white/95 px-4 text-sm text-[#1d1a2b] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] outline-none transition duration-200 placeholder:text-[#9a93a7] focus:border-[#ff9b54] focus:ring-2 focus:ring-[#ffbe3d]/30 sm:h-12"
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
      <span className="text-[13px] uppercase tracking-[0.14em] text-[#6a6179]">
        {label}
      </span>
      <select
        className="h-11 rounded-2xl border border-[#f2d5af] bg-white/95 px-4 text-sm text-[#1d1a2b] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] outline-none transition duration-200 focus:border-[#ff9b54] focus:ring-2 focus:ring-[#ffbe3d]/30 sm:h-12"
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
      ? "bg-[linear-gradient(135deg,#ff7a59,#ffb84f)] text-white shadow-[0_22px_38px_-20px_rgba(255,122,89,0.72)] hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0"
      : "border border-[#f0cfa1] bg-white/75 text-[#1d1a2b] shadow-sm hover:-translate-y-0.5 hover:border-[#ffbe3d] hover:bg-white hover:text-[#1d1a2b] active:translate-y-0";
  return (
    <button className={`${base} ${styles}`} onClick={onClick} type="button">
      {label}
    </button>
  );
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[28px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(255,245,228,0.76))] p-5 shadow-[0_20px_40px_-30px_rgba(19,24,42,0.48)] ring-1 ring-white/55">
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#756654]">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-[#1d1a2b]">
        {value}
      </p>
      <p className="mt-2 text-sm text-[#5b5568]">{detail}</p>
    </div>
  );
}

function StatusBadge({
  tone,
  message,
}: {
  tone: "info" | "error" | "success";
  message: string;
}) {
  const styles =
    tone === "success"
      ? "border-[#9ce3c4] bg-[#ebfff5] text-[#14573d]"
      : tone === "error"
        ? "border-[#f5b5a7] bg-[#fff1ed] text-[#8a2f1d]"
        : "border-[#cbd8ff] bg-[#eef3ff] text-[#27407b]";
  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-sm font-medium ${styles}`}
    >
      {message}
    </div>
  );
}

type StatusTone = "info" | "error" | "success";

type StatusState = {
  tone: StatusTone;
  message: string;
};

export default function Home() {
  const [networkName, setNetworkName] = useState<NetworkKey>(
    DEFAULT_NETWORK as NetworkKey,
  );
  const [status, setStatus] = useState<StatusState>({
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

  const setStatusMessage = (tone: StatusTone, message: string) => {
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

  const runContractCall = (async (
    contract: ContractMeta,
    functionName: string,
    functionArgs: ClarityValue[],
    options?: ContractCallOptions,
  ) => {
    if (!assertReady(contract)) return;
    const contractAddress = resolveContractAddress(contract);
    setStatusMessage("info", "Transaction submitted to wallet.");
    setLastTxId(null);
    try {
      const postConditions =
        typeof options?.postConditions === "function"
          ? await options.postConditions()
          : (options?.postConditions ?? []);

      await openContractCall({
        contractAddress,
        contractName: contract.name,
        functionName,
        functionArgs,
        network,
        anchorMode: AnchorMode.Any,
        postConditions,
        postConditionMode: PostConditionMode.Allow,
        onFinish: (data) => {
          setLastTxId(data.txId);
          setStatusMessage("success", "Transaction broadcasted.");
        },
        onCancel: () => setStatusMessage("info", "Transaction cancelled."),
      });
    } catch {
      setStatusMessage("error", "Transaction setup failed.");
    }
  }) as (
    contract: ContractMeta,
    functionName: string,
    functionArgs: ClarityValue[],
    options?: ContractCallOptions,
  ) => void;

  const callReadOnly = async (
    contract: ContractMeta,
    functionName: string,
    functionArgs: ClarityValue[],
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
    } catch {
      setStatusMessage("error", "Read-only call failed.");
    }
  };

  const fetchReadOnlyJson = async (
    contract: ContractMeta,
    functionName: string,
    functionArgs: ClarityValue[],
  ) => {
    const contractAddress = resolveContractAddress(contract);
    if (!contractAddress) {
      throw new Error("Missing contract address.");
    }
    const response = await fetchCallReadOnlyFunction({
      contractAddress,
      contractName: contract.name,
      functionName,
      functionArgs,
      senderAddress: senderAddress || contractAddress,
      network,
    });
    return cvToJSON(response);
  };

  const getTupleFromOptionalReadOnly = async (
    contract: ContractMeta,
    functionName: string,
    functionArgs: ClarityValue[],
  ) => {
    const response = await fetchReadOnlyJson(
      contract,
      functionName,
      functionArgs,
    );
    const unwrapped = readJsonValue(response);
    if (
      !unwrapped ||
      typeof unwrapped !== "object" ||
      Array.isArray(unwrapped)
    ) {
      throw new Error("Expected tuple response.");
    }
    return unwrapped as Record<string, unknown>;
  };

  const stxTransferPostCondition = (amount: bigint) => {
    if (!stxAddress) {
      throw new Error("Missing wallet address.");
    }
    return {
      type: "stx-postcondition" as const,
      address: stxAddress,
      condition: "lte" as const,
      amount,
    };
  };

  const getGameStakePostConditions = async (
    contract: ContractMeta,
    gameId: string,
  ) => {
    const game = await getTupleFromOptionalReadOnly(contract, "get-game", [
      uintCV(toUint(gameId)),
    ]);
    return [stxTransferPostCondition(readTupleUint(game, "stake"))];
  };

  const getLotteryTicketPostConditions = async (roundId: string) => {
    const round = await getTupleFromOptionalReadOnly(
      contracts.lottery,
      "get-round",
      [uintCV(toUint(roundId))],
    );
    return [stxTransferPostCondition(readTupleUint(round, "ticket-price"))];
  };

  const getTournamentEntryPostConditions = async (
    tournamentIdValue: string,
  ) => {
    const tournament = await getTupleFromOptionalReadOnly(
      contracts.tournament,
      "get-tournament",
      [uintCV(toUint(tournamentIdValue))],
    );
    return [stxTransferPostCondition(readTupleUint(tournament, "entry-fee"))];
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
    { id: "all", label: "All Games", emoji: "00" },
    { id: "coin-flip", label: "Coin Flip", emoji: "CF" },
    { id: "guess", label: "Guess the Number", emoji: "GN" },
    { id: "higher", label: "Higher / Lower", emoji: "HL" },
    { id: "emoji", label: "Emoji Battle", emoji: "EB" },
    { id: "rps", label: "Rock Paper Scissors", emoji: "RPS" },
    { id: "hot-potato", label: "Hot Potato", emoji: "HP" },
    { id: "lottery", label: "Lottery", emoji: "LOT" },
    { id: "tournament", label: "Tournaments", emoji: "TRN" },
    { id: "cosmetics", label: "Cosmetics", emoji: "NFT" },
    { id: "scoreboard", label: "Scoreboard", emoji: "SB" },
    { id: "tic-tac-toe", label: "Tic Tac Toe", emoji: "TTT" },
    { id: "todo", label: "Todo List", emoji: "TODO" },
  ];

  const shouldShow = (id: string) => activeGame === "all" || activeGame === id;
  const visibleGameCount = activeGame === "all" ? gameMenu.length - 1 : 1;
  const walletLabel = signedIn
    ? (stxAddress ?? `Connected without ${networkName} address`)
    : "Wallet offline";
  const txLabel = lastTxId
    ? `${lastTxId.slice(0, 8)}...${lastTxId.slice(-6)}`
    : "";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#fff6e7,transparent_32%),radial-gradient(circle_at_16%_18%,rgba(255,190,61,0.24),transparent_32%),radial-gradient(circle_at_84%_12%,rgba(73,214,186,0.2),transparent_28%),linear-gradient(180deg,#fffdf9_0%,#fff4df_48%,#fff9f1_100%)] px-4 pb-16 pt-8 text-[#1d1a2b] sm:px-6 sm:pt-10 lg:px-10">
      <div className="pointer-events-none absolute -left-12 top-10 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(255,184,79,0.85),transparent_62%)] opacity-70 blur-md animate-[floaty_8s_ease-in-out_infinite]" />
      <div className="pointer-events-none absolute right-[-44px] top-20 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(61,214,178,0.46),transparent_62%)] opacity-70 blur-2xl animate-[floaty_10s_ease-in-out_infinite]" />
      <div className="pointer-events-none absolute bottom-[-70px] left-1/2 h-60 w-60 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,122,89,0.22),transparent_68%)] blur-2xl animate-[floaty_9s_ease-in-out_infinite]" />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 sm:gap-10">
        <section className="grid gap-6 lg:grid-cols-[1.45fr_0.95fr]">
          <div className="relative overflow-hidden rounded-[36px] border border-white/60 bg-[linear-gradient(135deg,rgba(27,29,43,0.98),rgba(45,46,73,0.92)_45%,rgba(255,122,89,0.84)_140%)] px-6 py-7 text-white shadow-[0_34px_70px_-38px_rgba(19,24,42,0.75)] sm:px-8 sm:py-8">
            <div className="pointer-events-none absolute right-[-32px] top-[-24px] h-36 w-36 rounded-full border border-white/10 bg-white/5" />
            <div className="pointer-events-none absolute bottom-[-38px] right-16 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(255,190,61,0.55),transparent_70%)] blur-xl" />
            <div className="relative">
              <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.34em] text-white/70">
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">
                  Stacks Arcade
                </span>
                <span>Multi-game command deck</span>
              </div>
              <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[0.98] tracking-tight sm:text-5xl lg:text-6xl">
                Playable contracts with a frontend that finally matches them.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/74 sm:text-base">
                Browse every mini-game, switch chain context, inspect
                transaction status, and jump straight into commit-reveal flows
                without digging through a flat operator form.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 text-sm text-white/80">
                <span className="rounded-full border border-white/12 bg-white/10 px-4 py-2">
                  {visibleGameCount} active view
                </span>
                <span className="rounded-full border border-white/12 bg-white/10 px-4 py-2">
                  {gameMenu.length - 1} contracts wired
                </span>
                <span className="rounded-full border border-white/12 bg-white/10 px-4 py-2">
                  {networkName} selected
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-[36px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,243,223,0.88))] p-5 shadow-[0_28px_60px_-38px_rgba(19,24,42,0.4)] ring-1 ring-white/55 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#756654]">
                  Session
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#1d1a2b]">
                  Wallet + network
                </h2>
              </div>
              <span className="rounded-full border border-[#ead2ab] bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#6a6179]">
                Live
              </span>
            </div>
            <div className="mt-5 flex rounded-full border border-[#ead2ab] bg-white/85 p-1 text-sm shadow-sm">
              <button
                className={`flex-1 rounded-full px-4 py-2 transition ${
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
                className={`flex-1 rounded-full px-4 py-2 transition ${
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
            <div className="mt-5 space-y-3">
              <StatusBadge tone={status.tone} message={status.message} />
              <div className="rounded-[24px] border border-[#ead2ab] bg-white/75 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#756654]">
                  Wallet address
                </p>
                <p className="mt-2 break-all font-mono text-sm text-[#1d1a2b]">
                  {walletLabel}
                </p>
              </div>
              {networkWarning ? (
                <div className="rounded-[24px] border border-[#f2c6b3] bg-[#fff5f0] p-4 text-sm text-[#8a3d21]">
                  <p>{networkWarning}</p>
                  <div className="mt-3">
                    <ActionButton
                      label="Reconnect wallet"
                      onClick={handleReconnect}
                      tone="secondary"
                    />
                  </div>
                </div>
              ) : null}
              <div className="flex flex-wrap gap-3">
                {signedIn ? (
                  <ActionButton
                    label="Sign out"
                    onClick={handleSignOut}
                    tone="secondary"
                  />
                ) : (
                  <ActionButton
                    label="Connect wallet"
                    onClick={handleConnect}
                  />
                )}
                {lastTxId ? (
                  <a
                    className="inline-flex h-11 items-center justify-center rounded-full border border-[#f0cfa1] bg-white/80 px-5 text-sm font-semibold text-[#1d1a2b] transition hover:-translate-y-0.5 hover:border-[#ffbe3d] sm:h-12 sm:px-6"
                    href={txExplorerUrl(lastTxId)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View tx {txLabel}
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Visible Modules"
            value={String(visibleGameCount)}
            detail={
              activeGame === "all"
                ? "All game panels are expanded."
                : `Focused on ${gameMenu.find((item) => item.id === activeGame)?.label ?? "one game"}.`
            }
          />
          <StatCard
            label="Connected Wallet"
            value={signedIn ? "Online" : "Offline"}
            detail={
              signedIn
                ? "Transactions can be sent from the connected account."
                : "Connect a wallet to enable contract calls."
            }
          />
          <StatCard
            label="Contract Version"
            value="v9"
            detail="Default names now match the upgraded contract set in this repo."
          />
          <StatCard
            label="Deployer"
            value={contracts.deployer ? "Set" : "Missing"}
            detail={
              contracts.deployer ||
              "Set NEXT_PUBLIC_*_DEPLOYER_ADDRESS to unlock reads and writes."
            }
          />
        </section>

        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          <aside className="h-fit rounded-[30px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(255,247,235,0.86))] p-4 shadow-[0_24px_54px_-36px_rgba(19,24,42,0.38)] ring-1 ring-white/55 sm:p-5 lg:sticky lg:top-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#756654]">
                  Navigation
                </p>
                <p className="mt-2 text-xl font-semibold text-[#1d1a2b]">
                  Choose a module
                </p>
              </div>
              <span className="rounded-full bg-[#1d1a2b] px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white">
                {activeGame === "all" ? "All" : "Focus"}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-[#5b5568]">
              Filter the canvas to one game when you want a tighter workflow, or
              keep everything open for a full operator view.
            </p>
            <nav className="mt-5 flex flex-col gap-2">
              {gameMenu.map((item) => {
                const active = activeGame === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveGame(item.id)}
                    className={`flex items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-medium transition-all duration-200 ease-out ${
                      active
                        ? "bg-[#1d1a2b] text-white shadow-[0_18px_30px_-20px_rgba(29,26,43,0.72)]"
                        : "border border-[#f2d5af] bg-white/75 text-[#4a4763] hover:-translate-y-0.5 hover:border-[#ffbe3d] hover:text-[#1d1a2b]"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={`inline-flex min-w-11 justify-center rounded-full px-2 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${
                          active
                            ? "bg-white/12 text-white/80"
                            : "bg-[#fff1dc] text-[#7e5a24]"
                        }`}
                      >
                        {item.emoji}
                      </span>
                      {item.label}
                    </span>
                    <span
                      className={`text-xs ${active ? "text-white/70" : "text-[#7a7287]"}`}
                    >
                      {active ? "Open" : "View"}
                    </span>
                  </button>
                );
              })}
            </nav>
            <div className="mt-6 rounded-[24px] border border-[#ead2ab] bg-[linear-gradient(180deg,#fffefb,#fff4e2)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#756654]">
                Operator notes
              </p>
              <ul className="mt-3 space-y-2 text-sm text-[#5b5568]">
                <li>Generate secrets before submitting commit-based games.</li>
                <li>Read-only responses land in the console at the bottom.</li>
                <li>Wallet network must match the selected chain.</li>
              </ul>
            </div>
          </aside>

          <div className="grid gap-8">
            <section className="grid gap-4 rounded-[30px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(255,250,241,0.84))] px-5 py-5 text-sm text-[#4a4763] shadow-[0_24px_54px_-38px_rgba(19,24,42,0.36)] ring-1 ring-white/55 sm:px-6 lg:grid-cols-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#756654]">
                  How to start
                </p>
                <p className="mt-2 leading-6">
                  Connect a wallet, pick a network, then use the left rail to
                  focus the exact game you want to operate.
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#756654]">
                  Commit-reveal flow
                </p>
                <p className="mt-2 leading-6">
                  Generate a 32-byte secret, derive the commit, create the game,
                  and only then reveal the original secret to settle.
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#756654]">
                  Tracking
                </p>
                <p className="mt-2 leading-6">
                  Status updates surface here immediately, and the latest
                  transaction can be opened in Hiro Explorer after broadcast.
                </p>
              </div>
            </section>

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
                        runContractCall(
                          contracts.coinFlip,
                          "create-game",
                          [uintCV(toUint(coinWager)), commitArg],
                          {
                            postConditions: [
                              stxTransferPostCondition(toUint(coinWager)),
                            ],
                          },
                        );
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
                          {
                            postConditions: [
                              stxTransferPostCondition(toUint(guessWager)),
                            ],
                          },
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
                        runContractCall(
                          contracts.higherLower,
                          "create-game",
                          [uintCV(toUint(higherWager)), commitArg],
                          {
                            postConditions: [
                              stxTransferPostCondition(toUint(higherWager)),
                            ],
                          },
                        );
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
                        runContractCall(
                          contracts.emojiBattle,
                          "create-game",
                          [uintCV(toUint(emojiStake)), commitArg],
                          {
                            postConditions: [
                              stxTransferPostCondition(toUint(emojiStake)),
                            ],
                          },
                        );
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
                        runContractCall(
                          contracts.emojiBattle,
                          "join-game",
                          [uintCV(toUint(emojiGameId)), commitArg],
                          {
                            postConditions: () =>
                              getGameStakePostConditions(
                                contracts.emojiBattle,
                                emojiGameId,
                              ),
                          },
                        );
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
                          {
                            postConditions: [
                              stxTransferPostCondition(toUint(rpsStake)),
                            ],
                          },
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
                          {
                            postConditions: () =>
                              getGameStakePostConditions(
                                contracts.rockPaperScissors,
                                rpsGameId,
                              ),
                          },
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
                        runContractCall(
                          contracts.hotPotato,
                          "create-game",
                          [uintCV(toUint(hotStake))],
                          {
                            postConditions: [
                              stxTransferPostCondition(toUint(hotStake)),
                            ],
                          },
                        )
                      }
                    />
                    <ActionButton
                      label="Take potato"
                      onClick={() =>
                        runContractCall(
                          contracts.hotPotato,
                          "take-potato",
                          [uintCV(toUint(hotGameId))],
                          {
                            postConditions: () =>
                              getGameStakePostConditions(
                                contracts.hotPotato,
                                hotGameId,
                              ),
                          },
                        )
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
                        runContractCall(
                          contracts.lottery,
                          "buy-ticket",
                          [uintCV(toUint(lotteryRoundId))],
                          {
                            postConditions: () =>
                              getLotteryTicketPostConditions(lotteryRoundId),
                          },
                        )
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
                          {
                            postConditions: () =>
                              getTournamentEntryPostConditions(tournamentId),
                          },
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
                        runContractCall(
                          contracts.cosmetics,
                          "transfer",
                          [
                            uintCV(toUint(cosmeticsTokenId)),
                            standardPrincipalCV(stxAddress),
                            standardPrincipalCV(cosmeticsTransferTo),
                          ],
                          {
                            postConditions: [
                              {
                                type: "nft-postcondition",
                                address: stxAddress,
                                condition: "sent",
                                asset: `${resolveContractAddress(contracts.cosmetics)}.${contracts.cosmetics.name}::cosmetic`,
                                assetId: uintCV(toUint(cosmeticsTokenId)),
                              },
                            ],
                          },
                        );
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
