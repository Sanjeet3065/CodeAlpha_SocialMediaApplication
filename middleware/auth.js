const jwt = require('jsonwebtoken');
const { db } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'pulse_secret_key_super_secure_2026';

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

function verifyToken(req) {
  let token = null;

  // Check Authorization header: Bearer <token>
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Fetch fresh user record
    const user = db.prepare(`
      SELECT id, username, email, name, bio, avatar, banner, location, website, verified, created_at
      FROM users WHERE id = ?
    `).get(decoded.id);
    return user || null;
  } catch (err) {
    return null;
  }
}

// Middleware: requires login
function requireAuth(req, res, next) {
  const user = verifyToken(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }
  req.user = user;
  next();
}

// Middleware: optional auth (sets req.user if token is present and valid)
function optionalAuth(req, res, next) {
  const user = verifyToken(req);
  req.user = user;
  next();
}

module.exports = {
  generateToken,
  requireAuth,
  optionalAuth,
  JWT_SECRET
};
