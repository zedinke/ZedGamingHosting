const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    // Ensure CSS files are properly handled
    experimental: {
        optimizePackageImports: ['lucide-react'],
    },
};

module.exports = withNextIntl(nextConfig);
