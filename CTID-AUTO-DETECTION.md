# Container ID Auto-Detection Feature

## Overview

The Proxmox LXC deployment script has been updated to automatically detect and use the next available Container ID, preventing conflicts with existing containers.

## Problem Solved

Previously, the script defaulted to Container ID 100, which could conflict with existing containers on your Proxmox host. This required manual intervention to find and specify an available ID.

## Solution

The `proxmox-auto-deploy.sh` script now:

1. **Automatically scans** for available Container IDs starting from 100
2. **Detects the next available ID** by checking both `pct status` and `/etc/pve/lxc/` directory
3. **Displays the detected ID** before prompting for configuration
4. **Validates custom IDs** if you choose to override the auto-detected value
5. **Prevents conflicts** by rejecting IDs that are already in use

## How It Works

### Auto-Detection Logic

```bash
# Function to check if a container ID is in use
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

    return 1
}
```

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

Interactive Setup

Container ID [101] (auto-detected as next available): 
```

## Configuration Options

You can customize the search range by editing the script:

```bash
# Configuration - Edit these values
CTID_MIN=100                      # Minimum Container ID to start searching from
CTID_MAX=999                      # Maximum Container ID to search up to
```

## Manual Override

If you want to use a specific Container ID:

1. Run the script
2. When prompted for Container ID, enter your desired ID
3. The script will validate it's available before proceeding
4. If the ID is in use, you'll see an error and can choose a different one

Example:
```
Container ID [101] (auto-detected as next available): 150
```

## Benefits

- ✅ **No more conflicts**: Automatically avoids existing containers
- ✅ **Time-saving**: No need to manually check which IDs are available
- ✅ **Flexible**: Still allows manual override when needed
- ✅ **Safe**: Validates IDs before creating containers
- ✅ **Transparent**: Shows you what ID was detected and why

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
