# Deployment Guide

This guide covers deploying the Support Staff Dashboard to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Database Setup](#database-setup)
4. [Application Deployment](#application-deployment)
5. [Docker Deployment](#docker-deployment)
6. [Platform-Specific Guides](#platform-specific-guides)
7. [Post-Deployment](#post-deployment)
8. [Monitoring and Maintenance](#monitoring-and-maintenance)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js**: Version 18 or higher
- **PostgreSQL**: Version 12 or higher
- **npm**: Version 8 or higher
- **Git**: For cloning the repository

### Optional Tools

- **Docker & Docker Compose**: For containerized deployment
- **Nginx**: For reverse proxy (recommended)
- **PM2**: For process management
- **SSL Certificate**: For HTTPS (highly recommended)

---

## Environment Configuration

### 1. Clone the Repository

```bash
git clone https://github.com/riskecrp/support-staff-dashboard.git
cd support-staff-dashboard
```

### 2. Create Environment File

```bash
cp .env.example .env.local
```

### 3. Configure Environment Variables

Edit `.env.local`:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/support_staff_db

# Application Configuration
NODE_ENV=production
PORT=3000

# Security
SESSION_SECRET=your-secure-random-secret-key-here

# Optional: Logging
LOG_LEVEL=info
```

**Important Security Notes:**
- Generate a strong `SESSION_SECRET` using: `openssl rand -base64 32`
- NEVER commit `.env.local` to version control
- Use different secrets for each environment (dev, staging, production)

---

## Database Setup

### 1. Create PostgreSQL Database

```bash
# Log into PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE support_staff_db;
CREATE USER support_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE support_staff_db TO support_user;

# Exit PostgreSQL
\q
```

### 2. Run Migrations

```bash
npm run db:migrate
```

This will create all necessary tables and indexes.

### 3. (Optional) Seed Sample Data

For testing purposes only:

```bash
npm run db:seed
```

**Note:** Skip this step in production unless you want demo data.

### 4. Backup Strategy

Set up automated backups:

```bash
# Create backup script
cat > /usr/local/bin/backup-dashboard-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/support-staff-dashboard"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
pg_dump -U support_user support_staff_db | gzip > $BACKUP_DIR/backup_$DATE.sql.gz
# Keep only last 30 days of backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete
EOF

chmod +x /usr/local/bin/backup-dashboard-db.sh

# Add to crontab (run daily at 2 AM)
crontab -e
# Add line:
0 2 * * * /usr/local/bin/backup-dashboard-db.sh
```

---

## Application Deployment

### Method 1: Direct Deployment

#### 1. Install Dependencies

```bash
npm ci --production
```

#### 2. Build Application

```bash
npm run build
```

#### 3. Start Application

**Option A: Direct Start**
```bash
NODE_ENV=production npm start
```

**Option B: Using PM2** (Recommended)
```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start npm --name "support-staff-dashboard" -- start

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup
```

### Method 2: With Process Manager

Create `ecosystem.config.js` for PM2:

```javascript
module.exports = {
  apps: [{
    name: 'support-staff-dashboard',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm Z',
    merge_logs: true,
  }]
};
```

Start with:
```bash
pm2 start ecosystem.config.js
```

---

## Docker Deployment

### 1. Create Dockerfile

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### 2. Create docker-compose.yml

```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    restart: always
    environment:
      POSTGRES_DB: support_staff_db
      POSTGRES_USER: support_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U support_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build:
      context: .
      dockerfile: Dockerfile
    restart: always
    environment:
      DATABASE_URL: postgresql://support_user:${DB_PASSWORD}@db:5432/support_staff_db
      NODE_ENV: production
      SESSION_SECRET: ${SESSION_SECRET}
    ports:
      - "3000:3000"
    depends_on:
      db:
        condition: service_healthy

volumes:
  postgres_data:
```

### 3. Create .env for Docker

```env
DB_PASSWORD=your_secure_db_password
SESSION_SECRET=your_secure_session_secret
```

### 4. Deploy with Docker Compose

```bash
# Build and start services
docker-compose up -d

# Check logs
docker-compose logs -f app

# Run migrations
docker-compose exec app npm run db:migrate

# Stop services
docker-compose down
```

---

## Platform-Specific Guides

### Deploying to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Configure environment variables in Vercel dashboard
4. Use external PostgreSQL (e.g., Supabase, Neon, Railway)
5. Deploy automatically on push

### Deploying to Railway

1. Connect GitHub repository
2. Add PostgreSQL service
3. Configure environment variables
4. Deploy automatically

### Deploying to DigitalOcean App Platform

1. Create new app from GitHub
2. Add managed PostgreSQL database
3. Configure environment variables
4. Deploy

### Deploying to AWS

Use **Elastic Beanstalk** or **ECS**:
1. Create RDS PostgreSQL instance
2. Deploy application to Elastic Beanstalk or ECS
3. Configure security groups
4. Set up Application Load Balancer

---

## Post-Deployment

### 1. Verify Deployment

```bash
# Check if app is running
curl http://your-domain:3000

# Check API endpoints
curl http://your-domain:3000/api/staff

# Verify database connection
psql -U support_user -d support_staff_db -c "SELECT COUNT(*) FROM staff;"
```

### 2. Set Up Nginx Reverse Proxy

```nginx
# /etc/nginx/sites-available/support-staff-dashboard
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/support-staff-dashboard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. Set Up SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is set up automatically
```

### 4. Configure Firewall

```bash
# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## Monitoring and Maintenance

### Application Monitoring

**Using PM2:**
```bash
pm2 status
pm2 logs support-staff-dashboard
pm2 monit
```

**Using Docker:**
```bash
docker-compose logs -f app
docker stats
```

### Database Monitoring

```bash
# Check database size
psql -U support_user -d support_staff_db -c "
  SELECT pg_size_pretty(pg_database_size('support_staff_db'));"

# Check table sizes
psql -U support_user -d support_staff_db -c "
  SELECT tablename, 
         pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
  FROM pg_tables 
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"
```

### Performance Optimization

```bash
# Run VACUUM ANALYZE weekly
psql -U support_user -d support_staff_db -c "VACUUM ANALYZE;"

# Check slow queries (if logging is enabled)
psql -U support_user -d support_staff_db -c "
  SELECT * FROM pg_stat_statements 
  ORDER BY mean_exec_time DESC 
  LIMIT 10;"
```

### Log Management

```bash
# Rotate logs (add to logrotate)
sudo nano /etc/logrotate.d/support-staff-dashboard

# Add configuration:
/path/to/logs/*.log {
  daily
  missingok
  rotate 14
  compress
  delaycompress
  notifempty
  create 0640 www-data www-data
  sharedscripts
  postrotate
    pm2 reloadLogs
  endscript
}
```

---

## Troubleshooting

### Application Won't Start

**Check logs:**
```bash
pm2 logs support-staff-dashboard --lines 100
```

**Common issues:**
- Database connection string incorrect
- Database not accessible
- Port already in use
- Missing environment variables

### Database Connection Errors

**Test connection:**
```bash
psql -U support_user -h localhost -d support_staff_db
```

**Check PostgreSQL status:**
```bash
sudo systemctl status postgresql
```

**Check connection limits:**
```sql
SELECT * FROM pg_stat_activity;
```

### High Memory Usage

**Check Node.js memory:**
```bash
pm2 list
```

**Restart application:**
```bash
pm2 restart support-staff-dashboard
```

### Slow Performance

1. **Check database indexes:**
```sql
SELECT * FROM pg_stat_user_indexes WHERE idx_scan = 0;
```

2. **Enable query logging** temporarily
3. **Run VACUUM ANALYZE**
4. **Check server resources** (CPU, RAM, disk)

---

## Security Checklist

- [ ] Strong database passwords
- [ ] SSL/TLS certificates installed
- [ ] Firewall configured
- [ ] Regular backups automated
- [ ] Environment variables secured
- [ ] Database access restricted
- [ ] Application behind reverse proxy
- [ ] Security headers configured
- [ ] Rate limiting implemented (future)
- [ ] Authentication added (future)

---

## Scaling Considerations

### Horizontal Scaling

- Use PM2 cluster mode or multiple containers
- Load balance with Nginx or cloud load balancer
- Use connection pooling for database

### Vertical Scaling

- Increase server resources (CPU, RAM)
- Optimize database queries
- Add caching layer (Redis)

### Database Scaling

- Read replicas for reporting
- Connection pooling
- Query optimization
- Partitioning large tables

---

## Support

For deployment assistance:
- Check logs first
- Review this guide
- Check GitHub issues
- Contact system administrator

---

Last Updated: February 2026
