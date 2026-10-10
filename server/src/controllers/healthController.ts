import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { isCloudinaryConfigured } from '../config/cloudinary';
import { config } from '../config';

const startTime = Date.now();

/**
 * GET /api/v1/health (and /health)
 * Liveness Check for OCI Load Balancer / Container Orchestration.
 * Must be lightweight: Never run heavy database queries here.
 */
export const getLiveness = (req: Request, res: Response) => {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  const memoryUsage = process.memoryUsage();

  res.status(200).json({
    status: 'healthy',
    uptime: uptimeSeconds,
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
    requestId: req.id,
    memory: {
      rssMb: Math.round(memoryUsage.rss / 1024 / 1024),
      heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      heapTotalMb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
    },
  });
};

/**
 * GET /api/v1/ready (and /ready)
 * Readiness Check to verify all critical dependencies are ready to accept traffic.
 * Checks MongoDB connection state (readyState 1 = connected).
 */
export const getReadiness = async (req: Request, res: Response) => {
  const dbState = mongoose.connection.readyState;
  // 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
  const isDbReady = dbState === 1;

  const dependencies = {
    database: {
      status: isDbReady ? 'connected' : 'disconnected',
      readyState: dbState,
      host: mongoose.connection.host || 'unknown',
    },
    cloudinary: {
      status: isCloudinaryConfigured() ? 'configured' : 'optional_missing',
    },
  };

  if (!isDbReady) {
    return res.status(503).json({
      status: 'not_ready',
      message: 'Database is not yet connected or is currently reconnecting.',
      dependencies,
      timestamp: new Date().toISOString(),
      requestId: req.id,
    });
  }

  res.status(200).json({
    status: 'ready',
    message: 'CampusTrack is ready to serve institutional traffic.',
    dependencies,
    timestamp: new Date().toISOString(),
    requestId: req.id,
  });
};
