/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone", // for Docker / Fly.io
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
