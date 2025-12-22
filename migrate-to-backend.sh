#!/bin/bash

# OneNightDrink - Add Backend to Existing VPS Deployment
# Usage: ./migrate-to-backend.sh

set -e

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
API_PORT="${1:-3001}"

echo "=== OneNightDrink Backend Migration ==="
echo "This script adds the backend API to your existing deployment"
echo ""

# Check if running on VPS (not Windows)
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    echo "ERROR: This script must be run on your Linux VPS, not Windows"
    echo "Usage: ssh into your VPS, then run: ./migrate-to-backend.sh"
    exit 1
fi

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js not found. Please install Node.js first."
    exit 1
fi

# Check if server directory exists
if [ ! -d "$APP_DIR/server" ]; then
    echo "ERROR: server/ directory not found"
    echo "Please run 'git pull' first to get the latest code"
    exit 1
fi

# ===== INSTALL POSTGRESQL =====
echo ""
echo "=== Step 1: PostgreSQL Setup ==="
if ! command -v psql &> /dev/null; then
    echo "PostgreSQL not found. Installing..."
    sudo apt-get update
    sudo apt-get install -y postgresql postgresql-contrib
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    echo "✓ PostgreSQL installed"
else
    echo "✓ PostgreSQL already installed"
fi

# ===== CREATE DATABASE =====
echo ""
echo "=== Step 2: Create Database ==="
if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw onenightdrink; then
    echo "✓ Database 'onenightdrink' already exists"
else
    echo "Creating database..."
    sudo -u postgres createdb onenightdrink
    echo "✓ Database created"
fi

# ===== CONFIGURE BACKEND =====
echo ""
echo "=== Step 3: Configure Backend ==="
cd "$APP_DIR/server"

if [ -f .env ]; then
    echo "⚠ server/.env already exists"
    read -p "Overwrite with new configuration? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Keeping existing .env"
    else
        rm .env
    fi
fi

if [ ! -f .env ]; then
    echo "Creating .env file..."
    
    # Generate JWT secret
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    
    # Prompt for admin password
    read -p "Enter admin password (default: onenightdrink2024): " ADMIN_PASS
    ADMIN_PASS=${ADMIN_PASS:-onenightdrink2024}
    
    # Prompt for domain
    read -p "Enter your domain (e.g., www.one-night-drink.com): " DOMAIN
    DOMAIN=${DOMAIN:-localhost}
    
    cat > .env <<EOF
PORT=$API_PORT
NODE_ENV=production

# Database
DATABASE_URL=postgresql://postgres@localhost:5432/onenightdrink

# JWT
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d

# Admin
ADMIN_PASSWORD=$ADMIN_PASS

# CORS
CORS_ORIGIN=https://$DOMAIN,http://localhost:5173,http://localhost:8100
EOF
    
    echo "✓ Created .env file"
    echo "⚠ If PostgreSQL has a password, edit server/.env and update DATABASE_URL"
fi

# ===== INSTALL DEPENDENCIES =====
echo ""
echo "=== Step 4: Install Backend Dependencies ==="
npm install
echo "✓ Dependencies installed"

# ===== BUILD BACKEND =====
echo ""
echo "=== Step 5: Build Backend ==="
npm run build
if [ $? -ne 0 ]; then
    echo "ERROR: Backend build failed"
    exit 1
fi
echo "✓ Backend built successfully"

# ===== RUN MIGRATIONS =====
echo ""
echo "=== Step 6: Database Migrations ==="
npm run migrate
if [ $? -ne 0 ]; then
    echo "ERROR: Database migration failed"
    echo "Check DATABASE_URL in server/.env"
    exit 1
fi
echo "✓ Migrations completed"

# ===== SEED DATABASE =====
echo ""
echo "=== Step 7: Seed Database ==="
read -p "Seed database with initial bar data? (Y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    npm run seed
    echo "✓ Database seeded"
else
    echo "⊘ Skipped seeding"
fi

# ===== INSTALL PM2 =====
echo ""
echo "=== Step 8: Process Manager ==="
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
    echo "✓ PM2 installed"
else
    echo "✓ PM2 already installed"
fi

# ===== START BACKEND =====
echo ""
echo "=== Step 9: Start Backend API ==="

