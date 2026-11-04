# UniFi Firewall Manager - Proxmox LXC Deployment Guide

This guide provides step-by-step instructions for deploying the UniFi Firewall Manager as a Proxmox LXC container.

📖 **Looking for other installation methods?** See the comprehensive [INSTALL.md](../INSTALL.md) guide.

## Prerequisites

- Proxmox VE 7.x or 8.x
- Access to Proxmox web interface or CLI
- At least 512MB RAM and 2GB disk space for the container

## Quick Start

### Simplified Deployment Process

The automated deployment script (`proxmox-auto-deploy.sh`) uses sensible defaults for all configuration:

**Defaults:**
- Container ID: Auto-detected (next available starting from 100)
- Hostname: unifi-fw-manager
- Memory: 512MB RAM
- CPU: 1 core
- Disk: 2GB on local-lvm
- Network: DHCP on vmbr0
- DNS: 8.8.8.8

**The script prompts for:**
- Container ID (with auto-detected suggestion, or enter custom)
- Root password for the container

**How it works:**
- Scans for existing containers to find the next available ID
- Uses predefined defaults for all settings
- Prompts for Container ID (accept suggestion or enter custom) and root password
- Validates custom Container ID to ensure it's not in use
- Automatically deploys with optimal configuration

### Option 1: Using the Setup Script (Recommended)

1. **Create LXC Container in Proxmox**
   ```bash
   # Download a Debian 12 or Ubuntu 22.04 template
   pveam update
   pveam download local debian-12-standard_12.2-1_amd64.tar.zst
   
   # Create container (adjust CTID, storage, and resources as needed)
   # Note: The automated script (proxmox-auto-deploy.sh) will automatically
   # find the next available CTID starting from 100 to avoid conflicts
   pct create 100 local:vztmpl/debian-12-standard_12.2-1_amd64.tar.zst \
     --hostname unifi-firewall-mgr \
     --memory 512 \
     --swap 512 \
     --cores 1 \
     --rootfs local-lvm:2 \
     --net0 name=eth0,bridge=vmbr0,ip=dhcp \
     --unprivileged 1 \
     --features nesting=1
   ```

2. **Start the Container**
   ```bash
   pct start 100
   ```

3. **Enter the Container**
   ```bash
   pct enter 100
   ```

4. **Transfer Project Files**
   ```bash
   # Option A: Clone from git (if you've pushed to a repository)
   apt update && apt install -y git
   git clone <your-repo-url> /tmp/app
   cd /tmp/app
   
   # Option B: Use scp from your local machine
   # On your local machine:
   # scp -r ./dist root@<container-ip>:/tmp/app/
   ```

5. **Run the Setup Script**
   ```bash
   cd /tmp/app
   chmod +x deploy/lxc-setup.sh
   ./deploy/lxc-setup.sh
   ```

6. **Access the Application**
   Open your browser and navigate to: `http://<container-ip>`

### Option 2: Manual Installation

If you prefer manual control:

```bash
# Inside the LXC container
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs nginx

# Create app directory
mkdir -p /opt/unifi-firewall-manager

# Copy built files (from your local machine)
# scp -r dist/* root@<container-ip>:/opt/unifi-firewall-manager/

# Set permissions
chown -R www-data:www-data /opt/unifi-firewall-manager
chmod -R 755 /opt/unifi-firewall-manager

# Configure nginx (use the config from deploy/nginx.conf)
cp deploy/nginx.conf /etc/nginx/sites-available/unifi-firewall-manager
ln -sf /etc/nginx/sites-available/unifi-firewall-manager /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Start nginx
systemctl enable nginx
systemctl restart nginx
```

## Configuration Files

### nginx.conf
Located at `deploy/nginx.conf` - Optimized nginx configuration with:
- Gzip compression
- Security headers
- Static asset caching
- SPA routing support

### systemd Service (Optional)
If you want to run a development server instead of static files:

```bash
# Create service file
cat > /etc/systemd/system/unifi-firewall-mgr.service << 'EOF'
[Unit]
Description=UniFi Firewall Manager
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/unifi-firewall-manager
ExecStart=/usr/bin/npx serve -s . -l 3000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start
systemctl enable unifi-firewall-mgr
systemctl start unifi-firewall-mgr
```

## Proxmox LXC Configuration Tips

### Resource Allocation
- **Minimum**: 512MB RAM, 1 CPU core, 2GB disk
- **Recommended**: 1GB RAM, 2 CPU cores, 4GB disk (for future growth)

