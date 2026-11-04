# Installation Guide

Complete installation instructions for the UniFi Firewall Manager.

## Table of Contents

- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Installation Methods](#installation-methods)
  - [Option 1: Proxmox LXC (Recommended)](#option-1-proxmox-lxc-recommended)
  - [Option 2: Docker](#option-2-docker)
  - [Option 3: Manual Linux Installation](#option-3-manual-linux-installation)
  - [Option 4: Static Hosting](#option-4-static-hosting)
- [Post-Installation Setup](#post-installation-setup)
- [Connecting to UniFi Controller](#connecting-to-unifi-controller)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)
- [Updating](#updating)
- [Uninstallation](#uninstallation)

---

## Quick Start

**Fastest way to get running:**

```bash
# Clone the repository
git clone <your-repo-url>
cd unifi-firewall-manager

# Choose your installation method:

# Proxmox LXC (recommended for home lab):
chmod +x deploy/proxmox-auto-deploy.sh
./deploy/proxmox-auto-deploy.sh

# Docker (universal):
docker-compose up -d

# Static hosting (simplest):
npm install
npm run build
# Upload dist/ folder to any web server
```

---

## Prerequisites

### For All Methods
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Network access to your UniFi controller (if connecting to real controller)

### For Proxmox LXC
- Proxmox VE 7.x or 8.x
- At least 1GB free RAM
- At least 5GB free disk space
- Root access to Proxmox host

### For Docker
- Docker 20.10+
- Docker Compose 2.0+
- At least 512MB free RAM
- At least 2GB free disk space

### For Manual Linux Installation
- Linux distribution (Ubuntu 20.04+, Debian 11+, CentOS 8+)
- Node.js 20+
- nginx or Apache
- At least 512MB free RAM
- At least 2GB free disk space
- Root or sudo access

### For Static Hosting
- Node.js 20+ (for building)
- OR use pre-built files from releases

---

## Installation Methods

### Option 1: Proxmox LXC (Recommended)

**Best for:** Home labs, Proxmox users, isolated environments

**Resources:** 512MB RAM, 1 CPU core, 2GB disk

#### Automated Installation (One Command)

```bash
# 1. SSH into your Proxmox host
ssh root@your-proxmox-host

# 2. Clone the repository
cd /tmp
git clone <your-repo-url>
cd unifi-firewall-manager

# 3. Make the script executable
chmod +x deploy/proxmox-auto-deploy.sh

# 4. Run the automated installer
./deploy/proxmox-auto-deploy.sh
```

**Simple prompts:**
```
Scanning for available Container IDs (starting from 100)...
✓ Next available Container ID: 101

Configuration:
  Hostname: unifi-fw-manager
  Memory: 512MB
  CPU Cores: 1
  Disk: 2GB on local-lvm
  Network: vmbr0 (DHCP)

Container ID [101] (auto-detected, press Enter to use or enter custom): [press Enter or type custom ID]

Enter root password for container: [enter password]

Starting deployment...
```

**Note:** The script uses sensible defaults for all settings (512MB RAM, 1 CPU core, 2GB disk, DHCP networking) and prompts for the Container ID and root password. It automatically detects the next available Container ID as a suggestion, but you can enter a custom ID if preferred. The detection is **cluster-aware** and works correctly in multi-node Proxmox environments by checking all nodes for existing containers and VMs.

**What the script does:**
1. Downloads Debian 12 container template
2. Creates unprivileged LXC container
3. Installs Node.js 20 and nginx
4. Builds the application
5. Configures nginx with security headers
6. Sets up proper permissions
7. Starts the service

**After installation:**
```bash
# Get the container IP
pct exec 100 -- hostname -I

# Access the application
# Open http://<container-ip> in your browser
```

#### Manual Installation

If you prefer manual control:

```bash
# 1. Create LXC container in Proxmox web interface
#    - Template: Debian 12
#    - Resources: 512MB RAM, 1 core, 2GB disk
#    - Network: DHCP or static IP
#    - Enable nesting feature

# 2. Start and enter the container
pct start 100
pct enter 100

# 3. Run the setup script
cd /tmp
# Transfer files: scp -r ./dist root@<container-ip>:/tmp/app/
chmod +x deploy/lxc-setup.sh
./deploy/lxc-setup.sh

# 4. Access at http://<container-ip>
```

**See also:** [deploy/LXC-DEPLOYMENT.md](deploy/LXC-DEPLOYMENT.md) for comprehensive guide

---

### Option 2: Docker

**Best for:** Any Docker environment, easy updates, portability

**Resources:** ~100MB RAM, minimal CPU

#### Using Docker Compose (Recommended)

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd unifi-firewall-manager

# 2. Build and start
docker-compose up -d

# 3. Verify it's running
docker-compose ps

# 4. Access at http://localhost
```

#### Using Docker Commands

```bash
# 1. Build the image
docker build -t unifi-firewall-manager .

# 2. Run the container
docker run -d \
  --name unifi-fw-mgr \
  -p 80:80 \
  --restart unless-stopped \
  unifi-firewall-manager

# 3. Access at http://localhost
```

#### Docker with Custom Port

```bash
# Use port 8080 instead of 80
docker run -d \
  --name unifi-fw-mgr \
  -p 8080:80 \
  --restart unless-stopped \
  unifi-firewall-manager

# Access at http://localhost:8080
```

#### Docker with Persistent Data (Optional)

```bash
# Create volume for logs
docker volume create unifi-fw-logs

# Run with volume
docker run -d \
  --name unifi-fw-mgr \
  -p 80:80 \
  -v unifi-fw-logs:/var/log/nginx \
  --restart unless-stopped \
  unifi-firewall-manager
```

**Useful Docker commands:**
```bash
# View logs
docker-compose logs -f
# or
docker logs -f unifi-fw-mgr

# Stop
docker-compose down
# or
docker stop unifi-fw-mgr

# Restart
docker-compose restart
# or
docker restart unifi-fw-mgr

# Update
docker-compose pull
docker-compose up -d
```

---

### Option 3: Manual Linux Installation

**Best for:** Existing Linux servers, full control, custom configurations

**Resources:** 512MB RAM, 1 CPU core, 2GB disk

#### Step 1: Install Dependencies

**Ubuntu/Debian:**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install nginx
sudo apt install -y nginx

# Verify installations
node --version  # Should show v20.x.x
nginx -v
```

**CentOS/RHEL:**
```bash
# Install Node.js 20
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Install nginx
sudo yum install -y nginx

# Start and enable nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

#### Step 2: Clone and Build

```bash
# Clone the repository
cd /opt
sudo git clone <your-repo-url>
cd unifi-firewall-manager

# Install dependencies
sudo npm install

# Build the application
sudo npm run build

# The built files are now in the 'dist' directory
```

#### Step 3: Deploy to Web Server

```bash
# Create application directory
sudo mkdir -p /var/www/unifi-firewall-manager

# Copy built files
sudo cp -r dist/* /var/www/unifi-firewall-manager/

# Set permissions
sudo chown -R www-www-data /var/www/unifi-firewall-manager
sudo chmod -R 755 /var/www/unifi-firewall-manager
```

#### Step 4: Configure nginx

```bash
# Copy nginx configuration
sudo cp deploy/nginx.conf /etc/nginx/sites-available/unifi-firewall-manager

# Update the root path if needed
sudo nano /etc/nginx/sites-available/unifi-firewall-manager
# Change: root /opt/unifi-firewall-manager;
# To:     root /var/www/unifi-firewall-manager;

# Enable the site
sudo ln -sf /etc/nginx/sites-available/unifi-firewall-manager /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

#### Step 5: Configure Firewall (Optional)

```bash
# UFW (Ubuntu)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp  # If using HTTPS

# firewalld (CentOS/RHEL)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

#### Step 6: Access the Application

Open your browser and navigate to: `http://your-server-ip`

---

### Option 4: Static Hosting

**Best for:** Quick deployment, no server management, shared hosting

#### Using Netlify (Easiest)

```bash
# 1. Build locally
npm install
npm run build

# 2. Go to https://app.netlify.com/drop

# 3. Drag the 'dist' folder to the browser

# 4. Get your URL instantly!
```

#### Using Vercel

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Deploy
vercel

# 3. Follow the prompts
```

#### Using GitHub Pages

```bash
# 1. Build
npm install
npm run build

# 2. Install gh-pages
npm install -g gh-pages

# 3. Deploy
gh-pages -d dist

# 4. Access at https://<username>.github.io/<repo-name>
```

#### Using Any Web Server

```bash
# 1. Build
npm install
npm run build

# 2. Upload the 'dist' folder contents to your web root
# Examples:
# - /var/www/html/
# - /usr/share/nginx/html/
# - Public folder on shared hosting

# 3. Ensure your server supports SPA routing
# (serve index.html for all routes)
```

---

## Post-Installation Setup

### 1. Access the Application

Open your browser and navigate to:
- **Proxmox LXC**: `http://<container-ip>`
- **Docker**: `http://localhost` (or `http://localhost:8080` if using custom port)
- **Manual Linux**: `http://your-server-ip`
- **Static Hosting**: Your provided URL

### 2. Explore Demo Mode

The application starts in **Demo Mode** with sample firewall rules:

1. **Dashboard** - View overview of rules and statistics
2. **Firewall Rules** - See the rule list with Meraki translations
3. **Concept Guide** - Learn how UniFi maps to Meraki
4. **Connection** - Configure real controller connection

**Try these actions:**
- Toggle rules on/off
- Drag rules to reorder them
- Expand rules to see details
- Click "Edit" to modify a rule
- Read the Concept Guide

### 3. Configure Application Settings

**Toggle Demo Mode:**
- Go to **Connection** tab
- Toggle "Demo Mode" switch
- When disabled, you can connect to a real controller

---

## Connecting to UniFi Controller

### Step 1: Enable CORS on UniFi Controller

**For UDM Pro / Cloud Key Gen2+:**

```bash
# SSH into your UDM Pro
ssh root@192.168.1.1

# Edit nginx config
sudo vi /mnt/data/unifi-os/nginx/drop-in/unifi.conf

# Add these lines in the server block:
add_header 'Access-Control-Allow-Origin' '*' always;
add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
add_header 'Access-Control-Allow-Headers' 'X-CSRF-Token, Content-Type' always;
add_header 'Access-Control-Allow-Credentials' 'true' always;

# Handle preflight requests
if ($request_method = 'OPTIONS') {
    add_header 'Access-Control-Allow-Origin' '*';
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
    add_header 'Access-Control-Allow-Headers' 'X-CSRF-Token, Content-Type';
    add_header 'Content-Length' 0;
    add_header 'Content-Type' 'text/plain';
    return 204;
}

# Restart nginx
sudo systemctl restart unifi-core
```

**Alternative: Use a Reverse Proxy**

If you can't modify the UniFi controller directly, set up a reverse proxy:

```nginx
# nginx reverse proxy config
server {
    listen 80;
    server_name unifi-proxy.local;

    location / {
        proxy_pass https://192.168.1.1;
        proxy_ssl_verify off;
        
        # Add CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'X-CSRF-Token, Content-Type' always;
    }
}
```

**Alternative: Browser Extension (Testing Only)**

Install "CORS Unblock" Chrome extension for quick testing. **Not recommended for production.**

### Step 2: Connect in the Application

1. Open the application in your browser
2. Click **Connection** in the sidebar
3. Disable "Demo Mode" toggle
4. Enter your controller details:
   - **Controller URL**: `https://192.168.1.1` (or your domain)
   - **Username**: Your UniFi admin username
   - **Password**: Your UniFi admin password
   - **Site**: `default` (unless you have multiple sites)
5. Click **Connect**

**If connection fails:**
- Verify CORS is enabled (check browser console for errors)
- Check network connectivity: `curl -k https://<controller-ip>`
- Verify credentials are correct
- Ensure the controller is accessible from the application's network

### Step 3: Manage Real Rules

Once connected:
- View your actual firewall rules
- Edit, create, delete rules
- Reorder rules by dragging
- Changes are applied to your real UniFi controller

---

## Verification

After installation, verify everything works:

### 1. Check Service Status

**Proxmox LXC:**
```bash
pct status 100
pct exec 100 -- systemctl status nginx
```

**Docker:**
```bash
docker-compose ps
docker-compose logs --tail=50
```

**Manual Linux:**
```bash
systemctl status nginx
```

### 2. Test Application Access

Open your browser and verify:
- ✅ Dashboard loads with sample rules
- ✅ Firewall Rules page shows the rule list
- ✅ Concept Guide displays the mapping table
- ✅ You can toggle rules on/off
- ✅ You can drag rules to reorder
- ✅ You can edit rules

### 3. Test Health Endpoint

```bash
# From the server/container
curl http://localhost/health

# Should return: healthy
```

### 4. Test Controller Connection (Optional)

If connecting to a real controller:
- ✅ Connection tab shows "Connected"
- ✅ Real firewall rules load
- ✅ You can edit rules
- ✅ Changes persist after refresh

---

## Troubleshooting

### Can't Access the Application

**Symptom:** Browser shows "Connection refused" or timeout

**Proxmox LXC:**
```bash
# Check container is running
pct status 100

# Start if stopped
pct start 100

# Check nginx is running
pct exec 100 -- systemctl status nginx

# Start nginx if stopped
pct exec 100 -- systemctl start nginx

# Get container IP
pct exec 100 -- hostname -I

# Check firewall
pct exec 100 -- ufw status
```

**Docker:**
```bash
# Check container is running
docker-compose ps

# View logs
docker-compose logs

# Restart
docker-compose restart

# Check port mapping
docker port unifi-fw-mgr
```

**Manual Linux:**
```bash
# Check nginx is running
systemctl status nginx

# Check if port 80 is in use
sudo ss -tulpn | grep :80

# Check nginx config
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

### Can't Connect to UniFi Controller

**Symptom:** "Failed to connect" error

**Check CORS:**
```bash
# From the container/server
curl -I -k https://<controller-ip>

# Look for Access-Control-Allow-Origin header
```

**Check Network:**
```bash
# Test connectivity
ping <controller-ip>
curl -k https://<controller-ip>
```

**Check Browser Console:**
- Open Developer Tools (F12)
- Go to Console tab
- Look for CORS errors
- Check Network tab for failed requests

**Common Issues:**
1. CORS not enabled on controller → See [Enable CORS](#step-1-enable-cors-on-unifi-controller)
2. Wrong URL format → Use `https://` prefix
3. Invalid credentials → Verify username/password
4. Network isolation → Ensure container can reach controller
5. Self-signed certificate → Browser may block, accept the cert first

### Permission Denied Errors

**Symptom:** 403 Forbidden or permission errors

```bash
# Fix permissions (inside container or on server)
sudo chown -R www-www-data /opt/unifi-firewall-manager
sudo chmod -R 755 /opt/unifi-firewall-manager

# For nginx
sudo chown -R www-www-data /var/www/unifi-firewall-manager
```

### Rules Not Loading

**Symptom:** Empty rule list or API errors

**Check:**
1. Correct site name (usually "default")
2. User has admin permissions
3. API endpoints are accessible
4. Network connectivity to controller

```bash
# Test API endpoint
curl -k https://<controller-ip>/proxy/network/api/s/default/rest/firewallrule
```

### Performance Issues

**Symptom:** Slow loading or high resource usage

**Solutions:**
1. Increase container/server resources
2. Enable browser caching (already configured)
3. Use a CDN for static assets
4. Check for resource limits in Proxmox/Docker

```bash
# Check resource usage
# Proxmox
pct status 100

# Docker
docker stats unifi-fw-mgr

# Linux
top
htop
```

### Build Errors

**Symptom:** npm install or npm run build fails

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node.js version
node --version  # Should be 20.x

# Update npm
npm install -g npm@latest
```

---

## Updating

### Proxmox LXC

```bash
# Option 1: Rebuild and replace
# On your development machine
npm run build

# Transfer to container
scp -r dist/* root@<container-ip>:/opt/unifi-firewall-manager/

# Option 2: Git pull (if using git in container)
pct enter 100
cd /opt/unifi-firewall-manager
git pull
npm install
npm run build
```

### Docker

```bash
# Pull latest image (if using pre-built)
docker-compose pull

# Or rebuild
docker-compose build

# Restart
docker-compose up -d
```

### Manual Linux

```bash
# On the server
cd /opt/unifi-firewall-manager
git pull
npm install
npm run build
cp -r dist/* /var/www/unifi-firewall-manager/
```

### Static Hosting

Rebuild and re-upload the `dist/` folder to your hosting provider.

---

## Uninstallation

### Proxmox LXC

```bash
# Stop and remove container
pct stop 100
pct destroy 100

# Optional: Remove template
pveam remove local debian-12-standard_12.2-1_amd64.tar.zst
```

### Docker

```bash
# Stop and remove
docker-compose down

# Remove image
docker rmi unifi-firewall-manager

# Remove volumes (if created)
docker volume rm unifi-fw-logs
```

### Manual Linux

```bash
# Stop nginx
sudo systemctl stop nginx

# Remove files
sudo rm -rf /opt/unifi-firewall-manager
sudo rm -rf /var/www/unifi-firewall-manager

# Remove nginx config
sudo rm /etc/nginx/sites-available/unifi-firewall-manager
sudo rm /etc/nginx/sites-enabled/unifi-firewall-manager

# Restart nginx
sudo systemctl restart nginx

# Optional: Remove Node.js
sudo apt remove nodejs
```

### Static Hosting

Delete the uploaded files from your hosting provider.

---

## Additional Resources

- **Main Documentation**: [README.md](README.md)
- **LXC Deployment Guide**: [deploy/LXC-DEPLOYMENT.md](deploy/LXC-DEPLOYMENT.md)
- **Deployment Options**: [deploy/README.md](deploy/README.md)
- **Deployment Summary**: [DEPLOYMENT-SUMMARY.md](DEPLOYMENT-SUMMARY.md)

---

## Support

If you encounter issues:

1. **Check the logs** - Most issues are logged
2. **Review this guide** - Common solutions are documented
3. **Check browser console** - For frontend errors
4. **Verify prerequisites** - Ensure all requirements are met
5. **Open an issue** - On the GitHub repository

---

**Installation complete! Start managing your UniFi firewalls with a familiar Meraki-style interface.** 🚀
