import { v2 as cloudinary } from 'cloudinary';
import { config } from './index';

/**
 * Dynamically configures Cloudinary with values from config or process.env, trimming any whitespace.
 */
export const configureCloudinary = () => {
  const cloud_name = (process.env.CLOUDINARY_CLOUD_NAME || config.CLOUDINARY_CLOUD_NAME || '').trim();
  const api_key = (process.env.CLOUDINARY_API_KEY || config.CLOUDINARY_API_KEY || '').trim();
  const api_secret = (process.env.CLOUDINARY_API_SECRET || config.CLOUDINARY_API_SECRET || '').trim();

  if (cloud_name && api_key && api_secret) {
    cloudinary.config({
      cloud_name,
      api_key,
      api_secret,
      secure: true,
    });
  }

  return { cloud_name, api_key, api_secret };
};

// Initial configuration
configureCloudinary();

/**
 * Checks if all required Cloudinary credentials are provided.
 */
export const isCloudinaryConfigured = (): boolean => {
  const { cloud_name, api_key, api_secret } = configureCloudinary();
  return Boolean(cloud_name && api_key && api_secret);
};

export { cloudinary };
