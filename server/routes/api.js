const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET, requireRoles } = require('../middleware/auth');
const { uploadToCloudinary } = require('../utils/cloudinary');

// =========================================================================
// 1. AUTHENTICATION & ROLE MANAGEMENT
// =========================================================================

router.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Username and password required' });
  }

  const data = db.get();
  const user = data.users.find(u => u.username.toLowerCase() === username.toLowerCase());

  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ success: false, error: 'Invalid username or password' });
  }

  const tokenPayload = {
    id: user.id,
    username: user.username,
    role: user.role,
    fullName: user.fullName,
    badge: user.badge,
    email: user.email
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

  return res.json({
    success: true,
    token,
    user: tokenPayload
  });
});

router.post('/auth/switch-demo-role', (req, res) => {
  const { role } = req.body;
  const data = db.get();
  const user = data.users.find(u => u.role === role) || data.users[0];

  const tokenPayload = {
    id: user.id,
    username: user.username,
    role: user.role,
    fullName: user.fullName,
    badge: user.badge,
    email: user.email
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

  return res.json({
    success: true,
    token,
    user: tokenPayload
  });
});

router.get('/auth/me', (req, res) => {
  return res.json({ success: true, user: req.user });
});

// =========================================================================
// 2. DASHBOARD / SITUATIONAL OVERVIEW
// =========================================================================

router.get('/dashboard/stats', (req, res) => {
  const data = db.get();

  const totalAffected = data.incidents
    .filter(i => i.status !== 'RESOLVED')
    .reduce((sum, i) => sum + (Number(i.affectedPopulation) || 0), 0);

  const totalCampCapacity = data.camps.reduce((sum, c) => sum + (Number(c.capacity) || 0), 0);
  const totalCampOccupancy = data.camps.reduce((sum, c) => sum + (Number(c.currentOccupancy) || 0), 0);
  const campOccupancyRate = totalCampCapacity > 0 ? ((totalCampOccupancy / totalCampCapacity) * 100).toFixed(1) : 0;

  const totalVolunteers = data.volunteers.length;
  const availableVolunteers = data.volunteers.filter(v => v.status === 'AVAILABLE').length;
  const deployedVolunteers = totalVolunteers - availableVolunteers;

  const criticalVictims = data.victims.filter(v => v.condition === 'CRITICAL').length;
  const pendingSOS = data.emergencySOS.filter(s => !s.isResolved).length;
  const pendingCitizenRequests = (data.citizenRequests || []).filter(r => r.status !== 'DELIVERED').length;

  const totalFunds = data.donations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const lowStockItems = data.supplies.filter(s => s.quantity <= s.minThreshold).length;

  return res.json({
    success: true,
    data: {
      activeIncidentsCount: data.incidents.filter(i => i.status !== 'RESOLVED').length,
      totalIncidents: data.incidents.length,
      totalAffectedPopulation: totalAffected,
      activeSheltersCount: data.camps.length,
      totalCampCapacity,
      totalCampOccupancy,
      campOccupancyRate,
      registeredVictimsCount: data.victims.length,
      criticalVictimsCount: criticalVictims,
      totalVolunteers,
      availableVolunteers,
      deployedVolunteers,
      pendingSOSCount: pendingSOS,
      pendingCitizenRequestsCount: pendingCitizenRequests,
      totalFundsRaised: totalFunds,
      lowStockItemsCount: lowStockItems
    }
  });
});

// =========================================================================
// 3. STRANDED CITIZEN RELIEF REQUISITIONS & ITEM CATALOG
// =========================================================================

router.get('/relief-catalog', (req, res) => {
  const data = db.get();
  return res.json({ success: true, data: data.catalog || [] });
});

router.get('/citizen-requests', (req, res) => {
  const { phone, campId, status } = req.query;
  const data = db.get();
  let results = [...(data.citizenRequests || [])];

  if (phone) {
    const p = phone.replace(/[^0-9]/g, '');
    results = results.filter(r => r.phone && r.phone.replace(/[^0-9]/g, '').includes(p));
  }

  if (campId) {
    results = results.filter(r => r.nearestCampId === campId);
  }

  if (status) {
    results = results.filter(r => r.status === status);
  }

  return res.json({ success: true, data: results });
});

router.post('/citizen-requests', (req, res) => {
  const {
    citizenName,
    phone,
    currentLocation,
    nearestCampId,
    peopleCount,
    deliveryPreference,
    itemsNeeded,
    itemsNotNeeded,
    itemsSurplus,
    specialNotes,
    lat,
    lng,
    accuracyMeters,
    satelliteLocked
  } = req.body;

  if (!citizenName || !phone || !currentLocation || !nearestCampId) {
    return res.status(400).json({
      success: false,
      error: 'Name, Phone Number, Current Location, and Nearest Camp Selection are required'
    });
  }

  const data = db.get();
  const camp = data.camps.find(c => c.id === nearestCampId);
  const id = `REQ-${data.counters.citizenRequest++}`;

  const newRequest = {
    id,
    citizenName,
    phone,
    currentLocation,
    lat: lat ? parseFloat(lat) : 13.08 + (Math.random() * 0.06 - 0.03),
    lng: lng ? parseFloat(lng) : 80.26 + (Math.random() * 0.06 - 0.03),
    accuracyMeters: accuracyMeters ? parseFloat(accuracyMeters) : 10.0,
    satelliteLocked: Boolean(satelliteLocked),
    nearestCampId: camp ? camp.id : nearestCampId,
    nearestCampName: camp ? camp.name : 'Central Aid Depot',
    peopleCount: parseInt(peopleCount, 10) || 1,
    deliveryPreference: deliveryPreference || 'CAMP_PICKUP',
    itemsNeeded: Array.isArray(itemsNeeded) ? itemsNeeded : [],
    itemsNotNeeded: Array.isArray(itemsNotNeeded) ? itemsNotNeeded : [],
    itemsSurplus: Array.isArray(itemsSurplus) ? itemsSurplus : [],
    specialNotes: specialNotes || 'None',
    status: 'PENDING',
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
  };

  if (!data.citizenRequests) data.citizenRequests = [];
  data.citizenRequests.unshift(newRequest);
  db.save();

  return res.status(201).json({
    success: true,
    data: newRequest,
    message: `Your relief requisition #${id} has been recorded with GPS verification and routed to ${newRequest.nearestCampName}!`
  });
});

router.patch('/citizen-requests/:id/status', requireRoles(['admin', 'coordinator', 'volunteer']), (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['PENDING', 'PACKED', 'IN_TRANSIT', 'DELIVERED'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid requisition status' });
  }

  const data = db.get();
  const reqItem = (data.citizenRequests || []).find(r => r.id === id);
  if (!reqItem) {
    return res.status(404).json({ success: false, error: 'Requisition ID not found' });
  }

  reqItem.status = status;
  db.save();

  return res.json({ success: true, data: reqItem });
});

// =========================================================================
// 4. DISASTER INCIDENTS
// =========================================================================

router.get('/incidents', (req, res) => {
  const data = db.get();
  return res.json({ success: true, data: data.incidents });
});

router.post('/incidents', requireRoles(['admin', 'coordinator']), (req, res) => {
  const { type, location, severity, affectedPopulation, description, lat, lng } = req.body;

  if (!type || !location || !severity) {
    return res.status(400).json({ success: false, error: 'Type, Location, and Severity are required' });
  }

  const data = db.get();
  const id = `INC-${data.counters.incident++}`;

  const newIncident = {
    id,
    type: type.toUpperCase(),
    location,
    lat: lat ? parseFloat(lat) : 13.08 + (Math.random() * 0.08 - 0.04),
    lng: lng ? parseFloat(lng) : 80.27 + (Math.random() * 0.08 - 0.04),
    severity: severity.toUpperCase(),
    status: 'ACTIVE',
    affectedPopulation: parseInt(affectedPopulation, 10) || 0,
    reportedTime: new Date().toISOString().replace('T', ' ').substring(0, 16),
    description: description || 'No specific hazard notes provided.'
  };

  data.incidents.unshift(newIncident);
  db.save();

  return res.status(201).json({ success: true, data: newIncident });
});

router.patch('/incidents/:id/status', requireRoles(['admin', 'coordinator']), (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['ACTIVE', 'UNDER_CONTROL', 'RESOLVED'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid status' });
  }

  const data = db.get();
  const incident = data.incidents.find(i => i.id === id);
  if (!incident) {
    return res.status(404).json({ success: false, error: 'Incident not found' });
  }

  incident.status = status;
  db.save();

  return res.json({ success: true, data: incident });
});

// =========================================================================
// 5. RELIEF CAMPS & SHELTERS
// =========================================================================

router.get('/camps', (req, res) => {
  const data = db.get();
  return res.json({ success: true, data: data.camps });
});

router.post('/camps', requireRoles(['admin', 'coordinator']), (req, res) => {
  const { name, location, capacity, coordinator, contact, amenities, lat, lng } = req.body;

  if (!name || !location || !capacity) {
    return res.status(400).json({ success: false, error: 'Name, Location, and Capacity are required' });
  }

  const data = db.get();
  const id = `CAMP-${data.counters.camp++}`;

  const newCamp = {
    id,
    name,
    location,
    lat: lat ? parseFloat(lat) : 13.06 + (Math.random() * 0.08 - 0.04),
    lng: lng ? parseFloat(lng) : 80.24 + (Math.random() * 0.08 - 0.04),
    capacity: parseInt(capacity, 10),
    currentOccupancy: 0,
    coordinator: coordinator || 'Unassigned',
    contact: contact || '+1 (555) 000-0000',
    amenities: Array.isArray(amenities) ? amenities : ['Clean Drinking Water', 'First Aid Post']
  };

  data.camps.push(newCamp);
  db.save();

  return res.status(201).json({ success: true, data: newCamp });
});

// =========================================================================
// 6. EVACUEE & MISSING PERSON REGISTRY
// =========================================================================

router.get('/victims', (req, res) => {
  const { q, campId, condition } = req.query;
  const data = db.get();
  let results = [...data.victims];

  if (q) {
    const query = q.toLowerCase();
    results = results.filter(v =>
      v.name.toLowerCase().includes(query) ||
      (v.kinContact && v.kinContact.toLowerCase().includes(query)) ||
      v.id.toLowerCase().includes(query)
    );
  }

  if (campId) {
    results = results.filter(v => v.campId === campId);
  }

  if (condition) {
    results = results.filter(v => v.condition === condition);
  }

  return res.json({ success: true, data: results });
});

router.post('/victims', requireRoles(['admin', 'coordinator']), (req, res) => {
  const { name, age, gender, condition, campId, kinContact, specialNeeds } = req.body;

  if (!name || !campId) {
    return res.status(400).json({ success: false, error: 'Name and Camp Allocation are required' });
  }

  const data = db.get();
  const camp = data.camps.find(c => c.id === campId);
  if (!camp) {
    return res.status(400).json({ success: false, error: 'Selected relief camp does not exist' });
  }

  if (camp.currentOccupancy >= camp.capacity) {
    return res.status(400).json({ success: false, error: 'Selected relief camp is at 100% capacity' });
  }

  const id = `VIC-${data.counters.victim++}`;
  const newVictim = {
    id,
    name,
    age: parseInt(age, 10) || 0,
    gender: gender || 'Unspecified',
    condition: condition || 'STABLE',
    campId: camp.id,
    campName: camp.name,
    kinContact: kinContact || 'N/A',
    registeredAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    specialNeeds: specialNeeds || 'None'
  };

  camp.currentOccupancy += 1;
  data.victims.unshift(newVictim);
  db.save();

  return res.status(201).json({ success: true, data: newVictim });
});

// =========================================================================
// 7. RELIEF INVENTORY & AID SUPPLIES
// =========================================================================

router.get('/supplies', (req, res) => {
  const data = db.get();
  return res.json({ success: true, data: data.supplies });
});

router.post('/supplies/:id/replenish', requireRoles(['admin', 'coordinator']), (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;

  const qtyNum = parseInt(quantity, 10);
  if (!qtyNum || qtyNum <= 0) {
    return res.status(400).json({ success: false, error: 'Valid positive replenishment quantity required' });
  }

  const data = db.get();
  const item = data.supplies.find(s => s.id === id);
  if (!item) {
    return res.status(404).json({ success: false, error: 'Supply item not found' });
  }

  item.quantity += qtyNum;
  db.save();

  return res.json({ success: true, data: item });
});

router.post('/supplies/:id/dispatch', requireRoles(['admin', 'coordinator']), (req, res) => {
  const { id } = req.params;
  const { quantity, campId } = req.body;

  const qtyNum = parseInt(quantity, 10);
  if (!qtyNum || qtyNum <= 0) {
    return res.status(400).json({ success: false, error: 'Valid positive dispatch quantity required' });
  }

  const data = db.get();
  const item = data.supplies.find(s => s.id === id);
  const camp = data.camps.find(c => c.id === campId);

  if (!item) {
    return res.status(404).json({ success: false, error: 'Supply item not found' });
  }
  if (!camp) {
    return res.status(404).json({ success: false, error: 'Target relief camp not found' });
  }
  if (item.quantity < qtyNum) {
    return res.status(400).json({ success: false, error: `Insufficient stock. Warehouse only has ${item.quantity} ${item.unit}` });
  }

  item.quantity -= qtyNum;
  db.save();

  return res.json({
    success: true,
    data: item,
    message: `Successfully dispatched ${qtyNum} ${item.unit} to ${camp.name}`
  });
});

// =========================================================================
// 8. VOLUNTEER & RESCUE CORPS
// =========================================================================

router.get('/volunteers', (req, res) => {
  const data = db.get();
  return res.json({ success: true, data: data.volunteers });
});

router.post('/volunteers', (req, res) => {
  const { name, skill, phone } = req.body;
  if (!name || !skill || !phone) {
    return res.status(400).json({ success: false, error: 'Name, Skill specialization, and Phone are required' });
  }

  const data = db.get();
  const id = `VOL-${data.counters.volunteer++}`;

  const newVolunteer = {
    id,
    name,
    skill,
    phone,
    status: 'AVAILABLE',
    assignedLocation: 'Base HQ',
    registeredDate: new Date().toISOString().substring(0, 10)
  };

  data.volunteers.push(newVolunteer);
  db.save();

  return res.status(201).json({ success: true, data: newVolunteer });
});

router.post('/volunteers/:id/deploy', requireRoles(['admin', 'coordinator']), (req, res) => {
  const { id } = req.params;
  const { location } = req.body;

  if (!location) {
    return res.status(400).json({ success: false, error: 'Deployment location is required' });
  }

  const data = db.get();
  const vol = data.volunteers.find(v => v.id === id);
  if (!vol) {
    return res.status(404).json({ success: false, error: 'Volunteer not found' });
  }

  vol.status = 'DEPLOYED';
  vol.assignedLocation = location;
  db.save();

  return res.json({ success: true, data: vol });
});

router.post('/volunteers/:id/recall', requireRoles(['admin', 'coordinator']), (req, res) => {
  const { id } = req.params;
  const data = db.get();
  const vol = data.volunteers.find(v => v.id === id);
  if (!vol) {
    return res.status(404).json({ success: false, error: 'Volunteer not found' });
  }

  vol.status = 'AVAILABLE';
  vol.assignedLocation = 'Base HQ';
  db.save();

  return res.json({ success: true, data: vol });
});

// =========================================================================
// 9. EMERGENCY SOS & 911 DISTRESS CALLS WITH GPS / SATELLITE TELEMETRY
// =========================================================================

// POST /api/upload (Upload disaster ground photo to Cloudinary)
router.post('/upload', async (req, res) => {
  const { image, folder } = req.body;
  if (!image) {
    return res.status(400).json({ success: false, error: 'Image data (base64 or URL) is required' });
  }

  const uploadResult = await uploadToCloudinary(image, folder || 'disaster_relief_evidence');
  if (uploadResult.success) {
    return res.json({
      success: true,
      url: uploadResult.url,
      publicId: uploadResult.publicId
    });
  } else {
    return res.status(500).json({
      success: false,
      error: uploadResult.error || 'Failed to upload image to Cloudinary'
    });
  }
});

router.get('/sos', (req, res) => {
  const data = db.get();
  return res.json({ success: true, data: data.emergencySOS });
});

router.post('/sos', (req, res) => {
  const {
    location,
    callerName,
    contact,
    peopleTrapped,
    urgency,
    description,
    lat,
    lng,
    accuracyMeters,
    satelliteLocked,
    altitude,
    imageUrl
  } = req.body;

  if (!location || !callerName || !contact) {
    return res.status(400).json({ success: false, error: 'Location, Name, and Contact Phone are required for rescue dispatch' });
  }

  const data = db.get();
  const id = `SOS-${data.counters.sos++}`;

  const newSOS = {
    id,
    location,
    lat: lat ? parseFloat(lat) : 13.085 + (Math.random() * 0.04 - 0.02),
    lng: lng ? parseFloat(lng) : 80.265 + (Math.random() * 0.04 - 0.02),
    accuracyMeters: accuracyMeters ? parseFloat(accuracyMeters) : 8.5,
    altitude: altitude ? parseFloat(altitude) : 12.0,
    satelliteLocked: Boolean(satelliteLocked),
    imageUrl: imageUrl || null,
    callerName,
    contact,
    peopleTrapped: parseInt(peopleTrapped, 10) || 1,
    urgency: urgency ? urgency.toUpperCase() : 'HIGH',
    description: description || 'Immediate rescue required',
    isResolved: false,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
  };

  data.emergencySOS.unshift(newSOS);
  db.save();

  return res.status(201).json({
    success: true,
    data: newSOS,
    message: `SOS received with GPS Satellite lock [Lat: ${newSOS.lat.toFixed(4)}, Lng: ${newSOS.lng.toFixed(4)}]! Dispatched to first responders.`
  });
});

router.patch('/sos/:id/resolve', requireRoles(['admin', 'coordinator', 'volunteer']), (req, res) => {
  const { id } = req.params;
  const data = db.get();
  const sos = data.emergencySOS.find(s => s.id === id);

  if (!sos) {
    return res.status(404).json({ success: false, error: 'SOS record not found' });
  }

  sos.isResolved = true;
  db.save();

  return res.json({ success: true, data: sos });
});

// =========================================================================
// 10. RELIEF AID & DONATIONS
// =========================================================================

router.get('/donations', (req, res) => {
  const data = db.get();
  return res.json({
    success: true,
    totalFunds: data.donations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0),
    data: data.donations
  });
});

