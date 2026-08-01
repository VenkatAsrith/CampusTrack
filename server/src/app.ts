import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middlewares/error';
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
import { config } from './config';

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: config.NODE_ENV === 'development' ? 'http://localhost:5173' : '*', // Allow client port
  credentials: true,
}));

// Body parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

// API Routes
app.use('/api/v1/auth', authLimiter, authRoutes);
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
app.use('/api/v1/exports', exportRoutes);

// Base route for connectivity check
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'CampusTrack API is operational.' });
});

// Global Error Handler
app.use(errorHandler);

export default app;
