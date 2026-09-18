import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    // Las fotos de muebles se sirven desde un CDN externo. Agregar acá cada
    // host nuevo; Next no optimiza imágenes de dominios no declarados.
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  // Prisma y pg cargan binarios y hacen resolución dinámica de módulos: si el
  // bundler los procesa, el adapter pierde la connection string y termina
  // intentando conectarse a localhost.
  serverExternalPackages: ['@prisma/client', '@prisma/adapter-pg', 'pg'],
}

export default nextConfig
