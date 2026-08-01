import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { config } from './index';

let mongod: MongoMemoryServer | null = null;

export const connectDB = async (): Promise<void> => {
  try {
    let mongoUri = config.MONGODB_URI;

    if (!mongoUri) {
      console.log('⚠️ No MONGODB_URI environment variable found.');
      console.log('🚀 Initializing in-memory MongoDB Server for demo/testing...');
      mongod = await MongoMemoryServer.create();
      mongoUri = mongod.getUri();
      console.log(`✅ In-memory MongoDB running at: ${mongoUri}`);
    }

    mongoose.set('strictQuery', true);
    await mongoose.connect(mongoUri);

    console.log(`💚 MongoDB Connected: ${mongoose.connection.host}`);
  } catch (error) {
    console.error('❌ Database connection error:', error);
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
