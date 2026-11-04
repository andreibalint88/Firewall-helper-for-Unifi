# Bug Fix: Gateway Configuration in Proxmox LXC Deployment

## Issue

The `proxmox-auto-deploy.sh` script was failing with the following error when creating containers with a static IP and gateway:

```
Unknown option: gw
400 unable to parse option
pct create <vmid> <ostemplate> [OPTIONS]
```

## Root Cause

The script was using `--gw` as a separate command-line parameter for `pct create`, but Proxmox VE does not support `--gw` as a standalone option. The gateway must be specified as part of the network configuration in the `--net0` parameter.

## Solution

### Before (Incorrect)
```bash
pct create 120 local:vztmpl/debian-12-standard_12.12-1_amd64.tar.zst \
    --hostname "Unifi Firewall Manager" \
    --memory 512 \
    --swap 512 \
    --cores 1 \
    --rootfs local-lvm:2 \
    --net0 name=eth0,bridge=vmbr0,ip=10.10.4.40 \
    --unprivileged 1 \
    --features nesting=1 \
    --password xxx \
    --start 0 \
    --gw 10.10.4.1  # ❌ This is invalid!
```

### After (Correct)
```bash
pct create 120 local:vztmpl/debian-12-standard_12.12-1_amd64.tar.zst \
    --hostname "Unifi Firewall Manager" \
    --memory 512 \
    --swap 512 \
    --cores 1 \
    --rootfs local-lvm:2 \
    --net0 name=eth0,bridge=vmbr0,ip=10.10.4.40,gw=10.10.4.1 \
    --unprivileged 1 \
    --features nesting=1 \
    --password xxx \
    --start 0
```

## Technical Details

### Proxmox Network Configuration Syntax

The `--net0` parameter accepts a comma-separated list of network options:

```
--net0 name=<name>,bridge=<bridge>,ip=<ip>[,gw=<gateway>][,hwaddr=<mac>][,rate=<rate>][,tag=<vlan_tag>]
```

**Key points:**
- `gw=` (gateway) must be included in the `--net0` parameter
- Gateway is only valid when using a static IP (not with `ip=dhcp`)
- The gateway should be in the same subnet as the IP address

### Script Changes

**File:** `deploy/proxmox-auto-deploy.sh`

**Lines changed:** 181-206

**Before:**
```bash
CREATE_CMD="pct create ${CTID} ${TEMPLATE_PATH} \
    --hostname ${HOSTNAME} \
    ...
    --net0 name=eth0,bridge=${BRIDGE},ip=${IP_ADDRESS} \
    ...
    --start 0"

if [ -n "$GATEWAY" ] && [ "$IP_ADDRESS" != "dhcp" ]; then
    CREATE_CMD="${CREATE_CMD} --gw ${GATEWAY}"  # ❌ Invalid
fi
```

**After:**
```bash
# Build network configuration
# For static IP with gateway, include gw in the net0 parameter
if [ -n "$GATEWAY" ] && [ "$IP_ADDRESS" != "dhcp" ]; then
    NET_CONFIG="name=eth0,bridge=${BRIDGE},ip=${IP_ADDRESS},gw=${GATEWAY}"
else
    NET_CONFIG="name=eth0,bridge=${BRIDGE},ip=${IP_ADDRESS}"
fi

CREATE_CMD="pct create ${CTID} ${TEMPLATE_PATH} \
    --hostname ${HOSTNAME} \
    ...
    --net0 ${NET_CONFIG} \
    ...
    --start 0"
```

## Impact

- ✅ Fixes deployment with static IP and gateway
- ✅ Maintains compatibility with DHCP configuration
- ✅ No breaking changes to the script interface
- ✅ All existing functionality preserved

## Testing

### Test Case 1: Static IP with Gateway
```bash
# Configuration
IP Address: 10.10.4.40/24
Gateway: 10.10.4.1

# Expected result
Container created successfully with:
- IP: 10.10.4.40/24
- Gateway: 10.10.4.1
- DNS: 8.8.8.8
```

### Test Case 2: DHCP
```bash
# Configuration
IP Address: dhcp

# Expected result
Container created successfully with DHCP configuration
Gateway parameter ignored (as expected)
```

### Test Case 3: Static IP without Gateway
```bash
# Configuration
IP Address: 10.10.4.40/24
Gateway: (empty)

# Expected result
Container created successfully with static IP but no default gateway
```

## How to Apply the Fix

If you've already cloned the repository:

```bash
cd Firewall-helper-for-Unifi
git pull
chmod +x deploy/proxmox-auto-deploy.sh
./deploy/proxmox-auto-deploy.sh
```

If you're starting fresh:

```bash
git clone <repository-url>
cd Firewall-helper-for-Unifi
chmod +x deploy/proxmox-auto-deploy.sh
./deploy/proxmox-auto-deploy.sh
```

## Related Documentation

- [INSTALL.md](INSTALL.md) - Complete installation guide
- [deploy/LXC-DEPLOYMENT.md](deploy/LXC-DEPLOYMENT.md) - Proxmox LXC deployment guide
- [CTID-AUTO-DETECTION.md](CTID-AUTO-DETECTION.md) - Container ID auto-detection feature

## Proxmox Version Compatibility

This fix is compatible with:
- ✅ Proxmox VE 7.x
- ✅ Proxmox VE 8.x
- ✅ All recent versions that support LXC containers

## Additional Notes

### Why This Happened

The `--gw` parameter was likely confused with:
1. The `gw` option in `/etc/network/interfaces` (inside the container)
2. The `gateway` option in some other virtualization platforms
3. Old Proxmox documentation or examples

### Best Practices

When working with Proxmox LXC networking:

1. **Always include gateway in `--net0`** when using static IPs
2. **Use DHCP** when possible for simpler configuration
3. **Verify subnet masks** match your network topology
4. **Test connectivity** after container creation with `pct exec <CTID> -- ping 8.8.8.8`

### Manual Network Configuration

If you need to modify network settings after creation:

```bash
# Edit container config
pct set <CTID> --net0 name=eth0,bridge=vmbr0,ip=10.10.4.40/24,gw=10.10.4.1

# Or edit the config file directly
nano /etc/pve/lxc/<CTID>.conf
```

## Status

✅ **FIXED** - The script now correctly handles gateway configuration for static IPs.

---

**Fixed in version:** 1.1.1  
**Date:** 2024  
**Issue:** Gateway configuration error in `pct create` command
