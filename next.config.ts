import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@sparticuz/chromium",
    "puppeteer-core", // ✅ ADD THIS
  ],
};

export default nextConfig;
