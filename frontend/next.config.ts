import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // On force explicitement la racine du workspace pour éviter le warning
    root: path.resolve(__dirname, ".."),
  },
};

export default nextConfig;
