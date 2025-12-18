const API_IP = '172.19.0.5';
const API_PORT = 3000;
const BASE_URL = `http://${API_IP}:${API_PORT}`;

(async () => {
  try {
    // Try login
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@zedgaminghosting.hu',
        password: 'Admin123!'
      }),
      timeout: 30000
    });
    
    console.log('Login response status:', loginRes.status);
    const data = await loginRes.json();
    console.log(JSON.stringify(data, null, 2));
    
    if (loginRes.ok) {
      console.log('\n✅ Login SUCCESSFUL');
      console.log('Access Token:', data.accessToken);
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
})();
