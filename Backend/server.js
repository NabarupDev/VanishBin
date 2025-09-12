const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
require('dotenv').config();

// Import database connection
const connectDB = require('./config/database');

// Import routes
const shareRoutes = require('./routes/shareRoutes');

// Import cleanup service
const { scheduleCleanup } = require('./services/cleanupService');

// Import rate limiting middleware
const { globalRateLimit } = require('./middleware/rateLimiting');

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'https://vanishbin.vercel.app',
  'https://vanishbin.vercel.app/',
  process.env.FRONTEND_URL
].filter(Boolean); // Remove any undefined values

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Trust proxy for accurate IP detection behind reverse proxies
app.set('trust proxy', 1);

// Apply global rate limiting to all endpoints
app.use(globalRateLimit);

// Serve static files from uploads directory (for legacy files)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api', shareRoutes);

// Health check endpoint
app.get('/health', require('./middleware/rateLimiting').healthCheckRateLimit, (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    storage: 'Supabase',
    cleanup: 'Enabled',
    rateLimiting: 'Enabled'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    availableEndpoints: [
      'POST /api/upload - Upload text or file',
      'GET /api/:id - Get shared content',
      'GET /api/file/:id - Download file',
      'GET /api/all - Get all shares',
      'GET /api/cleanup/stats - Get cleanup statistics',
      'POST /api/cleanup - Manually trigger cleanup',
      'GET /api/rate-limit/stats - Get rate limiting statistics',
      'GET /health - Health check'
    ]
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: 'File too large. Maximum size is 50MB.' 
      });
    }
  }
  
  res.status(500).json({ 
    error: 'Internal server error' 
  });
});

// Start server
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/health`);
  console.log(`📤 Upload endpoint: http://localhost:${PORT}/api/upload`);
  console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`☁️ Storage: Supabase`);
  console.log(`🌐 Allowed CORS origins:`, allowedOrigins);
  
  // Start scheduled cleanup (every hour)
  if (process.env.ENABLE_SCHEDULED_CLEANUP !== 'false') {
    scheduleCleanup(60); // Run every 60 minutes
    console.log(`🧹 Scheduled cleanup enabled (every 60 minutes)`);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

module.exports = app;