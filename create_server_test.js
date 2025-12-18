(async () => {
  try {
    const res = await fetch('http://api:3000/api/servers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1OTNmMzNjNy04MzRmLTQ1YjItOGY3OC1lOGU3NTI2MWI4NGUiLCJlbWFpbCI6ImFkbWluQHplZGdhbWluZ2hvc3RpbmcuaHUiLCJyb2xlIjoiU1VQRVJBRE1JTiIsImlhdCI6MTc2NjAxNzU5MiwiZXhwIjoxNzY2MDE4NDkyfQ.X-Q4iRfQ2DDv0X_sxbYAzl9jKHMT3qN7UQ9CXbFySqs'
      },
      body: JSON.stringify({
        name: 'TestMC12',
        gameType: 'MINECRAFT',
        nodeId: '550e8400-e29b-41d4-a716-446655441111'
      })
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
    console.log('\\n\\nServer UUID:', data.uuid);
  } catch (err) {
    console.error('Error:', err.message, err.stack);
  }
})();
