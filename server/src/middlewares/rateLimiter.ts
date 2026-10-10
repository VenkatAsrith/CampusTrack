import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

const createRateLimiterResponse = (windowMinutes: number, customMsg?: string) => {
  return (req: Request, res: Response) => {
    const retryAfter = res.getHeader('Retry-After') || `${windowMinutes * 60}`;
    res.status(429).json({
      success: false,
      status: 'fail',
      error: {
        code: 'RATE_LIMITED',
        message: customMsg || `Too many requests from this address. Please wait a moment before trying again.`,
        retryAfterSeconds: Number(retryAfter) || windowMinutes * 60,
      },
      message: customMsg || `Too many requests. Please wait before retrying.`,
      requestId: req.id,
    });
  };
};

/**
 * General API Limiter: Prevents general flood / DDoS spikes
 * 500 requests per 15 minutes by default, configurable via RATE_LIMIT_GLOBAL_MAX env
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_GLOBAL_MAX || '1000', 10),
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimiterResponse(15, 'Institutional rate limit reached. Please wait a moment and try again.'),
});

/**
 * Authentication Limiter: Protects against credential brute-force attacks
 * 20 attempts per 15 minutes
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_AUTH_MAX || '20', 10),
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimiterResponse(
    15,
    'Multiple unsuccessful sign-in attempts detected. For security, please wait 15 minutes before retrying.'
  ),
});

// Backward compatibility alias for auth routes
export const loginLimiter = authLimiter;

/**
 * Search & Filter Limiter: Protects dynamic MongoDB search aggregation endpoints
 * 120 queries per minute
 */
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_SEARCH_MAX || '120', 10),
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimiterResponse(1, 'Search query limit reached. Please pause a moment before typing further.'),
});

/**
 * File Upload Limiter: Prevents storage exhaustion and memory spikes
 * 40 uploads per 15 minutes
 */
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_UPLOAD_MAX || '40', 10),
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimiterResponse(15, 'Upload rate limit reached. Please wait before uploading more files.'),
});
