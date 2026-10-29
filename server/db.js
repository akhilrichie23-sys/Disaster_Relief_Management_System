const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_FILE = path.join(__dirname, 'data_store.json');

const RELIEF_ITEMS_CATALOG = [
  { id: 'CAT-FOOD-1', category: 'Food & Nutrition', name: 'Ready-to-Eat Food Ration Packs', unit: 'Packs', defaultQty: 3 },
  { id: 'CAT-FOOD-2', category: 'Food & Nutrition', name: 'Baby Food & Infant Formula', unit: 'Cans', defaultQty: 2 },
  { id: 'CAT-FOOD-3', category: 'Food & Nutrition', name: 'High-Energy Protein Biscuits', unit: 'Packets', defaultQty: 4 },
  { id: 'CAT-FOOD-4', category: 'Food & Nutrition', name: 'Dry Grains & Ready Cereals', unit: 'Kg', defaultQty: 5 },
  
  { id: 'CAT-WATER-1', category: 'Water & Hydration', name: 'Potable Bottled Mineral Water (5L)', unit: 'Bottles', defaultQty: 4 },
  { id: 'CAT-WATER-2', category: 'Water & Hydration', name: 'Water Purification Chlorine Tablets', unit: 'Strips', defaultQty: 2 },
  { id: 'CAT-WATER-3', category: 'Water & Hydration', name: 'Oral Rehydration Salts (ORS)', unit: 'Sachets', defaultQty: 6 },
  
  { id: 'CAT-MED-1', category: 'Medical & First Aid', name: 'Emergency Trauma & First Aid Kit', unit: 'Kits', defaultQty: 1 },
  { id: 'CAT-MED-2', category: 'Medical & First Aid', name: 'Insulin Vials & Syringes (Diabetic)', unit: 'Vials', defaultQty: 2 },
  { id: 'CAT-MED-3', category: 'Medical & First Aid', name: 'Pain Relief & Paracetamol Packs', unit: 'Strips', defaultQty: 2 },
  { id: 'CAT-MED-4', category: 'Medical & First Aid', name: 'Asthma Inhalers (Salbutamol)', unit: 'Units', defaultQty: 1 },
  
  { id: 'CAT-SHELTER-1', category: 'Shelter & Warmth', name: 'Thermal Insulation Blankets', unit: 'Units', defaultQty: 3 },
  { id: 'CAT-SHELTER-2', category: 'Shelter & Warmth', name: 'Waterproof Rain Ponchos & Tarps', unit: 'Units', defaultQty: 2 },
  { id: 'CAT-SHELTER-3', category: 'Shelter & Warmth', name: 'Inflatable Sleeping Mats', unit: 'Mats', defaultQty: 2 },
  
  { id: 'CAT-HYG-1', category: 'Hygiene & Care', name: 'Sanitary Napkins / Menstrual Care', unit: 'Packs', defaultQty: 3 },
  { id: 'CAT-HYG-2', category: 'Hygiene & Care', name: 'Infant Diapers (Medium/Large)', unit: 'Packs', defaultQty: 2 },
  { id: 'CAT-HYG-3', category: 'Hygiene & Care', name: 'Sanitation Soap & Antiseptic Disinfectant', unit: 'Bottles', defaultQty: 2 },
  
  { id: 'CAT-POWER-1', category: 'Power & Light', name: 'Solar LED Flashlight & Emergency Lantern', unit: 'Units', defaultQty: 1 },
  { id: 'CAT-POWER-2', category: 'Power & Light', name: 'Pre-charged USB Power Bank', unit: 'Units', defaultQty: 1 }
];

