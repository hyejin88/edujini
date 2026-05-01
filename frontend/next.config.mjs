// next.config.mjs — Cloudflare Pages 호환 설정
// dev 시 setupDevPlatform 호출되도록 가드.
import { setupDevPlatform } from '@cloudflare/next-on-pages/next-dev'

if (process.env.NODE_ENV === 'development') {
  await setupDevPlatform().catch(() => {
    // 로컬에서 next-on-pages 설치 안 된 경우 조용히 패스
  })
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
