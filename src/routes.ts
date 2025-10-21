import { Express, Router } from 'express';
import { setupApiRoutes } from './routes/apiRoutes';

export const setupRoutes = (app: Express): void => {
  // API base path
  const apiRouter = Router();
  
  // Setup API routes
  setupApiRoutes(apiRouter);
  
  // Mount API routes
  app.use('/api', apiRouter);

  // Test route for basic connectivity
  app.get('/api/test', (req, res) => {
    res.json({ 
      message: 'Curcus LMS TypeScript API is running!',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });

  // 404 handler for undefined routes
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      error: 'Route not found',
      message: `Cannot ${req.method} ${req.originalUrl}`
    });
  });
  
  console.log('✅ Routes configured successfully');
};