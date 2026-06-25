# PHASE 11: DEVOPS & DEPLOYMENT

## Deployment Architecture

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│    Vercel (CDN)  │     │  Railway/Render  │     │  Neon (DBaaS)    │
│                  │     │                  │     │                  │
│  React SPA       │────►│  Express API     │────►│  PostgreSQL      │
│  Static Assets   │     │  Socket.io       │     │  Auto-scaling    │
│  Automatic SSL   │     │  Auto-scaling    │     │  Daily Backups   │
└──────────────────┘     └──────────────────┘     └──────────────────┘
```

## CI/CD Pipeline (GitHub Actions)

### Workflow: `.github/workflows/ci.yml`

```yaml
Triggers:
  - Push to main/develop
  - Pull requests to main

Jobs:
  1. Backend Lint & Test
     - Runs ESLint
     - Runs Jest tests
     - Uses PostgreSQL service container

  2. Frontend Lint & Test
     - Runs ESLint
     - Runs Vitest tests
     - Builds production bundle

  3. Deploy Backend (main only)
     - Railway deploy via GitHub Action

  4. Deploy Frontend (main only)
     - Vercel deploy via GitHub Action
```

## Docker Setup

### Backend (docker/Dockerfile.backend)
- Multi-stage build with node:20-alpine
- Production dependencies only
- Non-root user for security
- Exposes port 3000

### Frontend (docker/Dockerfile.frontend)
- Build stage: node:20-alpine
- Serve stage: nginx:alpine
- Exposes port 80
- Includes reverse proxy config for API

### Docker Compose (docker-compose.yml)
```bash
# Build and run all services
docker-compose up -d

# View logs
docker-compose logs -f
```

## Production Environment Configuration

### Backend (Railway)
```
NODE_ENV=production
DATABASE_URL=postgresql://... (Neon connection string)
JWT_SECRET=<random-64-char-string>
JWT_REFRESH_SECRET=<random-64-char-string>
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=https://your-frontend-domain.com
LOG_LEVEL=info
```

### Frontend (Vercel)
```
VITE_API_URL=https://your-backend.com/api/v1
VITE_SOCKET_URL=https://your-backend.com
```

## Monitoring

### Application Monitoring
- Winston logging (error.log, combined.log)
- Morgan HTTP request logging
- Health check endpoint: GET /api/v1/health
- Slow query logging (>500ms)

### Database Monitoring
- Neon Console for query performance
- pg_stat_statements for slow queries
- Automated daily backups

### Uptime Monitoring
- Recommended: UptimeRobot or BetterStack
- Monitor: /api/v1/health every 5 minutes
- Alert on 2 consecutive failures

## Logging Strategy

### Log Levels
```
error:   Production issues, stack traces
warn:    Validation failures, slow queries, 4xx errors
info:    Request completions, user actions
debug:   Development details (disabled in production)
```

### Log Rotation
- Error logs: 5 files max, 5MB each
- Combined logs: 10 files max, 5MB each
- 30-day retention

## Backup Strategy

### Database (Neon)
- Automatic daily backups
- Point-in-time recovery (7 days)
- Branch for staging/testing

### Application
- Environment variables stored in Railway/Vercel dashboards
- Configuration in Git (no secrets)
- Migration files in Git (version controlled)

## Deployment Commands

### Initial Backend Deploy (Railway)
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and link
railway login
railway link

# Deploy
railway up

# Set environment variables
railway variables set JWT_SECRET=...
railway variables set DATABASE_URL=...
```

### Initial Frontend Deploy (Vercel)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel --prod

# Set environment variables
vercel env add VITE_API_URL
vercel env add VITE_SOCKET_URL
```

### Run Migrations
```bash
# After backend deploy
railway run node database/migrate.js
```
