import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // Server Configuration
  port: parseInt(process.env.PORT || '8080'),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database Configuration
  database: {
    url: process.env.SPRING_DATASOURCE_URL || '',
    username: process.env.SPRING_DATASOURCE_USERNAME || '',
    password: process.env.SPRING_DATASOURCE_PASSWORD || '',
  },
  
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRATION || '24h',
  },
  
  // Email Configuration
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    username: process.env.SMTP_USERNAME || '',
    password: process.env.SMTP_PASSWORD || '',
  },
  
  // File Upload Configuration
  upload: {
    maxSize: process.env.MAX_FILE_SIZE || '50MB',
    uploadPath: process.env.UPLOAD_PATH || './uploads',
  },
  
  // API Configuration
  api: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:8080/api',
  },
};