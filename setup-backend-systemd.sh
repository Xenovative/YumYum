#!/bin/bash

# OneNightDrink Backend API systemd Service Setup
# Usage: sudo ./setup-backend-systemd.sh

set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_NAME="onenightdrink-api"
SERVICE_NAME="onenightdrink-api"
API_PORT="${1:-3001}"

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  echo "Run as root (sudo)."
  exit 1
fi

# Get the actual user who ran sudo
ACTUAL_USER="${SUDO_USER:-$USER}"
USER_HOME=$(eval echo ~$ACTUAL_USER)

echo "=== Setting up $SERVICE_NAME systemd service ==="

# Check if backend is built
if [ ! -f "$APP_DIR/server/dist/index.js" ]; then
    echo "ERROR: Backend not built. Run 'cd server && npm run build' first."
    exit 1
fi

# Check if .env exists
if [ ! -f "$APP_DIR/server/.env" ]; then
    echo "ERROR: server/.env not found!"
    echo "Please create server/.env from server/.env.example"
    exit 1
fi

# Create systemd service file
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=OneNightDrink Backend API
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=$ACTUAL_USER
WorkingDirectory=$APP_DIR/server
Environment=NODE_ENV=production
Environment=PORT=$API_PORT
EnvironmentFile=$APP_DIR/server/.env
ExecStart=$(which node) dist/index.js
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=$SERVICE_NAME

[Install]
WantedBy=multi-user.target
EOF

echo "Created service file: $SERVICE_FILE"

# Reload systemd
systemctl daemon-reload

# Enable service to start on boot
systemctl enable "$SERVICE_NAME"

# Start service
systemctl start "$SERVICE_NAME"

# Check status
sleep 2
systemctl status "$SERVICE_NAME" --no-pager

echo ""
echo "=== Setup Complete ==="
echo "Service: $SERVICE_NAME"
echo "Port: $API_PORT"
echo ""
echo "Commands:"
echo "  Status:  sudo systemctl status $SERVICE_NAME"
echo "  Start:   sudo systemctl start $SERVICE_NAME"
echo "  Stop:    sudo systemctl stop $SERVICE_NAME"
echo "  Restart: sudo systemctl restart $SERVICE_NAME"
echo "  Logs:    sudo journalctl -u $SERVICE_NAME -f"
echo ""
echo "API Health: curl http://localhost:$API_PORT/health"
