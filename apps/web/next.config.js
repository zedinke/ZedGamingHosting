/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    pageExtensions: ['ts', 'tsx'],
    images: {
        domains: ['images.unsplash.com'],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
        ],
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    generateBuildId: async () => {
        return process.env.BUILD_ID || `build-${Date.now()}`;
    },
    skipTrailingSlashRedirect: true,
    experimental: {
        optimizePackageImports: ['lucide-react'],
        // Skip prerendering for error pages  
        esmExternals: 'loose',
    },
    webpack: (config) => {
        config.resolve.alias = {
            ...config.resolve.alias,
            '@i18n': require('path').resolve(__dirname, 'src/i18n'),
        };
        return config;
    },
};

module.exports = nextConfig;
