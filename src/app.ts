import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createConnection } from 'typeorm';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { setupRoutes } from './routes';
import { Logger, httpLogger } from './utils/logger';

// Load environment variables
dotenv.config();

// Log startup immediately
Logger.startup('Application starting...');
Logger.info(`Node version: ${process.version}`);
Logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
Logger.info(`Platform: ${process.platform}`);

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
Logger.info('Setting up middleware...');
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// JSON parsing error handler - must come after express.json()
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    Logger.error('Invalid JSON in request body', err.message);
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON',
      message: 'Request body contains invalid JSON format'
    });
  }
  next(err);
});

// Use both loggers for comprehensive logging
app.use(httpLogger);
app.use(requestLogger);
Logger.info('Middleware configured');

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Curcus LMS TypeScript Backend'
  });
});

// Setup routes
setupRoutes(app);

// Error handling middleware (must be last)
app.use(errorHandler);

// Database connection and server start
async function startServer() {
  try {
    Logger.info('Connecting to database...');
    Logger.info(`Database URL: ${process.env.SPRING_DATASOURCE_URL ? 'configured' : 'NOT SET'}`);
    Logger.info(`Database Username: ${process.env.SPRING_DATASOURCE_USERNAME ? 'configured' : 'NOT SET'}`);
    Logger.info(`Database Password: ${process.env.SPRING_DATASOURCE_PASSWORD ? 'configured' : 'NOT SET'}`);
    
    // Initialize database connection
    await createConnection({
      type: 'postgres',
      url: process.env.SPRING_DATASOURCE_URL,
      username: process.env.SPRING_DATASOURCE_USERNAME,
      password: process.env.SPRING_DATASOURCE_PASSWORD,
      synchronize: false, // Disable synchronization to work with existing schema
      logging: process.env.NODE_ENV === 'development' || process.env.ENABLE_DB_LOGGING === 'true',
      entities: [
        __dirname + '/models/entities/*.js'
      ],
      migrations: [],
    });

    Logger.database('Database connected successfully');

    // Start server
    const server = app.listen(PORT, () => {
      Logger.startup(`Server is running on port ${PORT}`);
      Logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      Logger.info(`Health check: http://localhost:${PORT}/health`);
      Logger.info(`Process ID: ${process.pid}`);
      Logger.startup('Application ready to accept connections');
    });

    // Handle server errors
    server.on('error', (error: any) => {
      Logger.error('Server error:', error);
      if (error.code === 'EADDRINUSE') {
        Logger.error(`Port ${PORT} is already in use`);
      }
      process.exit(1);
    });

  } catch (error) {
    Logger.error('Failed to start server:', error);
    if (error instanceof Error) {
      Logger.error('Error details:', error.message);
      Logger.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  Logger.warn('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  Logger.warn('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  Logger.error('Uncaught Exception:', error.message);
  Logger.error('Stack:', error.stack);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  Logger.error('Unhandled Rejection at:', promise);
  Logger.error('Reason:', reason);
});

startServer();

export { app };