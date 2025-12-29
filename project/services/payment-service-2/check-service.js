// Quick script to check if Payment Service 2 is running
const http = require('http');

const checkService = () => {
  const options = {
    hostname: 'localhost',
    port: 3005,
    path: '/health',
    method: 'GET',
    timeout: 3000
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log('✅ Payment Service 2 is running!');
        console.log('Response:', response);
        process.exit(0);
      } catch (e) {
        console.log('⚠️ Service responded but with invalid JSON');
        console.log('Response:', data);
        process.exit(1);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Payment Service 2 is NOT running!');
    console.error('Error:', error.message);
    console.error('\n💡 To start the service:');
    console.error('   cd services/payment-service-2');
    console.error('   npm install (if not done)');
    console.error('   cp env.example .env (if not done)');
    console.error('   npm start');
    process.exit(1);
  });

  req.on('timeout', () => {
    console.error('❌ Connection timeout - Service may not be running');
    req.destroy();
    process.exit(1);
  });

  req.end();
};

checkService();

