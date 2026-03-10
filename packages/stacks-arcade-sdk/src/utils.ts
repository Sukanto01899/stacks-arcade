import { createNetwork } from "@stacks/network";
import { bufferCV, type ClarityValue } from "@stacks/transactions";
import { CONTRACT_KEYS, DEFAULT_CONTRACT_NAMES } from "./constants.js";
import type {
  ArcadeClientConfig,
  ArcadeContracts,
  ArcadeNetwork,
  ContractMeta,
  ContractOverride,
  UIntLike,
} from "./types.js";

export function getStacksNetwork(network: ArcadeNetwork) {
  return createNetwork(network);
}

export function toUint(value: UIntLike): bigint {
  if (typeof value === "bigint") return value;
  if (typeof value === "number") return BigInt(Math.trunc(value));
  return BigInt(value);
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function hexToBytes(hex: string): Uint8Array | null {
  const normalized = hex.trim().toLowerCase();
  if (!/^[0-9a-f]*$/.test(normalized) || normalized.length % 2 !== 0) {
    return null;
  }
  const bytes = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < normalized.length; i += 2) {
    bytes[i / 2] = Number.parseInt(normalized.slice(i, i + 2), 16);
  }
  return bytes;
}

export function randomSecretBytes(length = 32): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

export function makeSecretHex(length = 32): string {
  return bytesToHex(randomSecretBytes(length));
}

function clampByte(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 255) return 255;
  return Math.floor(value);
}

export async function sha256(bytes: Uint8Array): Promise<Uint8Array> {
  const view = new Uint8Array(bytes.length);
  view.set(bytes);
  const digest = await crypto.subtle.digest("SHA-256", view);
  return new Uint8Array(digest);
}

export async function makeCommitHex(
  secretHex: string,
  extraBytes: number[],
): Promise<string> {
  const secretBytes = requireHexBytes(secretHex, 32, "Secret");
  const payload = new Uint8Array(secretBytes.length + extraBytes.length);
  payload.set(secretBytes, 0);
  payload.set(extraBytes.map(clampByte), secretBytes.length);
  return bytesToHex(await sha256(payload));
}

export function requireHexBytes(
  hex: string,
  expectedLength: number,
  label: string,
): Uint8Array {
  const bytes = hexToBytes(hex);
  if (!bytes || bytes.length !== expectedLength) {
    throw new Error(`${label} must be ${expectedLength} bytes of hex.`);
  }
  return bytes;
}

export function bufferCvFromHex(
  hex: string,
  expectedLength: number,
  label: string,
): ClarityValue {
  return bufferCV(requireHexBytes(hex, expectedLength, label));
}

export function resolveContractOverride(
  override: ContractOverride | undefined,
  fallbackName: string,
  fallbackAddress: string,
): ContractMeta {
  if (!override) {
    return { address: fallbackAddress, name: fallbackName };
  }

  if (typeof override === "string") {
    const parts = override.split(".");
    if (parts.length === 2) {
      return { address: parts[0], name: parts[1] };
    }
    return { address: fallbackAddress, name: override };
  }

  return {
    address: override.address ?? fallbackAddress,
    name: override.name ?? fallbackName,
  };
}

export function resolveContracts(config: ArcadeClientConfig): ArcadeContracts {
  const deployer = config.deployer ?? "";
  const overrides = config.contracts ?? {};

  return CONTRACT_KEYS.reduce<ArcadeContracts>((accumulator, key) => {
    accumulator[key] = resolveContractOverride(
      overrides[key],
      DEFAULT_CONTRACT_NAMES[key],
      deployer,
    );
    return accumulator;
  }, {} as ArcadeContracts);
}

export function requireAddress(address: string, contractName: string): string {
  if (!address) {
    throw new Error(
      `Missing contract address for ${contractName}. Provide a deployer or full contract principal override.`,
    );
  }
  return address;
}
