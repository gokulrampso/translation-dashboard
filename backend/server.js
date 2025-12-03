import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import translationRoutes from './routes/translations.js';
import { initializeTranslationCache } from './services/translationService.js';
import { getLanguages, getFullCache } from './cache/translationCache.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Middleware
app.use(cors({
  origin: FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  const languages = getLanguages();
  const cache = getFullCache();
  const totalKeys = Object.values(cache).reduce((sum, lang) => sum + Object.keys(lang).length, 0);

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    cache: {
      languages: languages.length,
      totalKeys,
      languageList: languages,
    },
  });
});

// API routes
app.use('/api', translationRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.path,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // AWS SDK errors
  if (err.name === 'CredentialsProviderError') {
    return res.status(500).json({
      success: false,
      message: 'AWS credentials not configured properly',
      error: 'Please check your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY',
    });
  }

  if (err.name === 'ResourceNotFoundException') {
    return res.status(500).json({
      success: false,
      message: 'DynamoDB table not found',
      error: 'Please create the Translations table in DynamoDB',
    });
  }

  // Generic error response
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

// Start server
async function startServer() {
  try {
    // Initialize cache from DynamoDB
    await initializeTranslationCache();

    app.listen(PORT, () => {
      console.log(`\n🚀 Translation Manager Backend`);
      console.log(`   Server running on http://localhost:${PORT}`);
      console.log(`   Frontend URL: ${FRONTEND_URL}`);
      console.log(`   Health check: http://localhost:${PORT}/health\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

