import { Request, Response, NextFunction } from 'express';

/**
 * Simple logger utility that ensures logs are flushed to stdout
 * for proper visibility on Railway and other cloud platforms
 */
export class Logger {
  private static log(level: string, message: string, ...args: any[]): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}`;
    
    if (args.length > 0) {
      console.log(logMessage, ...args);
    } else {
      console.log(logMessage);
    }
    
    // Force flush to ensure logs appear immediately on Railway
    if (process.stdout.write('')) {
      // stdout is ready
    }
  }

  static info(message: string, ...args: any[]): void {
    this.log('INFO', message, ...args);
  }

  static error(message: string, ...args: any[]): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [ERROR] ${message}`;
    
    if (args.length > 0) {
      console.error(logMessage, ...args);
    } else {
      console.error(logMessage);
    }
    
    // Force flush
    if (process.stderr.write('')) {
      // stderr is ready
    }
  }

  static warn(message: string, ...args: any[]): void {
    this.log('WARN', message, ...args);
  }

  static debug(message: string, ...args: any[]): void {
    // Only log debug messages in development
    if (process.env.NODE_ENV !== 'production') {
      this.log('DEBUG', message, ...args);
    }
  }

  static startup(message: string): void {
    this.log('STARTUP', `🚀 ${message}`);
  }

  static database(message: string): void {
    this.log('DATABASE', `💾 ${message}`);
  }

  static http(req: Request): void {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.originalUrl || req.url;
    const ip = req.ip || req.connection.remoteAddress;
    console.log(`[${timestamp}] [HTTP] ${method} ${url} - IP: ${ip}`);
  }
}

/**
 * Express middleware for HTTP request logging
 */
export const httpLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const method = req.method;
  const url = req.originalUrl || req.url;
  
  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const timestamp = new Date().toISOString();
    
    console.log(
      `[${timestamp}] [HTTP] ${method} ${url} - Status: ${statusCode} - Duration: ${duration}ms`
    );
  });
  
  next();
};
