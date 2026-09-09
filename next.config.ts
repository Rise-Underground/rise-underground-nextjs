import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // A stray package-lock.json in the parent `projects/` folder (unrelated to
  // this project) makes Next infer the wrong workspace root. Pin it explicitly.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
