require('dotenv').config();

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');

const connectDB = require('./config/db');
const { helmetMiddleware, corsMiddleware, clientIpMiddleware } = require('./config/security');
const { globalLimiter } = require('./middleware/rateLimiter');
const auditLoggerMiddleware = require('./middleware/auditLoggerMiddleware');
const apiRoutes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust reverse proxy if configured (Vercel, Cloudflare, NGINX)
app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS) || 1);

// Initialize Database Connection
connectDB();

// ----------------------------------------------------------------------------
// 1. Security & Core Middleware
// ----------------------------------------------------------------------------
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(clientIpMiddleware);
app.use(express.json());

// ----------------------------------------------------------------------------
// 2. Request Logging & Audit Middleware
// ----------------------------------------------------------------------------
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});
app.use(auditLoggerMiddleware);

// ----------------------------------------------------------------------------
// 3. Static Uploads
// ----------------------------------------------------------------------------
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ----------------------------------------------------------------------------
// 4. Serverless MongoDB Reconnection Guard
// ----------------------------------------------------------------------------
app.use(async (req, res, next) => {
  if (req.path === '/' || req.path === '/favicon.ico' || req.path === '/api/health') {
    return next();
  }
  try {
    await connectDB();
  } catch (_e) {}
  next();
});

// ----------------------------------------------------------------------------
// 5. System Status Root Endpoint
// ----------------------------------------------------------------------------
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'VeriFitor API',
    database: mongoose.connection.readyState === 1 ? 'connected' : (mongoose.connection.readyState === 2 ? 'connecting' : 'disconnected')
  });
});
app.get('/favicon.ico', (req, res) => res.status(204).end());

// ----------------------------------------------------------------------------
// 6. Centralized API Routes (Grouped by Department)
// ----------------------------------------------------------------------------
app.use('/api', globalLimiter, apiRoutes);

// ----------------------------------------------------------------------------
// 7. Error Handling Pipeline
// ----------------------------------------------------------------------------
app.use(notFoundHandler);
app.use(errorHandler);

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
