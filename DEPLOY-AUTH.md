# Deploy Authentication System to Container

## Quick Update Guide

Your UniFi Firewall Manager now has a complete multi-user authentication system! Here's how to deploy it to your container.

## Step 1: Push Changes to GitHub

From your local machine (where you have the project):

```bash
cd /path/to/Firewall-helper-for-Unifi

# Add all new files
git add .

# Commit
git commit -m "Add multi-user authentication system with SQLite database"

# Push to the branch
git push origin unifi-meraki-firewall-tool-5db3d
```

## Step 2: Update Container

SSH into your Proxmox host and enter the container:

```bash
pct enter 120
```

Pull the latest changes and rebuild:

```bash
cd /tmp/app
git pull origin unifi-meraki-firewall-tool-5db3d

# Install new dependencies
npm install

# Rebuild the frontend
npm run build

# Copy to web directory
cp -r dist/* /opt/unifi-firewall-manager/
chown -R www-www-data /opt/unifi-firewall-manager
chmod -R 755 /opt/unifi-firewall-manager
```

## Step 3: Setup Authentication Server

Install server dependencies:

```bash
cd /tmp/app
npm install express better-sqlite3 bcryptjs jsonwebtoken cookie-parser cors
```

Create data directory:

```bash
mkdir -p /opt/unifi-firewall-manager/data
chown -R www-www-data /opt/unifi-firewall-manager/data
```

Generate a secure JWT secret:

```bash
export JWT_SECRET=$(openssl rand -base64 32)
echo "Your JWT_SECRET: $JWT_SECRET"
echo "Save this! You'll need it for the systemd service."
```

## Step 4: Create Systemd Service

Create a service file to run the authentication server:

```bash
cat > /etc/systemd/system/unifi-fw-manager.service << 'EOF'
[Unit]
Description=UniFi Firewall Manager - Authentication Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/tmp/app
Environment=NODE_ENV=production
Environment=PORT=3001
Environment=JWT_SECRET=YOUR_JWT_SECRET_HERE
Environment=DB_PATH=/opt/unifi-firewall-manager/data/users.db
ExecStart=/usr/bin/node server/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
```

Replace `YOUR_JWT_SECRET_HERE` with the JWT_SECRET you generated above.

Enable and start the service:

```bash
systemctl daemon-reload
systemctl enable unifi-fw-manager
systemctl start unifi-fw-manager

# Check status
systemctl status unifi-fw-manager
```

## Step 5: Update Nginx Configuration

Update nginx to proxy requests to the authentication server:

```bash
cat > /etc/nginx/sites-available/unifi-firewall-manager << 'EOF'
server {
    listen 80;
    server_name _;

    # Proxy API requests to Node server
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Serve static files
    location / {
        root /opt/unifi-firewall-manager;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
EOF

# Restart nginx
systemctl restart nginx
```

## Step 6: First Login

Open your browser and navigate to `http://<container-ip>`

You'll see the login page. Use the default admin credentials:

```
Username: admin
Password: admin123
```

⚠️ **IMPORTANT**: Change the password immediately after first login!

## Step 7: Create Additional Users

After logging in:

1. Click "User Management" in the sidebar (only visible to admins)
2. Click "Create User"
3. Fill in the details:
   - Username
   - Password
   - Email (optional)
   - Role (admin or user)
4. Click "Create"

## Verification

Check that everything is working:

```bash
# Check authentication server is running
systemctl status unifi-fw-manager

# Check logs
journalctl -u unifi-fw-manager -f

# Test API health
curl http://localhost:3001/api/health

# Check database was created
ls -la /opt/unifi-firewall-manager/data/
```

## Security Checklist

- [ ] Changed default admin password
- [ ] Set a secure JWT_SECRET in systemd service
- [ ] Enabled HTTPS (optional but recommended)
- [ ] Created individual user accounts
- [ ] Reviewed audit logs
- [ ] Set up database backups

## Troubleshooting

### Authentication server won't start
```bash
# Check logs
journalctl -u unifi-fw-manager -n 50

# Common issues:
# - Port 3001 already in use
# - Database file permissions
# - Missing dependencies
```

### Cannot login
```bash
# Check if admin user was created
sqlite3 /opt/unifi-firewall-manager/data/users.db "SELECT username, role FROM users;"

# Reset admin password (if needed)
cd /tmp/app
node -e "
const db = require('./server/database');
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('newpassword', 10);
db.db.prepare('UPDATE users SET password = ? WHERE username = ?').run(hash, 'admin');
console.log('Password reset to: newpassword');
"
```

### Nginx 502 Bad Gateway
```bash
# Check if Node server is running
systemctl status unifi-fw-manager

# Check if port 3001 is listening
netstat -tlnp | grep 3001

# Restart both services
systemctl restart unifi-fw-manager
systemctl restart nginx
```

## What's New

✅ **Login Page** - Secure authentication required to access the app  
✅ **Multi-User Support** - Create multiple user accounts  
✅ **Role-Based Access** - Admin and User roles with different permissions  
✅ **User Management** - Admins can create, edit, and delete users  
✅ **Audit Logging** - Track all authentication events  
✅ **Session Management** - Automatic session expiration (24 hours)  
✅ **SQLite Database** - Lightweight, file-based database  
✅ **Password Hashing** - Secure bcrypt password storage  
✅ **JWT Tokens** - Secure session management  

## Documentation

See `AUTHENTICATION.md` for complete documentation on:
- API endpoints
- Database schema
- Security best practices
- Backup and restore
- Troubleshooting

---

**Need Help?** Check the logs and review the AUTHENTICATION.md guide.
