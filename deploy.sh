#!/bin/bash

# YumYum VPS Deployment Script
# Usage: ./deploy.sh [port]

PORT=${1:-8080}
APP_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_NAME="yumyum"

echo "=== YumYum VPS Deployment ==="

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "Node.js not found. Installing via nvm..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    nvm install --lts
fi

# Install dependencies
echo "Installing dependencies..."
cd "$APP_DIR"
npm install

# Build production bundle
echo "Building production bundle..."
node ./node_modules/typescript/bin/tsc && node ./node_modules/vite/bin/vite.js build

if [ $? -ne 0 ]; then
    echo "Build failed!"
    exit 1
fi

# Install serve globally if not present
if ! command -v serve &> /dev/null; then
    echo "Installing serve..."
    npm install -g serve
fi

# Kill existing process if running
pkill -f "serve.*$APP_NAME" 2>/dev/null

# Start server with nohup (survives SSH disconnect)
echo "Starting server on port $PORT..."
nohup serve -s dist -l $PORT > "$APP_DIR/$APP_NAME.log" 2>&1 &

echo "=== Deployment complete ==="
echo "App running at: http://$(hostname -I | awk '{print $1}'):$PORT"
echo "Logs: $APP_DIR/$APP_NAME.log"
echo "Stop with: pkill -f 'serve.*$APP_NAME'"
