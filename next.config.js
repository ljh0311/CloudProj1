/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    images: {
        domains: ['54.159.253.0', 'localhost'],
        unoptimized: true
    },
    server: {
        host: '0.0.0.0',  // Listen on all network interfaces
        port: 3000
    }
}

module.exports = nextConfig 