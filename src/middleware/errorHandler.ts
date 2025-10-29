import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';

export interface CustomError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  error: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  
  // Log error with context
  Logger.error(`[${statusCode}] ${message}`);
  Logger.error(`Path: ${req.method} ${req.path}`);
  Logger.error(`Stack: ${error.stack}`);

  res.status(statusCode).json({
    error: {
      message,
      status: statusCode,
      timestamp: new Date().toISOString(),
      path: req.path
    }
  });
};