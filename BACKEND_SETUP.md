# Backend API Setup Guide

## Prerequisites

1. **Node.js** (v18 or higher)
2. **PostgreSQL** (v14 or higher)
3. **npm** or **yarn**

## Step-by-Step Setup

### 1. Install PostgreSQL

**Windows:**
```powershell
# Download from https://www.postgresql.org/download/windows/
# Or use Chocolatey:
choco install postgresql
```

**macOS:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Linux:**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE onenightdrink;

# Exit psql
\q
```

Or use a single command:
```bash
createdb onenightdrink
```

### 3. Install Backend Dependencies

```bash
cd server
npm install
```

### 4. Configure Environment

```bash
# Copy example env file
cp .env.example .env
```

Edit `.env` file:
```env
PORT=3001
NODE_ENV=development

# Update with your PostgreSQL credentials
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/onenightdrink

# Generate a secure random string for JWT_SECRET
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Set admin password
ADMIN_PASSWORD=onenightdrink2024

# Add your frontend URLs (comma-separated)
CORS_ORIGIN=http://localhost:5173,http://localhost:8100,https://one-night-drink.com,https://www.one-night-drink.com
```

**Generate secure JWT_SECRET:**
```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or online: https://generate-secret.vercel.app/32
```

### 5. Run Database Migrations

```bash
npm run migrate
```

This creates all necessary tables:
- users
- bars
- passes
- parties
- party_members
- payment_settings

### 6. Seed Initial Data

```bash
npm run seed
```

This populates the database with 16 bars across Hong Kong districts.

### 7. Start Development Server

```bash
npm run dev
```

Server will start on `http://localhost:3001`

Test health endpoint:
```bash
curl http://localhost:3001/health
```

## Production Deployment

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
NODE_ENV=production npm start
```

### Using PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start server
pm2 start dist/index.js --name onenightdrink-api

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### Using systemd (Linux)

Create `/etc/systemd/system/onenightdrink-api.service`:

```ini
[Unit]
Description=OneNightDrink API Server
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/YumYum/server
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable onenightdrink-api
sudo systemctl start onenightdrink-api
sudo systemctl status onenightdrink-api
```

## Nginx Configuration

Add to your nginx config:

```nginx
# API proxy
location /api/ {
    proxy_pass http://localhost:3001/api/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## Testing API Endpoints

### Register User
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User",
    "phone": "12345678"
  }'
```

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Get Bars
```bash
curl http://localhost:3001/api/bars
```

### Admin Login
```bash
curl -X POST http://localhost:3001/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "password": "onenightdrink2024"
  }'
```

## Troubleshooting

### Database Connection Issues

1. Check PostgreSQL is running:
```bash
# Linux/macOS
sudo systemctl status postgresql

# Windows
Get-Service postgresql*
```

2. Verify DATABASE_URL in `.env`
3. Check PostgreSQL logs:
```bash
# Linux
sudo tail -f /var/log/postgresql/postgresql-14-main.log

# macOS
tail -f /usr/local/var/log/postgres.log
```

### Port Already in Use

Change PORT in `.env` or kill process:
```bash
# Find process
lsof -i :3001  # macOS/Linux
netstat -ano | findstr :3001  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

### Migration Errors

Reset database:
```bash
# Drop and recreate
dropdb onenightdrink
createdb onenightdrink

# Re-run migrations
npm run migrate
npm run seed
```

## Next Steps

After backend is running:
1. Update frontend to use API (see FRONTEND_MIGRATION.md)
2. Configure CORS for your domains
3. Set up SSL certificates for production
4. Configure backup strategy for PostgreSQL
5. Set up monitoring (e.g., PM2, New Relic)

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| PORT | Server port | 3001 |
| NODE_ENV | Environment | development/production |
| DATABASE_URL | PostgreSQL connection | postgresql://user:pass@host:5432/db |
| JWT_SECRET | JWT signing key | random-32-byte-hex-string |
| JWT_EXPIRES_IN | Token expiry | 7d |
| ADMIN_PASSWORD | Admin panel password | onenightdrink2024 |
| CORS_ORIGIN | Allowed origins | http://localhost:5173,https://... |
