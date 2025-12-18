import { PrismaClient } from '@zed-hosting/db';

const prisma = new PrismaClient();

async function main() {
    const nodeId = '550e8400-e29b-41d4-a716-446655441111';
    const apiKey = 'golO4lGeUmrUVEIpTG_lve2tgGMk2fX7uTu5Z8CEurO9Hxi9';
    const name = 'Brain-One';
    const ip = '116.203.226.140';

    console.log(`Creating node: ${name} (${ip})...`);

    try {
        const node = await prisma.node.create({
            data: {
                id: nodeId,
                name: name,
                ipAddress: ip,
                publicFqdn: ip,
                totalRam: 32000,
                totalCpu: 16,
                diskType: 'NVME',
                status: 'PROVISIONING',
                apiKey: apiKey,
            },
        });

        console.log('\n✅ NODE CREATED');
        console.log(`ID: ${node.id}`);
        console.log(`Name: ${node.name}`);
        console.log(`Status: ${node.status}`);
        console.log(`API Key: ${node.apiKey}`);
        console.log('------------------------\n');
    } catch (error: any) {
        if (error.code === 'P2002') {
            console.log('\n⚠️  Node already exists');
            console.log(`ID: ${nodeId}`);
        } else {
            throw error;
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
