#!/bin/bash

# UniFi Firewall Manager - Proxmox Host Deployment Script
# Run this script on the Proxmox HOST (not inside the container)
# It creates the LXC container and sets everything up automatically

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration - Edit these values
CTID_MIN=100                      # Minimum Container ID to start searching from
CTID_MAX=999                      # Maximum Container ID to search up to
HOSTNAME="unifi-fw-manager"       # Container hostname
MEMORY=512                        # RAM in MB
SWAP=512                          # Swap in MB
CORES=1                           # CPU cores
DISK_SIZE=2                       # Root disk in GB
STORAGE="local-lvm"               # Storage pool for root disk
TEMPLATE_STORAGE="local"          # Storage for templates
BRIDGE="vmbr0"                    # Network bridge
IP_ADDRESS="dhcp"                 # IP address (dhcp or static like 192.168.1.100/24)
GATEWAY=""                        # Gateway (required for static IP)
DNS="8.8.8.8"                     # DNS server
PASSWORD=""                       # Root password for the container (will prompt if empty)
SSH_KEYS=""                       # Path to SSH public key file (optional)
PROJECT_DIR=""                    # Path to project files on Proxmox host (will prompt)

# Function to check if a container ID is in use
# Returns 0 (true) if in use, 1 (false) if available
ctid_in_use() {
    local check_id=$1
    # Check via pct status (works for running and stopped containers)
    if pct status "$check_id" &> /dev/null 2>&1; then
        return 0
    fi
    # Also check the config directory as a fallback
    if [ -f "/etc/pve/lxc/${check_id}.conf" ]; then
        return 0
    fi
    return 1
}

# Function to find the next available container ID
find_next_available_ctid() {
    local start_id=${1:-100}
    local max_id=${2:-999}
    local current_id=$start_id

    while [ $current_id -le $max_id ]; do
        if ! ctid_in_use $current_id; then
            echo $current_id
            return 0
        fi
        current_id=$((current_id + 1))
    done

    # No available ID found in range
    return 1
}

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║   UniFi Firewall Manager - Proxmox LXC Auto-Deploy      ║"
echo "║                                                          ║"
echo "║   This script creates and configures an LXC container    ║"
echo "║   to run the UniFi Firewall Manager application.         ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Error: This script must be run as root on the Proxmox host${NC}"
    exit 1
fi

# Check if pve-manager is installed
if ! command -v pveversion &> /dev/null; then
    echo -e "${RED}Error: This doesn't appear to be a Proxmox VE host${NC}"
    exit 1
fi

# Auto-detect next available container ID
echo -e "${YELLOW}Scanning for available Container IDs (starting from ${CTID_MIN})...${NC}"
CTID=$(find_next_available_ctid $CTID_MIN $CTID_MAX)

if [ -z "$CTID" ]; then
    echo -e "${RED}Error: No available Container ID found in range ${CTID_MIN}-${CTID_MAX}${NC}"
    echo "Please free up a container ID or adjust CTID_MIN/CTID_MAX in the script."
    exit 1
fi

echo -e "${GREEN}✓ Next available Container ID: ${CTID}${NC}"
echo ""

# Interactive configuration
echo -e "${YELLOW}Interactive Setup${NC}"
echo ""

read -p "Container ID [${CTID}] (auto-detected as next available): " input
if [ -n "$input" ]; then
    # User provided a custom ID - verify it's available
    if ctid_in_use "$input"; then
        echo -e "${RED}Error: Container ID ${input} is already in use${NC}"
        echo "Please choose a different ID or destroy the existing container first."
        exit 1
    fi
    CTID=$input
fi

read -p "Hostname [${HOSTNAME}]: " input
HOSTNAME=${input:-$HOSTNAME}

read -p "Memory (MB) [${MEMORY}]: " input
MEMORY=${input:-$MEMORY}

read -p "CPU Cores [${CORES}]: " input
CORES=${input:-$CORES}

read -p "Disk Size (GB) [${DISK_SIZE}]: " input
DISK_SIZE=${input:-$DISK_SIZE}

read -p "Storage Pool [${STORAGE}]: " input
STORAGE=${input:-$STORAGE}

read -p "Network Bridge [${BRIDGE}]: " input
BRIDGE=${input:-$BRIDGE}

read -p "IP Address (dhcp or static e.g. 192.168.1.100/24) [${IP_ADDRESS}]: " input
IP_ADDRESS=${input:-$IP_ADDRESS}

if [ "$IP_ADDRESS" != "dhcp" ]; then
    read -p "Gateway [${GATEWAY}]: " input
    GATEWAY=${input:-$GATEWAY}
fi

read -p "Path to project files on this host (leave empty to skip copy): " input
PROJECT_DIR=${input:-$PROJECT_DIR}

if [ -z "$PASSWORD" ]; then
    read -sp "Root password for container: " PASSWORD
    echo ""
fi

read -p "SSH public key file path (optional, press Enter to skip): " input
SSH_KEYS=${input:-$SSH_KEYS}

echo ""
echo -e "${YELLOW}Configuration Summary:${NC}"
echo "  Container ID: ${CTID}"
echo "  Hostname: ${HOSTNAME}"
echo "  Memory: ${MEMORY}MB"
echo "  CPU Cores: ${CORES}"
echo "  Disk: ${DISK_SIZE}GB on ${STORAGE}"
echo "  Network: ${BRIDGE} (${IP_ADDRESS})"
echo ""

read -p "Proceed? [Y/n]: " confirm
if [[ "$confirm" =~ ^[Nn] ]]; then
    echo "Aborted."
    exit 0
