# Storage Configuration Change: local-lvm → local-zfs

## Overview

The default storage pool for the UniFi Firewall Manager LXC container has been changed from `local-lvm` to `local-zfs`.

## What Changed

### Before
```bash
STORAGE="local-lvm"               # Storage pool for root disk
```

### After
```bash
STORAGE="local-zfs"               # Storage pool for root disk
```

## Why ZFS?

ZFS offers several advantages over LVM for Proxmox containers:

### ✅ Benefits of ZFS

1. **Snapshots**
   - Instantaneous container snapshots
   - Easy rollback to previous states
   - Perfect for testing and backups

2. **Compression**
   - Built-in data compression
   - Saves disk space automatically
   - Transparent to applications

3. **Data Integrity**
   - Checksums for all data
   - Automatic detection of corruption
   - Self-healing capabilities

4. **Performance**
   - Excellent read performance
   - Adaptive replacement cache (ARC)
   - Better for database workloads

5. **Clones**
   - Instant container cloning
   - Space-efficient (copy-on-write)
   - Great for testing environments

6. **Deduplication**
   - Eliminates duplicate data blocks
   - Further space savings
   - Optional feature

## Impact

### Deployment Script
- Default storage pool is now `local-zfs`
- All new deployments will use ZFS storage
- Existing containers are unaffected

### Documentation
- All example outputs updated
- Configuration tables updated
- Command examples updated

### Files Updated
- ✅ `deploy/proxmox-auto-deploy.sh` - Default configuration
- ✅ `INSTALL.md` - Example outputs
- ✅ `CTID-AUTO-DETECTION.md` - Example outputs
- ✅ `SIMPLIFIED-DEPLOYMENT.md` - Configuration table and examples
- ✅ `CONTAINER-ID-SELECTION.md` - Example outputs
- ✅ `QUICK-FIX-CLUSTER.md` - Example outputs
- ✅ `BUGFIX-GATEWAY.md` - Command examples
- ✅ `deploy/LXC-DEPLOYMENT.md` - Configuration and examples
- ✅ `CHANGELOG.md` - Version 1.1.5 entry

## How to Use

### Default Deployment (ZFS)
```bash
./deploy/proxmox-auto-deploy.sh

# Output:
Configuration:
  Hostname: unifi-fw-manager
  Memory: 512MB
  CPU Cores: 1
  Disk: 2GB on local-zfs  ← Now uses ZFS!
  Network: vmbr0 (DHCP)
```

### Custom Storage Pool
If you want to use a different storage pool, edit the script:

```bash
# Edit deploy/proxmox-auto-deploy.sh
STORAGE="your-storage-pool"     # Change this line
```

### Manual Deployment
```bash
pct create <VMID> <template> \
  --rootfs local-zfs:2 \
  --memory 512 \
  --swap 512 \
  --cores 1 \
  --net0 name=eth0,bridge=vmbr0,ip=dhcp \
  --unprivileged 1 \
  --features nesting=1
```

## Verification

### Check Your Storage Pools
```bash
# List all storage pools
pvesm status

# Expected output:
Name            Type     Status   Total    Used     Available  %
local           dir      active   50G      10G      40G        20%
local-zfs       zfspool  active   100G     20G      80G        20%
```

### Verify Container Storage
```bash
# Check container disk location
pct config <VMID> | grep rootfs

# Expected output:
rootfs: local-zfs:vm-<VMID>-disk-0,size=2G
```

## Migration (Optional)

If you have existing containers on `local-lvm` and want to move them to `local-zfs`:

### Option 1: Move Disk
```bash
# Stop the container
pct stop <VMID>

# Move disk to ZFS
pct move-disk <VMID> rootfs local-zfs

# Start the container
pct start <VMID>
```

### Option 2: Backup and Restore
```bash
# Backup container
vzdump <VMID> --storage local

# Remove old container
pct destroy <VMID>

# Restore to ZFS
qmrestore /var/lib/vz/dump/vzdump-lxc-<VMID>-*.vma.zst <VMID> --storage local-zfs
```

## Requirements

### ZFS Storage Pool
Your Proxmox host must have a ZFS storage pool configured:

```bash
# Check if ZFS pool exists
zpool list

# If not, create one (requires dedicated disks)
# This is typically done during Proxmox installation
```

### Disk Space
Ensure you have enough space on your ZFS pool:
```bash
# Check available space
zfs list -o name,avail,used

# Or via Proxmox
pvesm status local-zfs
```

## Performance Comparison

| Feature | LVM | ZFS |
|---------|-----|-----|
| Snapshots | Slow (requires LVM snapshot) | Instant (copy-on-write) |
| Compression | No | Yes (lz4, gzip, zstd) |
| Deduplication | No | Yes (optional) |
| Data Integrity | No checksums | Full checksums |
| Clone Speed | Slow | Instant |
| Memory Usage | Low | Higher (ARC cache) |
| CPU Usage | Low | Higher (compression) |
| Setup Complexity | Simple | Moderate |

## Troubleshooting

### "Storage 'local-zfs' does not exist"

**Cause**: ZFS storage pool not configured

**Solution**:
```bash
# Check available storage
pvesm status

# If local-zfs doesn't exist, either:
# 1. Add it via Proxmox web interface (Datacenter → Storage → Add → ZFS)
# 2. Or change the script to use an existing storage pool
```

### "No space left on device"

**Cause**: ZFS pool is full

**Solution**:
```bash
# Check space
zfs list -o name,avail,used

# Free up space or expand the pool
# Or use a different storage pool
```

### Poor Performance

**Cause**: ZFS ARC cache using too much RAM

**Solution**:
```bash
# Limit ARC size (edit /etc/modprobe.d/zfs.conf)
echo "options zfs zfs_arc_max=2147483648" > /etc/modprobe.d/zfs.conf
# This limits ARC to 2GB

# Reboot or reload module
update-initramfs -u
reboot
```

## Best Practices

### 1. Use SSDs for ZFS
ZFS performs best on SSDs due to:
- Faster random I/O
- Better ARC cache performance
- Lower latency for transactions

### 2. Enable Compression
```bash
# Enable lz4 compression (fast, good ratio)
zfs set compression=lz4 rpool/ROOT/pve-1

# Or use zstd (better ratio, slower)
zfs set compression=zstd rpool/ROOT/pve-1
```

### 3. Regular Scrubs
```bash
# Schedule weekly scrub
echo "zpool scrub rpool" > /etc/cron.weekly/zfs-scrub
chmod +x /etc/cron.weekly/zfs-scrub
```

### 4. Monitor Health
```bash
# Check pool health
zpool status

# Check for errors
zpool status -v
```

## Documentation

- **Main README**: [README.md](README.md)
- **Installation Guide**: [INSTALL.md](INSTALL.md)
- **LXC Deployment**: [deploy/LXC-DEPLOYMENT.md](deploy/LXC-DEPLOYMENT.md)
- **Changelog**: [CHANGELOG.md](CHANGELOG.md) - Version 1.1.5

---

**Changed in version**: 1.1.5  
**Date**: 2024  
**Change**: Default storage pool from local-lvm to local-zfs
