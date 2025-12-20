import type { NextConfig } from "next";
import { resolve } from "path";

const turboAliases = {
  pino: "./lib/pino-stub.ts",
  "@reown/appkit-universal-connector": "./lib/walletconnect-stub.ts",
  "thread-stream": "./lib/thread-stream-stub.ts",
};

const webpackAliases = {
  pino: resolve(__dirname, "lib/pino-stub"),
  "@reown/appkit-universal-connector": resolve(__dirname, "lib/walletconnect-stub"),
  "thread-stream": resolve(__dirname, "lib/thread-stream-stub"),
};

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
    resolveAlias: turboAliases,
  },
  webpack: (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      ...webpackAliases,
    };
    return config;
  },
};

export default nextConfig;
