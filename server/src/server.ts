import app from './app';
import { connectDB, closeDB } from './config/db';
import { config } from './config';
import { isCloudinaryConfigured } from './config/cloudinary';
import { User } from './models/User';
import { seedData } from './scripts/seed';
import { logger } from './utils/logger';

// Handle uncaught exceptions (Section 8: Never crash without logging)
process.on('uncaughtException', (err: Error) => {
  logger.error('CRITICAL UNCAUGHT EXCEPTION 💥 Initiating emergency shutdown...', err);
  process.exit(1);
});

const startServer = async () => {
  // Connect to persistent MongoDB connection pool (Section 35)
  await connectDB();

  // Auto seed if empty or if requested student profile is missing
  try {
    const userCount = await User.countDocuments();
    const demo23SS = await User.findOne({ rollNumber: '23SS1A0535' });
    if (userCount === 0 || !demo23SS) {
      console.log('🌱 Database needs initialization. Running auto-seeding with student 23SS1A0535 & demo profiles...');
      await seedData();
    }
  } catch (seedErr) {
    logger.error('Database initialization check encountered an error:', seedErr);
  }

  const server = app.listen(config.PORT, () => {
    logger.info(`🚀 Server running in ${config.NODE_ENV} mode on port ${config.PORT}`);
    logger.info(`📡 API endpoint: http://localhost:${config.PORT}/api/v1`);
    logger.info(`💚 Health checks: http://localhost:${config.PORT}/health and /ready`);
    if (isCloudinaryConfigured()) {
      logger.info(`☁️ Cloudinary storage: Connected (Cloud Name: ${(config.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || '').trim()})`);
    } else {
      logger.warn(`⚠️ Cloudinary storage: Not configured. Set CLOUDINARY_CLOUD_NAME in .env`);
    }
  });

  // Handle unhandled promise rejections (Section 34)
  process.on('unhandledRejection', (err: any) => {
    logger.error('UNHANDLED REJECTION 💥 Closing server gracefully...', err);
    server.close(() => {
      closeDB().then(() => {
        process.exit(1);
      });
    });
  });

  // Graceful Shutdown for OCI VM, Docker, Load Balancer drain (Section 34)
  let isShuttingDown = false;
  const gracefulShutdown = (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    logger.info(`👋 ${signal} signal received. Draining existing requests and shutting down gracefully...`);

    // Force exit if connections do not close within 10 seconds
    const forceExitTimer = setTimeout(() => {
      logger.error('⚠️ Graceful shutdown timed out after 10s. Forcing exit.');
      process.exit(1);
    }, 10000);
    forceExitTimer.unref();

    server.close(async () => {
      logger.info('🔒 HTTP server closed: No longer accepting new connections.');
      try {
        await closeDB();
        logger.info('✅ Database pool closed cleanly. Process terminating.');
        process.exit(0);
      } catch (dbErr) {
        logger.error('Error during database pool closing:', dbErr);
        process.exit(1);
      }
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
};

startServer();
