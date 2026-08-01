import app from './app';
import { connectDB, closeDB } from './config/db';
import { config } from './config';
import { User } from './models/User';
import { seedData } from './scripts/seed';

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});

const startServer = async () => {
  // Connect to DB
  await connectDB();

  // Auto seed if empty
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    console.log('🌱 Database is empty. Running auto-seeding...');
    await seedData();
  }

  const server = app.listen(config.PORT, () => {
    console.log(`🚀 Server running in ${config.NODE_ENV} mode on port ${config.PORT}`);
    console.log(`📡 API endpoint: http://localhost:${config.PORT}/api/v1`);
  });

  // Handle unhandled rejections
  process.on('unhandledRejection', (err: any) => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down gracefully...');
    console.error(err.name, err.message);
    server.close(() => {
      closeDB().then(() => {
        process.exit(1);
      });
    });
  });

  // Handle termination signals
  const shutdown = () => {
    console.log('👋 SIGTERM/SIGINT received. Shutting down gracefully...');
    server.close(() => {
      closeDB().then(() => {
        console.log('💥 Process terminated.');
        process.exit(0);
      });
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

startServer();
