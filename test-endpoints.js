const http = require('http');

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    }).on('error', reject);
  });
}

async function runHealthCheck() {
  console.log('--- Verifying Disaster Relief System Endpoints ---');
  
  const endpoints = [
    '/api/dashboard/stats',
    '/api/relief-catalog',
    '/api/incidents',
    '/api/camps',
    '/api/victims',
    '/api/supplies',
    '/api/volunteers',
    '/api/sos',
    '/api/citizen-requests',
    '/api/donations'
  ];

  let passed = 0;
  for (const ep of endpoints) {
    try {
      const res = await get(ep);
      if (res.status === 200 && res.body.success) {
        console.log(`✓ ${ep}: OK (Status ${res.status})`);
        passed++;
      } else {
        console.error(`✗ ${ep}: FAILED (Status ${res.status})`, res.body);
      }
    } catch (e) {
      console.error(`✗ ${ep}: Request Error:`, e.message);
    }
  }

  console.log(`\nResults: ${passed}/${endpoints.length} endpoints verified successfully.`);
  process.exit(passed === endpoints.length ? 0 : 1);
}

runHealthCheck();
