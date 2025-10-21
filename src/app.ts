import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createConnection } from 'typeorm';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { setupRoutes } from './routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// JSON parsing error handler - must come after express.json()
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    console.error('[Error] 400: Invalid JSON in request body');
    console.error('Request body that caused error:', err.message);
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON',
      message: 'Request body contains invalid JSON format'
    });
  }
  next(err);
});

app.use(requestLogger);

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
    // Initialize database connection
    await createConnection({
      type: 'postgres',
      url: process.env.SPRING_DATASOURCE_URL,
      username: process.env.SPRING_DATASOURCE_USERNAME,
      password: process.env.SPRING_DATASOURCE_PASSWORD,
      synchronize: false, // Disable synchronization to work with existing schema
      logging: process.env.NODE_ENV === 'development',
      entities: [
        __dirname + '/models/entities/*.js'
      ],
      migrations: [],
    });

    console.log('✅ Database connected successfully');

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();

export { app };