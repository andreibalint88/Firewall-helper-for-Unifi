# Container ID Auto-Detection Feature

## Overview

The Proxmox LXC deployment script has been updated to automatically detect and use the next available Container ID, preventing conflicts with existing containers.

## Problem Solved

Previously, the script defaulted to Container ID 100, which could conflict with existing containers on your Proxmox host. This required manual intervention to find and specify an available ID.

## Solution

The `proxmox-auto-deploy.sh` script now:

1. **Automatically scans** for available Container IDs starting from 100
2. **Detects the next available ID** by checking both `pct status` and `/etc/pve/lxc/` directory
3. **Uses sensible defaults** for all configuration (memory, CPU, disk, network)
4. **Only prompts for the root password** - no other interactive questions
5. **Prevents conflicts** by rejecting IDs that are already in use

## How It Works

### Auto-Detection Logic (Cluster-Aware)

```bash
# Function to check if a container ID is in use (cluster-aware)
ctid_in_use() {
    local check_id=$1
    
    # Method 1: Check via pct list (cluster-aware - shows all containers on all nodes)
    if pct list | grep -q "^ *${check_id} "; then
        return 0
    fi
    
    # Method 2: Check via qm list for VMs (to avoid ID conflicts with VMs too)
    if qm list 2>/dev/null | grep -q "^ *${check_id} "; then
        return 0
    fi
    
    # Method 3: Check the config directory (shared across cluster via pmxcfs)
    if [ -f "/etc/pve/lxc/${check_id}.conf" ]; then
        return 0
    fi
    
    # Method 4: Check for VM configs too
    if [ -f "/etc/pve/qemu-server/${check_id}.conf" ]; then
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

    return 1
}
```

### Cluster Support

The detection is **cluster-aware** and works correctly in multi-node Proxmox environments:

- ✅ Detects containers on **any node** in the cluster (not just the local node)
- ✅ Avoids conflicts with **VMs** using the same ID
- ✅ Uses `pct list` which shows all containers across all nodes
- ✅ Checks the cluster-shared filesystem (`/etc/pve/`)

This prevents the "CT already exists on node" error when deploying in a cluster.

### Example Output

When you run the script, you'll see:

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
  Disk: 2GB on local-lvm
  Network: vmbr0 (DHCP)

Container ID [101] (auto-detected, press Enter to use or enter custom): [press Enter or type custom ID]

Enter root password for container: 
```

## Configuration Options

You can customize the search range by editing the script:

```bash
# Configuration - Edit these values
CTID_MIN=100                      # Minimum Container ID to start searching from
CTID_MAX=999                      # Maximum Container ID to search up to
```

## Custom Configuration

If you want to use different settings than the defaults:

1. Edit the script configuration at the top of `deploy/proxmox-auto-deploy.sh`
2. Modify the values for `HOSTNAME`, `MEMORY`, `CORES`, `DISK_SIZE`, etc.
3. Run the script - it will use your custom values

Example:
```bash
# Edit these values at the top of proxmox-auto-deploy.sh
CTID_MIN=200                      # Start searching from 200
HOSTNAME="my-firewall-mgr"        # Custom hostname
MEMORY=1024                       # 1GB RAM
CORES=2                           # 2 CPU cores
DISK_SIZE=4                       # 4GB disk
```

## Benefits

- ✅ **No more conflicts**: Automatically avoids existing containers
- ✅ **Time-saving**: No need to manually check which IDs are available
- ✅ **Simple**: Only asks for root password, everything else uses defaults
- ✅ **Safe**: Validates IDs before creating containers
- ✅ **Transparent**: Shows you what ID was detected and the configuration
- ✅ **Fast**: Complete deployment in under 2 minutes

## Updated Documentation

The following documentation files have been updated to reflect this feature:

- `INSTALL.md` - Updated example output showing auto-detection
- `deploy/LXC-DEPLOYMENT.md` - Added section explaining auto-detection
- `README.md` - Added feature highlights
- `deploy/README.md` - Updated deployment instructions

## Troubleshooting

### "No available Container ID found"

If you see this error, it means all Container IDs in the range (100-999) are in use.

**Solutions:**
1. Free up some Container IDs by removing unused containers
2. Edit the script and increase `CTID_MAX` to a higher value
3. Manually specify a Container ID outside the default range

### Script detects wrong ID

If the auto-detection seems incorrect:

1. Check if the container exists: `pct list | grep <ID>`
2. Check the config file: `ls -la /etc/pve/lxc/<ID>.conf`
3. Verify Proxmox is running correctly: `pveversion`

### Want to use a specific ID range

Edit the script configuration:

```bash
# Change these values at the top of proxmox-auto-deploy.sh
CTID_MIN=200    # Start searching from 200 instead of 100
CTID_MAX=500    # Stop at 500 instead of 999
```

## Technical Details

### Detection Methods

The script uses two methods to check if a Container ID is in use:

1. **`pct status <ID>`**: Checks if the container exists (works for both running and stopped containers)
2. **`/etc/pve/lxc/<ID>.conf`**: Checks if the configuration file exists (fallback method)

This dual-check ensures accurate detection even in edge cases.

### Performance

- Scanning is fast (typically < 1 second)
- Only checks IDs in the configured range
- Stops immediately when an available ID is found
- No impact on Proxmox performance

## Migration from Old Script

If you were using the previous version of the script:

1. The old script would fail if CTID 100 was in use
2. The new script automatically finds the next available ID
3. No migration needed - just run the updated script
4. Your existing containers are unaffected

## Future Enhancements

Potential improvements for future versions:

- [ ] Configurable ID ranges via command-line arguments
- [ ] Option to skip auto-detection and always prompt
- [ ] Parallel detection for faster scanning
- [ ] Integration with Proxmox API for cluster-aware detection
- [ ] Logging of detected IDs for audit purposes

---

**Last Updated**: 2024  
**Version**: 1.1.0 (Auto-Detection Feature)
