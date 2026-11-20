const express = require('express');
const router = express.Router();
const { 
  getUserByUsername, 
  verifyPassword, 
  createUser, 
  createSession, 
  deleteSession,
  logAudit,
  updateUser
} = require('../database');
const { generateToken, authenticateToken } = require('../middleware/auth');

// Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  
  const user = getUserByUsername(username);
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  if (!verifyPassword(password, user.password)) {
    logAudit(user.id, username, 'login_failed', 'Wrong password', req.ip);
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Generate token
  const token = generateToken(user);
  
  // Create session (expires in 24 hours)
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  createSession(user.id, token, req.ip, req.get('User-Agent'), expiresAt);
  
  // Update last login
  updateUser(user.id, { last_login: new Date().toISOString() });
  
  // Log successful login
  logAudit(user.id, username, 'login_success', null, req.ip);
  
  // Set cookie
  res.cookie('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });
  
  res.json({
    message: 'Login successful',
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    },
    token: token
  });
});

// Register (admin only)
router.post('/register', authenticateToken, (req, res) => {
  const { username, password, email, role } = req.body;
  
  // Only admins can create users
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can create users' });
  }
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  
  // Check if username exists
  const existingUser = getUserByUsername(username);
  if (existingUser) {
    return res.status(409).json({ error: 'Username already exists' });
  }
  
  try {
    const result = createUser(username, password, email, role || 'user');
    logAudit(req.user.id, req.user.username, 'user_created', `Created user: ${username}`, req.ip);
    
    res.status(201).json({
      message: 'User created successfully',
      userId: result.lastInsertRowid
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Logout
router.post('/logout', authenticateToken, (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1] || req.cookies?.auth_token;
  
  if (token) {
    deleteSession(token);
    logAudit(req.user.id, req.user.username, 'logout', null, req.ip);
  }
  
  res.clearCookie('auth_token');
  res.json({ message: 'Logout successful' });
});

// Get current user
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role
    }
  });
});

// Change password
router.post('/change-password', authenticateToken, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password required' });
  }
  
  const user = getUserByUsername(req.user.username);
  
  if (!verifyPassword(currentPassword, user.password)) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }
  
  try {
    updateUser(req.user.id, { password: newPassword });
    logAudit(req.user.id, req.user.username, 'password_changed', null, req.ip);
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to change password' });
  }
});

module.exports = router;
