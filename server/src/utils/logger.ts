import { Request, Response } from 'express';
import { config } from '../config';

export interface StructuredLog {
  timestamp: string;
  requestId: string;
  method: string;
  route: string;
  statusCode: number;
  responseTimeMs: number;
  ip?: string;
  userId?: string;
  errorCode?: string;
  message?: string;
}

const SENSITIVE_FIELDS = ['password', 'token', 'secret', 'authorization', 'cookie', 'jwt'];

/**
 * Sanitizes an object by removing or masking sensitive fields
 */
export const sanitizeData = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitizeData);

  const clean: Record<string, any> = {};
  for (const [key, val] of Object.entries(data)) {
    if (SENSITIVE_FIELDS.some((s) => key.toLowerCase().includes(s))) {
      clean[key] = '[REDACTED]';
    } else if (typeof val === 'object' && val !== null) {
      clean[key] = sanitizeData(val);
    } else {
      clean[key] = val;
    }
  }
  return clean;
};

export const logger = {
  info: (msg: string, meta?: Record<string, any>) => {
    const timestamp = new Date().toISOString();
    if (config.NODE_ENV === 'production') {
      console.log(JSON.stringify({ timestamp, level: 'info', message: msg, ...sanitizeData(meta) }));
    } else {
      console.log(`[INFO] ${timestamp} - ${msg}`, meta ? sanitizeData(meta) : '');
    }
  },

  warn: (msg: string, meta?: Record<string, any>) => {
    const timestamp = new Date().toISOString();
    if (config.NODE_ENV === 'production') {
      console.warn(JSON.stringify({ timestamp, level: 'warn', message: msg, ...sanitizeData(meta) }));
    } else {
      console.warn(`[WARN] ${timestamp} - ${msg}`, meta ? sanitizeData(meta) : '');
    }
  },

  error: (msg: string, err?: any, meta?: Record<string, any>) => {
    const timestamp = new Date().toISOString();
    const errorDetails = err instanceof Error ? {
      name: err.name,
      message: err.message,
      ...(config.NODE_ENV === 'development' ? { stack: err.stack } : {}),
    } : err;

    if (config.NODE_ENV === 'production') {
      console.error(JSON.stringify({
        timestamp,
        level: 'error',
        message: msg,
        error: errorDetails,
        ...sanitizeData(meta),
      }));
    } else {
      console.error(`[ERROR] ${timestamp} - ${msg}`, errorDetails, meta ? sanitizeData(meta) : '');
    }
  },
};

/**
 * Express middleware to log completed HTTP requests with duration
 */
export const requestLogger = (req: Request, res: Response, next: () => void) => {
  const start = Date.now();
  const requestId = req.id || 'N/A';

  res.on('finish', () => {
    // Avoid noisy logs on healthcheck endpoints in production
    if (req.originalUrl.includes('/health') && res.statusCode === 200) {
      return;
    }

    const duration = Date.now() - start;
    const logEntry: StructuredLog = {
      timestamp: new Date().toISOString(),
      requestId,
      method: req.method,
      route: req.originalUrl,
      statusCode: res.statusCode,
      responseTimeMs: duration,
      ip: req.ip || req.socket.remoteAddress,
      userId: (req as any).user?.id,
    };

    if (res.statusCode >= 500) {
      logger.error(`Server Error ${res.statusCode} ${req.method} ${req.originalUrl}`, null, logEntry);
    } else if (res.statusCode >= 400) {
      logger.warn(`Client Error ${res.statusCode} ${req.method} ${req.originalUrl}`, logEntry);
    } else {
      logger.info(`HTTP ${res.statusCode} ${req.method} ${req.originalUrl} (${duration}ms)`, logEntry);
    }
  });

  next();
};
