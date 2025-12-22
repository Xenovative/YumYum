# Migration Guide: Adding Backend to Existing VPS Deployment

If you've already deployed OneNightDrink to your VPS **before** the backend implementation, follow this guide to add the backend API without disrupting your existing setup.

## Current State Assessment

Your VPS currently has:
- ✅ Frontend running (likely on port 8080 via `serve`)
- ✅ Nginx configured with SSL
- ✅ Domain pointing to frontend
- ❌ No backend API
- ❌ No PostgreSQL database
- ❌ No API endpoints

## Migration Steps

### Step 1: Install PostgreSQL

```bash
# SSH into your VPS
ssh user@your-vps-ip

# Install PostgreSQL
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
psql --version
```

### Step 2: Create Database

```bash
# Switch to postgres user and create database
sudo -u postgres createdb onenightdrink

# Verify database exists
sudo -u postgres psql -l | grep onenightdrink
```

### Step 3: Pull Latest Code

```bash
# Navigate to your app directory
cd /path/to/YumYum

# Pull latest changes (includes server/ directory)
git pull origin main

# You should now see a new 'server/' directory
ls -la server/
```

### Step 4: Configure Backend Environment

```bash
# Navigate to server directory
cd server

# Create .env from example
cp .env.example .env

# Edit .env file
nano .env
```

**Configure these values in `.env`:**

```env
PORT=3001
NODE_ENV=production

# Database - Update password if you set one
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/onenightdrink

# Generate a secure JWT secret (run this command):
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=paste-generated-secret-here

# Set your admin password
ADMIN_PASSWORD=your-secure-admin-password

# Add your domain(s)
CORS_ORIGIN=https://www.one-night-drink.com,https://one-night-drink.com
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 5: Install Backend Dependencies

```bash
# Still in server/ directory
npm install
```

### Step 6: Build Backend

```bash
npm run build

# Verify build succeeded
ls -la dist/
```

### Step 7: Run Database Migrations

```bash
npm run migrate

# You should see: "✓ Migrations completed successfully"
```

### Step 8: Seed Initial Data (Optional)

```bash
npm run seed

# This adds 16 bars to the database
```

### Step 9: Start Backend with PM2

```bash
# Install PM2 if not already installed
npm install -g pm2

# Start backend API
cd /path/to/YumYum/server
PORT=3001 NODE_ENV=production pm2 start dist/index.js --name onenightdrink-api

# Check status
pm2 status

# View logs
pm2 logs onenightdrink-api

# Save PM2 configuration
pm2 save
```

### Step 10: Update Nginx Configuration

Your existing nginx config is at:
- `/etc/nginx/sites-available/onenightdrink.conf` (or similar)
- `/etc/nginx/conf.d/onenightdrink.conf`

**Find your config:**
```bash
sudo ls /etc/nginx/sites-available/
sudo ls /etc/nginx/conf.d/
```

**Edit the HTTPS server block** to add API proxy:

```bash
sudo nano /etc/nginx/sites-available/your-config.conf
```

**Add this location block BEFORE the existing `location /` block:**

```nginx
server {
    listen 443 ssl http2;
    server_name www.one-night-drink.com one-night-drink.com;

    # ... existing SSL configuration ...

    # ADD THIS - API proxy (place BEFORE location /)
    location /api/ {
        proxy_pass http://127.0.0.1:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Existing frontend proxy
    location / {
        proxy_pass http://127.0.0.1:8080;
        # ... rest of existing config ...
    }
}
```

**Test and reload nginx:**
```bash
# Test configuration
sudo nginx -t

# If test passes, reload
sudo systemctl reload nginx
```

### Step 11: Verify Backend is Running

```bash
# Test health endpoint
curl http://localhost:3001/health

# Should return: {"status":"ok","timestamp":"..."}

# Test via domain
curl https://www.one-night-drink.com/api/bars

# Should return JSON array of bars
```

### Step 12: Update Frontend (When Ready)

The frontend currently uses localStorage. To connect to the API:

1. Add API URL to frontend `.env`:
```bash
cd /path/to/YumYum
echo "VITE_API_URL=https://www.one-night-drink.com" > .env
```

2. Rebuild frontend:
```bash
npm run build
```

3. Restart frontend:
```bash
pm2 restart onenightdrink-frontend
# Or if using serve directly:
pkill -f "serve.*dist"
serve -s dist -l 8080 &
```

## Troubleshooting

### Backend won't start

**Check logs:**
```bash
pm2 logs onenightdrink-api
```

**Common issues:**
- Database connection failed → Check DATABASE_URL in `.env`
- Port 3001 in use → Check: `sudo lsof -i :3001`
- Build failed → Run `npm run build` again

### Can't access API through nginx

**Check nginx error logs:**
```bash
sudo tail -f /var/log/nginx/error.log
```

**Verify backend is listening:**
```bash
sudo netstat -tlnp | grep 3001
# Or
sudo ss -tlnp | grep 3001
```

**Test direct connection:**
```bash
curl http://localhost:3001/health
```

### Database connection errors

**Check PostgreSQL is running:**
```bash
sudo systemctl status postgresql
```

**Test database connection:**
```bash
sudo -u postgres psql -d onenightdrink -c "SELECT 1;"
```

**Check DATABASE_URL format:**
```
postgresql://username:password@host:port/database
```

### PM2 not persisting after reboot

```bash
# Setup PM2 startup script
pm2 startup systemd

# Follow the command it outputs (usually starts with sudo)

# Save current PM2 processes
pm2 save
```

## Verification Checklist

- [ ] PostgreSQL installed and running
- [ ] Database `onenightdrink` created
- [ ] Backend dependencies installed
- [ ] Backend built successfully (`server/dist/` exists)
- [ ] Migrations completed
- [ ] Backend running on port 3001
- [ ] PM2 shows `onenightdrink-api` as online
- [ ] `curl http://localhost:3001/health` returns OK
- [ ] Nginx config updated with `/api/` location
- [ ] Nginx test passes (`sudo nginx -t`)
- [ ] Nginx reloaded
- [ ] `curl https://your-domain.com/api/bars` returns data
- [ ] PM2 startup configured

## Rollback Plan

If something goes wrong:

1. **Stop backend:**
```bash
pm2 stop onenightdrink-api
pm2 delete onenightdrink-api
```

2. **Revert nginx config:**
```bash
sudo nano /etc/nginx/sites-available/your-config.conf
# Remove the /api/ location block
sudo nginx -t
sudo systemctl reload nginx
```

3. **Frontend continues working** as before (using localStorage)

## Next Steps After Migration

1. **Update frontend** to use API instead of localStorage (separate task)
2. **Setup automated backups** for PostgreSQL
3. **Monitor logs** for any issues
4. **Test all features** (registration, login, pass purchase, etc.)

## Alternative: Fresh Deployment

If you prefer a clean slate:

```bash
# Stop current frontend
pm2 stop onenightdrink-frontend
pm2 delete onenightdrink-frontend

# Or if using serve directly
pkill -f "serve.*dist"

# Run full deployment script
cd /path/to/YumYum
./deploy.sh 8080 3001
```

This will deploy both frontend and backend fresh.

## Support

- Backend setup: `BACKEND_SETUP.md`
- Full deployment: `DEPLOYMENT.md`
- Quick start: `QUICK_START.md`
