#!/bin/bash

# OneNightDrink VPS Deployment Script
# Usage: ./deploy.sh [frontend-port] [api-port] [--noseed]

FRONTEND_PORT=${1:-8080}
API_PORT=${2:-3001}
NO_SEED=false

if [ "$3" == "--noseed" ]; then
    NO_SEED=true
fi
APP_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_NAME="onenightdrink"

echo "=== OneNightDrink VPS Deployment ==="

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "Node.js not found. Installing via nvm..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    nvm install --lts
fi

# Check for PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "PostgreSQL not found. Please install PostgreSQL first:"
    echo "  Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib"
    echo "  CentOS/RHEL: sudo yum install postgresql-server postgresql-contrib"
    exit 1
fi

# ===== BACKEND API DEPLOYMENT =====
echo ""
echo "=== Deploying Backend API ==="
cd "$APP_DIR/server"

# Check if .env exists
if [ ! -f .env ]; then
    echo "ERROR: server/.env not found!"
    echo "Please create server/.env from server/.env.example and configure:"
    echo "  - DATABASE_URL"
    echo "  - JWT_SECRET"
    echo "  - ADMIN_PASSWORD"
    exit 1
fi

# Install backend dependencies (skip if already installed)
if [ -d node_modules ]; then
    echo "Skipping backend npm install (node_modules exists)..."
else
    echo "Installing backend dependencies..."
    npm install
fi

# Build backend
echo "Building backend..."
npm run build

if [ $? -ne 0 ]; then
    echo "Backend build failed!"
    exit 1
fi

# Run migrations
echo "Running database migrations..."
npm run migrate

if [ $? -ne 0 ]; then
    echo "Database migration failed!"
    echo "Make sure PostgreSQL is running and DATABASE_URL is correct in server/.env"
    exit 1
fi

# Seed database (only if needed)
if [ "$NO_SEED" = false ]; then
    read -p "Seed database with initial bar data? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npm run seed
    fi
else
    echo "Skipping seed (flag --noseed supplied)"
fi

# Install PM2 if not present
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi

# Stop existing backend process
pm2 stop "$APP_NAME-api" 2>/dev/null || true
pm2 delete "$APP_NAME-api" 2>/dev/null || true

# Start backend with PM2
echo "Starting backend API on port $API_PORT..."
cd "$APP_DIR/server"
PORT=$API_PORT NODE_ENV=production pm2 start dist/index.js --name "$APP_NAME-api"

# ===== FRONTEND DEPLOYMENT =====
echo ""
echo "=== Deploying Frontend ==="
cd "$APP_DIR"

# Install frontend dependencies (skip if already installed)
if [ -d node_modules ]; then
    echo "Skipping frontend npm install (node_modules exists)..."
else
    echo "Installing frontend dependencies..."
    npm install --legacy-peer-deps
fi

# Build frontend
echo "Building frontend..."
node ./node_modules/typescript/bin/tsc && node ./node_modules/vite/bin/vite.js build

if [ $? -ne 0 ]; then
    echo "Frontend build failed!"
    exit 1
fi

# Stop existing frontend process
pm2 stop "$APP_NAME-frontend" 2>/dev/null || true
pm2 delete "$APP_NAME-frontend" 2>/dev/null || true

# Start frontend with PM2 static server (no external serve dependency)
echo "Starting frontend on port $FRONTEND_PORT..."
pm2 serve dist $FRONTEND_PORT --spa --name "$APP_NAME-frontend"

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup systemd -u $USER --hp $HOME

echo ""
echo "=== Deployment Complete ==="
echo "Frontend: http://$(hostname -I | awk '{print $1}'):$FRONTEND_PORT"
echo "Backend API: http://$(hostname -I | awk '{print $1}'):$API_PORT"
echo ""
echo "PM2 Status:"
pm2 status
echo ""
echo "Logs:"
echo "  Frontend: pm2 logs $APP_NAME-frontend"
echo "  Backend:  pm2 logs $APP_NAME-api"
echo ""
echo "Management:"
echo "  Stop all:    pm2 stop all"
echo "  Restart all: pm2 restart all"
echo "  Status:      pm2 status"
