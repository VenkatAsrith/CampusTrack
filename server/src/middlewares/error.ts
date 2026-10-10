import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorCode } from '../utils/errors';
import { config } from '../config';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  let statusCode = err.statusCode || 500;
  let status: 'fail' | 'error' = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
  let message = err.message || 'Something went wrong on the server.';
  let code: ErrorCode = err.code || (statusCode >= 500 ? 'INTERNAL_ERROR' : 'VALIDATION_ERROR');

  const requestId = req.id || 'N/A';

  // 1. Handle Mongoose / MongoDB specific technical errors
  if (err.name === 'CastError') {
    statusCode = 400;
    status = 'fail';
    code = 'RESOURCE_NOT_FOUND';
    message = `Invalid resource identifier format: ${err.value}`;
  } else if (err.code === 11000) {
    statusCode = 409;
    status = 'fail';
    code = 'VALIDATION_ERROR';
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `A record with this ${field} already exists in the system.`;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    status = 'fail';
    code = 'VALIDATION_ERROR';
    const errors = Object.values(err.errors || {}).map((e: any) => e.message);
    message = errors.join('. ') || 'Invalid submission data.';
  } else if (
    err.name === 'MongoServerSelectionError' ||
    err.name === 'MongoNetworkError' ||
    err.name === 'MongoTimeoutError'
  ) {
    statusCode = 503;
    status = 'error';
    code = 'DATABASE_ERROR';
    message = 'CampusTrack database is temporarily unavailable. Please retry shortly.';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    status = 'fail';
    code = 'AUTH_REQUIRED';
    message = 'Invalid authentication token. Please sign in again.';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    status = 'fail';
    code = 'AUTH_REQUIRED';
    message = 'Your session has expired. Please sign in again.';
  } else if (err.type === 'entity.too.large') {
    statusCode = 413;
    status = 'fail';
    code = 'VALIDATION_ERROR';
    message = 'Request payload exceeds the permitted institutional size limit.';
  }

  // 2. Log error details securely (no passwords or credentials)
  if (statusCode >= 500) {
    logger.error(`[${requestId}] ${message}`, err, {
      requestId,
      method: req.method,
      route: req.originalUrl,
      statusCode,
      code,
    });
  } else {
    logger.warn(`[${requestId}] ${message}`, {
      requestId,
      method: req.method,
      route: req.originalUrl,
      statusCode,
      code,
    });
  }

  // 3. Response payload: Never leak database internals, credentials, or file system paths
  const responsePayload: Record<string, any> = {
    success: false,
    status,
    message, // Retained for backwards compatibility with existing frontend callers
    error: {
      code,
      message,
    },
    requestId,
  };

  if (config.NODE_ENV === 'development' && !err.isOperational) {
    responsePayload.debug = {
      name: err.name,
      originalMessage: err.message,
      stack: err.stack,
    };
  }

  res.status(statusCode).json(responsePayload);
};

// Async wrapper to avoid try-catch blocks in controllers
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};
