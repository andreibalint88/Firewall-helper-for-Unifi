#!/bin/bash

# Quick fix script for 403 Forbidden error
# Run this inside the LXC container

set -e

echo "=== UniFi Firewall Manager - Quick Fix ==="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Error: Must run as root"
    exit 1
fi

# Find nginx config
echo "1. Checking nginx configuration..."
NGINX_CONF=$(find /etc/nginx -name "*unifi*" -o -name "*firewall*" 2>/dev/null | head -1)

if [ -z "$NGINX_CONF" ]; then
    echo "   ❌ No nginx config found"
    echo "   Creating default config..."
    
    cat > /etc/nginx/sites-available/unifi-firewall-manager << 'EOF'
server {
    listen 80;
    server_name _;

    root /opt/unifi-firewall-manager;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF
    
    ln -sf /etc/nginx/sites-available/unifi-firewall-manager /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    NGINX_CONF="/etc/nginx/sites-available/unifi-firewall-manager"
fi

echo "   ✓ Config: $NGINX_CONF"

# Get root directory from config
ROOT_DIR=$(grep "root " $NGINX_CONF | awk '{print $2}' | sed 's/;//')
echo "   ✓ Root directory: $ROOT_DIR"
echo ""

# Check if directory exists
echo "2. Checking directory..."
if [ ! -d "$ROOT_DIR" ]; then
    echo "   ❌ Directory does not exist: $ROOT_DIR"
    echo "   Creating directory..."
    mkdir -p $ROOT_DIR
fi
echo "   ✓ Directory exists"
echo ""

# Check if files exist
echo "3. Checking files..."
if [ ! -f "$ROOT_DIR/index.html" ]; then
    echo "   ❌ index.html not found in $ROOT_DIR"
    echo ""
    echo "   The application files need to be deployed."
    echo ""
    echo "   Option 1: Copy from Proxmox host"
    echo "   On Proxmox host, run:"
    echo "     pct push <CTID> /path/to/dist/* $ROOT_DIR/"
    echo ""
    echo "   Option 2: Build inside container"
    echo "   If you have the source code in /tmp/app:"
    echo "     cd /tmp/app"
    echo "     npm install"
    echo "     npm run build"
    echo "     cp -r dist/* $ROOT_DIR/"
    echo ""
    echo "   Option 3: Download pre-built files"
    echo "   If you have a release URL:"
    echo "     cd /tmp"
    echo "     wget <release-url>"
    echo "     tar -xzf *.tar.gz"
    echo "     cp -r dist/* $ROOT_DIR/"
    echo ""
    exit 1
fi

echo "   ✓ Files found:"
ls -lh $ROOT_DIR/ | head -10
echo ""

# Fix permissions
echo "4. Fixing permissions..."
chown -R www-data:www-data $ROOT_DIR
chmod -R 755 $ROOT_DIR
echo "   ✓ Permissions fixed (www-data:www-data, 755)"
echo ""

# Restart nginx
echo "5. Restarting nginx..."
nginx -t
if [ $? -eq 0 ]; then
    systemctl restart nginx
    echo "   ✓ nginx restarted"
else
    echo "   ❌ nginx config test failed"
    exit 1
fi
echo ""

# Test
echo "6. Testing..."
sleep 2
RESULT=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/)

if [ "$RESULT" = "200" ]; then
    echo "   ✓ Success! HTTP $RESULT"
    echo ""
    echo "=== Fix Complete ==="
    echo ""
    echo "Access the application at:"
    hostname -I | awk '{print "  http://"$1}'
    echo ""
else
    echo "   ❌ Still getting HTTP $RESULT"
    echo ""
    echo "Check nginx error log:"
    echo "  tail -20 /var/log/nginx/error.log"
    echo ""
    echo "Check file permissions:"
    echo "  ls -la $ROOT_DIR/"
    echo ""
    exit 1
fi
