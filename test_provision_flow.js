const API_IP = '172.19.0.5';
const API_PORT = 3000;
const BASE_URL = `http://${API_IP}:${API_PORT}`;

(async () => {
  try {
    // Step 1: Login
    console.log('📝 Logging in...');
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@zedgaminghosting.hu',
        password: 'Admin123!'
      })
    });
    
    if (!loginRes.ok) {
      console.error('❌ Login failed:', loginRes.status);
      const err = await loginRes.json();
      console.error(err);
      return;
    }
    
    const loginData = await loginRes.json();
    const token = loginData.accessToken;
    console.log('✅ Login successful');
    
    // Step 2: Create Minecraft server
    console.log('\n🎮 Creating Minecraft server...');
    const createRes = await fetch(`${BASE_URL}/api/servers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'TestMinecraftWithPull',
        gameType: 'MINECRAFT',
        nodeId: 'test-node-001'
      })
    });
    
    if (!createRes.ok) {
      console.error('❌ Server creation failed:', createRes.status);
      const err = await createRes.json();
      console.error(err);
      return;
    }
    
    const serverData = await createRes.json();
    const serverUuid = serverData.uuid;
    console.log('✅ Server created successfully');
    console.log(`Server UUID: ${serverUuid}`);
    console.log(`Status: ${serverData.status}`);
    console.log(`Ports: ${JSON.stringify(serverData.ports)}`);
    
    console.log('\n⏳ Server should now be provisioning...');
    console.log('Check daemon logs for PROVISION task processing and image pull progress');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.cause) {
      console.error('Cause:', err.cause);
    }
  }
})();
