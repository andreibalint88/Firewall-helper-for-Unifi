const jwt = require('jsonwebtoken');
const { validateSession } = require('../database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  // Check for token in Authorization header or cookie
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  // Also check cookies
  const cookieToken = req.cookies && req.cookies.auth_token;
  
  const authToken = token || cookieToken;
  
  if (!authToken) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  try {
    // Verify JWT
    const decoded = jwt.verify(authToken, JWT_SECRET);
    
    // Validate session in database
    const session = validateSession(authToken);
    
    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
    
    // Attach user info to request
    req.user = {
      id: session.user_id,
      username: session.username,
      role: session.role,
      email: session.email
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

module.exports = {
  authenticateToken,
  requireAdmin,
  generateToken,
  JWT_SECRET
};
