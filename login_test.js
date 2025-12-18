(async () => {
  try {
    const res = await fetch('http://api:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@zedgaminghosting.hu', password: 'secret' })
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
    if (data.accessToken) {
      console.log('\n✅ JWT Token:', data.accessToken);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
