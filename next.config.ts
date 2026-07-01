import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    "https://preview-chat-1eab3b5f-93f0-4f46-983b-cade0d80c89e.space.z.ai",
    "https://preview-chat-1eab3b5f-93f0-4f46-983b-cade0d80c89e.space.chatglm.site",
  ],
};

export default nextConfig;
