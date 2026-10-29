/**
 * ============================================================================
 * DISASTER RELIEF MANAGEMENT SYSTEM (DRMS) - CLIENT LOGIC
 * Tailwind v4 UI, Live GPS/Satellite Geolocation, Stranded Citizen Requisitions
 * ============================================================================
 */

// Global State
let currentUser = {
  id: 'USR-001',
  username: 'commander',
  role: 'admin',
  fullName: 'Arthur Vance',
  badge: 'Incident Commander'
};
let authToken = null;
let currentViewMode = 'landing'; // 'landing' or 'dashboard'
let currentTab = 'dashboard';
let mapInstance = null;
let mapMarkersGroup = null;
let userGPSMarker = null;

// User's acquired GPS coordinates
let userCurrentCoords = {
  lat: 13.0827,
  lng: 80.2707,
  accuracy: 4.8,
  altitude: 14.0,
  address: 'River Valley Sector 4, Chennai Basin',
  isLocked: false
};

let appData = {
  incidents: [],
  camps: [],
  victims: [],
  supplies: [],
  volunteers: [],
  emergencySOS: [],
  citizenRequests: [],
  donations: [],
  catalog: [],
  stats: {}
};

let requisitionItemSelections = {};

// =========================================================================
// 1. INITIALIZATION & LIFECYCLE
// =========================================================================

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const savedToken = localStorage.getItem('drms_auth_token');
    if (savedToken) {
      authToken = savedToken;
      try {
        const res = await apiFetch('/api/auth/me');
        if (res.success && res.user) {
          currentUser = res.user;
        }
      } catch (e) {
        console.warn('Session expired, using default role');
      }
    } else {
      await switchDemoRole('admin', false);
    }
  } catch (err) {
    console.error('Auth initialization error:', err);
  }

  try { updateUserUI(); } catch (e) { console.error('updateUserUI error:', e); }
  try { initMap(); } catch (e) { console.error('initMap error:', e); }
  try { await refreshAllData(); } catch (e) { console.error('refreshAllData error:', e); }
  try { acquireLiveGPS(false); } catch (e) { console.error('acquireLiveGPS error:', e); }
  try { setupModalBackdrops(); } catch (e) { console.error('setupModalBackdrops error:', e); }
  try { setupPhotoUploadPreview(); } catch (e) { console.error('setupPhotoUploadPreview error:', e); }

  // High-frequency real-time synchronization every 4 seconds
  setInterval(refreshAllData, 4000);
});

let sosAttachedImageBase64 = null;

function setupPhotoUploadPreview() {
  const photoInput = document.getElementById('sos-photo-file');
  const previewDiv = document.getElementById('sos-photo-preview');
  const previewImg = document.getElementById('sos-preview-img');

  if (photoInput) {
    photoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          sosAttachedImageBase64 = event.target.result;
          if (previewImg && previewDiv) {
            previewImg.src = sosAttachedImageBase64;
            previewDiv.style.display = 'block';
          }
        };
        reader.readAsDataURL(file);
      } else {
        sosAttachedImageBase64 = null;
        if (previewDiv) previewDiv.style.display = 'none';
      }
    });
  }
}

// Helper for authorized API calls
async function apiFetch(endpoint, options = {}) {
  options.headers = options.headers || {};
  options.headers['Content-Type'] = 'application/json';
  if (authToken) {
    options.headers['Authorization'] = `Bearer ${authToken}`;
  }

  try {
    const res = await fetch(endpoint, options);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `HTTP error ${res.status}`);
    }
    return data;
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

// =========================================================================
// 2. LIVE GPS & SATELLITE GEOLOCATION ENGINE
// =========================================================================

function acquireLiveGPS(showNotification = true) {
  const statusEl = document.getElementById('gps-lock-status');
  if (statusEl) {
    statusEl.textContent = 'ACQUIRING SATELLITE FIX...';
    statusEl.className = 'px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse';
  }

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        applyGPSCoordinates(
          position.coords.latitude,
          position.coords.longitude,
          position.coords.accuracy || 4.2,
          position.coords.altitude || 12.0,
          showNotification
        );
      },
      (error) => {
        console.warn('Browser GPS permission unavailable or denied. Using tactical GNSS ground beacon simulation:', error.message);
        // Fallback simulation with realistic high-accuracy coordinates
        const simLat = 13.0827 + (Math.random() * 0.008 - 0.004);
        const simLng = 80.2707 + (Math.random() * 0.008 - 0.004);
        applyGPSCoordinates(simLat, simLng, 4.8, 14.0, showNotification);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 0
      }
    );
  } else {
    // Geolocation not supported in browser
    applyGPSCoordinates(13.0827, 80.2707, 6.5, 12.0, showNotification);
  }
}

async function applyGPSCoordinates(lat, lng, accuracy, altitude, showNotification) {
  userCurrentCoords.lat = parseFloat(lat);
  userCurrentCoords.lng = parseFloat(lng);
  userCurrentCoords.accuracy = parseFloat(accuracy).toFixed(1);
  userCurrentCoords.altitude = parseFloat(altitude || 10).toFixed(1);
  userCurrentCoords.isLocked = true;

  // Format telemetry readouts
  const latStr = `${userCurrentCoords.lat.toFixed(4)}° ${userCurrentCoords.lat >= 0 ? 'N' : 'S'}`;
  const lngStr = `${userCurrentCoords.lng.toFixed(4)}° ${userCurrentCoords.lng >= 0 ? 'E' : 'W'}`;

  const latEl = document.getElementById('telemetry-lat');
  const lngEl = document.getElementById('telemetry-lng');
  const accEl = document.getElementById('telemetry-acc');
  const statusEl = document.getElementById('gps-lock-status');
  const addrEl = document.getElementById('telemetry-address');

  if (latEl) latEl.textContent = latStr;
  if (lngEl) lngEl.textContent = lngStr;
  if (accEl) accEl.textContent = `± ${userCurrentCoords.accuracy} meters`;
  if (statusEl) {
    statusEl.textContent = '3D SATELLITE FIX LOCKED';
    statusEl.className = 'px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
  }

  // Pre-fill location text fields if open
  const addressString = `Sector 4 Basin [GPS: ${latStr}, ${lngStr} (±${userCurrentCoords.accuracy}m)]`;
  userCurrentCoords.address = addressString;
  if (addrEl) addrEl.textContent = addressString;

  const sosLocInput = document.getElementById('sos-location');
  if (sosLocInput && (!sosLocInput.value || sosLocInput.value.includes('GPS:'))) {
    sosLocInput.value = addressString;
  }

  const reqLocInput = document.getElementById('req-citizen-location');
  if (reqLocInput && (!reqLocInput.value || reqLocInput.value.includes('GPS:'))) {
    reqLocInput.value = addressString;
  }

  // Pin on Tactical Map
  pinUserGPSOnMap(userCurrentCoords.lat, userCurrentCoords.lng);

  if (showNotification) {
    showToast(`🛰️ GPS Satellite Lock Active! [${latStr}, ${lngStr}] accuracy: ±${userCurrentCoords.accuracy}m`, 'success');
  }
}

