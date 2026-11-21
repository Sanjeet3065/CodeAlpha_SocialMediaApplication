const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { initDatabase } = require('./db');

// Initialize database schema and seeds
initDatabase();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Serve static assets
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Mount API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/users', require('./routes/users'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/stories', require('./routes/stories'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/messages', require('./routes/messages'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Haven — Thoughtful Social Space',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// SPA fallback for unmatched non-API routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    error: err.message || 'An unexpected server error occurred'
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`
======================================================
  ✦ HAVEN — THOUGHTFUL SOCIAL SPACE
  ✨ Status: Server running in production-grade mode
  🌐 URL: http://localhost:${PORT}
  📁 Database: SQLite (WAL mode enabled)
======================================================
    `);
  });
}

module.exports = app;
