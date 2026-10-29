const jwt = require('jsonwebtoken');
const validator = require('validator');

const JWT_SECRET = process.env.JWT_SECRET || 'disaster-relief-secret-key-2026-super-secure-jwt';

// Authentication Middleware: extracts & validates token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    req.user = { id: 'ANONYMOUS', role: 'public', fullName: 'Public Citizen' };
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      // Invalid/expired token
      req.user = { id: 'ANONYMOUS', role: 'public', fullName: 'Public Citizen' };
      return next();
    }
    req.user = user;
    next();
  });
}

// Role Authorization Guard Middleware
function requireRoles(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    if (allowedRoles.includes('*') || allowedRoles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: `Access Denied: Requires elevated role [${allowedRoles.join(' or ')}]. Current role is '${req.user.role}'`
    });
  };
}

// Input Sanitization Middleware to prevent injection / XSS attacks
function sanitizeInputs(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    sanitizeObject(req.query);
  }
  next();
}

function sanitizeObject(obj) {
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'string') {
      // Trim and escape critical characters
      obj[key] = validator.escape(obj[key].trim());
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
}

module.exports = {
  JWT_SECRET,
  authenticateToken,
  requireRoles,
  sanitizeInputs
};
