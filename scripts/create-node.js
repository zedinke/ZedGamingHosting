
const { PrismaClient } = require('@prisma/client');
const { randomBytes } = require('crypto');

const prisma = new PrismaClient();

async function main() {
    const name = process.argv[2] || 'Daemon-01';
    const ip = process.argv[3] || '127.0.0.1';

    console.log(`Creating node: ${name} (${ip})...`);

    const apiKey = randomBytes(32).toString('base64');

    const node = await prisma.node.create({
        data: {
            name: name,
            ipAddress: ip,
            publicFqdn: ip,
            totalRam: 32000,
            totalCpu: 16,
            diskType: 'NVMe',
            status: 'PROVISIONING',
            apiKey: apiKey,
        },
    });

    console.log('\n--- NODE CREDENTIALS ---');
    console.log(`DAEMON_NODE_ID="${node.id}"`);
    console.log(`DAEMON_API_KEY="${apiKey}"`);
    console.log(`MANAGER_URL="http://api:3000"`);
    console.log('------------------------\n');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
