
import { PrismaClient } from '@zed-hosting/db';
import { randomBytes } from 'crypto';

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
            publicFqdn: ip, // Default to IP if no FQDN
            totalRam: 32000, // Placeholder
            totalCpu: 16,    // Placeholder
            diskType: 'NVMe',
            status: 'PROVISIONING', // enum NodeStatus.PROVISIONING
            apiKey: apiKey,
        },
    });

    console.log('\n--- NODE CREDENTIALS ---');
    console.log(`NODE_ID="${node.id}"`);
    console.log(`API_KEY="${apiKey}"`);
    console.log(`MANAGER_URL="https://zedgaminghosting.hu"`); // Or http://api:3000 if internal
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
