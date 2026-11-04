# UniFi Firewall Manager - Meraki Style

A web-based tool that helps experienced Meraki users understand and manage UniFi firewall rules by presenting them in a familiar Meraki-style interface.

![UniFi Firewall Manager](https://img.shields.io/badge/UniFi-Firewall_Manager-blue)
![Meraki Style](https://img.shields.io/badge/Meraki-Style_Interface-green)
![Proxmox Ready](https://img.shields.io/badge/Proxmox-LXC_Ready-orange)

## 🎯 Purpose

If you're experienced with Meraki firewalls and need to manage UniFi networks, this tool helps you:

- **Understand UniFi firewall rules** by showing Meraki equivalents
- **Manage rules visually** with drag-and-drop reordering
- **Learn the differences** between Meraki and UniFi concepts
- **Connect to real controllers** or explore with demo data

## ✨ Features

### 📊 Dashboard
- Overview of all firewall rules with statistics
- Network/VLAN visualization
- Firewall groups overview
- Meraki comparison notes on every element

### 🔥 Firewall Rules Management
- Meraki-style rule list with drag-and-drop reordering
- Enable/disable rules with one click
- Expandable details showing source/destination
- "Meraki Translation" preview for each rule
- Create, edit, and delete rules

### 📚 Concept Guide
- Comprehensive Meraki ↔ UniFi mapping
- Searchable concept reference
- Quick translation cheat sheet
- Important gotchas for Meraki users

### 🔌 Controller Connection
- Connect to real UniFi controllers
- Demo mode with sample data
- CORS configuration guidance
- Secure credential handling

## 🚀 Quick Start

### Option 1: Demo Mode (No Setup Required)

1. Open the application in your browser
2. Start exploring with sample firewall rules
3. Learn how UniFi concepts map to Meraki

### Option 2: Connect to Real Controller

1. Enable CORS on your UniFi controller (see [CORS Setup](#cors-setup))
2. Open the application
3. Go to **Connection** tab
4. Enter your controller URL, username, and password
5. Click **Connect**

## 🏗️ Deployment

### Proxmox LXC (Recommended)

The easiest way to deploy in a home lab environment:

```bash
# On your Proxmox host
chmod +x deploy/proxmox-auto-deploy.sh
./deploy/proxmox-auto-deploy.sh
```

**Resources**: 512MB RAM, 1 CPU core, 2GB disk

See [deploy/LXC-DEPLOYMENT.md](deploy/LXC-DEPLOYMENT.md) for detailed instructions.

### Docker

```bash
# Build and run
docker-compose up -d

# Access at http://localhost
```

### Static Hosting

```bash
# Build
npm install
npm run build

# Upload dist/ folder to any web server
# Or use Netlify, Vercel, GitHub Pages, etc.
```

See [deploy/README.md](deploy/README.md) for all deployment options.

## 🔧 Development

### Prerequisites
- Node.js 20+
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Tech Stack
- React 18
- TypeScript
- Tailwind CSS
- Zustand (state management)
- Vite (build tool)

## 🔐 CORS Setup

To connect to a real UniFi controller, you need to enable CORS:

### UDM Pro / Cloud Key Gen2+

```bash
# SSH into your UDM Pro
ssh root@192.168.1.1

# Edit nginx config
vi /mnt/data/unifi-os/nginx/drop-in/unifi.conf

# Add these lines in the server block:
add_header 'Access-Control-Allow-Origin' '*' always;
add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
add_header 'Access-Control-Allow-Headers' 'X-CSRF-Token, Content-Type' always;
add_header 'Access-Control-Allow-Credentials' 'true' always;

# Restart nginx
systemctl restart unifi-core
```

### Alternative: Browser Extension (Testing Only)

Install "CORS Unblock" Chrome extension for quick testing (not recommended for production).

## 📖 Concept Mapping

### Key Differences

| Meraki | UniFi | Notes |
|--------|-------|-------|
| Allow | Accept | Same function |
| Deny | Drop / Reject | Drop is silent, Reject sends response |
| L3 Firewall Rules | Firewall Rules | Same concept, different UI |
| Named Objects | Firewall Groups | UniFi groups are reusable |
| Automatic stateful | Explicit state matching | UniFi: new/established/related |
| Single rule list | Separate WAN/LAN rules | UniFi separates by direction |

### Quick Translation

**Meraki**: "Allow port 443 from internet"  
**UniFi**: Create WAN In rule: Accept, TCP, Port 443, dest = your server

**Meraki**: "Block this IP"  
**UniFi**: Create rule: Drop, All protocols, source = that IP, any destination

**Meraki**: "Allow VLAN A to VLAN B"  
**UniFi**: Create LAN rule: Accept, All, source = VLAN A, dest = VLAN B

See the **Concept Guide** in the app for complete mapping.

## ⚠️ Important Notes

1. **Implicit Rules**: UniFi has implicit allow rules for LAN→Internet that you can't see
2. **Port Forwarding**: Separate feature in UniFi (not part of firewall rules)
3. **Traffic Rules vs Firewall Rules**: Newer UniFi UI has both - they're different
4. **Rule Order**: Critical - first match wins, just like Meraki
5. **Firewall Groups**: Create reusable objects (Address, Port, Network groups)

## 🔒 Security

- Credentials are stored in browser memory only (not persisted)
- Use HTTPS for production deployments
- Restrict access to your local network
- Don't expose publicly without authentication
- Regular security updates recommended

## 🐛 Troubleshooting

### Can't Connect to Controller
- Verify CORS is enabled
- Check controller URL format (include `https://`)
- Verify credentials
- Check browser console for errors

### Rules Not Loading
- Ensure correct site name (usually "default")
- Check user has admin permissions
- Verify API endpoints are accessible

### Can't Edit Rules
- Some UniFi versions have read-only API
- Check user has write permissions
- Demo Mode always allows editing (but doesn't save to controller)

## 📝 Roadmap

- [ ] IPv6 rule support
- [ ] Firewall group management UI
- [ ] Rule import/export
- [ ] Bulk rule operations
- [ ] Rule templates
- [ ] Integration with UniFi OS SSO
- [ ] Mobile-responsive improvements
- [ ] Dark/Light theme toggle

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Built for network administrators transitioning from Meraki to UniFi
- Inspired by the need for better UniFi documentation
- Thanks to the UniFi community for API documentation

## 📞 Support

- **Documentation**: See [deploy/LXC-DEPLOYMENT.md](deploy/LXC-DEPLOYMENT.md)
- **Issues**: Open a GitHub issue
- **Discussions**: Use GitHub Discussions

---

**Made with ❤️ for network administrators**

*This tool is not affiliated with Ubiquiti Inc. or Cisco Meraki. UniFi and Meraki are trademarks of their respective owners.*
