/**
 * Main server file for Fake Pinterest application
 * Configures Express server with middleware, authentication, and API routes
 * 
 * @module server
 */

const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const cors = require('cors');
const axios = require('axios');
const helmet = require('helmet');
const compression = require('compression');
const MongoStore = require('connect-mongo');
const path = require('path');
const fs = require('fs');

require('dotenv').config();

// Initialize Express app
const app = express();

// IMPORTANT: Add the health check route before any middleware
app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Pinterest Clone API is running',
    timestamp: new Date().toISOString()
  });
});

// Connect to MongoDB database
try {
  require('./config/db')();
} catch (err) {
  console.error('MongoDB connection error:', err);
  // Continue without failing the app
}

// Initialize Firebase Admin (no need to store result as it's initialized in the module)
try {
  require('./config/firebase');
} catch (err) {
  console.error('Firebase initialization error:', err);
  // Continue without failing the app
}

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add compression for better performance
app.use(compression());

// Security headers with Helmet - disable CSP to avoid path-to-regexp issues
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false
}));

// Enable CORS
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

// Express session configuration with MongoDB store
try {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'keyboard cat',
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({ 
        mongoUrl: process.env.MONGO_URI || 'mongodb://localhost:27017/pinterest-clone',
        collectionName: 'sessions'
      }),
      cookie: {
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax' // Fix SameSite warning
      }
    })
  );
} catch (err) {
  console.error('Session setup error:', err);
  // Continue without session store
}

// Serve static files from the uploads directory with explicit CORS headers
app.use('/uploads', (req, res, next) => {
  // Explicitly set all headers needed for cross-origin image loading
  res.removeHeader('Cross-Origin-Resource-Policy');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

  // Handle OPTIONS requests for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
}, express.static(path.join(__dirname, 'uploads')));

// API routes
try {
  // API Routes with '/api' prefix
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/images', require('./routes/images'));

  // API health check endpoint
  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });
} catch (err) {
  console.error('Error setting up routes:', err);
}

// Global error handler middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Server Error',
    error: process.env.NODE_ENV === 'production' ? {} : err.message
  });
});

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({ message: 'Resource not found' });
});

// Start the server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  // Don't exit in production
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});
