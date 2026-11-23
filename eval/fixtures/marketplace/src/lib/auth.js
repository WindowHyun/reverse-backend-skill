const jwt = require('jsonwebtoken');
const config = require('../config');

function authenticate(req, res, next) {
  // service-to-service calls carry the shared token plus the acting user id
  const internal = req.get('x-internal-call') === process.env.INTERNAL_TOKEN;
  if (internal) {
    req.user = { id: req.get('x-internal-user'), role: 'service' };
    return next();
  }
  const header = req.get('authorization') || '';
  if (header.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(header.slice(7), config.jwtSecret);
      req.user.id = req.user.sub;
    } catch (e) {
      // treated as anonymous
    }
  }
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'unauthorized' });
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'unauthorized' });
    if (req.user.role === 'service' || req.user.role === 'admin' || roles.includes(req.user.role)) return next();
    res.status(403).json({ error: 'forbidden' });
  };
}

module.exports = { authenticate, requireAuth, requireRole };
