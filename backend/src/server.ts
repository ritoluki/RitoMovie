import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
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
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
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

app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
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

