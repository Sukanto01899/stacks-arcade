export class UniversalConnector {
  static async init() {
    throw new Error(
      "WalletConnect is disabled in this build and cannot be used.",
    );
  }
}
