# Troubleshooting: 403 Forbidden Error

## Problem

You're seeing a **403 Forbidden** error when trying to access the application:

```
403 Forbidden
nginx/1.22.1
```

## Root Cause

The 403 Forbidden error means nginx cannot access the files. This is typically caused by:

1. **Wrong file permissions** - nginx (www-data user) can't read the files
2. **Files not deployed** - The built files aren't in the expected location
3. **Wrong nginx config** - nginx is looking in the wrong directory
4. **Missing index.html** - The main file doesn't exist

## Quick Fix

### Step 1: SSH into the Container

```bash
# From Proxmox host
pct enter <CTID>

# Or via SSH
ssh root@<container-ip>
```

### Step 2: Check Where Files Should Be

```bash
# Check nginx config
cat /etc/nginx/sites-enabled/unifi-firewall-manager | grep root
```

Expected output:
```
root /opt/unifi-firewall-manager;
```

### Step 3: Check if Files Exist

```bash
# List files in the directory
ls -la /opt/unifi-firewall-manager/

# You should see:
# index.html
# assets/
#   index-*.css
#   index-*.js
```

### Step 4: Fix Permissions

```bash
# Set correct ownership
chown -R www-data:www-data /opt/unifi-firewall-manager

# Set correct permissions
chmod -R 755 /opt/unifi-firewall-manager

# Restart nginx
systemctl restart nginx
```

### Step 5: Test

```bash
# Check nginx status
systemctl status nginx

# Test locally
curl http://localhost/

# Should return HTML content, not 403
```

## Complete Diagnostic Script

Run this script inside the container to diagnose and fix the issue:

```bash
#!/bin/bash

echo "=== UniFi Firewall Manager - 403 Fix Script ==="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Error: Must run as root"
    exit 1
fi

# Find nginx config
echo "1. Checking nginx configuration..."
NGINX_CONF=$(find /etc/nginx -name "*unifi*" -o -name "*firewall*" 2>/dev/null | head -1)

if [ -z "$NGINX_CONF" ]; then
    echo "   ❌ No nginx config found for unifi-firewall-manager"
    echo "   Creating default config..."
    
    cat > /etc/nginx/sites-available/unifi-firewall-manager << 'EOF'
server {
    listen 80;
    server_name _;

    root /opt/unifi-firewall-manager;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF
    
    ln -sf /etc/nginx/sites-available/unifi-firewall-manager /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    NGINX_CONF="/etc/nginx/sites-available/unifi-firewall-manager"
fi

echo "   ✓ Config: $NGINX_CONF"

# Get root directory from config
ROOT_DIR=$(grep "root " $NGINX_CONF | awk '{print $2}' | sed 's/;//')
echo "   ✓ Root directory: $ROOT_DIR"
echo ""

# Check if directory exists
echo "2. Checking directory..."
if [ ! -d "$ROOT_DIR" ]; then
    echo "   ❌ Directory does not exist: $ROOT_DIR"
    echo "   Creating directory..."
    mkdir -p $ROOT_DIR
fi
echo "   ✓ Directory exists"
echo ""

# Check if files exist
echo "3. Checking files..."
if [ ! -f "$ROOT_DIR/index.html" ]; then
    echo "   ❌ index.html not found in $ROOT_DIR"
    echo ""
    echo "   The application files need to be deployed."
    echo "   Run the deployment script again or manually copy files:"
    echo ""
    echo "   # From Proxmox host:"
    echo "   pct push <CTID> /path/to/dist/* $ROOT_DIR/"
    echo ""
    exit 1
fi

echo "   ✓ Files found:"
ls -lh $ROOT_DIR/
echo ""

# Fix permissions
echo "4. Fixing permissions..."
chown -R www-data:www-data $ROOT_DIR
chmod -R 755 $ROOT_DIR
echo "   ✓ Permissions fixed"
echo ""

# Restart nginx
echo "5. Restarting nginx..."
nginx -t
if [ $? -eq 0 ]; then
    systemctl restart nginx
    echo "   ✓ nginx restarted"
else
    echo "   ❌ nginx config test failed"
    exit 1
fi
echo ""

# Test
echo "6. Testing..."
sleep 2
RESULT=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/)

if [ "$RESULT" = "200" ]; then
    echo "   ✓ Success! HTTP $RESULT"
    echo ""
    echo "=== Fix Complete ==="
    echo "Access the application at: http://<container-ip>"
else
    echo "   ❌ Still getting HTTP $RESULT"
    echo ""
    echo "Check nginx error log:"
    echo "  tail -20 /var/log/nginx/error.log"
    exit 1
fi
```

### How to Use the Fix Script

