#!/usr/bin/env bash
set -euo pipefail

WWW_DOMAIN="www.one-night-drink.com"
APEX_DOMAIN=""
EMAIL=""
APP_PORT="8080"
CERTBOT_STAGING="0"

usage() {
  echo "Usage: sudo ./setup-domain.sh --email you@domain.com [--port 8080] [--www www.one-night-drink.com] [--apex one-night-drink.com] [--staging]"
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

pkg_installed() {
  dpkg-query -W -f='${Status}' "$1" 2>/dev/null | grep -q "install ok installed"
}

wait_for_dpkg_lock() {
  local timeout_s="${1:-600}"
  local waited_s=0

  while \
    fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1 || \
    fuser /var/lib/dpkg/lock >/dev/null 2>&1 || \
    fuser /var/lib/apt/lists/lock >/dev/null 2>&1 || \
    fuser /var/cache/apt/archives/lock >/dev/null 2>&1; do
    if [[ "$waited_s" -ge "$timeout_s" ]]; then
      echo "ERROR: Timed out waiting for dpkg/apt locks (likely unattended-upgrades). Try again later."; exit 1
    fi
    echo "Waiting for dpkg/apt lock... (${waited_s}s/${timeout_s}s)"
    sleep 5
    waited_s=$((waited_s + 5))
  done
}

if command -v apt-get >/dev/null 2>&1; then
  export DEBIAN_FRONTEND=noninteractive

  NEED_PKGS=()
  pkg_installed nginx || NEED_PKGS+=(nginx)
  pkg_installed certbot || NEED_PKGS+=(certbot)
  pkg_installed python3-certbot-nginx || NEED_PKGS+=(python3-certbot-nginx)

  if [[ "${#NEED_PKGS[@]}" -gt 0 ]]; then
    wait_for_dpkg_lock 900
    apt-get update -y
    apt-get install -y "${NEED_PKGS[@]}"
  fi
else
  echo "This script currently supports Debian/Ubuntu (apt-get)."; exit 1
fi

NGINX_CONF_NAME="onenightdrink"
NGINX_ROOT="/etc/nginx"
NGINX_AVAILABLE=""
NGINX_ENABLED=""
USE_SITES_LAYOUT="0"

if [[ -f "${NGINX_ROOT}/nginx.conf" ]] && grep -Eqs "include\s+${NGINX_ROOT}/sites-enabled/\*" "${NGINX_ROOT}/nginx.conf"; then
  USE_SITES_LAYOUT="1"
elif [[ -d "${NGINX_ROOT}/sites-available" || -d "${NGINX_ROOT}/sites-enabled" ]]; then
  USE_SITES_LAYOUT="1"
fi

if [[ "$USE_SITES_LAYOUT" == "1" ]]; then
  mkdir -p "${NGINX_ROOT}/sites-available" "${NGINX_ROOT}/sites-enabled"
  NGINX_AVAILABLE="${NGINX_ROOT}/sites-available/${NGINX_CONF_NAME}.conf"
  NGINX_ENABLED="${NGINX_ROOT}/sites-enabled/${NGINX_CONF_NAME}.conf"
else
  mkdir -p "${NGINX_ROOT}/conf.d"
  NGINX_AVAILABLE="${NGINX_ROOT}/conf.d/${NGINX_CONF_NAME}.conf"
fi

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

if [[ -n "$NGINX_ENABLED" ]]; then
  ln -sf "$NGINX_AVAILABLE" "$NGINX_ENABLED"
fi

nginx -t
systemctl enable nginx >/dev/null 2>&1 || true
systemctl start nginx >/dev/null 2>&1 || true
systemctl reload nginx >/dev/null 2>&1 || systemctl restart nginx

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
