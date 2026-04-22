import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    // On force explicitement la racine du workspace pour éviter le warning
    root: path.resolve(__dirname, ".."),
  },
  devIndicators: false,
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);

