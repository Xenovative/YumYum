#!/bin/bash

# Setup OneNightDrink as a systemd service
# Run with sudo: sudo ./setup-systemd.sh [port]

PORT=${1:-3000}
APP_DIR="$(cd "$(dirname "$0")" && pwd)"
USER=$(logname)

# Build first
echo "Building app..."
cd "$APP_DIR"
sudo -u $USER npm install
sudo -u $USER npm run build

# Install serve if needed
which serve > /dev/null || npm install -g serve

# Create systemd service
cat > /etc/systemd/system/onenightdrink.service << EOF
[Unit]
Description=OneNightDrink Bar Pass App
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$APP_DIR
ExecStart=$(which serve) dist -l $PORT
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=onenightdrink

[Install]
WantedBy=multi-user.target
EOF

# Enable and start
systemctl daemon-reload
systemctl enable onenightdrink
systemctl start onenightdrink

echo "=== Service installed ==="
echo "Status:  sudo systemctl status onenightdrink"
echo "Logs:    sudo journalctl -u onenightdrink -f"
echo "Restart: sudo systemctl restart onenightdrink"
echo "Stop:    sudo systemctl stop onenightdrink"
echo ""
echo "App running at: http://$(hostname -I | awk '{print $1}'):$PORT"
