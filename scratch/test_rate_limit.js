const http = require('http');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      }
    }, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(responseBody) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: responseBody });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function run() {
  console.log('🔒 Testing CampusTrack Login Rate Limiter...');

  // Test 1: Successful demo login should work
  const goodLogin = await post('/api/v1/auth/login', {
    identifier: 'admin@college.edu',
    password: 'admin123'
  });
  console.log(`✅ Valid Demo Login HTTP status: ${goodLogin.status} (${goodLogin.body.status})`);

  // Test 2: Sequence of failed logins with wrong password
  for (let i = 1; i <= 6; i++) {
    const res = await post('/api/v1/auth/login', {
      identifier: 'admin@college.edu',
      password: 'wrong_password_' + i
    });
    console.log(`Attempt ${i} → HTTP ${res.status}: ${JSON.stringify(res.body.message || res.body)}`);
  }

  console.log('🎉 Rate limiter verification test complete.');
}

run().catch(console.error);
