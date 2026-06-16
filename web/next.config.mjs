/** @type {import('next').NextConfig} */
const nextConfig = {
  // 루트의 레거시 Django lockfile과 충돌하지 않도록 web/을 트레이싱 루트로 고정
  outputFileTracingRoot: import.meta.dirname,
  // Supabase Storage 이미지를 next/image로 쓸 경우를 대비한 자리.
  // 실제 프로젝트 ref로 교체: <project-ref>.supabase.co
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.amazonaws.com" },
      { protocol: "https", hostname: "*.cloudfront.net" },
    ],
  },
};

export default nextConfig;
