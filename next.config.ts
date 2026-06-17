import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Auth middleware (proxy) buffers request bodies; the default cap is 10MB, which
  // truncated large pitch-deck PDFs before they reached the upload routes (the body
  // then failed to parse as FormData). Raise it to match the 50MB storage-bucket
  // limit (migration 015) so big decks/memoranda upload through middleware.
  experimental: {
    proxyClientMaxBodySize: 52 * 1024 * 1024,
  },
};

export default nextConfig;