### Network Configuration
```bash
# Static IP (optional)
# Edit /etc/network/interfaces in the container
auto eth0
iface eth0 inet static
    address 192.168.1.100
    netmask 255.255.255.0
    gateway 192.168.1.1
    dns-nameservers 8.8.8.8 8.8.4.4
```

### Nesting Support
Enable nesting for the container (required if you want to run Docker inside LXC):
```bash
# In Proxmox host
pct set 100 --features nesting=1
```

### Backup Strategy
```bash
# Create backup from Proxmox host
vzdump 100 --mode snapshot --compress zstd

# Restore
qmrestore /var/lib/vz/dump/vzdump-lxc-100-*.vma.zst 100
```

## Security Hardening

### 1. HTTPS with Let's Encrypt
```bash
# Inside the container
apt install -y certbot python3-certbot-nginx

# Get certificate (requires domain pointing to container IP)
certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
```

### 2. Firewall Rules (Proxmox Level)
```bash
# In Proxmox host, restrict access to container
# Edit /etc/pve/firewall/<CTID>.fw

[RULES]
IN ACCEPT -p tcp -dport 80 -source 192.168.1.0/24
IN ACCEPT -p tcp -dport 443 -source 192.168.1.0/24
IN DROP -p tcp -dport 80
IN DROP -p tcp -dport 443
```

### 3. Basic Authentication (Optional)
```bash
# Install apache2-utils
apt install -y apache2-utils

# Create password file
htpasswd -c /etc/nginx/.htpasswd admin

# Update nginx config to require auth
# Add to server block:
# auth_basic "Restricted Access";
# auth_basic_user_file /etc/nginx/.htpasswd;
```

## Updating the Application

### Method 1: Rebuild and Replace
```bash
# On your development machine
npm run build

# Transfer to container
scp -r dist/* root@<container-ip>:/opt/unifi-firewall-manager/

# Reload nginx (optional, usually not needed for static files)
ssh root@<container-ip> "systemctl reload nginx"
```

### Method 2: Git Pull (If Using Git)
```bash
# Inside the container
cd /opt/unifi-firewall-manager
git pull origin main
# Rebuild if needed
npm install
npm run build
```

## Monitoring

### View Logs
```bash
# Nginx access logs
tail -f /var/log/nginx/access.log

# Nginx error logs
tail -f /var/log/nginx/error.log

# System logs
journalctl -u nginx -f
```

### Health Check
```bash
# From inside the container
curl http://localhost/health

# From Proxmox host
curl http://<container-ip>/health
```

### Resource Usage
```bash
# Inside container
top
htop  # if installed

# From Proxmox host
pct status 100
```

## Troubleshooting

### Container Won't Start
```bash
# Check logs
pct start 100 --debug

# Check system logs
journalctl -xe
```

### Nginx Not Responding
```bash
# Check nginx status
systemctl status nginx

# Check if port is in use
ss -tulpn | grep :80

# Test nginx config
nginx -t

# Restart nginx
systemctl restart nginx
```

### Can't Connect to UniFi Controller
1. Verify CORS is enabled on the UniFi controller
2. Check network connectivity: `curl -k https://<controller-ip>`
3. Review browser console for CORS errors
4. Try Demo Mode first to verify the app works

### Permission Denied
```bash
# Fix permissions
chown -R www-data:www-data /opt/unifi-firewall-manager
chmod -R 755 /opt/unifi-firewall-manager
```

## Performance Optimization

### Enable HTTP/2
```nginx
# In nginx config, change:
listen 80;
# To:
listen 443 ssl http2;
```

### Add More Caching
```nginx
# In nginx config, add:
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### Use a CDN (Optional)
For global access, consider placing CloudFlare or another CDN in front.

## Maintenance

### Regular Updates
```bash
# Update system packages monthly
apt update && apt upgrade -y

# Update Node.js as needed
# Update nginx as needed
```

### Log Rotation
Nginx logs are automatically rotated by logrotate. Check:
```bash
cat /etc/logrotate.d/nginx
```

### Backup
```bash
# Automated backup script (run from Proxmox host)
#!/bin/bash
vzdump 100 --mode snapshot --compress zstd --mailto admin@example.com
```

## Support

For issues related to:
- **UniFi Controller API**: Check UniFi documentation
- **Proxmox LXC**: Check Proxmox documentation
- **This Application**: Check the main README.md

## License

See the main project README.md for license information.