# Stop if already running
pm2 stop onenightdrink-api 2>/dev/null || true
pm2 delete onenightdrink-api 2>/dev/null || true

# Start backend
cd "$APP_DIR/server"
PORT=$API_PORT NODE_ENV=production pm2 start dist/index.js --name onenightdrink-api

# Save PM2 config
pm2 save

# Setup startup script if not already done
if ! pm2 startup | grep -q "already"; then
    echo "Setting up PM2 startup..."
    pm2 startup systemd -u $USER --hp $HOME
fi

echo "✓ Backend API started on port $API_PORT"

# ===== UPDATE NGINX =====
echo ""
echo "=== Step 10: Update Nginx Configuration ==="

# Find nginx config file
NGINX_CONF=""
if [ -f /etc/nginx/sites-available/00-onenightdrink.conf ]; then
    NGINX_CONF="/etc/nginx/sites-available/00-onenightdrink.conf"
elif [ -f /etc/nginx/sites-enabled/00-onenightdrink.conf ]; then
    NGINX_CONF="/etc/nginx/sites-enabled/00-onenightdrink.conf"
elif [ -f /etc/nginx/conf.d/onenightdrink.conf ]; then
    NGINX_CONF="/etc/nginx/conf.d/onenightdrink.conf"
fi

if [ -z "$NGINX_CONF" ]; then
    echo "⚠ Nginx config not found. Skipping automatic update."
    echo "Please manually add API proxy to your nginx config."
else
    echo "Found nginx config: $NGINX_CONF"
    
    # Check if API proxy already exists
    if grep -q "location /api/" "$NGINX_CONF"; then
        echo "✓ API proxy already configured"
    else
        echo "Adding API proxy configuration..."
        
        # Create backup
        sudo cp "$NGINX_CONF" "${NGINX_CONF}.backup.$(date +%Y%m%d_%H%M%S)"
        
        # Add API proxy before the first 'location /' block in the HTTPS server section
        sudo sed -i '/listen 443 ssl/,/location \// {
            /location \// i\
\
  # API proxy\
  location /api/ {\
    proxy_pass http://127.0.0.1:'"$API_PORT"'/api/;\
    proxy_http_version 1.1;\
    proxy_set_header Host $host;\
    proxy_set_header X-Real-IP $remote_addr;\
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\
    proxy_set_header X-Forwarded-Proto $scheme;\
  }\

        }' "$NGINX_CONF"
        
        echo "✓ API proxy added to nginx config"
    fi
    
    echo ""
    echo "Testing nginx configuration..."
    sudo nginx -t
    
    if [ $? -eq 0 ]; then
        echo "✓ Nginx config valid"
        echo "Reloading nginx..."
        sudo systemctl reload nginx
        echo "✓ Nginx reloaded"
    else
        echo "ERROR: Nginx config test failed"
        echo "Restoring backup..."
        sudo cp "${NGINX_CONF}.backup."* "$NGINX_CONF" 2>/dev/null || true
        echo "Please check the configuration manually"
    fi
fi

# ===== VERIFICATION =====
echo ""
echo "=== Step 11: Verification ==="
echo ""

# Test local health endpoint
echo "Testing backend health endpoint..."
sleep 2
if curl -s http://localhost:$API_PORT/health | grep -q "ok"; then
    echo "✓ Backend API responding locally"
else
    echo "⚠ Backend health check failed"
    echo "Check logs: pm2 logs onenightdrink-api"
fi

# Show PM2 status
echo ""
echo "PM2 Status:"
pm2 status

echo ""
echo "=== Migration Complete ==="
echo ""
echo "Backend API: http://localhost:$API_PORT"
echo "Health check: curl http://localhost:$API_PORT/health"
echo ""
echo "Next steps:"
echo "1. Test API: curl https://your-domain.com/api/bars"
echo "2. Check logs: pm2 logs onenightdrink-api"
echo "3. Update frontend to use API (separate task)"
echo ""
echo "Management commands:"
echo "  Status:  pm2 status"
echo "  Logs:    pm2 logs onenightdrink-api"
echo "  Restart: pm2 restart onenightdrink-api"
echo "  Stop:    pm2 stop onenightdrink-api"
echo ""
