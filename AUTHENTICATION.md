# Authentication System Guide

## Overview

The UniFi Firewall Manager now includes a complete multi-user authentication system with:

- **SQLite Database** - Lightweight, file-based database for user storage
- **JWT Tokens** - Secure session management
- **Password Hashing** - bcrypt for secure password storage
- **Role-Based Access** - Admin and User roles
- **Audit Logging** - Track all authentication events
- **Session Management** - Automatic session expiration

## Default Admin Account

When the application starts for the first time, it creates a default admin account:

```
Username: admin
Password: admin123
```

⚠️ **IMPORTANT**: Change this password immediately after first login!

## User Roles

### Admin
- Full access to all features
- Can create, edit, and delete users
- Can view audit logs
- Can manage firewall rules
- Can access all settings

### User
- Can view and manage firewall rules (based on permissions)
- Can view the concept guide
- Can access UniFi controller connection settings
- Cannot manage other users

## Authentication Flow

1. **Login**: User enters credentials → Server validates → JWT token issued → Stored in browser
2. **Session Check**: On app load, token is validated against database
3. **API Requests**: Token sent with each request in Authorization header
4. **Logout**: Token invalidated in database → Cleared from browser

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with username/password
- `POST /api/auth/logout` - Logout and invalidate session
- `POST /api/auth/register` - Create new user (admin only)
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/change-password` - Change own password

### User Management (Admin Only)
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/users/audit/logs` - Get audit logs

## Database Schema

### Users Table
```sql
- id: Primary key
- username: Unique username
- password: Hashed password (bcrypt)
- email: User email (optional)
- role: 'admin' or 'user'
- created_at: Account creation timestamp
- last_login: Last login timestamp
- is_active: Account status (1 = active, 0 = inactive)
```

### Sessions Table
```sql
- id: Primary key
- user_id: Foreign key to users
- token: JWT token
- created_at: Session creation timestamp
- expires_at: Session expiration timestamp
- ip_address: Client IP address
- user_agent: Client user agent
```

### Audit Log Table
```sql
- id: Primary key
- user_id: User who performed action
- username: Username at time of action
- action: Action type (login_success, login_failed, logout, etc.)
- details: Additional details
- ip_address: Client IP address
- created_at: Action timestamp
```

## Configuration

### Environment Variables

```bash
# Server Configuration
PORT=3001                          # Server port
NODE_ENV=production                # Environment (development/production)

# Security
JWT_SECRET=your-secret-key-here    # Secret for JWT signing (CHANGE THIS!)

# Database
DB_PATH=./data/users.db            # SQLite database file path
```

### Setting JWT_SECRET

Generate a secure random string:

```bash
# Linux/Mac
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Deployment

### Docker (Recommended)

```bash
# Set a secure JWT secret
export JWT_SECRET=$(openssl rand -base64 32)

# Start the application
docker-compose up -d

# View logs
docker-compose logs -f
```

The database is persisted in a Docker volume (`unifi-fw-data`).

### Proxmox LXC

Update the deployment script to include the server:

```bash
# Inside the container after deployment
cd /opt/unifi-firewall-manager

# Install server dependencies
npm install express better-sqlite3 bcryptjs jsonwebtoken cookie-parser cors

# Create data directory
mkdir -p data

# Set environment variables
export JWT_SECRET=$(openssl rand -base64 32)
export NODE_ENV=production

# Start the server
npm run server
```

For production, create a systemd service:

```bash
cat > /etc/systemd/system/unifi-fw-manager.service << 'EOF'
[Unit]
Description=UniFi Firewall Manager
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/unifi-firewall-manager
Environment=NODE_ENV=production
Environment=PORT=3001
Environment=JWT_SECRET=your-secret-key-here
Environment=DB_PATH=/opt/unifi-firewall-manager/data/users.db
ExecStart=/usr/bin/node server/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl enable unifi-fw-manager
systemctl start unifi-fw-manager
```

Update nginx to proxy to the Node server:

```nginx
server {
    listen 80;
    server_name _;

    location / {
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
}
```

## Security Best Practices

1. **Change Default Password**: Immediately change the admin password after first login
2. **Use Strong JWT_SECRET**: Generate a random 32+ character string
3. **Enable HTTPS**: Use Let's Encrypt or similar for production
4. **Regular Backups**: Backup the SQLite database regularly
5. **Monitor Audit Logs**: Review login attempts and user actions
6. **Limit Admin Access**: Only grant admin role to trusted users
7. **Session Timeout**: Sessions expire after 24 hours
8. **Network Security**: Restrict access to the application via firewall rules

## User Management

### Creating Users (Admin)

1. Navigate to "User Management" in the sidebar
2. Click "Create User"
3. Fill in username, password, email, and role
4. Click "Create"

### Editing Users (Admin)

1. Click the edit icon next to a user
2. Update email, role, or password
3. Click "Save Changes"

### Deactivating Users (Admin)

1. Click the status badge (Active/Inactive) to toggle
2. Deactivated users cannot log in
3. Their sessions are automatically invalidated

### Deleting Users (Admin)

1. Click the delete icon next to a user
2. Confirm deletion
3. User and all sessions are permanently removed

⚠️ **Note**: Admins cannot delete or deactivate their own account

## Troubleshooting

### Cannot Login
- Check username and password (case-sensitive)
- Verify account is active (check admin panel)
- Check server logs for errors

### Database Locked
- SQLite uses file locking
- Ensure only one process is accessing the database
- Check file permissions on `data/users.db`

### Session Expired
- Sessions expire after 24 hours
- User will need to login again
- Check server time is correct

### JWT_SECRET Not Set
- Application uses a default secret (INSECURE)
- Set `JWT_SECRET` environment variable
- Regenerate all user sessions after changing

## Audit Logs

View audit logs to track:
- Successful logins
- Failed login attempts
- User creation/deletion
- Password changes
- Administrative actions

Access via API (admin only):
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/api/users/audit/logs
```

## Backup and Restore

### Backup Database
```bash
# Docker
docker cp unifi-firewall-manager:/app/data/users.db ./backup/users.db

# Direct
cp /opt/unifi-firewall-manager/data/users.db ./backup/
```

### Restore Database
```bash
# Docker
docker cp ./backup/users.db unifi-firewall-manager:/app/data/users.db
docker-compose restart

# Direct
cp ./backup/users.db /opt/unifi-firewall-manager/data/
systemctl restart unifi-fw-manager
```

## Migration from No Auth

If you were running the app without authentication:

1. Stop the application
2. Deploy the new version with authentication
3. Start the application (creates default admin)
4. Login with admin/admin123
5. Change the password
6. Create additional users as needed

## Support

For issues related to authentication:
- Check server logs: `docker-compose logs` or `journalctl -u unifi-fw-manager`
- Verify database permissions
- Check JWT_SECRET is set
- Review audit logs for failed attempts

---

**Version**: 1.1.5  
**Last Updated**: 2024
