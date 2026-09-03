import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config();

export const config = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET || 'campustracksecretkeyv1_deepmind_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  GOOGLE_SHEETS_SPREADSHEET_ID: process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '1w2T9SHihyIOdKWXCkYYPu7R_U2ZYqB3j4zhrQjXKQBk',
  GOOGLE_SHEETS_SYNC_SECRET: process.env.GOOGLE_SHEETS_SYNC_SECRET || 'campustrack_sync_secret_prod_987654321',
  UPLOAD_DIR: process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads'),
};
