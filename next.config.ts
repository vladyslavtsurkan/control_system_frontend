import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Allow same-origin requests from the dev server (fixes CSRF 403 on Route Handlers)
  allowedDevOrigins: ["localhost:3000", "127.0.0.1:3000"],
  output: "standalone",
};

export default withNextIntl(nextConfig);
