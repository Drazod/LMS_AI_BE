# Build stage
FROM node:20-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for TypeScript build)
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine as production

# Install Python for speech-to-text functionality
RUN apk add --no-cache python3 py3-pip ffmpeg

# Create app directory
WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy scripts directory for Python integration
COPY scripts ./scripts

# Create uploads directory
RUN mkdir -p uploads

# Install Python dependencies for speech recognition
RUN pip3 install --no-cache-dir speechrecognition pydub openai python-dotenv

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership of the app directory
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Start the application
CMD ["npm", "start"]