# Deployment Guide

This directory contains everything you need to deploy the UniFi Firewall Manager in various environments.

## Deployment Options

### 1. Proxmox LXC (Recommended for Home Lab)

**Best for**: Home labs, small businesses, Proxmox users

**Files**:
- `proxmox-auto-deploy.sh` - Automated deployment script (run on Proxmox host)
- `lxc-setup.sh` - Manual setup script (run inside LXC container)
- `nginx.conf` - Optimized nginx configuration
- `LXC-DEPLOYMENT.md` - Comprehensive deployment guide

**Quick Start**:
```bash
# On Proxmox host
chmod +x deploy/proxmox-auto-deploy.sh
./deploy/proxmox-auto-deploy.sh
```

**Resources**: 512MB RAM, 1 CPU core, 2GB disk

---

### 2. Docker (Universal)

**Best for**: Any environment with Docker, easy updates, portability

**Files**:
- `Dockerfile` (in project root) - Multi-stage build for minimal image
- `docker-compose.yml` (in project root) - Easy deployment
- `nginx-docker.conf` - Nginx config for Docker

**Quick Start**:
```bash
# Build and run
docker-compose up -d

# Or manually
docker build -t unifi-firewall-manager .
docker run -d -p 80:80 --name unifi-fw-mgr unifi-firewall-manager
```

**Resources**: ~100MB RAM, minimal CPU

---

### 3. Static Hosting (Simplest)

**Best for**: Quick deployment, existing web servers, shared hosting

**Files**:
- Build the project: `npm run build`
- Upload `dist/` folder contents to any web server

**Options**:
- Netlify: Drag & drop `dist/` folder
- Vercel: `vercel deploy`
- GitHub Pages: Push to gh-pages branch
- Any web server: Copy `dist/` to web root

**Resources**: Depends on hosting provider

---

### 4. Traditional VPS/Server

**Best for**: Existing Linux servers, full control

**Steps**:
```bash
# Install Node.js and nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs nginx

# Build and deploy
npm install
npm run build
cp -r dist/* /var/www/html/

# Configure nginx (use deploy/nginx.conf as reference)
```

---

## File Reference

| File | Purpose |
|------|---------|
| `proxmox-auto-deploy.sh` | Automated Proxmox LXC deployment (run on host) |
| `lxc-setup.sh` | Manual LXC setup (run inside container) |
| `nginx.conf` | Nginx config for LXC/traditional deployment |
| `nginx-docker.conf` | Nginx config for Docker deployment |
| `LXC-DEPLOYMENT.md` | Comprehensive LXC deployment guide |

---

## Comparison Table

| Feature | Proxmox LXC | Docker | Static Hosting | VPS |
|---------|-------------|--------|----------------|-----|
| Setup Complexity | Medium | Easy | Very Easy | Medium |
| Resource Usage | Low | Low | N/A | Low |
| Isolation | Good | Excellent | N/A | Good |
| Updates | Manual | Easy | Easy | Manual |
| Portability | Proxmox only | Any Docker host | Any web server | Any Linux |
| HTTPS Setup | Manual | Manual | Automatic (Netlify) | Manual |
| Backup | Proxmox tools | Docker volumes | Git/FTP | Manual |

---

## Security Recommendations

### All Deployments
1. **Use HTTPS** - Especially if accessing from outside your network
2. **Restrict Access** - Use firewall rules to limit access to your network
3. **Regular Updates** - Keep Node.js, nginx, and system packages updated
4. **Monitor Logs** - Check nginx access/error logs regularly

### Proxmox LXC Specific
- Use Proxmox firewall to restrict container access
- Enable nesting only if needed
- Use unprivileged containers
- Regular snapshots for backup

### Docker Specific
- Run as non-root user (already configured)
- Use Docker secrets for sensitive data
- Regular image updates
- Network isolation

---

## Troubleshooting

### Common Issues

**Can't access the application**:
- Check if the service is running: `systemctl status nginx` or `docker ps`
- Check firewall rules: `ufw status` or `iptables -L`
- Check logs: `journalctl -u nginx` or `docker logs <container>`

**Can't connect to UniFi controller**:
- Verify CORS is enabled on the controller
- Check network connectivity from the container
- Review browser console for errors
- Try Demo Mode first

**Performance issues**:
- Increase container resources (RAM/CPU)
- Enable gzip compression (already configured)
- Use a CDN for static assets
- Check for resource limits in Proxmox/Docker

---

## Support

- **Proxmox LXC**: See `LXC-DEPLOYMENT.md` for detailed guide
- **Docker**: Check Docker logs with `docker logs <container>`
- **General**: Check browser console and nginx logs

---

## License

See the main project README.md for license information.
