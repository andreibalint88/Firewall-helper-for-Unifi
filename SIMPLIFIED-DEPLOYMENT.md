# Simplified Proxmox LXC Deployment

## Overview

The Proxmox LXC deployment script has been simplified to use sensible defaults and only prompt for the root password. This makes deployment faster and easier.

## What Changed

### Before (Complex)
```bash
# Script prompted for:
- Container ID
- Hostname
- Memory
- CPU Cores
- Disk Size
- Storage Pool
- Network Bridge
- IP Address (DHCP or static)
- Gateway (if static)
- Project files path
- Root password
- SSH keys
- Confirmation to proceed

# Total: 12+ prompts
```

### After (Simple)
```bash
# Script prompts for:
- Container ID (with auto-detected suggestion)
- Root password

# Total: 2 prompts
```

## Default Configuration

The script now uses these defaults automatically:

| Setting | Default Value |
|---------|---------------|
| Container ID | Auto-detected (next available from 100) |
| Hostname | unifi-fw-manager |
| Memory | 512MB |
| Swap | 512MB |
| CPU Cores | 1 |
| Disk Size | 2GB |
| Storage | local-zfs |
| Network Bridge | vmbr0 |
| IP Address | DHCP |
| DNS | 8.8.8.8 |

## Deployment Process

### Step 1: Run the Script
```bash
chmod +x deploy/proxmox-auto-deploy.sh
./deploy/proxmox-auto-deploy.sh
```

### Step 2: Choose Container ID and Enter Password
```
╔══════════════════════════════════════════════════════════╗
║   UniFi Firewall Manager - Proxmox LXC Auto-Deploy      ║
║                                                          ║
║   This script creates and configures an LXC container    ║
║   to run the UniFi Firewall Manager application.         ║
╚══════════════════════════════════════════════════════════╝

Scanning for available Container IDs (starting from 100)...
✓ Next available Container ID: 101

Configuration:
  Hostname: unifi-fw-manager
  Memory: 512MB
  CPU Cores: 1
  Disk: 2GB on local-zfs
  Network: vmbr0 (DHCP)

Container ID [101] (auto-detected, press Enter to use or enter custom): [press Enter or type custom ID]

Enter root password for container: [enter your password]

Starting deployment...
```

### Step 3: Wait for Deployment
The script will:
1. Download the Debian 12 template (if not already present)
2. Create the LXC container with the specified configuration
3. Start the container
4. Install Node.js and nginx
5. Build and deploy the application
6. Configure nginx with security headers

### Step 4: Access the Application
```bash
# Get the container IP
pct exec 101 -- hostname -I

# Open in browser
http://<container-ip>
```

## Customizing Defaults

If you want to change the defaults, edit the top of `deploy/proxmox-auto-deploy.sh`:

```bash
# Configuration - Defaults (no prompts needed)
CTID_MIN=100                      # Minimum Container ID to start searching from
CTID_MAX=999                      # Maximum Container ID to search up to
HOSTNAME="unifi-fw-manager"       # Container hostname
MEMORY=512                        # RAM in MB
SWAP=512                          # Swap in MB
CORES=1                           # CPU cores
DISK_SIZE=2                       # Root disk in GB
STORAGE="local-zfs"               # Storage pool for root disk
TEMPLATE_STORAGE="local"          # Storage for templates
BRIDGE="vmbr0"                    # Network bridge
IP_ADDRESS="dhcp"                 # IP address (dhcp)
DNS="8.8.8.8"                     # DNS server
```

## Benefits

✅ **Fast Deployment**: Complete in under 2 minutes  
✅ **No Conflicts**: Auto-detects available Container IDs  
✅ **Simple**: Only two prompts (Container ID and password)  
✅ **Flexible**: Accept auto-detected ID or choose your own  
✅ **Sensible Defaults**: Optimized for typical use cases  
✅ **Reproducible**: Same configuration every time  

## When to Customize

You should customize the defaults if:

- You need more RAM (e.g., `MEMORY=1024` for 1GB)
- You need more CPU cores (e.g., `CORES=2`)
- You need more disk space (e.g., `DISK_SIZE=4` for 4GB)
- You want a different hostname (e.g., `HOSTNAME="my-firewall"`)
- You want to use a different storage pool (e.g., `STORAGE="local-zfs"`)
- You want to use a different network bridge (e.g., `BRIDGE="vmbr1"`)
- You want to use a static IP instead of DHCP (requires script modification)

## Static IP Configuration

If you need a static IP instead of DHCP, you'll need to modify the script:

1. Edit `deploy/proxmox-auto-deploy.sh`
2. Change `IP_ADDRESS="dhcp"` to `IP_ADDRESS="192.168.1.100/24"`
3. Update the network configuration section to include the gateway:
   ```bash
   NET_CONFIG="name=eth0,bridge=${BRIDGE},ip=${IP_ADDRESS},gw=192.168.1.1"
   ```

## Troubleshooting

### "No available Container ID found"
All Container IDs in the range (100-999) are in use. Either:
- Free up some Container IDs
- Increase `CTID_MAX` in the script

### Container won't start
Check the logs:
```bash
pct start <CTID>
pct enter <CTID>
journalctl -xe
```

### Can't access the application
- Verify the container is running: `pct status <CTID>`
- Check nginx is running: `pct exec <CTID> -- systemctl status nginx`
- Get the IP: `pct exec <CTID> -- hostname -I`

## Comparison

| Feature | Before | After |
|---------|--------|-------|
| Prompts | 12+ | 2 |
| Time to deploy | 5-10 minutes | < 2 minutes |
| Configuration | Manual | Automatic |
| Customization | Interactive | Edit script or enter custom ID |
| Error-prone | Yes | No |
| Reproducible | No | Yes |

## Migration

If you've already deployed with the old script:

1. The new script is backward compatible
2. Existing containers are not affected
3. You can run the new script to deploy additional containers
4. No migration needed

## Documentation Updates

The following files have been updated to reflect the simplified deployment:

- `INSTALL.md` - Updated example output
- `README.md` - Updated deployment section
- `deploy/LXC-DEPLOYMENT.md` - Simplified deployment guide
- `CTID-AUTO-DETECTION.md` - Updated examples
- `CHANGELOG.md` - Added version 1.1.2

---

**Last Updated**: 2024  
**Version**: 1.1.2 (Simplified Deployment)
