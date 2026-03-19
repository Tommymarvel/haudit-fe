import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Keep build tooling scoped to this repo when parent folders contain other lockfiles.
  outputFileTracingRoot: path.join(__dirname),
  experimental: {
    webpackBuildWorker: false,
    workerThreads: false,
  },
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
