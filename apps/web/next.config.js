const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

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
};

module.exports = withNextIntl(nextConfig);
