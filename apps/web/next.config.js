/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
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
