# 403 Forbidden Error - Quick Summary

## What Happened

You got a **403 Forbidden** error because the application files weren't deployed to the container during installation.

## Why It Happened

The deployment script was simplified to only ask for Container ID and password, but it still needs the project files to build and deploy the application. The script tried to copy files but either:

1. The project files weren't in the expected location on the Proxmox host
2. The copy failed silently
3. The build inside the container failed

## How to Fix It NOW

### Option 1: Quick Fix Script (Recommended)

**Inside the container:**
```bash
# Enter the container from Proxmox host
pct enter <CTID>

# Run the fix script
cd /tmp
wget https://raw.githubusercontent.com/your-repo/unifi-firewall-manager/main/deploy/fix-403.sh
chmod +x fix-403.sh
./fix-403.sh
```

### Option 2: Manual Fix

**From Proxmox host:**
```bash
# 1. Navigate to your project
cd /tmp/Firewall-helper-for-Unifi

# 2. Build the application
npm install
npm run build

# 3. Copy files to container
pct push <CTID> dist/index.html /opt/unifi-firewall-manager/
pct push <CTID> dist/assets /opt/unifi-firewall-manager/

# 4. Fix permissions
pct exec <CTID> -- chown -R www-data:www-data /opt/unifi-firewall-manager
pct exec <CTID> -- chmod -R 755 /opt/unifi-firewall-manager
pct exec <CTID> -- systemctl restart nginx
```

### Option 3: Redeploy (Clean Start)

**From Proxmox host:**
```bash
# 1. Destroy the broken container
pct stop <CTID>
pct destroy <CTID>

# 2. Run the updated deployment script
cd /tmp/Firewall-helper-for-Unifi
./deploy/proxmox-auto-deploy.sh

# 3. When prompted, provide the correct path:
#    Path to project files on this host: /tmp/Firewall-helper-for-Unifi
```

## What Changed

I've updated the deployment script to:

1. ✅ **Require project files path** - No longer optional
2. ✅ **Verify project directory exists** - Checks before deployment
3. ✅ **Verify file copy succeeded** - Confirms files were copied
4. ✅ **Verify build succeeded** - Checks if index.html exists
5. ✅ **Better error messages** - Clear instructions if something fails

## Quick Commands Reference

```bash
# Enter container
pct enter <CTID>

# Check if files exist
ls -la /opt/unifi-firewall-manager/

# Check nginx status
systemctl status nginx

# Fix permissions
chown -R www-data:www-data /opt/unifi-firewall-manager
chmod -R 755 /opt/unifi-firewall-manager
systemctl restart nginx

# Test
curl http://localhost/
```

## Documentation

- **Quick Fix Guide**: [QUICK-FIX-403.md](QUICK-FIX-403.md)
- **Detailed Troubleshooting**: [TROUBLESHOOTING-403.md](TROUBLESHOOTING-403.md)
- **Fix Script**: [deploy/fix-403.sh](deploy/fix-403.sh)

## Next Steps

1. **Fix the current container** using one of the options above
2. **Test the application** at `http://<container-ip>`
3. **Future deployments** will work correctly with the updated script

---

**Issue**: 403 Forbidden  
**Cause**: Application files not deployed  
**Status**: ✅ Fixed in deployment script  
**Action Required**: Run fix script or redeploy
