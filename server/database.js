const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'users.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db = null;

// Initialize database
async function initDatabase() {
  const SQL = await initSqlJs();
  
  // Load existing database or create new one
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  
  // Create users table
  db.run(`
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
  db.run(`
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
  db.run(`
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
  
  saveDatabase();
  
  return db;
}

// Save database to disk
function saveDatabase() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

// Helper functions
function createUser(username, password, email = null, role = 'user') {
  const hashedPassword = bcrypt.hashSync(password, 10);
  db.run(
    'INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)',
    [username, hashedPassword, email, role]
  );
  saveDatabase();
  return db.exec('SELECT last_insert_rowid()')[0].values[0][0];
}

function getUserByUsername(username) {
  const stmt = db.prepare('SELECT * FROM users WHERE username = ? AND is_active = 1');
  stmt.bind([username]);
  
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

function getUserById(id) {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  stmt.bind([id]);
  
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

function getAllUsers() {
  const results = db.exec('SELECT id, username, email, role, created_at, last_login, is_active FROM users');
  if (results.length === 0) return [];
  
  const columns = results[0].columns;
  return results[0].values.map(row => {
    const obj = {};
    columns.forEach((col, i) => obj[col] = row[i]);
    return obj;
  });
}

function verifyPassword(password, hashedPassword) {
  return bcrypt.compareSync(password, hashedPassword);
}

function updateUser(id, updates) {
  const sets = [];
  const values = [];
  
  if (updates.password) {
    sets.push('password = ?');
    values.push(bcrypt.hashSync(updates.password, 10));
  }
  if (updates.email !== undefined) {
    sets.push('email = ?');
    values.push(updates.email);
  }
  if (updates.role !== undefined) {
    sets.push('role = ?');
    values.push(updates.role);
  }
  if (updates.is_active !== undefined) {
    sets.push('is_active = ?');
    values.push(updates.is_active);
  }
  if (updates.last_login !== undefined) {
    sets.push('last_login = ?');
    values.push(updates.last_login);
  }
  
  if (sets.length === 0) return null;
  
  values.push(id);
  db.run(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, values);
  saveDatabase();
  return true;
}

function deleteUser(id) {
  db.run('DELETE FROM users WHERE id = ?', [id]);
  saveDatabase();
  return true;
}

function createSession(userId, token, ipAddress = null, userAgent = null, expiresAt) {
  db.run(
    'INSERT INTO sessions (user_id, token, expires_at, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)',
    [userId, token, expiresAt, ipAddress, userAgent]
  );
  saveDatabase();
  return true;
}

function validateSession(token) {
  const stmt = db.prepare(`
    SELECT s.*, u.username, u.role, u.email 
    FROM sessions s 
    JOIN users u ON s.user_id = u.id 
    WHERE s.token = ? AND s.expires_at > datetime('now') AND u.is_active = 1
  `);
  stmt.bind([token]);
  
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

function deleteSession(token) {
  db.run('DELETE FROM sessions WHERE token = ?', [token]);
  saveDatabase();
  return true;
}

function deleteUserSessions(userId) {
  db.run('DELETE FROM sessions WHERE user_id = ?', [userId]);
  saveDatabase();
  return true;
}

function logAudit(userId, username, action, details = null, ipAddress = null) {
  db.run(
    'INSERT INTO audit_log (user_id, username, action, details, ip_address) VALUES (?, ?, ?, ?, ?)',
    [userId, username, action, details, ipAddress]
  );
  saveDatabase();
  return true;
}

function getAuditLogs(limit = 100, userId = null) {
  let query;
  let params;
  
  if (userId) {
    query = 'SELECT * FROM audit_log WHERE user_id = ? ORDER BY created_at DESC LIMIT ?';
    params = [userId, limit];
  } else {
    query = 'SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ?';
    params = [limit];
  }
  
  const results = db.exec(query, params);
  if (results.length === 0) return [];
  
  const columns = results[0].columns;
  return results[0].values.map(row => {
    const obj = {};
    columns.forEach((col, i) => obj[col] = row[i]);
    return obj;
  });
}

// Create default admin user if no users exist
function ensureDefaultAdmin() {
  const result = db.exec('SELECT COUNT(*) as count FROM users');
  const count = result[0].values[0][0];
  
  if (count === 0) {
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
}

module.exports = {
  initDatabase,
  getDb: () => db,
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
  getAuditLogs,
  ensureDefaultAdmin
};
