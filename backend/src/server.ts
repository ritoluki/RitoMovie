import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import middleware from 'i18next-http-middleware';
import connectDB from './config/database';
import errorHandler from './middleware/errorHandler';
import i18next from './config/i18n';

// Load environment variables
dotenv.config();

// Initialize express app
const app: Application = express();

// Connect to database
connectDB();

// Middleware
app.use(helmet()); // Security headers

// CORS configuration - support multiple origins
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://152.42.172.52',
  'http://152.42.172.52:5173',
].filter(Boolean); // Remove any undefined/null values

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // In development, log the blocked origin for debugging
      if (process.env.NODE_ENV === 'development') {
        console.warn(`CORS blocked origin: ${origin}. Allowed origins:`, allowedOrigins);
      }
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
}));
app.use(express.json()); // Body parser
app.use(express.urlencoded({ extended: true }));

// i18n middleware (must be after body parser)
app.use(middleware.handle(i18next));

// Serve static files
app.use('/uploads', express.static('uploads'));

// API Routes
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'RitoMovie API is running',
    version: '1.0.0',
  });
});

// Import routes
import authRoutes from './routes/auth';
import movieRoutes from './routes/movies';
import videoRoutes from './routes/videos';
import userRoutes from './routes/users';
import commentRoutes from './routes/comments';

app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/users', userRoutes);
app.use('/api/comments', commentRoutes);

// Health check with database status
app.get('/health', (_req: Request, res: Response) => {
  const dbStatus = mongoose.connection.readyState;
  const dbStates: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  const isHealthy = dbStatus === 1; // 1 = connected

  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    message: isHealthy ? 'Server is healthy' : 'Server is unhealthy',
    timestamp: new Date().toISOString(),
    database: {
      status: dbStates[dbStatus] || 'unknown',
      readyState: dbStatus,
      connected: isHealthy,
      host: mongoose.connection.host || 'N/A',
      name: mongoose.connection.name || 'N/A',
    },
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => {
    process.exit(1);
  });
});

export default app;