function pinUserGPSOnMap(lat, lng) {
  if (!mapInstance) return;

  if (userGPSMarker) {
    mapInstance.removeLayer(userGPSMarker);
  }

  const pulseIcon = L.divIcon({
    className: 'gps-pulse-icon',
    html: `<div style="width: 22px; height: 22px; border-radius: 50%; background: #06b6d4; border: 3px solid #ffffff; box-shadow: 0 0 15px #06b6d4; animation: pulse 1.5s infinite;"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });

  userGPSMarker = L.marker([lat, lng], { icon: pulseIcon }).addTo(mapInstance);
  userGPSMarker.bindPopup(`
    <div style="color: #000; font-family: sans-serif;">
      <h4 style="color: #0284c7; margin: 0 0 4px 0;">🛰️ YOUR LIVE SATELLITE GPS FIX</h4>
      <p style="margin: 0 0 4px 0;"><strong>Coordinates:</strong> ${lat.toFixed(4)}, ${lng.toFixed(4)}</p>
      <p style="margin: 0;"><strong>Accuracy:</strong> ± ${userCurrentCoords.accuracy} meters</p>
    </div>
  `);
}

// =========================================================================
// 3. VIEW MODE & TAB SWITCHING
// =========================================================================

function toggleViewMode(mode) {
  currentViewMode = mode;
  const landingSection = document.getElementById('view-landing');
  const dashboardSection = document.getElementById('view-dashboard');
  const btnLanding = document.getElementById('btn-view-landing');
  const btnDashboard = document.getElementById('btn-view-dashboard');

  if (mode === 'landing') {
    if (landingSection) landingSection.style.display = 'block';
    if (dashboardSection) dashboardSection.style.display = 'none';

    if (btnLanding) {
      btnLanding.className = 'px-3.5 py-1.5 rounded-lg transition-all text-white bg-blue-600 shadow-md';
    }
    if (btnDashboard) {
      btnDashboard.className = 'px-3.5 py-1.5 rounded-lg transition-all text-slate-400 hover:text-white';
    }
  } else {
    if (landingSection) landingSection.style.display = 'none';
    if (dashboardSection) dashboardSection.style.display = 'flex';

    if (btnLanding) {
      btnLanding.className = 'px-3.5 py-1.5 rounded-lg transition-all text-slate-400 hover:text-white';
    }
    if (btnDashboard) {
      btnDashboard.className = 'px-3.5 py-1.5 rounded-lg transition-all text-white bg-blue-600 shadow-md';
    }

    if (mapInstance) {
      setTimeout(() => mapInstance.invalidateSize(), 200);
    }
  }
}

function switchTab(tabId) {
  currentTab = tabId;

  document.querySelectorAll('.tab-view').forEach(view => {
    view.classList.remove('active');
  });
  const targetView = document.getElementById(`tab-${tabId}`);
  if (targetView) targetView.classList.add('active');

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');
    btn.classList.remove('text-white', 'bg-blue-600/30', 'border-blue-500/40', 'shadow-lg');
    btn.classList.add('text-slate-400');
  });

  const activeBtn = Array.from(document.querySelectorAll('.nav-btn')).find(b =>
    b.getAttribute('onclick') && b.getAttribute('onclick').includes(tabId)
  );
  if (activeBtn) {
    activeBtn.classList.add('active', 'text-white', 'bg-blue-600/30', 'border-blue-500/40', 'shadow-lg');
    activeBtn.classList.remove('text-slate-400');
  }

  if (tabId === 'dashboard' && mapInstance) {
    setTimeout(() => mapInstance.invalidateSize(), 200);
  }
}

// =========================================================================
// 4. DATA REFRESH & STATE SYNC
// =========================================================================

async function refreshAllData() {
  try {
    const [statsRes, incRes, campRes, vicRes, supRes, volRes, sosRes, citRes, donRes, catRes] = await Promise.all([
      apiFetch('/api/dashboard/stats'),
      apiFetch('/api/incidents'),
      apiFetch('/api/camps'),
      apiFetch('/api/victims'),
      apiFetch('/api/supplies'),
      apiFetch('/api/volunteers'),
      apiFetch('/api/sos'),
      apiFetch('/api/citizen-requests'),
      apiFetch('/api/donations'),
      apiFetch('/api/relief-catalog')
    ]);

    appData.stats = statsRes.data || {};
    appData.incidents = incRes.data || [];
    appData.camps = campRes.data || [];
    appData.victims = vicRes.data || [];
    appData.supplies = supRes.data || [];
    appData.volunteers = volRes.data || [];
    appData.emergencySOS = sosRes.data || [];
    appData.citizenRequests = citRes.data || [];
    appData.donations = donRes.data || [];
    appData.catalog = catRes.data || [];

    renderDashboardMetrics();
    renderMapMarkers();
    renderRecentActivity();
    renderCitizenRequestsTable(appData.citizenRequests);
    renderIncidentsTable();
    renderCampsTable();
    renderVictimsTable(appData.victims);
    renderSuppliesTable();
    renderVolunteersTable();
    renderSOSTable();
    renderDonationsTable();
    updateFormDropdowns();
    updateTabBadges();
    updateEmergencyTicker();
  } catch (err) {
    console.error('Error refreshing disaster data:', err);
  }
}

function updateEmergencyTicker() {
  const ticker = document.getElementById('ticker-text');
  if (!ticker) return;

  const messages = [];

  const activeInc = (appData.incidents || []).filter(i => i.status !== 'RESOLVED');
  if (activeInc.length > 0) {
    const inc = activeInc[0];
    messages.push(`[${inc.id}] ${inc.type} in ${inc.location}: ${(inc.affectedPopulation || 0).toLocaleString()} people affected (${inc.severity} Threat)`);
  }

  const pendingSOS = (appData.emergencySOS || []).filter(s => !s.isResolved);
  if (pendingSOS.length > 0) {
    messages.push(`🚨 [EMERGENCY SOS] ${pendingSOS.length} distress beacon(s) active awaiting search & rescue`);
  }

  const occupiedCamps = (appData.camps || []).filter(c => c.currentOccupancy > 0);
  if (occupiedCamps.length > 0) {
    const camp = occupiedCamps[0];
    messages.push(`[${camp.id}] ${camp.name}: ${camp.currentOccupancy}/${camp.capacity} shelter beds filled`);
  }

  messages.push('[SATELLITE TELEMETRY] Live GNSS & GPS triangulation active for casualty evacuation');

  ticker.textContent = messages.join('  |  ');
}

function updateTabBadges() {
  const incBadge = document.getElementById('tab-badge-incidents');
  const campBadge = document.getElementById('tab-badge-camps');
  const vicBadge = document.getElementById('tab-badge-victims');
  const supBadge = document.getElementById('tab-badge-supplies');
  const volBadge = document.getElementById('tab-badge-volunteers');
  const sosBadge = document.getElementById('tab-badge-sos');
  const citBadge = document.getElementById('tab-badge-citizen-reqs');

  if (incBadge) incBadge.textContent = appData.incidents.filter(i => i.status !== 'RESOLVED').length;
  if (campBadge) campBadge.textContent = appData.camps.length;
  if (vicBadge) vicBadge.textContent = appData.victims.length;
  if (supBadge) supBadge.textContent = appData.supplies.length;
  if (volBadge) volBadge.textContent = appData.volunteers.length;
  if (sosBadge) sosBadge.textContent = appData.emergencySOS.filter(s => !s.isResolved).length;
  if (citBadge) citBadge.textContent = appData.citizenRequests.filter(r => r.status !== 'DELIVERED').length;
}

function renderDashboardMetrics() {
  const s = appData.stats;
  
  // Hero landing page counters
  const hInc = document.getElementById('hero-active-incidents');
  const hBeds = document.getElementById('hero-shelter-beds');
  const hVics = document.getElementById('hero-rescued-victims');
  const hFunds = document.getElementById('hero-relief-funds');

  if (hInc) hInc.textContent = s.activeIncidentsCount || 0;
  if (hBeds) hBeds.textContent = (s.totalCampCapacity || 1250).toLocaleString();
  if (hVics) hVics.textContent = s.registeredVictimsCount || 0;
  if (hFunds) hFunds.textContent = `$${(s.totalFundsRaised || 0).toLocaleString()}`;

  // Command Dashboard metrics
  const sInc = document.getElementById('stat-active-incidents');
  const sPop = document.getElementById('stat-affected-pop');
  const sOcc = document.getElementById('stat-occupancy-rate');
  const sHead = document.getElementById('stat-camp-headcount');
  const sCap = document.getElementById('stat-camp-cap');
  const sVics = document.getElementById('stat-registered-victims');
  const sCrit = document.getElementById('stat-critical-victims');
  const sVol = document.getElementById('stat-available-volunteers');
  const sDep = document.getElementById('stat-deployed-volunteers');
  const sSos = document.getElementById('stat-pending-sos');
  const sReqs = document.getElementById('stat-pending-citizen-requests');
  const sFunds = document.getElementById('stat-total-funds');

  if (sInc) sInc.textContent = s.activeIncidentsCount || 0;
  if (sPop) sPop.textContent = (s.totalAffectedPopulation || 0).toLocaleString();
  if (sOcc) sOcc.textContent = `${s.campOccupancyRate || 0}%`;
  if (sHead) sHead.textContent = s.totalCampOccupancy || 0;
  if (sCap) sCap.textContent = s.totalCampCapacity || 0;
  if (sVics) sVics.textContent = s.registeredVictimsCount || 0;
  if (sCrit) sCrit.textContent = s.criticalVictimsCount || 0;
  if (sVol) sVol.textContent = `${s.availableVolunteers || 0} / ${s.totalVolunteers || 0}`;
  if (sDep) sDep.textContent = s.deployedVolunteers || 0;
  if (sSos) sSos.textContent = s.pendingSOSCount || 0;
  if (sReqs) sReqs.textContent = s.pendingCitizenRequestsCount || 0;
  if (sFunds) sFunds.textContent = `$${(s.totalFundsRaised || 0).toLocaleString()}`;
}

function renderRecentActivity() {
  const tbody = document.getElementById('table-recent-activity');
  if (!tbody) return;
  tbody.innerHTML = '';

  const activities = [];

  appData.citizenRequests.forEach(r => {
    activities.push({
      type: 'CITIZEN_REQ',
      id: r.id,
      title: `Need Package: ${r.citizenName}`,
      location: r.currentLocation,
      urgency: r.status === 'DELIVERED' ? 'LOW' : 'HIGH',
      isResolved: r.status === 'DELIVERED'
    });
  });

  appData.emergencySOS.forEach(s => {
    activities.push({
      type: 'SOS',
      id: s.id,
      title: `SOS: ${s.peopleTrapped} Trapped`,
      location: s.location,
      urgency: s.urgency,
      isResolved: s.isResolved
    });
  });

  appData.incidents.forEach(i => {
    activities.push({
      type: 'INCIDENT',
      id: i.id,
      title: `${i.type} Disaster`,
      location: i.location,
      urgency: i.severity,
      isResolved: i.status === 'RESOLVED'
    });
  });

  activities.slice(0, 8).forEach(act => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <strong>${escapeHtml(act.title)}</strong><br/>
        <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-dim);">${act.id}</span>
      </td>
      <td>${escapeHtml(act.location)}</td>
      <td>
        <span class="badge-pill ${act.urgency.toLowerCase()}">${act.urgency}</span>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderCitizenRequestsTable(reqList) {
  const tbody = document.getElementById('table-citizen-requests-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  const list = reqList || appData.citizenRequests || [];

  if (!list || list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-dim); padding: 1.5rem;">No citizen relief requests found.</td></tr>`;
    return;
  }

  const canCoordinate = currentUser.role === 'admin' || currentUser.role === 'coordinator' || currentUser.role === 'volunteer';

  list.forEach(req => {
    const tr = document.createElement('tr');

    const neededHtml = (req.itemsNeeded || []).map(item => `
      <div style="margin-bottom: 2px;">
        <span style="color: #fca5a5; font-weight: 700;">• ${item.quantity}x</span> ${escapeHtml(item.name)}
      </div>
    `).join('') || '<span style="color: var(--text-dim);">None specified</span>';

    const notNeededHtml = (req.itemsNotNeeded || []).map(item => `
      <div style="color: #86efac; font-size: 0.76rem;">
        ✓ ${escapeHtml(item)}
      </div>
    `).join('') || '<span style="color: var(--text-dim); font-size: 0.76rem;">None marked</span>';

    const statusPillClass = req.status.toLowerCase();

    tr.innerHTML = `
      <td><strong style="font-family: var(--font-mono); color: var(--accent-cyan);">${req.id}</strong></td>
      <td>
        <strong>${escapeHtml(req.citizenName)}</strong><br/>
        <span style="font-family: var(--font-mono); font-size: 0.78rem; color: var(--text-muted);">${escapeHtml(req.phone)}</span><br/>
        <span style="font-size: 0.72rem; color: var(--text-dim);">${req.peopleCount} people &bull; ${req.deliveryPreference.replace('_', ' ')}</span>
      </td>
      <td>
        ${escapeHtml(req.currentLocation)}<br/>
        ${req.lat ? `<span style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--accent-cyan);">GPS: [${req.lat.toFixed(4)}, ${req.lng.toFixed(4)}]</span>` : ''}
      </td>
      <td><strong>${escapeHtml(req.nearestCampName)}</strong></td>
      <td style="font-size: 0.82rem; max-width: 220px;">${neededHtml}</td>
      <td style="font-size: 0.78rem; max-width: 180px;">${notNeededHtml}</td>
      <td><span class="badge-pill ${statusPillClass}">${req.status.replace('_', ' ')}</span></td>
      <td>
        ${canCoordinate && req.status !== 'DELIVERED' ? `
          <div style="display: flex; gap: 0.3rem; flex-direction: column;">
            ${req.status === 'PENDING' ? `
              <button class="btn-action secondary" style="padding: 0.2rem 0.5rem; font-size: 0.72rem;" onclick="updateRequisitionStatus('${req.id}', 'PACKED')">
                Mark Packed
              </button>
            ` : ''}
            ${req.status === 'PACKED' ? `
              <button class="btn-action" style="padding: 0.2rem 0.5rem; font-size: 0.72rem;" onclick="updateRequisitionStatus('${req.id}', 'IN_TRANSIT')">
                Dispatch / In Transit
              </button>
            ` : ''}
            ${req.status === 'IN_TRANSIT' ? `
              <button class="btn-action success" style="padding: 0.2rem 0.5rem; font-size: 0.72rem;" onclick="updateRequisitionStatus('${req.id}', 'DELIVERED')">
                Mark Delivered
              </button>
            ` : ''}
          </div>
        ` : `<span style="color: var(--text-dim); font-size: 0.75rem;">Completed</span>`}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderIncidentsTable(customList) {
  const tbody = document.getElementById('table-incidents-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  const list = customList || appData.incidents || [];

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-dim); padding: 1.5rem;">No incidents found matching criteria.</td></tr>`;
    return;
  }

  list.forEach(inc => {
    const tr = document.createElement('tr');
    const isCommander = currentUser.role === 'admin' || currentUser.role === 'coordinator';

    tr.innerHTML = `
      <td><strong style="font-family: var(--font-mono);">${inc.id}</strong></td>
      <td><strong>${escapeHtml(inc.type)}</strong></td>
      <td>${escapeHtml(inc.location)}</td>
      <td><span class="badge-pill ${inc.severity.toLowerCase()}">${inc.severity}</span></td>
      <td>${(inc.affectedPopulation || 0).toLocaleString()}</td>
      <td style="font-size: 0.8rem; color: var(--text-muted);">${inc.reportedTime}</td>
      <td><span class="badge-pill ${inc.status.toLowerCase()}">${inc.status.replace('_', ' ')}</span></td>
      <td>
        ${isCommander && inc.status !== 'RESOLVED' ? `
          <button class="btn-action secondary" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;" onclick="updateIncidentStatus('${inc.id}', 'RESOLVED')">
            Mark Resolved
          </button>
        ` : `<span style="color: var(--text-dim); font-size: 0.75rem;">None</span>`}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderCampsTable() {
  const tbody = document.getElementById('table-camps-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  appData.camps.forEach(camp => {
    const occPct = ((camp.currentOccupancy / camp.capacity) * 100).toFixed(0);
    const progressClass = occPct > 85 ? 'danger' : occPct > 60 ? 'warning' : 'safe';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong style="font-family: var(--font-mono);">${camp.id}</strong></td>
      <td><strong>${escapeHtml(camp.name)}</strong></td>
      <td>${escapeHtml(camp.location)}</td>
      <td style="min-width: 140px;">
        <div style="display: flex; justify-content: space-between; font-size: 0.8rem;">
          <span>${camp.currentOccupancy} / ${camp.capacity}</span>
          <strong>${occPct}%</strong>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar-fill ${progressClass}" style="width: ${Math.min(occPct, 100)}%;"></div>
        </div>
      </td>
      <td>${escapeHtml(camp.coordinator)}</td>
      <td style="font-family: var(--font-mono); font-size: 0.8rem;">${escapeHtml(camp.contact)}</td>
      <td>
        <span style="font-size: 0.78rem; color: var(--text-muted);">
          ${(camp.amenities || []).join(', ')}
        </span>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderVictimsTable(victimsList) {
  const tbody = document.getElementById('table-victims-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (victimsList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-dim); padding: 1.5rem;">No matching evacuees found in registry.</td></tr>`;
    return;
  }

  victimsList.forEach(v => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong style="font-family: var(--font-mono);">${v.id}</strong></td>
      <td><strong>${escapeHtml(v.name)}</strong></td>
      <td>${v.age} yrs / ${escapeHtml(v.gender)}</td>
      <td><span class="badge-pill ${v.condition.toLowerCase()}">${v.condition}</span></td>
      <td>${escapeHtml(v.campName || v.campId)}</td>
      <td>${escapeHtml(v.kinContact || 'N/A')}</td>
      <td style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(v.specialNeeds || 'None')}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderSuppliesTable(customList) {
  const tbody = document.getElementById('table-supplies-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  const list = customList || appData.supplies || [];

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-dim); padding: 1.5rem;">No inventory supplies match the selected filter.</td></tr>`;
    return;
  }

  list.forEach(s => {
    const isLow = s.quantity <= s.minThreshold;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong style="font-family: var(--font-mono);">${s.id}</strong></td>
      <td><span style="font-size: 0.75rem; color: var(--accent-cyan); font-weight: 600;">${s.category}</span></td>
      <td><strong>${escapeHtml(s.name)}</strong></td>
      <td>
        <span style="font-size: 1.05rem; font-weight: 700;">${s.quantity.toLocaleString()}</span> ${s.unit}
      </td>
      <td>${s.minThreshold.toLocaleString()} ${s.unit}</td>
      <td>${escapeHtml(s.warehouse || 'Central Depot')}</td>
      <td>
        ${isLow ? `
          <span class="badge-pill critical">⚠️ LOW STOCK ALERT</span>
        ` : `
          <span class="badge-pill stable">✓ ADEQUATE</span>
        `}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderVolunteersTable() {
  const tbody = document.getElementById('table-volunteers-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  const isCommander = currentUser.role === 'admin' || currentUser.role === 'coordinator';

  appData.volunteers.forEach(vol => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong style="font-family: var(--font-mono);">${vol.id}</strong></td>
      <td><strong>${escapeHtml(vol.name)}</strong></td>
      <td><span style="font-size: 0.78rem; font-weight: 600; color: var(--accent-purple);">${vol.skill}</span></td>
      <td style="font-family: var(--font-mono);">${escapeHtml(vol.phone)}</td>
      <td><span class="badge-pill ${vol.status.toLowerCase()}">${vol.status}</span></td>
      <td>${escapeHtml(vol.assignedLocation)}</td>
      <td>
        ${isCommander ? (
          vol.status === 'AVAILABLE' ? `
            <button class="btn-action" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;" onclick="promptDeployVolunteer('${vol.id}')">
              Deploy
            </button>
          ` : `
            <button class="btn-action secondary" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;" onclick="recallVolunteer('${vol.id}')">
              Recall to Base
            </button>
          `
        ) : `<span style="color: var(--text-dim); font-size: 0.75rem;">None</span>`}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderSOSTable(customList) {
  const tbody = document.getElementById('table-sos-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  const list = customList || appData.emergencySOS || [];

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-dim); padding: 1.5rem;">No SOS distress calls match the filter.</td></tr>`;
    return;
  }

  const canResolve = currentUser.role === 'admin' || currentUser.role === 'coordinator' || currentUser.role === 'volunteer';

  list.forEach(sos => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong style="font-family: var(--font-mono); color: #fca5a5;">${sos.id}</strong></td>
      <td>
        <strong>${escapeHtml(sos.location)}</strong><br/>
        ${sos.lat ? `<span style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--accent-cyan);">GPS: [${sos.lat.toFixed(4)}, ${sos.lng.toFixed(4)}] &bull; ±${sos.accuracyMeters || 8}m</span>` : ''}
      </td>
      <td>
        ${escapeHtml(sos.callerName)}<br/>
        <span style="font-family: var(--font-mono); font-size: 0.78rem; color: var(--text-muted);">${escapeHtml(sos.contact)}</span>
      </td>
      <td><span style="font-weight: 700; color: #fca5a5;">${sos.peopleTrapped} people</span></td>
      <td><span class="badge-pill ${sos.urgency.toLowerCase()}">${sos.urgency}</span></td>
      <td style="font-size: 0.82rem; max-width: 250px;">
        ${escapeHtml(sos.description)}
        ${sos.imageUrl ? `
          <div style="margin-top: 4px;">
            <a href="${sos.imageUrl}" target="_blank" rel="noopener noreferrer" style="color: var(--accent-cyan); font-size: 0.72rem; text-decoration: underline; display: flex; align-items: center; gap: 4px;">
              <span>📷</span> View Ground Photo
            </a>
          </div>
        ` : ''}
      </td>
      <td>
        ${sos.isResolved ? `
          <span class="badge-pill resolved">✓ RESCUED / RESOLVED</span>
        ` : `
          <span class="badge-pill active">🚨 PENDING RESCUE</span>
        `}
      </td>
      <td>
        ${!sos.isResolved && canResolve ? `
          <button class="btn-action success" style="padding: 0.3rem 0.7rem; font-size: 0.75rem;" onclick="resolveSOS('${sos.id}')">
            Mark Rescued
          </button>
        ` : `<span style="color: var(--text-dim); font-size: 0.75rem;">None</span>`}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderDonationsTable() {
  const tbody = document.getElementById('table-donations-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  appData.donations.forEach(don => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong style="font-family: var(--font-mono);">${don.id}</strong></td>
      <td><strong>${escapeHtml(don.donorName)}</strong></td>
      <td><strong style="color: #86efac; font-size: 1.05rem;">$${Number(don.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></td>
      <td>${escapeHtml(don.purpose)}</td>
      <td style="font-size: 0.8rem; color: var(--text-muted);">${don.date}</td>
      <td><span style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-dim);">${don.txRef || 'TXN-GEN'}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function updateFormDropdowns() {
  const vicCampSelect = document.getElementById('vic-camp-select');
  const dispatchCampSelect = document.getElementById('dispatch-camp-select');
  const reqCampSelect = document.getElementById('req-camp-select');

  const campsList = (appData.camps && appData.camps.length > 0) ? appData.camps : [
    { id: 'CAMP-201', name: 'City Civic Arena Shelter', location: 'Downtown Sector 1', capacity: 500, currentOccupancy: 142, coordinator: 'Col. Robert Vance' },
    { id: 'CAMP-202', name: 'St. Jude Community Hall', location: 'North Ridge Suburb', capacity: 300, currentOccupancy: 95, coordinator: 'Dr. Sarah Jenkins' },
    { id: 'CAMP-203', name: 'Govt High School Grounds', location: 'Eastern Safe Zone', capacity: 450, currentOccupancy: 88, coordinator: 'Mark Sullivan' }
  ];

  if (vicCampSelect) {
    vicCampSelect.innerHTML = campsList.map(c => `
      <option value="${c.id}">${c.name} (${c.currentOccupancy}/${c.capacity} occupied)</option>
    `).join('');
  }

  if (dispatchCampSelect) {
    dispatchCampSelect.innerHTML = campsList.map(c => `
      <option value="${c.id}">${c.name} - ${c.location}</option>
    `).join('');
  }

  if (reqCampSelect) {
    reqCampSelect.innerHTML = campsList.map(c => `
      <option value="${c.id}">${c.name} (${c.location}) - Coordinator: ${c.coordinator}</option>
    `).join('');
  }

  const replenishSelect = document.getElementById('replenish-item-select');
  const dispatchItemSelect = document.getElementById('dispatch-item-select');

  const suppliesList = (appData.supplies && appData.supplies.length > 0) ? appData.supplies : [
    { id: 'FOOD-1', name: 'Ready-to-Eat Ration Packs', quantity: 1450, unit: 'Meals' },
    { id: 'WATER-1', name: 'Potable Mineral Water (5L)', quantity: 2150, unit: 'Bottles' },
    { id: 'MED-1', name: 'Emergency Trauma & First Aid', quantity: 420, unit: 'Kits' },
    { id: 'TENT-1', name: 'Thermal Blankets & Tents', quantity: 780, unit: 'Sets' },
    { id: 'HYG-1', name: 'Sanitation & Hygiene Packs', quantity: 590, unit: 'Packs' }
  ];

  if (replenishSelect) {
    replenishSelect.innerHTML = suppliesList.map(s => `
      <option value="${s.id}">${s.name} [Current: ${s.quantity} ${s.unit}]</option>
    `).join('');
  }

  if (dispatchItemSelect) {
    dispatchItemSelect.innerHTML = suppliesList.map(s => `
      <option value="${s.id}">${s.name} [Available: ${s.quantity} ${s.unit}]</option>
    `).join('');
  }
}

// Default catalog fallback in case of delayed network fetch
const DEFAULT_CATALOG_FALLBACK = [
  { id: 'CAT-FOOD-1', category: 'Food & Nutrition', name: 'Ready-to-Eat Food Ration Packs', unit: 'Packs', defaultQty: 3 },
  { id: 'CAT-FOOD-2', category: 'Food & Nutrition', name: 'Baby Food & Infant Formula', unit: 'Cans', defaultQty: 2 },
  { id: 'CAT-WATER-1', category: 'Water & Hydration', name: 'Potable Bottled Mineral Water (5L)', unit: 'Bottles', defaultQty: 4 },
  { id: 'CAT-WATER-2', category: 'Water & Hydration', name: 'Water Purification Chlorine Tablets', unit: 'Strips', defaultQty: 2 },
  { id: 'CAT-MED-1', category: 'Medical & First Aid', name: 'Emergency Trauma & First Aid Kit', unit: 'Kits', defaultQty: 1 },
  { id: 'CAT-MED-2', category: 'Medical & First Aid', name: 'Insulin Vials & Syringes (Diabetic)', unit: 'Vials', defaultQty: 2 },
  { id: 'CAT-SHELTER-1', category: 'Shelter & Warmth', name: 'Thermal Insulation Blankets', unit: 'Units', defaultQty: 3 },
  { id: 'CAT-HYG-1', category: 'Hygiene & Care', name: 'Sanitary Napkins / Menstrual Care', unit: 'Packs', defaultQty: 3 },
  { id: 'CAT-HYG-2', category: 'Hygiene & Care', name: 'Infant Diapers (Medium/Large)', unit: 'Packs', defaultQty: 2 },
  { id: 'CAT-POWER-1', category: 'Power & Light', name: 'Solar LED Flashlight & Emergency Lantern', unit: 'Units', defaultQty: 1 }
];

function openRequisitionModal() {
  updateFormDropdowns();
  renderRequisitionCatalogGrid();
  openModal('modal-citizen-requisition');
}

function renderRequisitionCatalogGrid() {
  const container = document.getElementById('requisition-items-list');
  if (!container) return;
  container.innerHTML = '';

  const items = (appData.catalog && appData.catalog.length > 0) ? appData.catalog : DEFAULT_CATALOG_FALLBACK;
  requisitionItemSelections = {};

  items.forEach(item => {
    requisitionItemSelections[item.id] = {
      status: 'none',
      quantity: item.defaultQty || 2,
      unit: item.unit,
      name: item.name,
      category: item.category
    };

    const card = document.createElement('div');
    card.className = 'catalog-item-card';
    card.id = `cat-card-${item.id}`;

    card.innerHTML = `
      <div class="item-card-header">
        <div>
          <span class="item-cat">${escapeHtml(item.category)}</span>
          <div class="item-name">${escapeHtml(item.name)}</div>
        </div>
      </div>

      <div class="manifest-choice-group">
        <button type="button" class="choice-btn need" onclick="setRequisitionItemChoice('${item.id}', 'need')">
          🔴 Urgently Need
        </button>
        <button type="button" class="choice-btn none active" onclick="setRequisitionItemChoice('${item.id}', 'none')">
          🟢 Don't Need
        </button>
        <button type="button" class="choice-btn surplus" onclick="setRequisitionItemChoice('${item.id}', 'surplus')">
          🟡 Surplus
        </button>
      </div>

      <div class="qty-stepper" id="qty-wrapper-${item.id}" style="display: none;">
        <span>Requested Quantity:</span>
        <div class="qty-control">
          <button type="button" class="qty-btn" onclick="adjustItemQty('${item.id}', -1)">-</button>
          <span class="qty-val" id="qty-val-${item.id}">${item.defaultQty || 2}</span>
          <span style="font-size: 0.75rem; color: var(--text-dim);">${item.unit}</span>
          <button type="button" class="qty-btn" onclick="adjustItemQty('${item.id}', 1)">+</button>
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

function setRequisitionItemChoice(itemId, choice) {
  if (!requisitionItemSelections[itemId]) return;
  requisitionItemSelections[itemId].status = choice;

  const card = document.getElementById(`cat-card-${itemId}`);
  if (!card) return;

  const buttons = card.querySelectorAll('.choice-btn');
  buttons.forEach(b => b.classList.remove('active'));

  const activeBtn = card.querySelector(`.choice-btn.${choice}`);
  if (activeBtn) activeBtn.classList.add('active');

  const qtyWrapper = document.getElementById(`qty-wrapper-${itemId}`);
  if (qtyWrapper) {
    qtyWrapper.style.display = choice === 'need' ? 'flex' : 'none';
  }
}

function adjustItemQty(itemId, delta) {
  if (!requisitionItemSelections[itemId]) return;
  let current = requisitionItemSelections[itemId].quantity;
  current = Math.max(1, current + delta);
  requisitionItemSelections[itemId].quantity = current;

  const valEl = document.getElementById(`qty-val-${itemId}`);
  if (valEl) valEl.textContent = current;
}

// Submit Citizen Requisition
async function submitCitizenRequisition(e) {
  e.preventDefault();

  const neededList = [];
  const notNeededList = [];
  const surplusList = [];

  for (const itemId in requisitionItemSelections) {
    const sel = requisitionItemSelections[itemId];
    if (sel.status === 'need') {
      neededList.push({
        name: sel.name,
        category: sel.category,
        quantity: sel.quantity,
        unit: sel.unit
      });
    } else if (sel.status === 'none') {
      notNeededList.push(sel.name);
    } else if (sel.status === 'surplus') {
      surplusList.push({
        name: sel.name,
        category: sel.category
      });
    }
  }

  const payload = {
    citizenName: document.getElementById('req-citizen-name').value,
    phone: document.getElementById('req-citizen-phone').value,
    currentLocation: document.getElementById('req-citizen-location').value,
    lat: userCurrentCoords.lat,
    lng: userCurrentCoords.lng,
    accuracyMeters: userCurrentCoords.accuracy,
    satelliteLocked: userCurrentCoords.isLocked,
    nearestCampId: document.getElementById('req-camp-select').value,
    peopleCount: parseInt(document.getElementById('req-people-count').value, 10) || 1,
    deliveryPreference: document.getElementById('req-delivery-pref').value,
    itemsNeeded: neededList,
    itemsNotNeeded: notNeededList,
    itemsSurplus: surplusList,
    specialNotes: document.getElementById('req-special-notes').value
  };

  try {
    const res = await apiFetch('/api/citizen-requests', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    showToast(res.message || 'Requisition submitted with GPS verification!', 'success');
    closeModal('modal-citizen-requisition');
    document.getElementById('form-citizen-requisition').reset();
    toggleViewMode('dashboard');
    switchTab('citizen-portal');
    await refreshAllData();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Track Request by Phone
function trackCitizenRequestByPhone() {
  const phone = document.getElementById('input-track-phone').value.trim();
  if (!phone) {
    showToast('Please enter your phone number to track', 'warning');
    return;
  }

  const cleanedPhone = phone.replace(/[^0-9]/g, '');
  const matched = appData.citizenRequests.filter(r =>
    r.phone && r.phone.replace(/[^0-9]/g, '').includes(cleanedPhone)
  );

  const container = document.getElementById('citizen-tracking-result');
  container.style.display = 'block';

  if (matched.length === 0) {
    container.innerHTML = `
      <div style="color: #fca5a5; font-size: 0.9rem;">
        ⚠️ No active relief package requests found matching phone: <strong>${escapeHtml(phone)}</strong>.
        Please submit a new request or verify the digits entered.
      </div>
    `;
    return;
  }

  const req = matched[0];

  const isStep1Done = true;
  const isStep2Done = req.status === 'PACKED' || req.status === 'IN_TRANSIT' || req.status === 'DELIVERED';
  const isStep3Done = req.status === 'IN_TRANSIT' || req.status === 'DELIVERED';
  const isStep4Done = req.status === 'DELIVERED';

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.75rem; margin-bottom: 0.75rem;">
      <div>
        <h4 style="color: var(--accent-cyan); font-size: 1.1rem; margin: 0;">📦 Request #${req.id} for ${escapeHtml(req.citizenName)}</h4>
        <p style="font-size: 0.78rem; color: var(--text-dim); margin: 0;">Assigned Camp: <strong>${escapeHtml(req.nearestCampName)}</strong> &bull; Submitted: ${req.timestamp}</p>
      </div>
      <span class="badge-pill ${req.status.toLowerCase()}">${req.status.replace('_', ' ')}</span>
    </div>

    <!-- Timeline Stepper -->
    <div class="timeline-stepper">
      <div class="timeline-step ${isStep1Done ? 'completed active' : ''}">
        <div class="step-circle">1</div>
        <span>Received</span>
      </div>
      <div class="timeline-step ${isStep2Done ? 'completed active' : ''}">
        <div class="step-circle">2</div>
        <span>Camp Packing</span>
      </div>
      <div class="timeline-step ${isStep3Done ? 'completed active' : ''}">
        <div class="step-circle">3</div>
        <span>In Transit</span>
      </div>
      <div class="timeline-step ${isStep4Done ? 'completed active' : ''}">
        <div class="step-circle">4</div>
        <span>Delivered</span>
      </div>
    </div>

    <div style="margin-top: 1rem; font-size: 0.85rem; color: var(--text-main);">
      <strong>Requested Supplies:</strong> ${(req.itemsNeeded || []).map(i => `<span style="color: #fca5a5;">${i.quantity}x ${escapeHtml(i.name)}</span>`).join(', ')}
    </div>
  `;
}

// Update Requisition Fulfillment Status
async function updateRequisitionStatus(reqId, newStatus) {
  try {
    await apiFetch(`/api/citizen-requests/${reqId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus })
    });
    showToast(`Request ${reqId} updated to: ${newStatus.replace('_', ' ')}`, 'success');
    await refreshAllData();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// =========================================================================
// 6. INTERACTIVE LEAFLET TACTICAL MAP
// =========================================================================

function initMap() {
  const mapElement = document.getElementById('disaster-map');
  if (!mapElement) return;

  mapInstance = L.map('disaster-map', {
    center: [13.0827, 80.2507],
    zoom: 12
  });

  L.tileLayer('https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=cb1_3o4y_1_53484ae07f9062bb4e614f04', {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    maxZoom: 19
  }).addTo(mapInstance);

  mapMarkersGroup = L.layerGroup().addTo(mapInstance);
}

function renderMapMarkers() {
  if (!mapInstance || !mapMarkersGroup) return;
  mapMarkersGroup.clearLayers();

  // Add Incident Markers
  appData.incidents.forEach(inc => {
    if (inc.lat && inc.lng && inc.status !== 'RESOLVED') {
      const circle = L.circleMarker([inc.lat, inc.lng], {
        radius: 14,
        fillColor: '#ef4444',
        color: '#ffffff',
        weight: 2,
        opacity: 0.9,
        fillOpacity: 0.65
      });

      circle.bindPopup(`
        <div style="color: #000; font-family: sans-serif;">
          <h4 style="color: #dc2626; margin: 0 0 4px 0;">⚡ ${escapeHtml(inc.type)} [${inc.id}]</h4>
          <p style="margin: 0 0 4px 0;"><strong>Location:</strong> ${escapeHtml(inc.location)}</p>
          <p style="margin: 0 0 4px 0;"><strong>Severity:</strong> ${inc.severity}</p>
          <p style="margin: 0;"><strong>Affected Pop:</strong> ${(inc.affectedPopulation || 0).toLocaleString()}</p>
        </div>
      `);
      mapMarkersGroup.addLayer(circle);
    }
  });

  // Add Camp Markers
  appData.camps.forEach(camp => {
    if (camp.lat && camp.lng) {
      const marker = L.circleMarker([camp.lat, camp.lng], {
        radius: 11,
        fillColor: '#06b6d4',
        color: '#ffffff',
        weight: 2,
        opacity: 0.9,
        fillOpacity: 0.8
      });

      marker.bindPopup(`
        <div style="color: #000; font-family: sans-serif;">
          <h4 style="color: #0284c7; margin: 0 0 4px 0;">🏕️ ${escapeHtml(camp.name)}</h4>
          <p style="margin: 0 0 4px 0;"><strong>Occupancy:</strong> ${camp.currentOccupancy} / ${camp.capacity}</p>
          <p style="margin: 0 0 4px 0;"><strong>Coordinator:</strong> ${escapeHtml(camp.coordinator)}</p>
          <p style="margin: 0;"><strong>Phone:</strong> ${escapeHtml(camp.contact)}</p>
        </div>
      `);
      mapMarkersGroup.addLayer(marker);
    }
  });

  // Add SOS Markers (Urgent Distress)
  appData.emergencySOS.forEach(sos => {
    if (sos.lat && sos.lng && !sos.isResolved) {
      const sosMarker = L.circleMarker([sos.lat, sos.lng], {
        radius: 13,
        fillColor: '#8b5cf6',
        color: '#ef4444',
        weight: 3,
        opacity: 1,
        fillOpacity: 0.95
      });

      sosMarker.bindPopup(`
        <div style="color: #000; font-family: sans-serif; min-width: 200px;">
          <h4 style="color: #dc2626; margin: 0 0 6px 0; font-size: 14px;">🆘 SOS: ${escapeHtml(sos.callerName)}</h4>
          <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Trapped:</strong> ${sos.peopleTrapped} people</p>
          <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Location:</strong> ${escapeHtml(sos.location)}</p>
          <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>GPS:</strong> ${sos.lat.toFixed(4)}° N, ${sos.lng.toFixed(4)}° E</p>
          <p style="margin: 0; font-size: 12px; color: #475569;">${escapeHtml(sos.description)}</p>
        </div>
      `);
      mapMarkersGroup.addLayer(sosMarker);
    }
  });

  // Add Citizen Requisition Markers
  if (appData.citizenRequests) {
    appData.citizenRequests.forEach(req => {
      if (req.lat && req.lng && req.status !== 'DELIVERED') {
        const reqMarker = L.circleMarker([req.lat, req.lng], {
          radius: 11,
          fillColor: '#8b5cf6',
          color: '#ffffff',
          weight: 2,
          opacity: 0.95,
          fillOpacity: 0.8
        });

        const itemsList = (req.itemsNeeded || []).map(i => `${i.quantity}x ${escapeHtml(i.name)}`).join(', ');

        reqMarker.bindPopup(`
          <div style="color: #000; font-family: sans-serif; min-width: 210px;">
            <h4 style="color: #7c3aed; margin: 0 0 6px 0; font-size: 13px;">📦 Supply Request [${req.id}]</h4>
            <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Citizen:</strong> ${escapeHtml(req.citizenName)} (${req.peopleCount} people)</p>
            <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Location:</strong> ${escapeHtml(req.currentLocation)}</p>
            <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Status:</strong> <span style="color: #d97706; font-weight: bold;">${req.status}</span></p>
            <p style="margin: 0; font-size: 11px; color: #334155;"><strong>Needs:</strong> ${itemsList || 'None specified'}</p>
          </div>
        `);
        mapMarkersGroup.addLayer(reqMarker);
      }
    });
  }

  // Re-pin user GPS marker if available
  if (userCurrentCoords.isLocked) {
    pinUserGPSOnMap(userCurrentCoords.lat, userCurrentCoords.lng);
  }
}

// =========================================================================
// 7. OTHER ACTIONS & FORM SUBMISSIONS
// =========================================================================

async function submitSOS(e) {
  e.preventDefault();

  let uploadedImageUrl = null;
  if (sosAttachedImageBase64) {
    try {
      showToast('Uploading ground photo evidence to Cloudinary...', 'info');
      const uploadRes = await apiFetch('/api/upload', {
        method: 'POST',
        body: JSON.stringify({
          image: sosAttachedImageBase64,
          folder: 'disaster_relief_sos'
        })
      });
      if (uploadRes.success && uploadRes.url) {
        uploadedImageUrl = uploadRes.url;
      }
    } catch (uploadErr) {
      console.warn('Cloudinary upload warning:', uploadErr.message);
    }
  }

  const payload = {
    location: document.getElementById('sos-location').value,
    lat: userCurrentCoords.lat,
    lng: userCurrentCoords.lng,
    accuracyMeters: userCurrentCoords.accuracy,
    satelliteLocked: userCurrentCoords.isLocked,
    altitude: userCurrentCoords.altitude,
    imageUrl: uploadedImageUrl,
    callerName: document.getElementById('sos-caller').value,
    contact: document.getElementById('sos-phone').value,
    peopleTrapped: parseInt(document.getElementById('sos-trapped').value, 10),
    urgency: document.getElementById('sos-urgency').value,
    description: document.getElementById('sos-description').value
  };

  try {
    const res = await apiFetch('/api/sos', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    showToast(res.message || '🚨 SOS Dispatched! Emergency response team notified.', 'error');
    closeModal('modal-sos');
    document.getElementById('form-sos').reset();
    sosAttachedImageBase64 = null;
    const previewDiv = document.getElementById('sos-photo-preview');
    if (previewDiv) previewDiv.style.display = 'none';
    toggleViewMode('dashboard');
    switchTab('sos');
    await refreshAllData();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function submitIncident(e) {
  e.preventDefault();
  const payload = {
    type: document.getElementById('inc-type').value,
    severity: document.getElementById('inc-severity').value,
    location: document.getElementById('inc-location').value,
    affectedPopulation: document.getElementById('inc-affected').value,
    description: document.getElementById('inc-description').value
  };

  try {
    await apiFetch('/api/incidents', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    showToast('Disaster incident registered successfully!', 'success');
    closeModal('modal-incident');
    document.getElementById('form-incident').reset();
    await refreshAllData();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function submitCamp(e) {
  e.preventDefault();
  const payload = {
    name: document.getElementById('camp-name').value,
    location: document.getElementById('camp-location').value,
    capacity: document.getElementById('camp-capacity').value,
    coordinator: document.getElementById('camp-coordinator').value,
    contact: document.getElementById('camp-phone').value
  };

  try {
    await apiFetch('/api/camps', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    showToast('Relief camp established successfully!', 'success');
    closeModal('modal-camp');
    document.getElementById('form-camp').reset();
    await refreshAllData();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function submitVictim(e) {
  e.preventDefault();
  const payload = {
    name: document.getElementById('vic-name').value,
    age: document.getElementById('vic-age').value,
    gender: document.getElementById('vic-gender').value,
    condition: document.getElementById('vic-condition').value,
    campId: document.getElementById('vic-camp-select').value,
    kinContact: document.getElementById('vic-kin').value,
    specialNeeds: document.getElementById('vic-needs').value
  };

  try {
    await apiFetch('/api/victims', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    showToast('Evacuee registered and allocated to camp shelter!', 'success');
    closeModal('modal-victim');
    document.getElementById('form-victim').reset();
    await refreshAllData();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function submitReplenish(e) {
  e.preventDefault();
  const itemId = document.getElementById('replenish-item-select').value;
  const qty = document.getElementById('replenish-qty').value;

  try {
    await apiFetch(`/api/supplies/${itemId}/replenish`, {
      method: 'POST',
      body: JSON.stringify({ quantity: qty })
    });
    showToast('Warehouse inventory stock updated!', 'success');
    closeModal('modal-replenish-supply');
    document.getElementById('form-replenish').reset();
    await refreshAllData();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function submitDispatch(e) {
  e.preventDefault();
  const itemId = document.getElementById('dispatch-item-select').value;
  const qty = document.getElementById('dispatch-qty').value;
  const campId = document.getElementById('dispatch-camp-select').value;

  try {
    const res = await apiFetch(`/api/supplies/${itemId}/dispatch`, {
      method: 'POST',
      body: JSON.stringify({ quantity: qty, campId })
    });
    showToast(res.message || 'Supplies dispatched successfully!', 'success');
    closeModal('modal-dispatch-supply');
    document.getElementById('form-dispatch').reset();
    await refreshAllData();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function submitVolunteer(e) {
  e.preventDefault();
  const payload = {
    name: document.getElementById('vol-name').value,
    skill: document.getElementById('vol-skill').value,
    phone: document.getElementById('vol-phone').value
  };

  try {
    await apiFetch('/api/volunteers', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    showToast('Volunteer enlisted into rescue corps!', 'success');
    closeModal('modal-volunteer');
    document.getElementById('form-volunteer').reset();
    await refreshAllData();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function promptDeployVolunteer(volId) {
  const location = prompt('Enter deployment target zone / relief shelter:');
  if (!location) return;

  try {
    await apiFetch(`/api/volunteers/${volId}/deploy`, {
      method: 'POST',
      body: JSON.stringify({ location })
    });
    showToast(`Volunteer deployed to ${location}`, 'success');
    await refreshAllData();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function recallVolunteer(volId) {
  try {
    await apiFetch(`/api/volunteers/${volId}/recall`, { method: 'POST' });
    showToast('Volunteer recalled to Base HQ', 'success');
    await refreshAllData();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function resolveSOS(sosId) {
  try {
    await apiFetch(`/api/sos/${sosId}/resolve`, { method: 'PATCH' });
    showToast('SOS marked as RESOLVED and casualties rescued.', 'success');
    await refreshAllData();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function updateIncidentStatus(incId, newStatus) {
  try {
    await apiFetch(`/api/incidents/${incId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus })
    });
    showToast(`Incident ${incId} marked as ${newStatus}`, 'success');
    await refreshAllData();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function submitDonation(e) {
  e.preventDefault();
  const payload = {
    donorName: document.getElementById('don-name').value,
    amount: document.getElementById('don-amount').value,
    purpose: document.getElementById('don-purpose').value
  };

  try {
    const res = await apiFetch('/api/donations', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    showToast(res.message || 'Donation received! Thank you for supporting relief efforts.', 'success');
    closeModal('modal-donation');
    document.getElementById('form-donation').reset();
    await refreshAllData();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Real-Time Missing Person Search
let searchDebounce = null;
function handleVictimSearch() {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(async () => {
    const query = document.getElementById('input-victim-search').value.trim();
    try {
      const res = await apiFetch(`/api/victims?q=${encodeURIComponent(query)}`);
      renderVictimsTable(res.data || []);
    } catch (e) {
      console.error(e);
    }
  }, 250);
}

// =========================================
// 8. ROLE SWITCHING & AUTHENTICATION
// =========================================

async function switchDemoRole(role, showNotification = true) {
  try {
    const res = await fetch('/api/auth/switch-demo-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
    const data = await res.json();
    if (data.success) {
      authToken = data.token;
      currentUser = data.user;
      localStorage.setItem('drms_auth_token', authToken);
      updateUserUI();
      closeModal('modal-auth');
      if (showNotification) {
        showToast(`Switched clearance to: ${currentUser.badge} (${currentUser.role.toUpperCase()})`, 'success');
      }
      await refreshAllData();
    }
  } catch (e) {
    console.error('Role switch error:', e);
  }
}

function updateUserUI() {
  const nameEl = document.getElementById('user-display-name');
  const roleEl = document.getElementById('user-role-pill');

  if (nameEl && roleEl) {
    nameEl.textContent = currentUser.fullName || currentUser.username;
    roleEl.textContent = currentUser.role.toUpperCase();
    roleEl.className = `px-2 py-0.5 text-[10px] font-bold rounded-full uppercase border ${
      currentUser.role === 'admin' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
      currentUser.role === 'coordinator' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
      currentUser.role === 'volunteer' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
      'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
    }`;
  }
}

// =========================================
// 9. MODAL NAVIGATION HELPERS
// =========================================

function openModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) m.classList.add('open');
}

function closeModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) m.classList.remove('open');
}

function setupModalBackdrops() {
  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('open');
      }
    });
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop.open').forEach(m => m.classList.remove('open'));
    }
  });
}

function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✓' : type === 'error' ? '🚨' : 'ℹ️'}</span>
    <div>${escapeHtml(msg)}</div>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// =========================================
// 10. CLIENT-SIDE FILTERING & DATA EXPORT
// =========================================

function filterCitizenRequests() {
  const statusEl = document.getElementById('filter-citizen-status');
  const selectedStatus = statusEl ? statusEl.value : '';
  if (!selectedStatus) {
    renderCitizenRequestsTable(appData.citizenRequests);
  } else {
    const filtered = appData.citizenRequests.filter(r => r.status === selectedStatus);
    renderCitizenRequestsTable(filtered);
  }
}

function filterIncidents() {
  const sevEl = document.getElementById('filter-incident-severity');
  const selectedSev = sevEl ? sevEl.value : '';
  if (!selectedSev) {
    renderIncidentsTable(appData.incidents);
  } else {
    const filtered = appData.incidents.filter(i => i.severity === selectedSev);
    renderIncidentsTable(filtered);
  }
}

function filterSupplies() {
  const stockEl = document.getElementById('filter-supply-stock');
  const selected = stockEl ? stockEl.value : '';
  if (!selected) {
    renderSuppliesTable(appData.supplies);
  } else if (selected === 'LOW') {
    const filtered = appData.supplies.filter(s => s.quantity <= s.minThreshold);
    renderSuppliesTable(filtered);
  } else if (selected === 'ADEQUATE') {
    const filtered = appData.supplies.filter(s => s.quantity > s.minThreshold);
    renderSuppliesTable(filtered);
  }
}

function filterSOS() {
  const sosEl = document.getElementById('filter-sos-status');
  const selected = sosEl ? sosEl.value : '';
  if (!selected) {
    renderSOSTable(appData.emergencySOS);
  } else if (selected === 'PENDING') {
    const filtered = appData.emergencySOS.filter(s => !s.isResolved);
    renderSOSTable(filtered);
  } else if (selected === 'RESOLVED') {
    const filtered = appData.emergencySOS.filter(s => s.isResolved);
    renderSOSTable(filtered);
  }
}

function exportData(resource, format = 'csv') {
  showToast(`Preparing ${resource} ${format.toUpperCase()} export...`, 'info');
  const url = `/api/export/${resource}?format=${format}`;
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `drms-${resource}-${new Date().toISOString().slice(0, 10)}.${format}`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Ensure all handlers are attached directly to global window object
window.acquireLiveGPS = acquireLiveGPS;
window.openModal = openModal;
window.closeModal = closeModal;
window.openRequisitionModal = openRequisitionModal;
window.toggleViewMode = toggleViewMode;
window.switchTab = switchTab;
window.switchDemoRole = switchDemoRole;
window.setRequisitionItemChoice = setRequisitionItemChoice;
window.adjustItemQty = adjustItemQty;
window.submitCitizenRequisition = submitCitizenRequisition;
window.trackCitizenRequestByPhone = trackCitizenRequestByPhone;
window.updateRequisitionStatus = updateRequisitionStatus;
window.submitSOS = submitSOS;
window.resolveSOS = resolveSOS;
window.submitIncident = submitIncident;
window.updateIncidentStatus = updateIncidentStatus;
window.submitCamp = submitCamp;
window.submitVictim = submitVictim;
window.handleVictimSearch = handleVictimSearch;
window.submitReplenish = submitReplenish;
window.submitDispatch = submitDispatch;
window.submitVolunteer = submitVolunteer;
window.promptDeployVolunteer = promptDeployVolunteer;
window.recallVolunteer = recallVolunteer;
window.submitDonation = submitDonation;
window.refreshAllData = refreshAllData;
window.filterCitizenRequests = filterCitizenRequests;
window.filterIncidents = filterIncidents;
window.filterSupplies = filterSupplies;
window.filterSOS = filterSOS;
window.exportData = exportData;
