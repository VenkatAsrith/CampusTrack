import rateLimit from 'express-rate-limit';

/**
 * Dedicated login failure protection limiter.
 * Allows legitimate users to log in without penalty (skipSuccessfulRequests).
 * Tracks failed login attempts per IP within a 15-minute rolling window.
 * Blocks further attempts with HTTP 429 when threshold (5 failed attempts) is exceeded.
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Allow 5 failed login attempts per window
  skipSuccessfulRequests: true, // Successful logins are not penalized
  standardHeaders: true, // Draft-6 RateLimit-* headers
  legacyHeaders: false,
  message: {
    status: 'fail',
    message: 'Too many failed login attempts from this IP. Please try again after 15 minutes.',
  },
});
