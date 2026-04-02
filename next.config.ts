import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep build tooling scoped to this repo when parent folders contain other lockfiles.
  outputFileTracingRoot: process.cwd(),
  experimental: {
    workerThreads: false,
  },
};

export default nextConfig;
