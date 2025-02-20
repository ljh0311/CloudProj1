/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    output: 'standalone',
    env: {
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL
    },
    experimental: {
        serverComponentsExternalPackages: ['mysql2']
    },
    images: {
        domains: ['44.201.154.170', 'localhost'],
        unoptimized: true
    },
    // Server configuration should be set through environment variables
    // PORT=3000 in .env file
    // The host binding is handled by Next.js automatically in production
}

module.exports = nextConfig 