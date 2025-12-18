#!/usr/bin/env node
/*
 Virtual test: Node creation + daemon registration
 Usage:
   node scripts/test_add_node.js --base http://localhost:3000 \
     --email admin@example.com --password Admin123!
*/

const args = process.argv.slice(2);
function arg(name, def) {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
}

const BASE = arg('base', process.env.API_BASE_URL || 'http://localhost:3000');
const EMAIL = arg('email', process.env.API_ADMIN_EMAIL || 'admin@zedgaminghosting.hu');
const PASSWORD = arg('password', process.env.API_ADMIN_PASSWORD || 'Admin123!');

(async () => {
  try {
    console.log(`Base: ${BASE}`);
    console.log('1) Logging in as admin...');
    const loginRes = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD })
    });
    if (!loginRes.ok) {
      const t = await loginRes.text().catch(() => '');
      throw new Error(`Login failed: ${loginRes.status} ${t}`);
    }
    const login = await loginRes.json();
    const token = login.accessToken;
    console.log('   ✓ Logged in');

    console.log('2) Creating node (PROVISIONING)...');
    const nodePayload = {
      name: `TestNode-${Date.now()}`,
      ipAddress: '203.0.113.10',
      publicFqdn: 'test-node.local',
      totalRam: 16384,
      totalCpu: 8,
      diskType: 'NVME',
      isClusterStorage: false,
      maxConcurrentUpdates: 2
    };
    const createRes = await fetch(`${BASE}/api/nodes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(nodePayload)
    });
    if (!createRes.ok) {
      const t = await createRes.text().catch(() => '');
      throw new Error(`Create node failed: ${createRes.status} ${t}`);
    }
    const node = await createRes.json();
    console.log(`   ✓ Node created: ${node.id}`);

    console.log('3) Simulating daemon register...');
    const regRes = await fetch(`${BASE}/api/agent/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nodeId: node.id,
        daemonVersion: '1.0.0-test',
        systemInfo: {
          cpu: 5.2,
          memory: { used: 4096, total: 16384, percent: 25 },
          disk: [{ mount: '/', used: 20_000, total: 100_000, percent: 20 }],
          network: { in: 1024, out: 2048 },
          containerCount: 0
        }
      })
    });
    if (!regRes.ok) {
      const t = await regRes.text().catch(() => '');
      throw new Error(`Register failed: ${regRes.status} ${t}`);
    }
    console.log('   ✓ Daemon register OK');

    console.log('4) Verifying node status...');
    const nodeGet = await fetch(`${BASE}/api/nodes/${node.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!nodeGet.ok) {
      const t = await nodeGet.text().catch(() => '');
      throw new Error(`Get node failed: ${nodeGet.status} ${t}`);
    }
    const fresh = await nodeGet.json();
    console.log(`   Status: ${fresh.status}`);

    if (fresh.status === 'ONLINE') {
      console.log('\n✅ Virtual test succeeded: Node is ONLINE.');
      process.exit(0);
    } else {
      console.log('\n⚠️ Virtual test completed but node not ONLINE.');
      process.exit(2);
    }
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
})();
