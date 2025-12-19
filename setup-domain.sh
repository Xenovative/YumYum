#!/usr/bin/env bash
set -euo pipefail

WWW_DOMAIN="www.one-night-drink.com"
APEX_DOMAIN=""
EMAIL=""
APP_PORT="8080"
CERTBOT_STAGING="0"

usage() {
  echo "Usage: sudo ./setup-domain.sh --email you@domain.com [--port 8080] [--www www.one-night-drink.com] [--apex one-night-drink.com]"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --email)
      EMAIL="${2:-}"; shift 2 ;;
    --port)
      APP_PORT="${2:-}"; shift 2 ;;
    --www)
      WWW_DOMAIN="${2:-}"; shift 2 ;;
    --apex)
      APEX_DOMAIN="${2:-}"; shift 2 ;;
    --staging)
      CERTBOT_STAGING="1"; shift 1 ;;
    -h|--help)
      usage; exit 0 ;;
    *)
      echo "Unknown arg: $1"; usage; exit 1 ;;
  esac
done

if [[ -z "$EMAIL" ]]; then
  echo "Missing --email"; usage; exit 1
fi

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  echo "Run as root (sudo)."; exit 1
fi

if command -v apt-get >/dev/null 2>&1; then
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -y
  apt-get install -y nginx
  apt-get install -y certbot python3-certbot-nginx
else
  echo "This script currently supports Debian/Ubuntu (apt-get)."; exit 1
fi

NGINX_CONF_NAME="onenightdrink"
NGINX_AVAILABLE="/etc/nginx/sites-available/${NGINX_CONF_NAME}.conf"
NGINX_ENABLED="/etc/nginx/sites-enabled/${NGINX_CONF_NAME}.conf"

DOMAINS=("$WWW_DOMAIN")
if [[ -n "$APEX_DOMAIN" ]]; then
  DOMAINS+=("$APEX_DOMAIN")
else
  if [[ "$WWW_DOMAIN" == www.* ]]; then
    DOMAINS+=("${WWW_DOMAIN#www.}")
  fi
fi

SERVER_NAMES="${DOMAINS[*]}"

cat > "$NGINX_AVAILABLE" <<EOF
server {
  listen 80;
  listen [::]:80;

  server_name ${SERVER_NAMES};

  location / {
    proxy_pass http://127.0.0.1:${APP_PORT};
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
EOF

ln -sf "$NGINX_AVAILABLE" "$NGINX_ENABLED"

nginx -t
systemctl enable nginx >/dev/null 2>&1 || true
systemctl reload nginx

if command -v ss >/dev/null 2>&1; then
  if ! ss -ltn | grep -E "[:\]]${APP_PORT}[[:space:]]" >/dev/null 2>&1; then
    echo "WARNING: Nothing appears to be listening on 127.0.0.1:${APP_PORT}."
    echo "WARNING: Run your app first (Option A), e.g.: ./deploy.sh ${APP_PORT}"
  fi
fi

CERTBOT_ARGS=(--nginx -n --agree-tos --redirect -m "$EMAIL")
if [[ "$CERTBOT_STAGING" == "1" ]]; then
  CERTBOT_ARGS+=(--staging)
fi
for d in "${DOMAINS[@]}"; do
  CERTBOT_ARGS+=( -d "$d" )
done

certbot "${CERTBOT_ARGS[@]}"

systemctl reload nginx

echo ""
echo "Done. Verify: https://${WWW_DOMAIN}"
echo "Proxy target: http://127.0.0.1:${APP_PORT}"
