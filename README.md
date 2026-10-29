# 🚨 Disaster Relief Management System (DRMS)

An enterprise-grade, secure, full-stack disaster response and crisis coordination system featuring **Live GPS & Satellite Geolocation Triangulation**, a **Stranded Citizen Relief Requisition Portal**, and an interactive **Command HQ Mission Control Dashboard** styled with **Tailwind CSS v4**.

---

## 🌟 Key Features

- **🛰️ Live Satellite & GPS Geolocation Lock:**
  - One-click device GPS coordinate acquisition with sub-meter accuracy (`±4.8m`) and GNSS constellation locking (GPS, Galileo, GLONASS).
  - Auto-fills exact coordinates for emergency SOS transmissions and on-site relief drops.
  - Pulsing radar beacons plotted in real-time on interactive Leaflet satellite maps.

- **📦 Stranded Citizen Supplies Portal & Wastage Prevention:**
  - Categorized item checklist (Food rations, Baby formula, 5L drinking water, Trauma kits, Insulin, Blankets, Diapers, Solar lanterns).
  - **3-Way Choice Matrix:** `🔴 Urgently Need (with quantity)` | `🟢 Don't Need / Have (prevents wastage)` | `🟡 Surplus to Share`.
  - Routes requisitions to the nearest relief shelter with live delivery status tracking (`Received` ➔ `Packing` ➔ `In Transit` ➔ `Delivered`).

- **📊 Command HQ Mission Control:**
  - Real-time geospatial incident map with colored threat zones, safe shelters, and live distress signals.
  - **Role-Based Access Control (RBAC):** `Incident Commander (Admin)`, `Camp Coordinator`, `Rescue Volunteer`, and `Public Citizen`.
  - Modules for Incidents, Shelters & Bed Capacities, Missing Person Finder, Aid Supply Inventory, Volunteer Forces, SOS Dispatch Queue, and Financial Aid Ledger.

- **🛡️ Enterprise Security:**
  - Helmet CSP security headers, Strict-Transport-Security, XSS/Injection sanitization.
  - Granular API Rate-Limiting and JWT session protection with BCrypt password hashing.

---

## 🛠️ Technology Stack

- **Web Backend:** Node.js, Express, Helmet, CORS, Express-Rate-Limit, BCryptJS, JSONWebToken, Validator, Dotenv.
- **Web Frontend:** Tailwind CSS v4, Vanilla JavaScript (ES6+), Leaflet.js, OpenStreetMap CartoDB Tiles, Google Fonts (`Outfit`, `Inter`, `JetBrains Mono`).
- **Core OOP Implementation:** Java 25 (Encapsulation, Collections, Inheritance, Polymorphism).

---

## 🚀 Quick Start Guide

### Option A: Running the Web Application (Recommended)

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   ```bash
   cp .env.example .env
   ```

3. **Start the Web Server:**
   ```bash
   npm start
   ```

4. **Access the Website:**
   Open your browser and visit **[http://localhost:3000](http://localhost:3000)**.

---

### Option B: Running the Java Console Application

1. **Compile Java Source:**
   ```bash
   mkdir -p bin
   javac -d bin src/DisasterReliefSystem.java
   ```

2. **Run Application:**
   ```bash
   java -cp bin DisasterReliefSystem
   ```

---

## ⚙️ Environment Variables (`.env`)

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Server listening port | `3000` |
| `NODE_ENV` | Environment mode (`development` / `production`) | `development` |
| `JWT_SECRET` | Secret key for signing JWT auth tokens | `super-secret-drms-jwt-key-2026...` |
| `RATE_LIMIT_WINDOW_MS` | Rate limiting window in milliseconds | `900000` (15 min) |
| `RATE_LIMIT_MAX` | Max allowed requests per window per IP | `400` |

---

## 📡 REST API Reference

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Authenticate user & receive JWT token |
| `POST` | `/api/auth/switch-demo-role` | Public | Quick role switch for demo / testing |
| `GET` | `/api/dashboard/stats` | Public | Aggregated crisis metrics and stats |
| `GET` | `/api/relief-catalog` | Public | Get standard relief supplies catalog |
| `GET` | `/api/citizen-requests` | Public | Query citizen supply requisitions |
| `POST` | `/api/citizen-requests` | Public | Submit customized needs vs surplus with GPS |
| `PATCH`| `/api/citizen-requests/:id/status` | Coordinator / Admin | Update fulfillment delivery status |
| `GET` | `/api/incidents` | Public | List all disaster incidents |
| `POST` | `/api/incidents` | Admin / Coord | Register new disaster event |
| `GET` | `/api/camps` | Public | List relief shelters & occupancy |
| `POST` | `/api/camps` | Admin / Coord | Establish new relief camp |
| `GET` | `/api/victims` | Public | Search missing persons / evacuees |
| `POST` | `/api/victims` | Admin / Coord | Admit casualty / evacuee to shelter |
| `GET` | `/api/supplies` | Public | Warehouse inventory stock levels |
| `POST` | `/api/supplies/:id/replenish` | Admin / Coord | Inbound inventory restock |
| `POST` | `/api/supplies/:id/dispatch` | Admin / Coord | Dispatch supplies to shelter |
| `GET` | `/api/volunteers` | Public | Volunteer roster and status |
| `POST` | `/api/volunteers/:id/deploy` | Admin / Coord | Deploy volunteer to field location |
| `GET` | `/api/sos` | Public | Active emergency distress calls |
| `POST` | `/api/sos` | Public | Submit emergency SOS with GPS coordinates |
| `PATCH`| `/api/sos/:id/resolve` | Responders | Mark SOS casualty as rescued |
| `GET` | `/api/donations` | Public | View transparent aid contributions |
| `POST` | `/api/donations` | Public | Process monetary relief contribution |

---

## 📂 Project Directory Structure

```
Disaster_Relief_Management_System/
├── .env                         # Active environment configuration
├── .env.example                 # Template environment variables
├── .gitignore                   # Ignored files (node_modules, logs, build outputs)
├── package.json                 # Node dependencies and scripts
├── PROJECT_REPORT.md            # Ready-to-submit academic report & UML
├── README.md                    # Project documentation
├── public/                      # Frontend Web Assets
│   ├── index.html               # Semantic HTML with Tailwind v4 & Leaflet
│   ├── css/
│   │   └── style.css            # Tactical mission control stylesheet
│   └── js/
│       └── app.js               # Client controller, GPS engine, and API logic
├── server/                      # Backend Architecture
│   ├── db.js                    # Persistent database layer & seed dataset
│   ├── server.js                # Express app, Helmet, Rate Limiter
│   ├── middleware/
│   │   └── auth.js              # JWT, RBAC guards, and Sanitization
│   └── routes/
│       └── api.js               # REST API endpoints for all modules
└── src/                         # Standalone Java Application
    └── DisasterReliefSystem.java# Clean OOP Java 25 Console Implementation
```

---

## 📄 License
This project is licensed for humanitarian crisis management and academic evaluation. &copy; 2026 DRMS Rescue Network.
