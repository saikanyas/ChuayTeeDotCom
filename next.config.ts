import type { NextConfig } from "next"
import withSerwistInit from "@serwist/next"

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
})

const nextConfig: NextConfig = {
  // Turbopack is default in Next.js 16 — empty config satisfies Turbopack+webpack coexistence
  turbopack: {},
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "ccqhglbmdqtnacgobidw.supabase.co" },
    ],
  },
}

export default withSerwist(nextConfig)
