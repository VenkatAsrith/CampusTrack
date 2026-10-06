import dotenv from 'dotenv';
import path from 'path';

// Explicitly load server/.env
dotenv.config({ path: path.join(__dirname, '../server/.env') });

import { v2 as cloudinary } from 'cloudinary';

console.log('Testing Cloudinary Connection...');
console.log('CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('API_KEY:', process.env.CLOUDINARY_API_KEY ? 'Present (length: ' + process.env.CLOUDINARY_API_KEY.length + ')' : 'Missing');
console.log('API_SECRET:', process.env.CLOUDINARY_API_SECRET ? 'Present (length: ' + process.env.CLOUDINARY_API_SECRET.length + ')' : 'Missing');

cloudinary.config({
  cloud_name: (process.env.CLOUDINARY_CLOUD_NAME || '').trim(),
  api_key: (process.env.CLOUDINARY_API_KEY || '').trim(),
  api_secret: (process.env.CLOUDINARY_API_SECRET || '').trim(),
  secure: true,
});

async function test() {
  try {
    const ping = await cloudinary.api.ping();
    console.log('Cloudinary Ping Result:', ping);

    // Test a tiny buffer upload
    const testBuffer = Buffer.from('CampusTrack test document buffer');
    const uploadRes = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'campustrack/test',
          resource_type: 'raw',
          public_id: 'connection_test_' + Date.now(),
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(testBuffer);
    });

    console.log('Cloudinary Upload Test Succeeded:', (uploadRes as any).secure_url);

    // Clean up test file
    await cloudinary.uploader.destroy((uploadRes as any).public_id, { resource_type: 'raw' });
    console.log('Cleanup Succeeded! Cloudinary is 100% operational.');
  } catch (err: any) {
    console.error('Cloudinary Test Failed:', err);
  }
}

test();