fi

echo ""
echo -e "${YELLOW}Step 1: Downloading container template...${NC}"
pveam update
TEMPLATE=$(pveam available | grep -E "debian-12|ubuntu-22" | head -1 | awk '{print $2}')
if [ -z "$TEMPLATE" ]; then
    echo "Downloading Debian 12 template..."
    pveam download ${TEMPLATE_STORAGE} debian-12-standard_12.2-1_amd64.tar.zst
    TEMPLATE="debian-12-standard_12.2-1_amd64.tar.zst"
fi
TEMPLATE_PATH="${TEMPLATE_STORAGE}:vztmpl/${TEMPLATE}"
echo "Using template: ${TEMPLATE_PATH}"

echo ""
echo -e "${YELLOW}Step 2: Creating LXC container...${NC}"

# Build network configuration
# For static IP with gateway, include gw in the net0 parameter
if [ -n "$GATEWAY" ] && [ "$IP_ADDRESS" != "dhcp" ]; then
    NET_CONFIG="name=eth0,bridge=${BRIDGE},ip=${IP_ADDRESS},gw=${GATEWAY}"
else
    NET_CONFIG="name=eth0,bridge=${BRIDGE},ip=${IP_ADDRESS}"
fi

CREATE_CMD="pct create ${CTID} ${TEMPLATE_PATH} \
    --hostname ${HOSTNAME} \
    --memory ${MEMORY} \
    --swap ${SWAP} \
    --cores ${CORES} \
    --rootfs ${STORAGE}:${DISK_SIZE} \
    --net0 ${NET_CONFIG} \
    --unprivileged 1 \
    --features nesting=1 \
    --password ${PASSWORD} \
    --start 0"

if [ -n "$DNS" ]; then
    CREATE_CMD="${CREATE_CMD} --nameserver ${DNS}"
fi

if [ -n "$SSH_KEYS" ] && [ -f "$SSH_KEYS" ]; then
    CREATE_CMD="${CREATE_CMD} --ssh-public-key ${SSH_KEYS}"
fi

eval ${CREATE_CMD}

echo -e "${GREEN}Container created successfully!${NC}"

echo ""
echo -e "${YELLOW}Step 3: Starting container...${NC}"
pct start ${CTID}
sleep 5

echo ""
echo -e "${YELLOW}Step 4: Installing application inside container...${NC}"

# Create a setup script to run inside the container
cat > /tmp/lxc-internal-setup.sh << 'INTERNAL_SCRIPT'
#!/bin/bash
set -e

export DEBIAN_FRONTEND=noninteractive

# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install nginx
apt install -y nginx curl

# Create app directory
mkdir -p /opt/unifi-firewall-manager

# Check if project files were copied
if [ -d "/tmp/app" ]; then
    echo "Found project files in /tmp/app"
    cd /tmp/app
    
    # Build if needed
    if [ ! -d "dist" ] && [ -f "package.json" ]; then
        echo "Building application..."
        npm install
        npm run build
    fi
    
    # Copy built files
    if [ -d "dist" ]; then
        cp -r dist/* /opt/unifi-firewall-manager/
    fi
else
    echo "No project files found. You'll need to copy them manually."
    echo "Use: pct push ${CTID} ./dist/* ${CTID}:/opt/unifi-firewall-manager/"
fi

# Set permissions
chown -R www-data:www-data /opt/unifi-firewall-manager
chmod -R 755 /opt/unifi-firewall-manager

# Configure nginx
cat > /etc/nginx/sites-available/unifi-firewall-manager << 'NGINX_CONF'
server {
    listen 80;
    server_name _;

    root /opt/unifi-firewall-manager;
    index index.html;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript image/svg+xml;

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
NGINX_CONF

ln -sf /etc/nginx/sites-available/unifi-firewall-manager /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and start nginx
nginx -t
systemctl enable nginx
systemctl restart nginx

# Clean up
apt clean
rm -rf /tmp/app /var/lib/apt/lists/*

echo "Setup complete!"
INTERNAL_SCRIPT

# Copy project files if available
if [ -n "$PROJECT_DIR" ] && [ -d "$PROJECT_DIR" ]; then
    echo "Copying project files to container..."
    pct push ${CTID} ${PROJECT_DIR} /tmp/app --permissions
fi

# Copy and run the internal setup script
pct push ${CTID} /tmp/lxc-internal-setup.sh /tmp/lxc-internal-setup.sh
pct exec ${CTID} -- chmod +x /tmp/lxc-internal-setup.sh
pct exec ${CTID} -- /tmp/lxc-internal-setup.sh

# Clean up temp files
rm -f /tmp/lxc-internal-setup.sh

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              Deployment Complete!                       ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Get container IP
CONTAINER_IP=$(pct exec ${CTID} -- hostname -I | awk '{print $1}')

echo -e "${BLUE}Access the application at:${NC}"
echo -e "  ${GREEN}http://${CONTAINER_IP}${NC}"
echo ""
echo -e "${BLUE}Container Management:${NC}"
echo "  Start:   pct start ${CTID}"
echo "  Stop:    pct stop ${CTID}"
echo "  Console: pct enter ${CTID}"
echo "  Status:  pct status ${CTID}"
echo "  Logs:    pct exec ${CTID} -- journalctl -u nginx -f"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Open http://${CONTAINER_IP} in your browser"
echo "  2. Start with Demo Mode to explore the interface"
echo "  3. Configure your UniFi controller connection"
echo "  4. Set up HTTPS if exposing beyond your network"
echo ""
