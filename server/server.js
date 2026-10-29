require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { authenticateToken, sanitizeInputs } = require('./middleware/auth');
const apiRoutes = require('./routes/api');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB Atlas
if (process.env.MONGODB_URI) {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
      console.log('  🍃 MongoDB Atlas Connected: Cloud Database Synchronized');
    })
    .catch((err) => {
      console.warn('  ⚠️ MongoDB Atlas Connection Notice:', err.message);
    });
}

// Security Middleware: Helmet with CSP relaxed for smooth local browser interaction & Tailwind/Leaflet
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);

// CORS configuration
app.use(cors());

// Rate Limiting (Configured with high capacity for real-time dashboards & polling)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000, // Generous capacity for live polling & dashboards
  message: { success: false, error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

const highFrequencyLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 1000,
  message: { success: false, error: 'Rate limit exceeded for critical operations. Please wait a moment.' }
});

app.use(generalLimiter);

// Body Parsers
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Input sanitization middleware
app.use(sanitizeInputs);

// Authentication parsing middleware
app.use(authenticateToken);

// Static frontend files
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/auth', highFrequencyLimiter);
app.use('/api/sos', highFrequencyLimiter);
app.use('/api', apiRoutes);

// Fallback to index.html for SPA routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred.' : err.message
  });
});

const server = app.listen(PORT, () => {
  console.log(`================================================================`);
  console.log(`  🚨 DISASTER RELIEF MANAGEMENT WEB SERVER RUNNING ON PORT ${PORT}`);
  console.log(`  🌐 URL: http://localhost:${PORT}`);
  console.log(`  🛡️  Security Headers (Helmet) & Rate Limiting: ACTIVE`);
  console.log(`================================================================`);
});

module.exports = server;
