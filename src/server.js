require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// 1. High-Visibility Terminal Request Logger Middleware (Runs BEFORE CORS & Routes)
app.use((req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toLocaleTimeString();
  
  // Log request arrival immediately
  console.log(`\n[API REQUEST ${timestamp}] 🚀 ${req.method} ${req.originalUrl}`);

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const color = status >= 500 ? '\x1b[31m' : status >= 400 ? '\x1b[33m' : status >= 300 ? '\x1b[36m' : '\x1b[32m';
    const reset = '\x1b[0m';
    console.log(`[API RESPONSE ${timestamp}] ${color}${status} ${res.statusMessage || ''}${reset} in ${duration}ms (${req.method} ${req.originalUrl})`);
  });
  next();
});

// Connect to MongoDB
connectDB();

// CORS configuration - Allow Next.js frontend URL
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:3001',
  'http://localhost:3000' // standard Next.js default port
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.indexOf(origin) !== -1 ||
      origin.startsWith('http://localhost:') ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.onrender.com')
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


// Serve uploaded media statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));


// Routes mapping
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/teams', require('./routes/teamRoutes'));
app.use('/api/players', require('./routes/playerRoutes'));
app.use('/api/matches', require('./routes/matchRoutes'));
app.use('/api/results', require('./routes/resultRoutes'));
app.use('/api/standings', require('./routes/standingsRoutes'));
app.use('/api/media', require('./routes/mediaRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));
app.use('/api/rules', require('./routes/ruleRoutes'));
app.use('/api/admin/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/admin/audit-logs', require('./routes/auditRoutes'));

// Root Endpoint & Health check endpoints
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'BGMI College Esports Tournament API is active and running',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      teams: '/api/teams',
      matches: '/api/matches',
      standings: '/api/standings'
    }
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'BGMI College Esports Tournament API is healthy and running' });
});

// Centralized error handler middleware
app.use(errorHandler);

// Listen on Port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
