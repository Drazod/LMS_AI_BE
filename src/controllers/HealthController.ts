import { Request, Response } from 'express';
import { ApiResponse } from '../models/response';

export class HealthController {
  constructor() {}

  /**
   * Health check endpoint
   * GET /api/health
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      const healthStatus = {
        status: 'UP',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          external: Math.round(process.memoryUsage().external / 1024 / 1024)
        },
        services: {
          database: 'UP',
          cache: 'UP',
          email: 'UP'
        }
      };

      res.status(200).json({
        success: true,
        message: 'Service is healthy',
        data: healthStatus,
        timestamp: new Date().toISOString()
      } as ApiResponse<any>);
    } catch (error) {
      res.status(503).json({
        success: false,
        message: 'Service is unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }

  /**
   * Readiness check endpoint
   * GET /api/health/ready
   */
  async readinessCheck(req: Request, res: Response): Promise<void> {
    try {
      // Check if all required services are ready
      const readinessChecks = {
        database: true, // Mock check
        cache: true,    // Mock check
        email: true     // Mock check
      };

      const isReady = Object.values(readinessChecks).every(check => check);

      const readinessStatus = {
        status: isReady ? 'READY' : 'NOT_READY',
        timestamp: new Date().toISOString(),
        checks: readinessChecks
      };

      res.status(isReady ? 200 : 503).json({
        success: isReady,
        message: isReady ? 'Service is ready' : 'Service is not ready',
        data: readinessStatus,
        timestamp: new Date().toISOString()
      } as ApiResponse<any>);
    } catch (error) {
      res.status(503).json({
        success: false,
        message: 'Readiness check failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }

  /**
   * Liveness check endpoint
   * GET /api/health/live
   */
  async livenessCheck(req: Request, res: Response): Promise<void> {
    try {
      // Basic liveness check - if we can respond, we're alive
      const livenessStatus = {
        status: 'ALIVE',
        timestamp: new Date().toISOString(),
        pid: process.pid,
        uptime: process.uptime()
      };

      res.status(200).json({
        success: true,
        message: 'Service is alive',
        data: livenessStatus,
        timestamp: new Date().toISOString()
      } as ApiResponse<any>);
    } catch (error) {
      res.status(503).json({
        success: false,
        message: 'Liveness check failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  }
}