// Default Seed Dataset
function generateDefaultData() {
  const salt = bcrypt.genSaltSync(10);
  return {
    users: [
      {
        id: 'USR-001',
        username: 'commander',
        passwordHash: bcrypt.hashSync('Commander@2026', salt),
        fullName: 'General Arthur Vance',
        role: 'admin',
        badge: 'Incident Commander',
        email: 'commander@relief.gov'
      },
      {
        id: 'USR-002',
        username: 'coordinator',
        passwordHash: bcrypt.hashSync('Coord@2026', salt),
        fullName: 'Dr. Sarah Jenkins',
        role: 'coordinator',
        badge: 'Camp Coordinator',
        email: 'sjenkins@relief.gov'
      },
      {
        id: 'USR-003',
        username: 'responder',
        passwordHash: bcrypt.hashSync('Responder@2026', salt),
        fullName: 'Capt. David Miller',
        role: 'volunteer',
        badge: 'Search & Rescue Lead',
        email: 'dmiller@rescue.org'
      },
      {
        id: 'USR-004',
        username: 'citizen',
        passwordHash: bcrypt.hashSync('Citizen@2026', salt),
        fullName: 'Civic Member',
        role: 'public',
        badge: 'Citizen Access',
        email: 'citizen@public.net'
      }
    ],
    catalog: RELIEF_ITEMS_CATALOG,
    incidents: [
      {
        id: 'INC-101',
        type: 'FLOOD',
        location: 'River Valley, Sector 4',
        lat: 13.0827,
        lng: 80.2707,
        severity: 'CRITICAL',
        status: 'ACTIVE',
        affectedPopulation: 1200,
        reportedTime: '2026-09-17 08:30',
        description: 'Severe riverbank overflow caused by heavy monsoon downpours. Multiple residential clusters submerged.'
      },
      {
        id: 'INC-102',
        type: 'EARTHQUAKE',
        location: 'North Ridge Zone',
        lat: 13.1200,
        lng: 80.2100,
        severity: 'HIGH',
        status: 'ACTIVE',
        affectedPopulation: 850,
        reportedTime: '2026-09-17 09:15',
        description: 'Magnitude 5.8 seismic tremor resulting in structural fissures and building evacuations.'
      },
      {
        id: 'INC-103',
        type: 'LANDSLIDE',
        location: 'Hilltop Pass Road',
        lat: 13.0300,
        lng: 80.1800,
        severity: 'MEDIUM',
        status: 'UNDER_CONTROL',
        affectedPopulation: 150,
        reportedTime: '2026-09-17 09:45',
        description: 'Debris blockage on arterial highway. Road clearance operations currently underway.'
      }
    ],
    camps: [
      {
        id: 'CAMP-201',
        name: 'City Civic Arena Shelter',
        location: 'Downtown Sector 1',
        lat: 13.0600,
        lng: 80.2500,
        capacity: 500,
        currentOccupancy: 142,
        coordinator: 'Col. Robert Vance',
        contact: '+1 (555) 987-6541',
        amenities: ['Power Generator', 'Field Hospital', 'Clean Kitchen', 'WiFi Beacon']
      },
      {
        id: 'CAMP-202',
        name: 'St. Jude Community Hall',
        location: 'North Ridge Suburb',
        lat: 13.1100,
        lng: 80.2300,
        capacity: 300,
        currentOccupancy: 95,
        coordinator: 'Dr. Sarah Jenkins',
        contact: '+1 (555) 987-6542',
        amenities: ['Pediatric Unit', 'Potable Water Tanks', 'Blanket Store']
      },
      {
        id: 'CAMP-203',
        name: 'Govt High School Grounds',
        location: 'Eastern Safe Zone',
        lat: 13.0200,
        lng: 80.2400,
        capacity: 450,
        currentOccupancy: 88,
        coordinator: 'Mark Sullivan',
        contact: '+1 (555) 987-6543',
        amenities: ['Helipad Access', 'Community Kitchen', 'Sanitation Blocks']
      }
    ],
    victims: [
      {
        id: 'VIC-301',
        name: 'John Anderson',
        age: 42,
        gender: 'Male',
        condition: 'STABLE',
        campId: 'CAMP-201',
        campName: 'City Civic Arena Shelter',
        kinContact: 'Martha Anderson (+1 555-0192)',
        registeredAt: '2026-09-17 08:50',
        specialNeeds: 'None'
      },
      {
        id: 'VIC-302',
        name: 'Maria Gonzalez',
        age: 28,
        gender: 'Female',
        condition: 'INJURED',
        campId: 'CAMP-201',
        campName: 'City Civic Arena Shelter',
        kinContact: 'Carlos Gonzalez (+1 555-0193)',
        registeredAt: '2026-09-17 09:10',
        specialNeeds: 'Left leg fracture dressing required'
      },
      {
        id: 'VIC-303',
        name: 'Arthur Pendelton',
        age: 76,
        gender: 'Male',
        condition: 'CRITICAL',
        campId: 'CAMP-202',
        campName: 'St. Jude Community Hall',
        kinContact: 'Elena Pendelton (+1 555-0194)',
        registeredAt: '2026-09-17 09:30',
        specialNeeds: 'Insulin dependence, respiratory monitoring'
      },
      {
        id: 'VIC-304',
        name: 'Maya Lin',
        age: 8,
        gender: 'Female',
        condition: 'STABLE',
        campId: 'CAMP-203',
        campName: 'Govt High School Grounds',
        kinContact: 'David Lin (+1 555-0195)',
        registeredAt: '2026-09-17 10:00',
        specialNeeds: 'Pediatric care'
      }
    ],
    supplies: [
      {
        id: 'FOOD-1',
        name: 'Ready-to-Eat Ration Packs',
        category: 'FOOD_RATIONS',
        quantity: 1450,
        unit: 'Meals',
        minThreshold: 300,
        warehouse: 'Central Depot A'
      },
      {
        id: 'WATER-1',
        name: 'Potable Mineral Water (5L)',
        category: 'DRINKING_WATER',
        quantity: 2150,
        unit: 'Bottles',
        minThreshold: 500,
        warehouse: 'Central Depot A'
      },
      {
        id: 'MED-1',
        name: 'Emergency Trauma & First Aid',
        category: 'MEDICAL_KITS',
        quantity: 420,
        unit: 'Kits',
        minThreshold: 100,
        warehouse: 'Medical Bay Alpha'
      },
      {
        id: 'TENT-1',
        name: 'Thermal Blankets & Tents',
        category: 'TENTS_BLANKETS',
        quantity: 780,
        unit: 'Sets',
        minThreshold: 150,
        warehouse: 'Logistics Depot B'
      },
      {
        id: 'HYG-1',
        name: 'Sanitation & Hygiene Packs',
        category: 'HYGIENE_KITS',
        quantity: 590,
        unit: 'Packs',
        minThreshold: 120,
        warehouse: 'Logistics Depot B'
      }
    ],
    volunteers: [
      {
        id: 'VOL-401',
        name: 'Capt. David Miller',
        skill: 'SEARCH_AND_RESCUE',
        phone: '+1 (555) 321-4567',
        status: 'DEPLOYED',
        assignedLocation: 'River Valley, Sector 4',
        registeredDate: '2026-09-15'
      },
      {
        id: 'VOL-402',
        name: 'Dr. Emily Watson',
        skill: 'MEDICAL_FIRST_RESPONDER',
        phone: '+1 (555) 321-4568',
        status: 'AVAILABLE',
        assignedLocation: 'Base HQ',
        registeredDate: '2026-09-16'
      },
      {
        id: 'VOL-403',
        name: 'Carlos Rivera',
        skill: 'LOGISTICS_SUPPLY',
        phone: '+1 (555) 321-4569',
        status: 'AVAILABLE',
        assignedLocation: 'Base HQ',
        registeredDate: '2026-09-16'
      },
      {
        id: 'VOL-404',
        name: 'Aisha Khan',
        skill: 'FOOD_DISTRIBUTION',
        phone: '+1 (555) 321-4570',
        status: 'DEPLOYED',
        assignedLocation: 'City Civic Arena Shelter',
        registeredDate: '2026-09-17'
      },
      {
        id: 'VOL-405',
        name: 'Nisha Sharma',
        skill: 'PSYCHOSOCIAL_SUPPORT',
        phone: '+1 (555) 321-4571',
        status: 'AVAILABLE',
        assignedLocation: 'Base HQ',
        registeredDate: '2026-09-17'
      }
    ],
    emergencySOS: [
      {
        id: 'SOS-601',
        location: 'Sector 4 Bridge East',
        lat: 13.0850,
        lng: 80.2750,
        callerName: 'Samuel Green',
        contact: '+1 (555) 900-1111',
        peopleTrapped: 5,
        urgency: 'CRITICAL',
        description: 'Rapidly rising water levels touching residential rooftop. Elderly citizen stranded.',
        isResolved: false,
        timestamp: '2026-09-17 09:20:15'
      },
      {
        id: 'SOS-602',
        location: 'Ridge View Apts Block C',
        lat: 13.1180,
        lng: 80.2150,
        callerName: 'Karen Taylor',
        contact: '+1 (555) 900-2222',
        peopleTrapped: 3,
        urgency: 'HIGH',
        description: 'Stairwell partially obstructed after quake tremor. Need evacuation assistance.',
        isResolved: false,
        timestamp: '2026-09-17 09:55:40'
      }
    ],
    citizenRequests: [
      {
        id: 'REQ-701',
        citizenName: 'Deepak Sharma',
        phone: '+1 (555) 777-1001',
        currentLocation: 'Sector 4 Flood Plain, Near Temple Gate',
        nearestCampId: 'CAMP-201',
        nearestCampName: 'City Civic Arena Shelter',
        peopleCount: 4,
        deliveryPreference: 'CAMP_PICKUP',
        itemsNeeded: [
          { name: 'Potable Bottled Mineral Water (5L)', quantity: 4, category: 'Water & Hydration' },
          { name: 'Baby Food & Infant Formula', quantity: 2, category: 'Food & Nutrition' },
          { name: 'Insulin Vials & Syringes (Diabetic)', quantity: 1, category: 'Medical & First Aid' }
        ],
        itemsNotNeeded: [
          'Ready-to-Eat Food Ration Packs (We have dry biscuits)',
          'Thermal Insulation Blankets (We have shelter covers)'
        ],
        itemsSurplus: [
          { name: 'Extra Flashlight Batteries (AA)', quantity: 8 }
        ],
        status: 'IN_TRANSIT',
        specialNotes: 'Grandmother needs insulin kept cool if possible.',
        timestamp: '2026-09-17 09:40:00'
      },
      {
        id: 'REQ-702',
        citizenName: 'Elena Rostova',
        phone: '+1 (555) 777-1002',
        currentLocation: 'North Ridge Suburb Block 4',
        nearestCampId: 'CAMP-202',
        nearestCampName: 'St. Jude Community Hall',
        peopleCount: 2,
        deliveryPreference: 'DOORSTEP_DELIVERY',
        itemsNeeded: [
          { name: 'Emergency Trauma & First Aid Kit', quantity: 1, category: 'Medical & First Aid' },
          { name: 'Sanitary Napkins / Menstrual Care', quantity: 2, category: 'Hygiene & Care' },
          { name: 'Solar LED Flashlight & Emergency Lantern', quantity: 1, category: 'Power & Light' }
        ],
        itemsNotNeeded: [
          'Potable Bottled Mineral Water (We have boiling source)'
        ],
        itemsSurplus: [],
        status: 'PACKED',
        specialNotes: 'Elderly neighbor with minor scrapes.',
        timestamp: '2026-09-17 10:05:00'
      }
    ],
    donations: [
      {
        id: 'DON-501',
        donorName: 'Global Humanitarian Relief Trust',
        amount: 50000.00,
        purpose: 'Emergency Food Rations & Trauma Care Kits',
        date: '2026-09-17 08:00',
        txRef: 'TXN-GLB-9981'
      },
      {
        id: 'DON-502',
        donorName: 'Red Cross Partner Alliance',
        amount: 25000.00,
        purpose: 'Camp Power Generation & Shelter Upgrades',
        date: '2026-09-17 08:45',
        txRef: 'TXN-RC-4412'
      },
      {
        id: 'DON-503',
        donorName: 'Civic Tech Community Fund',
        amount: 5000.00,
        purpose: 'Communication beacons and volunteer logistics',
        date: '2026-09-17 09:30',
        txRef: 'TXN-CTC-1082'
      }
    ],
    counters: {
      incident: 104,
      camp: 204,
      victim: 305,
      volunteer: 406,
      donation: 504,
      sos: 603,
      citizenRequest: 703
    }
  };
}

class Database {
  constructor() {
    this.data = null;
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(raw);
        if (!this.data.catalog) {
          this.data.catalog = RELIEF_ITEMS_CATALOG;
        }
        if (!this.data.citizenRequests) {
          this.data.citizenRequests = [];
        }
        if (!this.data.counters.citizenRequest) {
          this.data.counters.citizenRequest = 701;
        }
      } else {
        this.data = generateDefaultData();
        this.save();
      }
    } catch (e) {
      console.error('Error loading DB, resetting to defaults:', e);
      this.data = generateDefaultData();
      this.save();
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (e) {
      console.error('Error saving DB file:', e);
    }
  }

  get() {
    return this.data;
  }
}

const dbInstance = new Database();
module.exports = dbInstance;
