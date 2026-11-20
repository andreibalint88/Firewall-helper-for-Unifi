# Quick Fix: 403 Forbidden Error

## The Problem

You're seeing `403 Forbidden` because the application files weren't deployed to the container during installation.

## Quick Fix (Run Inside Container)

### Step 1: Enter the Container

From your Proxmox host:
```bash
pct enter <CTID>
```

Replace `<CTID>` with your container ID (e.g., 101, 102, etc.)

### Step 2: Run the Fix Script

```bash
# Download and run the fix script
cd /tmp
wget https://raw.githubusercontent.com/your-repo/unifi-firewall-manager/main/deploy/fix-403.sh
chmod +x fix-403.sh
./fix-403.sh
```

**OR** if you have the project files on the Proxmox host:

### Step 2 (Alternative): Copy Files from Host

From the **Proxmox host** (not inside the container):

```bash
# Navigate to your project directory
cd /tmp/Firewall-helper-for-Unifi

# Build the application (if not already built)
npm install
npm run build

# Push files to the container
pct push <CTID> dist/index.html /opt/unifi-firewall-manager/
pct push <CTID> dist/assets /opt/unifi-firewall-manager/

# Fix permissions inside the container
pct exec <CTID> -- chown -R www-data:www-data /opt/unifi-firewall-manager
pct exec <CTID> -- chmod -R 755 /opt/unifi-firewall-manager
pct exec <CTID> -- systemctl restart nginx
```

### Step 3: Verify

```bash
# Inside the container
curl http://localhost/

# Should return HTML, not 403
```

## Manual Fix (If Scripts Don't Work)

### 1. Check Where Files Should Be

```bash
# Find nginx config
cat /etc/nginx/sites-enabled/unifi-firewall-manager | grep root
```

You'll see something like:
```
root /opt/unifi-firewall-manager;
```

### 2. Check if Files Exist

```bash
ls -la /opt/unifi-firewall-manager/
```

You should see:
```
index.html
assets/
  index-*.css
  index-*.js
```

### 3. If Files Are Missing

**Option A: Build Inside Container**

If you copied the source code to `/tmp/app`:
```bash
cd /tmp/app
npm install
npm run build
cp -r dist/* /opt/unifi-firewall-manager/
```

**Option B: Copy from Proxmox Host**

From Proxmox host:
```bash
# Build on host
cd /tmp/Firewall-helper-for-Unifi
npm run build

# Copy to container
pct push <CTID> dist/* /opt/unifi-firewall-manager/
```

### 4. Fix Permissions

```bash
chown -R www-data:www-data /opt/unifi-firewall-manager
chmod -R 755 /opt/unifi-firewall-manager
```

### 5. Restart nginx

```bash
systemctl restart nginx
```

### 6. Test

```bash
curl http://localhost/
```

## What Went Wrong?

The deployment script tried to copy files from the Proxmox host to the container, but:

1. **Files weren't on the host** - The project wasn't in the expected location
2. **Copy failed silently** - The script didn't verify the copy succeeded
3. **Build failed** - If building inside the container, npm install or build may have failed

## Prevention

To prevent this in future deployments:

1. **Ensure project files are on the Proxmox host** before running the deployment script
2. **Specify the correct path** when prompted:
   ```
   Path to project files on this host: /tmp/Firewall-helper-for-Unifi
   ```
3. **Verify files were copied** after deployment:
   ```bash
   pct exec <CTID> -- ls -la /opt/unifi-firewall-manager/
   ```

## Diagnostic Commands

Run these to understand the issue:

```bash
# Check nginx is running
systemctl status nginx

# Check nginx config
cat /etc/nginx/sites-enabled/unifi-firewall-manager

# Check if files exist
ls -la /opt/unifi-firewall-manager/

# Check permissions
namei -l /opt/unifi-firewall-manager/index.html

# Check nginx error log
tail -20 /var/log/nginx/error.log

# Test locally
curl -v http://localhost/
```

## Expected Result

After the fix, you should see:

```bash
# curl http://localhost/
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    ...
```

And in your browser:
- Navigate to `http://<container-ip>`
- See the UniFi Firewall Manager dashboard
- No more 403 error!

## Still Not Working?

Check the error log:
```bash
tail -50 /var/log/nginx/error.log
```

Common errors:
- `Permission denied` → Fix file permissions
- `No such file` → Files not deployed
- `index.html not found` → Wrong root directory in nginx config

---

**Issue**: 403 Forbidden  
**Cause**: Application files not deployed to container  
**Solution**: Copy built files and fix permissions