router.post('/donations', (req, res) => {
  const { donorName, amount, purpose } = req.body;

  const amtNum = parseFloat(amount);
  if (!donorName || !amtNum || amtNum <= 0) {
    return res.status(400).json({ success: false, error: 'Donor Name and a valid positive amount are required' });
  }

  const data = db.get();
  const id = `DON-${data.counters.donation++}`;
  const txRef = 'TXN-' + Math.random().toString(36).substring(2, 9).toUpperCase();

  const newDonation = {
    id,
    donorName,
    amount: amtNum,
    purpose: purpose || 'General Disaster Relief Fund',
    date: new Date().toISOString().replace('T', ' ').substring(0, 16),
    txRef
  };

  data.donations.unshift(newDonation);
  db.save();

  return res.status(201).json({
    success: true,
    data: newDonation,
    message: `Thank you, ${donorName}! Your donation of $${amtNum.toLocaleString()} has been allocated to emergency relief.`
  });
});

// =========================================================================
// 11. BULK DATA EXPORT (CSV / JSON) FOR DISASTER AUDITING & DISPATCH
// =========================================================================

router.get('/export/:resource', (req, res) => {
  const { resource } = req.params;
  const { format = 'json' } = req.query;
  const data = db.get();

  let records = [];
  let filename = `drms-${resource}-${new Date().toISOString().slice(0, 10)}`;

  switch (resource) {
    case 'incidents':
      records = data.incidents || [];
      break;
    case 'camps':
      records = data.camps || [];
      break;
    case 'victims':
      records = data.victims || [];
      break;
    case 'supplies':
      records = data.supplies || [];
      break;
    case 'volunteers':
      records = data.volunteers || [];
      break;
    case 'sos':
      records = data.emergencySOS || [];
      break;
    case 'citizen-requests':
      records = data.citizenRequests || [];
      break;
    case 'donations':
      records = data.donations || [];
      break;
    default:
      return res.status(400).json({ success: false, error: 'Invalid resource for export' });
  }

  if (format === 'csv') {
    if (records.length === 0) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      return res.send('');
    }

    // Extract headers
    const sample = records[0];
    const headers = Object.keys(sample).filter(k => typeof sample[k] !== 'object' || sample[k] === null);
    const csvRows = [headers.join(',')];

    for (const row of records) {
      const values = headers.map(header => {
        let val = row[header];
        if (val === null || val === undefined) return '""';
        const strVal = String(val).replace(/"/g, '""');
        return `"${strVal}"`;
      });
      csvRows.push(values.join(','));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
    return res.send(csvRows.join('\r\n'));
  }

  // Default JSON export
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
  return res.json({ success: true, count: records.length, exportedAt: new Date().toISOString(), data: records });
});

module.exports = router;
