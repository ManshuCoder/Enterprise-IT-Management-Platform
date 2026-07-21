import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/eimp';

export const dbState = {
  isMock: false
};

export const connectDB = async (): Promise<void> => {
  try {
    // Set a fast timeout so it falls back quickly if MongoDB is missing
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 2000
    });
    console.log('MongoDB connected successfully to:', MONGODB_URI);
  } catch (error) {
    console.warn('\n=============================================================');
    console.warn('  WARNING: MongoDB service not detected or connection failed.');
    console.error('  Error Details:', error);
    console.warn('  FALLING BACK TO LOCAL JSON persistency driver (db_fallback.json).');
    console.warn('=============================================================\n');
    dbState.isMock = true;
  }
};
