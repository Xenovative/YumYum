# OneNightDrink Deployment Guide

Complete deployment guide for OneNightDrink with backend API and frontend.

## Prerequisites

- Ubuntu/Debian VPS with root access
- Domain name pointed to your VPS IP
- PostgreSQL installed
- Node.js 18+ installed

## Quick Deployment

### 1. Install PostgreSQL

```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Create Database

```bash
sudo -u postgres createdb onenightdrink
```

### 3. Configure Backend Environment

```bash
cd server
cp .env.example .env
nano .env
```

Update these values:
```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/onenightdrink
JWT_SECRET=<generate-random-32-byte-hex>
ADMIN_PASSWORD=your-secure-admin-password
CORS_ORIGIN=https://www.one-night-drink.com,https://one-night-drink.com
```

Generate JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Deploy Application

```bash
# Deploy both frontend and backend
./deploy.sh 8080 3001

# This will:
# - Install dependencies
# - Build backend and frontend
# - Run database migrations
# - Start both services with PM2
```

### 5. Setup Domain with SSL

```bash
sudo ./setup-domain.sh \
  --email your@email.com \
  --www www.one-night-drink.com \
  --apex one-night-drink.com \
  --port 8080 \
  --api-port 3001
```

This configures:
- Nginx reverse proxy
- SSL certificates via Let's Encrypt
- API proxy at `/api/*`
- Frontend proxy at `/`

## Manual Deployment Steps

### Backend API

```bash
cd server

# Install dependencies
npm install

# Build
npm run build

# Run migrations
npm run migrate

# Seed database (first time only)
npm run seed

# Start with PM2
pm2 start dist/index.js --name onenightdrink-api
```

### Frontend

```bash
# Install dependencies
npm install

# Build
npm run build

# Start with PM2
pm2 start serve --name onenightdrink-frontend -- -s dist -l 8080
```

### Save PM2 Configuration

```bash
pm2 save
pm2 startup systemd
```

## Alternative: systemd Service

For backend only (frontend can use PM2):

```bash
sudo ./setup-backend-systemd.sh
```

This creates a systemd service for the backend API.

## Nginx Configuration

If not using `setup-domain.sh`, manually configure nginx:

```nginx
server {
    listen 80;
    server_name www.one-night-drink.com one-night-drink.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name www.one-night-drink.com one-night-drink.com;

    ssl_certificate /etc/letsencrypt/live/www.one-night-drink.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/www.one-night-drink.com/privkey.pem;

    # API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend proxy
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Port Configuration

Default ports:
- **Frontend**: 8080
- **Backend API**: 3001
- **PostgreSQL**: 5432

To change ports:
```bash
# Deploy with custom ports
./deploy.sh <frontend-port> <api-port>

# Example: Frontend on 3000, API on 4000
./deploy.sh 3000 4000
```

## Database Management

### Backup Database

```bash
pg_dump onenightdrink > backup.sql
```

### Restore Database

```bash
psql onenightdrink < backup.sql
```

### Reset Database

```bash
sudo -u postgres dropdb onenightdrink
sudo -u postgres createdb onenightdrink
cd server
npm run migrate
npm run seed
```

## Monitoring & Logs

### PM2 Commands

```bash
# View status
pm2 status

# View logs
pm2 logs onenightdrink-api
pm2 logs onenightdrink-frontend

# Restart services
pm2 restart onenightdrink-api
pm2 restart onenightdrink-frontend

# Stop services
pm2 stop all

# Start services
pm2 start all
```

### systemd Commands (if using systemd)

```bash
# Status
sudo systemctl status onenightdrink-api

# Logs
sudo journalctl -u onenightdrink-api -f

# Restart
sudo systemctl restart onenightdrink-api
```

### Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log

# Test configuration
sudo nginx -t

# Reload configuration
sudo systemctl reload nginx
```

## Updating Application

### Update Backend

```bash
cd server
git pull
npm install
npm run build
npm run migrate  # Run any new migrations
pm2 restart onenightdrink-api
```

### Update Frontend

```bash
git pull
npm install
npm run build
pm2 restart onenightdrink-frontend
```

### Full Redeploy

```bash
./deploy.sh 8080 3001
```

## Troubleshooting

### Backend won't start

1. Check logs: `pm2 logs onenightdrink-api`
2. Verify database connection in `server/.env`
3. Check PostgreSQL is running: `sudo systemctl status postgresql`
4. Test database connection: `psql -U postgres -d onenightdrink`

### Frontend can't connect to API

1. Check CORS settings in `server/.env`
2. Verify API is running: `curl http://localhost:3001/health`
3. Check nginx proxy configuration
4. Verify firewall allows port 3001 (if accessing directly)

### SSL Certificate Issues

```bash
# Renew certificates
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run

# Check certificate expiry
sudo certbot certificates
```

### Database Migration Errors

```bash
# Check current schema
psql -U postgres -d onenightdrink -c "\dt"

# Manually run migration
cd server
npm run migrate
```

### Port Already in Use

```bash
# Find process using port
sudo lsof -i :3001
sudo lsof -i :8080

# Kill process
sudo kill -9 <PID>

# Or use PM2
pm2 delete onenightdrink-api
pm2 delete onenightdrink-frontend
```

## Security Checklist

- [ ] Change default admin password in `server/.env`
- [ ] Generate secure JWT_SECRET (32+ bytes)
- [ ] Configure proper CORS origins
- [ ] Enable firewall (ufw)
- [ ] Set up PostgreSQL password
- [ ] Enable SSL/HTTPS
- [ ] Regular database backups
- [ ] Keep Node.js and dependencies updated
- [ ] Monitor logs for suspicious activity

## Performance Optimization

### Enable Gzip in Nginx

Add to nginx server block:
```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
```

### Database Connection Pooling

Already configured in backend with default pool size. Adjust in `server/src/db/index.ts` if needed.

### PM2 Cluster Mode

For high traffic:
```bash
pm2 start dist/index.js --name onenightdrink-api -i max
```

## Backup Strategy

### Automated Daily Backups

Create `/etc/cron.daily/backup-onenightdrink`:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/onenightdrink"
mkdir -p "$BACKUP_DIR"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump onenightdrink | gzip > "$BACKUP_DIR/db_$DATE.sql.gz"
find "$BACKUP_DIR" -name "db_*.sql.gz" -mtime +7 -delete
```

Make executable:
```bash
sudo chmod +x /etc/cron.daily/backup-onenightdrink
```

## Support

- Backend API docs: `server/README.md`
- Backend setup: `BACKEND_SETUP.md`
- Quick start: `QUICK_START.md`
