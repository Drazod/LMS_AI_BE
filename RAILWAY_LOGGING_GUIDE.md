# Railway Logging Guide

## Issue: Logs Not Appearing on Railway

### What We've Fixed:

1. **Enhanced Logging System**
   - Created `src/utils/logger.ts` with structured logging
   - Timestamps on all log messages
   - Forced stdout/stderr flushing for Railway
   - Better error logging with stack traces

2. **Updated app.ts**
   - Immediate startup logs
   - Database connection status logging
   - Environment variable verification
   - Server error handling
   - Uncaught exception and rejection handlers

3. **Updated errorHandler.ts**
   - Uses new Logger utility
   - More detailed error context

### How to View Railway Logs:

#### Option 1: Railway CLI (Recommended)
```bash
# Install Railway CLI (if not installed)
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# View live logs
railway logs

# View logs with follow mode
railway logs -f
```

#### Option 2: Railway Dashboard
1. Go to https://railway.app
2. Select your project
3. Click on your service
4. Click "View Logs" tab
5. Toggle "Follow Logs" to see real-time updates

### Environment Variables to Set on Railway:

Make sure these are configured in Railway:

```bash
# Required
NODE_ENV=production
PORT=8080
SPRING_DATASOURCE_URL=postgresql://...
SPRING_DATASOURCE_USERNAME=...
SPRING_DATASOURCE_PASSWORD=...

# Optional - Enable database query logging in production (use cautiously)
ENABLE_DB_LOGGING=false

# Other required variables
JWT_SECRET=...
FRONTEND_HOST=...
VNPAY_TMN_CODE=...
VNPAY_HASH_SECRET=...
VNPAY_URL=...
VNPAY_RETURN_URL=...
```

### Troubleshooting Steps:

1. **Check if app is actually running:**
   ```bash
   railway logs | grep "Application ready"
   ```

2. **Check for startup errors:**
   ```bash
   railway logs | grep "ERROR"
   ```

3. **Check database connection:**
   ```bash
   railway logs | grep "Database"
   ```

4. **Test health endpoint:**
   ```bash
   curl https://your-railway-app.railway.app/health
   ```

5. **Check build logs:**
   - In Railway dashboard, go to "Deployments"
   - Click on the latest deployment
   - Check "Build Logs" and "Deploy Logs"

### Common Issues:

1. **No logs at all**
   - App might not be starting
   - Check build logs first
   - Verify Dockerfile is correct
   - Check for port binding issues

2. **Database connection errors**
   - Verify DATABASE_URL or SPRING_DATASOURCE_* variables
   - Check database is accessible from Railway
   - Verify database credentials

3. **Port binding issues**
   - Railway automatically sets PORT variable
   - Make sure app listens on process.env.PORT

4. **Build fails**
   - Check TypeScript compilation errors
   - Verify all dependencies in package.json
   - Check Dockerfile configuration

### Testing Locally:

To test the new logging locally:

```bash
# Development mode
npm run dev

# Production mode (simulating Railway)
npm run build
NODE_ENV=production npm start
```

### Log Levels:

The new logger has these levels:
- `Logger.info()` - General information (always logged)
- `Logger.error()` - Errors (always logged)
- `Logger.warn()` - Warnings (always logged)
- `Logger.debug()` - Debug info (only in development)
- `Logger.startup()` - Startup events (always logged)
- `Logger.database()` - Database events (always logged)

### Next Steps:

1. Deploy the updated code to Railway
2. Watch the logs using `railway logs -f`
3. You should now see:
   - Startup messages
   - Database connection status
   - HTTP requests
   - Any errors with full context

### If Logs Still Don't Appear:

1. **Check Railway Status:** https://railway.statuspage.io
2. **Check Railway Region:** Some regions may have log streaming delays
3. **Contact Railway Support:** If issue persists
4. **Alternative:** Use external logging service:
   - Logtail (https://logtail.com)
   - Datadog (https://www.datadoghq.com)
   - Papertrail (https://www.papertrail.com)

### Quick Commands:

```bash
# View last 100 log lines
railway logs --lines 100

# Filter logs
railway logs | grep "ERROR"
railway logs | grep "Database"
railway logs | grep "STARTUP"

# Show deployment status
railway status

# Redeploy
railway up
```
