# Curcus LMS - TypeScript Backend

This is the TypeScript/Node.js version of the Curcus Learning Management System backend, migrated from the original Spring Boot Java implementation.

## Features

- 🚀 Express.js REST API
- 🔐 JWT Authentication
- 📚 Course Management
- 👥 User Management
- 🎤 Speech-to-Text Integration (Python)
- 📧 Email Notifications
- 📁 File Upload/Management
- 🐳 Docker Support
- 🧪 Jest Testing
- 📊 TypeORM Database Integration

## Project Structure

```
src/
├── controllers/          # REST API controllers
├── services/            # Business logic services
├── models/              # Data models
│   ├── entities/        # TypeORM entities
│   ├── dto/            # Data Transfer Objects
│   ├── request/        # Request interfaces
│   └── response/       # Response interfaces
├── repositories/       # Data access layer
├── middleware/         # Express middleware
├── config/            # Configuration files
├── utils/             # Utility functions
└── routes.ts          # Route definitions
```

## Prerequisites

- Node.js 18+ 
- MySQL/MariaDB
- Python 3.8+ (for speech-to-text)
- FFmpeg (for audio processing)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd curcus_backend-typescript
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment variables:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`

5. Install Python dependencies for speech-to-text:
```bash
pip install speechrecognition pydub openai python-dotenv
```

## Development

Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:8080`

## Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## Building

Build for production:
```bash
npm run build
```

Start production server:
```bash
npm start
```

## Docker

Build and run with Docker:
```bash
docker build -t curcus-lms-typescript .
docker run -p 8080:8080 curcus-lms-typescript
```

## API Endpoints

### Health Check
- `GET /health` - Service health status

### Authentication (Coming Soon)
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh JWT token

### Courses (Coming Soon)
- `GET /api/courses` - List courses
- `POST /api/courses` - Create course
- `GET /api/courses/:id` - Get course details
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course

### Speech-to-Text (Coming Soon)
- `POST /api/speech/transcribe` - Convert audio to text

## Migration Status

This project is a migration from Java Spring Boot to TypeScript/Express.js:

### ✅ Completed
- [x] Project structure setup
- [x] Basic Express.js server
- [x] TypeScript configuration
- [x] Docker configuration
- [x] Testing setup
- [x] Middleware (error handling, logging)

### 🚧 In Progress
- [ ] TypeORM entities migration
- [ ] Controller migration
- [ ] Service layer migration
- [ ] Authentication system
- [ ] Python script integration

### 📋 Planned
- [ ] Email service
- [ ] File upload service
- [ ] Database migrations
- [ ] API documentation (Swagger)
- [ ] Production deployment

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License