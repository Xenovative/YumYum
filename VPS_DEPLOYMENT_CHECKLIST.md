# VPS Deployment Checklist - Backend/Frontend Connection Issues

## Problem
Admin changes only affect localStorage because backend and frontend aren't properly connected on VPS.

## Root Causes Identified

### 1. Backend Server Not Running
- Backend must be running on port 3001 on the VPS
- Check with: `ss -ltnp | grep 3001` or `netstat -tlnp | grep 3001`

### 2. Database Connection
- PostgreSQL must be running and accessible
- Update `server/.env` with correct DATABASE_URL including password
- Run migrations: `npm run migrate`
- Seed data: `npm run seed`

### 3. Nginx Proxy Configuration
Your nginx config (from `setup-domain.sh`) routes:
- `https://one-night-drink.com/api/*` → `http://127.0.0.1:3001/api/*`
- `https://one-night-drink.com/*` → `http://127.0.0.1:8080` (frontend)

This is correct! The frontend calls `https://one-night-drink.com/api/...` and nginx proxies to backend.

### 4. CORS Configuration
Backend must allow requests from your domain. Updated `server/.env`:
```env
CORS_ORIGIN=https://one-night-drink.com,https://www.one-night-drink.com
```

## VPS Deployment Steps

### On Your VPS:

1. **Update Backend .env**
   ```bash
   cd /path/to/YumYum/server
   nano .env
   ```
   
   Update these values:
   ```env
   PORT=3001
   NODE_ENV=production
   DATABASE_URL=postgresql://postgres:YOUR_ACTUAL_PASSWORD@localhost:5432/onenightdrink
   JWT_SECRET=GENERATE_A_SECURE_RANDOM_STRING
   ADMIN_PASSWORD=your_secure_admin_password
   CORS_ORIGIN=https://one-night-drink.com,https://www.one-night-drink.com
   ```

2. **Setup Database**
   ```bash
   # Create database
   sudo -u postgres createdb onenightdrink
   
   # Run migrations
   cd /path/to/YumYum/server
   npm run migrate
   
   # Seed initial data
   npm run seed
   ```

3. **Start Backend Server**
   
   Option A - Using PM2 (recommended for production):
   ```bash
   npm install -g pm2
   cd /path/to/YumYum/server
   npm run build
   pm2 start dist/index.js --name onenightdrink-api
   pm2 save
   pm2 startup  # Follow the instructions
   ```
   
   Option B - Using systemd:
   ```bash
   # Create systemd service file
   sudo nano /etc/systemd/system/onenightdrink-api.service
   ```
   
   Add:
   ```ini
   [Unit]
   Description=OneNightDrink API
   After=network.target postgresql.service
   
   [Service]
   Type=simple
   User=YOUR_USER
   WorkingDirectory=/path/to/YumYum/server
   ExecStart=/usr/bin/node dist/index.js
   Restart=on-failure
   Environment=NODE_ENV=production
   
   [Install]
   WantedBy=multi-user.target
   ```
   
   Then:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable onenightdrink-api
   sudo systemctl start onenightdrink-api
   sudo systemctl status onenightdrink-api
   ```

4. **Build and Deploy Frontend**
   ```bash
   cd /path/to/YumYum
   
   # Make sure .env has production API URL
   echo "VITE_API_URL=https://one-night-drink.com" > .env
   
   # Build
   npm run build
   
   # Serve with your preferred method (PM2, systemd, or serve package)
   # Example with serve:
   npm install -g serve
   pm2 start "serve -s dist -l 8080" --name onenightdrink-frontend
   ```

5. **Verify Nginx Configuration**
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

6. **Check Everything is Running**
   ```bash
   # Check backend
   curl http://localhost:3001/api/health
   
   # Check frontend
   curl http://localhost:8080
   
   # Check through nginx
   curl https://one-night-drink.com/api/health
   ```

## Testing Admin Panel

1. Visit `https://one-night-drink.com/admin`
2. Login with your ADMIN_PASSWORD
3. Try adding/editing/deleting a bar
4. Refresh the page - changes should persist
5. Check browser console for any API errors

## Common Issues

### Issue: "Failed to fetch" or CORS errors
**Solution**: 
- Verify CORS_ORIGIN in `server/.env` includes your domain
- Restart backend after changing .env
- Check browser console for exact error

### Issue: 401/403 errors on admin operations
**Solution**:
- Admin login must work first to get JWT token
- Token stored in localStorage as `admin_token`
- Check Network tab to see if Authorization header is sent

### Issue: Changes don't persist after refresh
**Solution**:
- Backend must be running and accessible
- Database must be configured correctly
- Check backend logs for errors: `pm2 logs onenightdrink-api`

### Issue: nginx 502 Bad Gateway
**Solution**:
- Backend not running on port 3001
- Check: `ss -ltnp | grep 3001`
- Start backend service

## Environment Variables Summary

### Frontend `.env`:
```env
VITE_API_URL=https://one-night-drink.com
```

### Backend `server/.env`:
```env
PORT=3001
NODE_ENV=production
DATABASE_URL=postgresql://postgres:PASSWORD@localhost:5432/onenightdrink
JWT_SECRET=your-secure-secret-key
ADMIN_PASSWORD=your-admin-password
CORS_ORIGIN=https://one-night-drink.com,https://www.one-night-drink.com
```

## Debugging Commands

```bash
# Check if backend is running
ss -ltnp | grep 3001

# Check backend logs (if using PM2)
pm2 logs onenightdrink-api

# Check backend logs (if using systemd)
sudo journalctl -u onenightdrink-api -f

# Test backend directly
curl http://localhost:3001/api/health

# Test through nginx
curl https://one-night-drink.com/api/health

# Check nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Test database connection
psql -U postgres -d onenightdrink -c "SELECT COUNT(*) FROM bars;"
```
