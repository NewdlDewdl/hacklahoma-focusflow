#!/bin/bash
# FocusFlow DigitalOcean deploy script
# Usage: ./deploy.sh [droplet-ip]

set -euo pipefail

DROPLET_IP="${1:?Usage: ./deploy.sh <droplet-ip>}"
APP_DIR="/opt/focusflow"

echo "🚀 Deploying FocusFlow to ${DROPLET_IP}..."

# Sync code to droplet
rsync -avz --exclude='node_modules' --exclude='.next' --exclude='.env' \
  -e ssh ../ root@${DROPLET_IP}:${APP_DIR}/

# Build and restart on remote
ssh root@${DROPLET_IP} << 'EOF'
  cd /opt/focusflow
  cd backend && npm ci --production && cd ..
  cd devops && docker compose up -d --build
  echo "✅ FocusFlow deployed"
EOF
