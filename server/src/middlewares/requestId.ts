import { Request, Response, NextFunction } from 'express';

// Extend Express Request interface to include id and startTime
declare global {
  namespace Express {
    interface Request {
      id?: string;
      startTime?: number;
    }
  }
}

/**
 * Generates an institutional correlation ID for every inbound request.
 * Format: CT-YYYYMMDD-XXXXXX (e.g. CT-20261008-8F73A1)
 */
export const generateRequestId = (): string => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CT-${dateStr}-${randomSuffix}`;
};

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const incomingId = (req.headers['x-request-id'] as string) || generateRequestId();
  req.id = incomingId;
  req.startTime = Date.now();

  // Expose on response header for tracing
  res.setHeader('X-Request-Id', incomingId);

  next();
};
