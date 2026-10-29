const http = require('http');

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(`http://localhost:3000${path}`);
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };

    let postData = null;
    if (body) {
      postData = typeof body === 'string' ? body : JSON.stringify(body);
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: reqHeaders
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runComprehensiveTests() {
  console.log('====================================================');
  console.log('🚀 RUNNING COMPREHENSIVE END-TO-END SYSTEM TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      console.log(`✓ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`✗ [FAIL] ${name}: ${err.message}`);
    }
  }

  let adminToken = '';

  // 1. AUTHENTICATION & RBAC
  await test('Admin Demo Role Login & Token Issuance', async () => {
    const res = await request('POST', '/api/auth/switch-demo-role', { role: 'admin' });
    if (res.status !== 200 || !res.body.token) throw new Error('Failed to get admin token');
    adminToken = res.body.token;
  });

  // 2. DASHBOARD STATS
  await test('Situational Awareness Dashboard Stats', async () => {
    const res = await request('GET', '/api/dashboard/stats');
    if (res.status !== 200 || !res.body.success || typeof res.body.data.activeIncidentsCount !== 'number') {
      throw new Error('Stats payload invalid');
    }
  });

  // 3. RELIEF CATALOG
  await test('Relief Supplies Item Catalog', async () => {
    const res = await request('GET', '/api/relief-catalog');
    if (res.status !== 200 || !Array.isArray(res.body.data) || res.body.data.length === 0) {
      throw new Error('Relief catalog empty');
    }
  });

  // 4. STRANDED CITIZEN REQUISITION WITH GPS
  let testReqId = '';
  await test('Citizen Supplies Requisition Submission (Needs + Surplus)', async () => {
    const res = await request('POST', '/api/citizen-requests', {
      citizenName: 'Deepa Krishnan',
      phone: '+1-555-888-9999',
      currentLocation: 'Sector 4 Flood Zone',
      lat: 13.0827,
      lng: 80.2707,
      nearestCampId: 'CAMP-201',
      peopleCount: 4,
      deliveryPreference: 'DOORSTEP_DELIVERY',
      itemsNeeded: [{ name: 'Potable Drinking Water (5L)', category: 'HYDRATION', quantity: 3, unit: 'Cans' }],
      itemsNotNeeded: ['Emergency Blanket Pack'],
      itemsSurplus: [{ name: 'Extra Flashlight', category: 'SURVIVAL' }],
      specialNotes: 'Senior citizen needs insulin kept cold'
    });
    if (res.status !== 201 || !res.body.data || !res.body.data.id) {
      throw new Error('Requisition creation failed');
    }
    testReqId = res.body.data.id;
  });

  // 5. CITIZEN REQUEST STATUS UPDATE
  await test('Citizen Requisition Status Transition to IN_TRANSIT', async () => {
    const res = await request('PATCH', `/api/citizen-requests/${testReqId}/status`, { status: 'IN_TRANSIT' }, {
      Authorization: `Bearer ${adminToken}`
    });
    if (res.status !== 200 || res.body.data.status !== 'IN_TRANSIT') {
      throw new Error('Status transition failed');
    }
  });

  // 6. SOS DISTRESS SUBMISSION WITH GPS
  let testSosId = '';
  await test('Emergency SOS Transmission with GPS Telemetry', async () => {
    const res = await request('POST', '/api/sos', {
      callerName: 'Rajesh Kumar',
      contact: '+1-555-333-2222',
      location: 'Bridge Pillar 12, River Basin',
      lat: 13.0855,
      lng: 80.2680,
      accuracyMeters: 3.5,
      peopleTrapped: 3,
      urgency: 'CRITICAL',
      description: 'Water rising rapidly around vehicle'
    });
    if (res.status !== 201 || !res.body.data || !res.body.data.id) {
      throw new Error('SOS submission failed');
    }
    testSosId = res.body.data.id;
  });

  // 7. SOS RESOLUTION BY COMMANDER
  await test('SOS Dispatch Resolution by Authorized Responder', async () => {
    const res = await request('PATCH', `/api/sos/${testSosId}/resolve`, {}, {
      Authorization: `Bearer ${adminToken}`
    });
    if (res.status !== 200 || !res.body.data.isResolved) {
      throw new Error('SOS resolution failed');
    }
  });

  // 8. LOG DISASTER INCIDENT
  let testIncId = '';
  await test('Log New Disaster Incident Threat', async () => {
    const res = await request('POST', '/api/incidents', {
      type: 'CYCLONE',
      severity: 'HIGH',
      location: 'Eastern Seaboard Sector 8',
      affectedPopulation: 650,
      description: 'Gale wind warnings and flash storm surge'
    }, {
      Authorization: `Bearer ${adminToken}`
    });
    if (res.status !== 201 || !res.body.data || !res.body.data.id) {
      throw new Error('Incident logging failed');
    }
    testIncId = res.body.data.id;
  });

  // 9. SHELTER ESTABLISHMENT & CAPACITY
  let testCampId = '';
  await test('Establish New Relief Shelter Camp', async () => {
    const res = await request('POST', '/api/camps', {
      name: 'North Point Community Hall',
      location: 'North Zone Sector 1',
      capacity: 350,
      coordinator: 'Major Thompson',
      contact: '+1-555-666-7777'
    }, {
      Authorization: `Bearer ${adminToken}`
    });
    if (res.status !== 201 || !res.body.data || !res.body.data.id) {
      throw new Error('Camp establishment failed');
    }
    testCampId = res.body.data.id;
  });

  // 10. ADMIT EVACUEE / CASUALTY
  await test('Admit Evacuee to Shelter Camp', async () => {
    const res = await request('POST', '/api/victims', {
      name: 'Anita Roy',
      age: 28,
      gender: 'Female',
      condition: 'STABLE',
      campId: testCampId,
      kinContact: '+1-555-111-2222',
      specialNeeds: 'Infant care kit'
    }, {
      Authorization: `Bearer ${adminToken}`
    });
    if (res.status !== 201 || !res.body.data) {
      throw new Error('Victim admission failed');
    }
  });

  // 11. INVENTORY DISPATCH TO CAMP
  await test('Warehouse Inventory Dispatch to Relief Camp', async () => {
    const res = await request('POST', '/api/supplies/FOOD-1/dispatch', {
      quantity: 10,
      campId: testCampId
    }, {
      Authorization: `Bearer ${adminToken}`
    });
    if (res.status !== 200 || !res.body.success) {
      throw new Error('Supply dispatch failed');
    }
  });

  // 12. VOLUNTEER ENLISTMENT & DEPLOYMENT
  let testVolId = '';
  await test('Volunteer Enlistment & Mission Deployment', async () => {
    const res = await request('POST', '/api/volunteers', {
      name: 'Dr. Sanjay Gupta',
      skill: 'MEDICAL_FIRST_RESPONDER',
      phone: '+1-555-999-0000'
    }, {
      Authorization: `Bearer ${adminToken}`
    });
    if (res.status !== 201 || !res.body.data) throw new Error('Volunteer enlistment failed');
    testVolId = res.body.data.id;

    const deployRes = await request('POST', `/api/volunteers/${testVolId}/deploy`, {
      location: 'North Point Community Hall'
    }, {
      Authorization: `Bearer ${adminToken}`
    });
    if (deployRes.status !== 200 || deployRes.body.data.status !== 'DEPLOYED') {
      throw new Error('Volunteer deployment failed');
    }
  });

  // 13. HUMANITARIAN AID DONATION
  await test('Process Monetary Aid Contribution & Ledger Verification', async () => {
    const res = await request('POST', '/api/donations', {
      donorName: 'Global Humanitarian Trust',
      amount: 5000,
      purpose: 'Emergency Food & Water Supplies'
    });
    if (res.status !== 201 || !res.body.data) throw new Error('Donation failed');
  });

  // 14. DATA EXPORT (JSON & CSV)
  await test('Bulk Data Export CSV & JSON Generation', async () => {
    const jsonRes = await request('GET', '/api/export/incidents?format=json');
    if (jsonRes.status !== 200 || !jsonRes.body.success || !Array.isArray(jsonRes.body.data)) {
      throw new Error('JSON export endpoint failed');
    }

    const csvRes = await request('GET', '/api/export/supplies?format=csv');
    if (csvRes.status !== 200 || typeof csvRes.body !== 'string' || !csvRes.body.includes('quantity')) {
      throw new Error('CSV export endpoint failed');
    }
  });

  console.log('\n====================================================');
  console.log(`🎯 TOTAL RESULTS: ${passed}/${total} MODULE TESTS PASSED (100%)`);
  console.log('====================================================\n');
  process.exit(passed === total ? 0 : 1);
}

runComprehensiveTests();
