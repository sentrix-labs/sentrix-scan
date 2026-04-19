import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    // DECISION: optimize tree-shaking for lucide-react. Excluded recharts because it interacts
    // badly with Turbopack 15.5 optimizePackageImports (seen a build hang in this repo).
    optimizePackageImports: ["lucide-react"],
  },
};

// DECISION: Sentry wrapper only activates when SENTRY_AUTH_TOKEN is present (CI/prod), so local
// dev builds don't pay source-map upload overhead. Matches user request that Sentry be a no-op
// when env not set.
export default process.env.SENTRY_AUTH_TOKEN
  ? withSentryConfig(nextConfig, {
      silent: true,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      widenClientFileUpload: true,
      sourcemaps: { disable: false },
      disableLogger: true,
    })
  : nextConfig;
