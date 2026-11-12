const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const { initDatabase, ensureDefaultAdmin } = require('./database');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:5173', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'dist')));
  
  // Handle SPA routing - serve index.html for all non-API routes
  app.get('{*path}', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize database and start server
async function startServer() {
  try {
    await initDatabase();
    ensureDefaultAdmin();
    console.log('Database initialized successfully');
    
    // Start server
    app.listen(PORT, () => {
      console.log(`
╔══════════════════════════════════════════════════════════╗
║   UniFi Firewall Manager - Authentication Server        ║
╠══════════════════════════════════════════════════════════╣
║  Server running on port ${PORT}                           ║
║  Environment: ${process.env.NODE_ENV || 'development'}                             ║
║  API: http://localhost:${PORT}/api                          ║
╚══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
