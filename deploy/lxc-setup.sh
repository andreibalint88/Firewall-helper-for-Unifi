#!/bin/bash

# UniFi Firewall Manager - Proxmox LXC Deployment Script
# This script sets up the application in a Proxmox LXC container

set -e

echo "=========================================="
echo "UniFi Firewall Manager - LXC Setup"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Error: This script must be run as root${NC}"
    exit 1
fi

# Configuration
APP_NAME="unifi-firewall-manager"
APP_DIR="/opt/${APP_NAME}"
NODE_VERSION="20"
NGINX_PORT=80

echo -e "${YELLOW}Step 1: Updating system packages...${NC}"
apt update && apt upgrade -y

echo -e "${YELLOW}Step 2: Installing Node.js ${NODE_VERSION}...${NC}"
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
apt install -y nodejs

echo -e "${YELLOW}Step 3: Installing nginx...${NC}"
apt install -y nginx

echo -e "${YELLOW}Step 4: Creating application directory...${NC}"
mkdir -p ${APP_DIR}

echo -e "${YELLOW}Step 5: Copying application files...${NC}"
# Assuming the script is run from the project root
if [ -d "dist" ]; then
    cp -r dist/* ${APP_DIR}/
elif [ -f "package.json" ]; then
    echo "Building application first..."
    npm install
    npm run build
    cp -r dist/* ${APP_DIR}/
else
    echo -e "${RED}Error: Cannot find application files. Run this script from the project root.${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 6: Setting permissions...${NC}"
chown -R www-data:www-data ${APP_DIR}
chmod -R 755 ${APP_DIR}

echo -e "${YELLOW}Step 7: Configuring nginx...${NC}"
cat > /etc/nginx/sites-available/${APP_NAME} << 'EOF'
server {
    listen 80;
    server_name _;

    root /opt/unifi-firewall-manager;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing - serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/${APP_NAME} /etc/nginx/sites-enabled/${APP_NAME}
rm -f /etc/nginx/sites-enabled/default

echo -e "${YELLOW}Step 8: Testing nginx configuration...${NC}"
nginx -t

echo -e "${YELLOW}Step 9: Starting nginx...${NC}"
systemctl enable nginx
systemctl restart nginx

echo -e "${YELLOW}Step 10: Configuring firewall (if ufw is installed)...${NC}"
if command -v ufw &> /dev/null; then
    ufw allow ${NGINX_PORT}/tcp
    echo "Firewall rule added for port ${NGINX_PORT}"
fi

echo ""
echo -e "${GREEN}=========================================="
echo "Installation Complete!"
echo "==========================================${NC}"
echo ""
echo "Application URL: http://$(hostname -I | awk '{print $1}')"
echo "Application directory: ${APP_DIR}"
echo ""
echo "Useful commands:"
echo "  - View status: systemctl status nginx"
echo "  - View logs: journalctl -u nginx -f"
echo "  - Restart nginx: systemctl restart nginx"
echo "  - Update app: Copy new dist/ files to ${APP_DIR}"
echo ""
echo -e "${YELLOW}Security Recommendations:${NC}"
echo "  1. Set up HTTPS with Let's Encrypt (certbot)"
echo "  2. Configure a reverse proxy if needed"
echo "  3. Set up proper authentication if exposing publicly"
echo "  4. Restrict access to your local network in Proxmox firewall"
echo ""
