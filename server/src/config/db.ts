import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { config } from './index';

let mongod: MongoMemoryServer | null = null;

export const connectDB = async (): Promise<void> => {
  let mongoUri = config.MONGODB_URI;

  mongoose.set('strictQuery', true);

  if (mongoUri) {
    try {
      console.log('📡 Connecting to configured MongoDB URI...');
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`💚 MongoDB Connected: ${mongoose.connection.host}`);
      return;
    } catch (err: any) {
      console.warn('⚠️ Could not connect to remote MongoDB Atlas:');
      console.warn(`   Reason: ${err.message}`);
      console.warn('💡 Tip: Make sure your current IP address is whitelisted (or 0.0.0.0/0) in MongoDB Atlas -> Network Access.');
      console.warn('🔄 Falling back to in-memory MongoDB Server so the application continues to run seamlessly...');
    }
  } else {
    console.log('⚠️ No MONGODB_URI environment variable found.');
  }

  try {
    console.log('🚀 Initializing in-memory MongoDB Server...');
    mongod = await MongoMemoryServer.create();
    mongoUri = mongod.getUri();
    await mongoose.connect(mongoUri);
    console.log(`✅ In-memory MongoDB running and connected at: ${mongoUri}`);
  } catch (error) {
    console.error('❌ Critical database error starting in-memory MongoDB:', error);
    process.exit(1);
  }
};

export const closeDB = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    if (mongod) {
      await mongod.stop();
    }
    console.log('✅ Database connections closed.');
  } catch (error) {
    console.error('Error during DB closing:', error);
  }
};
