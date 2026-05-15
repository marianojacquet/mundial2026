/** @type {import('next').NextConfig} */
const nextConfig = {
  // Para Docker: genera un servidor Node standalone
  output: process.env.DOCKER_BUILD ? 'standalone' : undefined,

  experimental: {
    serverComponentsExternalPackages: ['bcryptjs'],
  },

  images: {
    remotePatterns: [],
  },

  // Evita que el build falle si la DB no está disponible en CI/Vercel
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: true },
}

module.exports = nextConfig
