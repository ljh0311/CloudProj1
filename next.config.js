/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    output: 'standalone',
    env: {
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        DB_HOST: process.env.DB_HOST,
        DB_USER: process.env.DB_USER,
        DB_PASSWORD: process.env.DB_PASSWORD,
        DB_NAME: process.env.DB_NAME,
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
    webpack: (config, { isServer }) => {
        if (!isServer) {
            // Don't resolve 'mysql2' module on the client side
            config.resolve.fallback = {
                ...config.resolve.fallback,
                mysql2: false,
                'mysql2/promise': false,
                net: false,
                tls: false,
                fs: false,
                child_process: false
            };
        }
        return config;
    },
    // Add headers for security
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block',
                    },
                ],
            },
        ];
    },
}

module.exports = nextConfig 