**Option 1: Create and Run**
```bash
# Inside the container
cat > /tmp/fix-403.sh << 'EOF'
[paste the script above]
EOF

chmod +x /tmp/fix-403.sh
/tmp/fix-403.sh
```

**Option 2: Quick Commands**
```bash
# Inside the container - run these commands:

# 1. Find the root directory
ROOT_DIR=$(grep "root " /etc/nginx/sites-enabled/unifi-firewall-manager | awk '{print $2}' | sed 's/;//')
echo "Root directory: $ROOT_DIR"

# 2. Check if files exist
ls -la $ROOT_DIR/

# 3. If files don't exist, you need to deploy them
# If files exist, fix permissions:
chown -R www-data:www-data $ROOT_DIR
chmod -R 755 $ROOT_DIR

# 4. Restart nginx
systemctl restart nginx

# 5. Test
curl http://localhost/
```

## Common Scenarios

### Scenario 1: Files Not Deployed

**Symptom:**
```bash
ls -la /opt/unifi-firewall-manager/
# Directory is empty or doesn't exist
```

**Solution:**
```bash
# From Proxmox host, push the built files
cd /tmp/Firewall-helper-for-Unifi
pct push <CTID> dist/* /opt/unifi-firewall-manager/

# Or rebuild inside the container
pct enter <CTID>
cd /tmp/Firewall-helper-for-Unifi
npm install
npm run build
cp -r dist/* /opt/unifi-firewall-manager/
chown -R www-data:www-data /opt/unifi-firewall-manager
```

### Scenario 2: Wrong Permissions

**Symptom:**
```bash
ls -la /opt/unifi-firewall-manager/
# Files owned by root, not www-data
```

**Solution:**
```bash
chown -R www-data:www-data /opt/unifi-firewall-manager
chmod -R 755 /opt/unifi-firewall-manager
systemctl restart nginx
```

### Scenario 3: Wrong nginx Config

**Symptom:**
```bash
cat /etc/nginx/sites-enabled/unifi-firewall-manager
# root points to wrong directory
```

**Solution:**
```bash
# Edit the config
nano /etc/nginx/sites-available/unifi-firewall-manager

# Change root to correct directory:
root /opt/unifi-firewall-manager;

# Restart nginx
systemctl restart nginx
```

### Scenario 4: SELinux/AppArmor Blocking

**Symptom:**
```bash
# Check audit log
tail /var/log/audit/audit.log | grep nginx

# Or check dmesg
dmesg | grep nginx
```

**Solution:**
```bash
# For AppArmor (Debian/Ubuntu)
aa-complain /etc/apparmor.d/nginx

# Or disable AppArmor for nginx temporarily
systemctl stop apparmor
systemctl restart nginx
```

## Verification Checklist

Run these commands to verify everything is working:

```bash
# 1. Check nginx is running
systemctl status nginx

# 2. Check files exist
ls -la /opt/unifi-firewall-manager/

# 3. Check permissions
namei -l /opt/unifi-firewall-manager/index.html

# 4. Check nginx config
nginx -t

# 5. Test locally
curl -I http://localhost/

# 6. Check error logs
tail -20 /var/log/nginx/error.log

# 7. Check access logs
tail -20 /var/log/nginx/access.log
```

## Expected Output

When everything is working correctly:

```bash
# curl -I http://localhost/
HTTP/1.1 200 OK
Server: nginx/1.22.1
Content-Type: text/html
Content-Length: 3210
Connection: keep-alive
```

## Prevention

To prevent this issue in future deployments:

1. **Update the deployment script** to verify files after copying
2. **Add permission checks** in the setup script
3. **Test nginx config** before restarting
4. **Verify HTTP response** after deployment

## Quick Reference

| Issue | Command to Check | Fix |
|-------|------------------|-----|
| Files missing | `ls /opt/unifi-firewall-manager/` | Deploy files |
| Wrong permissions | `ls -la /opt/unifi-firewall-manager/` | `chown -R www-data:www-data` |
| Wrong config | `cat /etc/nginx/sites-enabled/*` | Edit config |
| nginx not running | `systemctl status nginx` | `systemctl start nginx` |
| SELinux/AppArmor | `dmesg \| grep nginx` | Adjust security policy |

## Support

If you're still getting 403 after trying these fixes:

1. Check the error log: `tail -50 /var/log/nginx/error.log`
2. Verify all files are present: `find /opt/unifi-firewall-manager -type f`
3. Test with verbose curl: `curl -v http://localhost/`
4. Check nginx user: `ps aux | grep nginx`

---

**Created**: 2024  
**Issue**: 403 Forbidden error  
**Solution**: Fix file permissions and ensure files are deployed
