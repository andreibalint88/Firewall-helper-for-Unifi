const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'users.db');

// Ensure data directory exists
const fs = require('fs');
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Create users table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    is_active INTEGER DEFAULT 1
  )
`);

// Create sessions table for tracking
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

// Create audit log table
db.exec(`
  CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    username TEXT,
    action TEXT NOT NULL,
    details TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Helper functions
const createUser = (username, password, email = null, role = 'user') => {
  const hashedPassword = bcrypt.hashSync(password, 10);
  const stmt = db.prepare(`
    INSERT INTO users (username, password, email, role) 
    VALUES (?, ?, ?, ?)
  `);
  return stmt.run(username, hashedPassword, email, role);
};

const getUserByUsername = (username) => {
  const stmt = db.prepare('SELECT * FROM users WHERE username = ? AND is_active = 1');
  return stmt.get(username);
};

const getUserById = (id) => {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  return stmt.get(id);
};

const getAllUsers = () => {
  const stmt = db.prepare('SELECT id, username, email, role, created_at, last_login, is_active FROM users');
  return stmt.all();
};

const verifyPassword = (password, hashedPassword) => {
  return bcrypt.compareSync(password, hashedPassword);
};

const updateUser = (id, updates) => {
  const fields = [];
  const values = [];
  
  if (updates.password) {
    fields.push('password = ?');
    values.push(bcrypt.hashSync(updates.password, 10));
  }
  if (updates.email !== undefined) {
    fields.push('email = ?');
    values.push(updates.email);
  }
  if (updates.role !== undefined) {
    fields.push('role = ?');
    values.push(updates.role);
  }
  if (updates.is_active !== undefined) {
    fields.push('is_active = ?');
    values.push(updates.is_active);
  }
  if (updates.last_login !== undefined) {
    fields.push('last_login = ?');
    values.push(updates.last_login);
  }
  
  if (fields.length === 0) return null;
  
  values.push(id);
  const stmt = db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`);
  return stmt.run(...values);
};

const deleteUser = (id) => {
  const stmt = db.prepare('DELETE FROM users WHERE id = ?');
  return stmt.run(id);
};

const createSession = (userId, token, ipAddress = null, userAgent = null, expiresAt) => {
  const stmt = db.prepare(`
    INSERT INTO sessions (user_id, token, expires_at, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?)
  `);
  return stmt.run(userId, token, expiresAt, ipAddress, userAgent);
};

const validateSession = (token) => {
  const stmt = db.prepare(`
    SELECT s.*, u.username, u.role, u.email 
    FROM sessions s 
    JOIN users u ON s.user_id = u.id 
    WHERE s.token = ? AND s.expires_at > datetime('now') AND u.is_active = 1
  `);
  return stmt.get(token);
};

const deleteSession = (token) => {
  const stmt = db.prepare('DELETE FROM sessions WHERE token = ?');
  return stmt.run(token);
};

const deleteUserSessions = (userId) => {
  const stmt = db.prepare('DELETE FROM sessions WHERE user_id = ?');
  return stmt.run(userId);
};

const logAudit = (userId, username, action, details = null, ipAddress = null) => {
  const stmt = db.prepare(`
    INSERT INTO audit_log (user_id, username, action, details, ip_address)
    VALUES (?, ?, ?, ?, ?)
  `);
  return stmt.run(userId, username, action, details, ipAddress);
};

const getAuditLogs = (limit = 100, userId = null) => {
  let stmt;
  if (userId) {
    stmt = db.prepare('SELECT * FROM audit_log WHERE user_id = ? ORDER BY created_at DESC LIMIT ?');
    return stmt.all(userId, limit);
  } else {
    stmt = db.prepare('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ?');
    return stmt.all(limit);
  }
};

// Create default admin user if no users exist
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
if (userCount.count === 0) {
  console.log('No users found. Creating default admin user...');
  try {
    createUser('admin', 'admin123', 'admin@example.com', 'admin');
    console.log('Default admin user created:');
    console.log('  Username: admin');
    console.log('  Password: admin123');
    console.log('  ⚠️  Please change this password immediately after first login!');
  } catch (error) {
    console.error('Error creating default admin user:', error.message);
  }
}

module.exports = {
  db,
  createUser,
  getUserByUsername,
  getUserById,
  getAllUsers,
  verifyPassword,
  updateUser,
  deleteUser,
  createSession,
  validateSession,
  deleteSession,
  deleteUserSessions,
  logAudit,
  getAuditLogs
};
