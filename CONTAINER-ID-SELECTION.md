# Container ID Selection Feature

## Overview

The deployment script now prompts you to choose the Container ID, with an auto-detected suggestion as the default. This gives you flexibility while maintaining safety through validation.

## What Changed

### Before
- Script auto-detected Container ID and used it automatically
- No way to choose a specific ID
- Had to edit the script to use a different ID

### After
- Script auto-detects the next available Container ID
- Prompts you to accept the suggestion or enter a custom ID
- Validates your choice to ensure it's not in use
- Provides flexibility without complexity

## How It Works

### Prompt Flow

```
Scanning for available Container IDs (starting from 100)...
✓ Next available Container ID: 101

Configuration:
  Hostname: unifi-fw-manager
  Memory: 512MB
  CPU Cores: 1
  Disk: 2GB on local-zfs
  Network: vmbr0 (DHCP)

Container ID [101] (auto-detected, press Enter to use or enter custom): 
```

### Option 1: Accept Auto-Detected ID
Just press **Enter** to use the suggested ID (101 in this example).

### Option 2: Choose Custom ID
Type your desired ID and press **Enter**:
```
Container ID [101] (auto-detected, press Enter to use or enter custom): 150
```

The script will:
1. Check if ID 150 is available
2. If available → proceed with ID 150
3. If in use → show error and exit

## Validation

The script validates your choice using cluster-aware detection:

✅ Checks all nodes in the Proxmox cluster  
✅ Checks for VM conflicts  
✅ Checks cluster-shared filesystem  
✅ Prevents duplicate IDs  

### Example: Choosing an In-Use ID

```
Container ID [101] (auto-detected, press Enter to use or enter custom): 100
Error: Container ID 100 is already in use
Please choose a different ID.
```

## Use Cases

### When to Accept the Suggestion
- ✅ First deployment
- ✅ Don't care about specific ID
- ✅ Want the next available ID
- ✅ Quick deployment

### When to Choose Custom ID
- ✅ Want a specific ID for organizational purposes
- ✅ Replacing a previous container with the same ID
- ✅ Following a numbering scheme (e.g., 200-299 for firewalls)
- ✅ Matching documentation or diagrams

## Examples

### Example 1: Quick Deployment
```bash
./deploy/proxmox-auto-deploy.sh

# Output:
Container ID [101] (auto-detected, press Enter to use or enter custom): [press Enter]
Enter root password for container: [enter password]

# Result: Container created with ID 101
```

### Example 2: Custom ID
```bash
./deploy/proxmox-auto-deploy.sh

# Output:
Container ID [101] (auto-detected, press Enter to use or enter custom): 200
Enter root password for container: [enter password]

# Result: Container created with ID 200
```

### Example 3: ID Already in Use
```bash
./deploy/proxmox-auto-deploy.sh

# Output:
Container ID [101] (auto-detected, press Enter to use or enter custom): 150
Error: Container ID 150 is already in use
Please choose a different ID.

# Script exits - run again and choose different ID
```

## Benefits

✅ **Flexible**: Choose any available ID  
✅ **Safe**: Validates your choice  
✅ **Convenient**: Auto-detection as suggestion  
✅ **Organized**: Follow your numbering scheme  
✅ **Cluster-aware**: Works in multi-node environments  

## Technical Details

### Detection Methods

The script uses multiple methods to check if an ID is in use:

1. **`pct list`** - Shows all containers across all cluster nodes
2. **`qm list`** - Shows all VMs to avoid conflicts
3. **`/etc/pve/lxc/<ID>.conf`** - Cluster-shared config filesystem
4. **`/etc/pve/qemu-server/<ID>.conf`** - VM configs in cluster filesystem

### Validation Logic

```bash
# User enters custom ID
read -p "Container ID [${CTID}] (auto-detected, press Enter to use or enter custom): " input

if [ -n "$input" ]; then
    # Check if ID is in use (cluster-aware)
    if ctid_in_use "$input"; then
        echo "Error: Container ID ${input} is already in use"
        exit 1
    fi
    CTID=$input
fi
```

## Comparison

| Feature | Auto-Detect Only | With Selection |
|---------|------------------|----------------|
| Prompts | 1 (password) | 2 (ID + password) |
| Flexibility | None | High |
| Safety | High | High |
| Convenience | High | High |
| Organization | None | Full control |

## Documentation Updates

The following files have been updated to reflect this feature:

- ✅ `deploy/proxmox-auto-deploy.sh` - Added Container ID prompt
- ✅ `INSTALL.md` - Updated example output
- ✅ `README.md` - Updated feature list
- ✅ `deploy/LXC-DEPLOYMENT.md` - Updated deployment guide
- ✅ `CTID-AUTO-DETECTION.md` - Updated examples
- ✅ `SIMPLIFIED-DEPLOYMENT.md` - Updated comparison
- ✅ `QUICK-FIX-CLUSTER.md` - Updated expected output
- ✅ `CHANGELOG.md` - Added version 1.1.4

## Migration

No migration needed! This is a backward-compatible enhancement:

- Existing deployments are unaffected
- New deployments get the flexibility to choose IDs
- Auto-detection still works as before
- Just an additional optional prompt

## Tips

### Tip 1: Use a Numbering Scheme
Organize your containers by purpose:
- 100-199: Infrastructure (DNS, DHCP, etc.)
- 200-299: Firewalls and security
- 300-399: Applications
- 400-499: Development

### Tip 2: Document Your IDs
Keep a spreadsheet or document of Container IDs:
```
ID   | Hostname              | Purpose
-----|-----------------------|------------------
100  | pve-dns-01           | Primary DNS
101  | unifi-fw-manager     | UniFi Firewall Manager
150  | pve-backup-01        | Backup server
200  | pve-monitor-01       | Monitoring stack
```

### Tip 3: Reserve Ranges
Reserve ID ranges for different environments:
- 100-199: Production
- 200-299: Staging
- 300-399: Development
- 400-499: Testing

## Troubleshooting

### "Error: Container ID X is already in use"

**Cause**: The ID you entered exists on another node or is used by a VM.

**Solution**: Choose a different ID or check what's using it:
```bash
# Check all containers
pct list | grep " X "

# Check all VMs
qm list | grep " X "
```

### Auto-Detected ID Seems Wrong

**Cause**: The detection might have missed something.

**Solution**: Manually verify:
```bash
# Check all containers in cluster
pct list

# Check all VMs in cluster
qm list
```

## Related Documentation

- **Quick Start**: [INSTALL.md](INSTALL.md)
- **Cluster Detection**: [BUGFIX-CLUSTER-DETECTION.md](BUGFIX-CLUSTER-DETECTION.md)
- **Auto-Detection**: [CTID-AUTO-DETECTION.md](CTID-AUTO-DETECTION.md)
- **Simplified Deployment**: [SIMPLIFIED-DEPLOYMENT.md](SIMPLIFIED-DEPLOYMENT.md)

---

**Added in version**: 1.1.4  
**Date**: 2024  
**Feature**: Container ID selection with auto-detection suggestion
