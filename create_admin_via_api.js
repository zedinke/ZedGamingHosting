const http = require('http');

const postData = JSON.stringify({
  email: 'admin@zedgaminghosting.hu',
  password: 'Admin123!'
});

const options = {
  hostname: 'api',
  port: 3000,
  path: '/api/auth/create-test-user',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('Creating admin user via API...');

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response status:', res.statusCode);
    console.log('Response:', data);
    
    try {
      const result = JSON.parse(data);
      console.log('\n✅ Result:', JSON.stringify(result, null, 2));
      
      if (result.success) {
        console.log('\n🎉 Admin user created successfully!');
        console.log('Email: admin@zedgaminghosting.hu');
        console.log('Password: Admin123!');
      }
    } catch (e) {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});

req.write(postData);
req.end();
