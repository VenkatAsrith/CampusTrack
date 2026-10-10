import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middlewares/error';
import { requestIdMiddleware } from './middlewares/requestId';
import { requestLogger } from './utils/logger';
import { globalLimiter, authLimiter, uploadLimiter } from './middlewares/rateLimiter';
import { AppError } from './utils/errors';

import healthRoutes from './routes/healthRoutes';
import authRoutes from './routes/authRoutes';
import studentsRoutes from './routes/studentsRoutes';
import codingProfileRoutes from './routes/codingProfileRoutes';
import projectRoutes from './routes/projectRoutes';
import internshipRoutes from './routes/internshipRoutes';
import certificationRoutes from './routes/certificationRoutes';
import nptelRoutes from './routes/nptelRoutes';
import hackathonRoutes from './routes/hackathonRoutes';
import achievementRoutes from './routes/achievementRoutes';
import documentRoutes from './routes/documentRoutes';
import adminRoutes from './routes/adminRoutes';
import exportRoutes from './routes/exportRoutes';
import announcementRoutes from './routes/announcementRoutes';
import syncRoutes from './routes/syncRoutes';
import { config } from './config';

const app = express();

// Trust reverse proxy (e.g. NGINX, OCI Load Balancer) for secure cookies & IP detection
app.set('trust proxy', 1);

// Security Headers (Section 30)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false, // Handled by reverse proxy / frontend
  })
);

// Request Correlation ID (Section 42) & Structured Logging (Section 43)
app.use(requestIdMiddleware);
app.use(requestLogger);

// Secure CORS configuration (Section 31)
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://localhost:4173',
  config.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        config.NODE_ENV === 'development' ||
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.onrender.com') ||
        origin.endsWith('.netlify.app') ||
        origin.includes('localhost')
      ) {
        callback(null, true);
      } else {
        callback(new Error('CORS policy: Origin not permitted'));
      }
    },
    credentials: true,
    exposedHeaders: ['X-Request-Id'],
  })
);

// Body parser with institutional payload limits (Section 29)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health & Readiness checks (Section 33) - Available at both root and /api/v1 for load balancers
app.use('/', healthRoutes);
app.use('/api/v1', healthRoutes);

// Rate Limiting (Section 28)
app.use('/api/v1', globalLimiter);
app.use('/api/v1/auth', authLimiter);
app.use('/api/v1/documents/upload', uploadLimiter);

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/students', studentsRoutes);
app.use('/api/v1/coding-profiles', codingProfileRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/internships', internshipRoutes);
app.use('/api/v1/certifications', certificationRoutes);
app.use('/api/v1/nptel', nptelRoutes);
app.use('/api/v1/hackathons', hackathonRoutes);
app.use('/api/v1/achievements', achievementRoutes);
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/announcements', announcementRoutes);
app.use('/api/v1/exports', exportRoutes);
app.use('/api/v1/sync', syncRoutes);

// Unhandled API & Server Route Handler (Section 6: 404 Handler)
app.all('*', (req, res, next) => {
  next(new AppError(`Endpoint ${req.method} ${req.originalUrl} not found on this server.`, 404, 'RESOURCE_NOT_FOUND'));
});

// Global Centralized Error Handler (Section 5)
app.use(errorHandler);

export default app;
