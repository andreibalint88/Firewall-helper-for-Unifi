const express = require('express');
const router = express.Router();
const { 
  getAllUsers, 
  getUserById, 
  updateUser, 
  deleteUser, 
  deleteUserSessions,
  logAudit,
  getAuditLogs
} = require('../database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// All routes require admin access
router.use(authenticateToken);
router.use(requireAdmin);

// Get all users
router.get('/', (req, res) => {
  try {
    const users = getAllUsers();
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID
router.get('/:id', (req, res) => {
  const user = getUserById(req.params.id);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Don't return password hash
  const { password, ...userWithoutPassword } = user;
  res.json({ user: userWithoutPassword });
});

// Update user
router.put('/:id', (req, res) => {
  const { email, role, is_active, password } = req.body;
  
  // Prevent admin from deactivating themselves
  if (req.params.id === req.user.id && is_active === 0) {
    return res.status(400).json({ error: 'Cannot deactivate your own account' });
  }
  
  // Prevent admin from changing their own role
  if (req.params.id === req.user.id && role && role !== 'admin') {
    return res.status(400).json({ error: 'Cannot change your own role' });
  }
  
  try {
    const updates = {};
    if (email !== undefined) updates.email = email;
    if (role !== undefined) updates.role = role;
    if (is_active !== undefined) updates.is_active = is_active;
    if (password !== undefined) updates.password = password;
    
    updateUser(req.params.id, updates);
    
    // If deactivating user, delete their sessions
    if (is_active === 0) {
      deleteUserSessions(req.params.id);
    }
    
    logAudit(req.user.id, req.user.username, 'user_updated', `Updated user ID: ${req.params.id}`, req.ip);
    
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
router.delete('/:id', (req, res) => {
  // Prevent admin from deleting themselves
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }
  
  try {
    deleteUserSessions(req.params.id);
    deleteUser(req.params.id);
    
    logAudit(req.user.id, req.user.username, 'user_deleted', `Deleted user ID: ${req.params.id}`, req.ip);
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get audit logs
router.get('/audit/logs', (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const userId = req.query.user_id ? parseInt(req.query.user_id) : null;
  
  try {
    const logs = getAuditLogs(limit, userId);
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

module.exports = router;
