import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@sparticuz/chromium"],
  outputFileTracingIncludes: {
    "/api/student/[id]/report": ["./src/assets/fonts/**/*"],
  },
};

export default nextConfig;
