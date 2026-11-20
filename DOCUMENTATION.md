# Documentation Index

Complete list of all documentation files in the UniFi Firewall Manager repository.

## 📚 Main Documentation

| File | Description | Audience |
|------|-------------|----------|
| **[README.md](README.md)** | Project overview, features, quick start | Everyone |
| **[INSTALL.md](INSTALL.md)** | Complete installation guide for all methods | New users, administrators |
| **[CONTRIBUTING.md](CONTRIBUTING.md)** | Development guidelines and contribution process | Developers, contributors |
| **[CHANGELOG.md](CHANGELOG.md)** | Version history and release notes | Everyone |
| **[LICENSE](LICENSE)** | MIT license agreement | Everyone |
| **[DEPLOYMENT-SUMMARY.md](DEPLOYMENT-SUMMARY.md)** | Quick reference for deployment options | Administrators |

## 🚀 Deployment Documentation

| File | Description | Audience |
|------|-------------|----------|
| **[deploy/README.md](deploy/README.md)** | Deployment options overview and comparison | Administrators |
| **[deploy/LXC-DEPLOYMENT.md](deploy/LXC-DEPLOYMENT.md)** | Comprehensive Proxmox LXC deployment guide | Proxmox users |
| **[deploy/nginx.conf](deploy/nginx.conf)** | Nginx configuration for LXC/manual deployment | System administrators |
| **[deploy/nginx-docker.conf](deploy/nginx-docker.conf)** | Nginx configuration for Docker deployment | Docker users |

## 🛠️ Deployment Scripts

| File | Description | Usage |
|------|-------------|-------|
| **[deploy/proxmox-auto-deploy.sh](deploy/proxmox-auto-deploy.sh)** | Automated Proxmox LXC deployment | Run on Proxmox host |
| **[deploy/lxc-setup.sh](deploy/lxc-setup.sh)** | Manual LXC container setup | Run inside LXC container |

## 🐳 Docker Files

| File | Description | Purpose |
|------|-------------|---------|
| **[Dockerfile](Dockerfile)** | Multi-stage Docker build | Build Docker image |
| **[docker-compose.yml](docker-compose.yml)** | Docker Compose configuration | Easy Docker deployment |
| **[.dockerignore](.dockerignore)** | Docker build exclusions | Optimize Docker builds |

## 📖 Documentation by Use Case

### "I want to install the application"
1. Start with **[INSTALL.md](INSTALL.md)** - Complete installation guide
2. Choose your deployment method:
   - Proxmox LXC → [deploy/LXC-DEPLOYMENT.md](deploy/LXC-DEPLOYMENT.md)
   - Docker → [INSTALL.md#option-2-docker](INSTALL.md#option-2-docker)
   - Static hosting → [INSTALL.md#option-4-static-hosting](INSTALL.md#option-4-static-hosting)
   - Manual Linux → [INSTALL.md#option-3-manual-linux-installation](INSTALL.md#option-3-manual-linux-installation)

### "I want to understand the project"
1. **[README.md](README.md)** - Project overview and features
2. **[CHANGELOG.md](CHANGELOG.md)** - What's new and planned

### "I want to contribute code"
1. **[CONTRIBUTING.md](CONTRIBUTING.md)** - Development guidelines
2. **[README.md#development](README.md#-development)** - Quick setup

### "I want to deploy to Proxmox"
1. **[deploy/LXC-DEPLOYMENT.md](deploy/LXC-DEPLOYMENT.md)** - Comprehensive guide
2. **[deploy/proxmox-auto-deploy.sh](deploy/proxmox-auto-deploy.sh)** - Automated script

### "I want to deploy with Docker"
1. **[INSTALL.md#option-2-docker](INSTALL.md#option-2-docker)** - Docker installation
2. **[docker-compose.yml](docker-compose.yml)** - Compose configuration

### "I need help troubleshooting"
1. **[INSTALL.md#troubleshooting](INSTALL.md#troubleshooting)** - Common issues and solutions
2. **[deploy/LXC-DEPLOYMENT.md#troubleshooting](deploy/LXC-DEPLOYMENT.md#troubleshooting)** - LXC-specific issues

### "I want to understand Meraki ↔ UniFi mapping"
1. Use the **Concept Guide** in the application
2. **[README.md#-concept-mapping](README.md#-concept-mapping)** - Quick reference

## 📊 Documentation Statistics

- **Total documentation files**: 14
- **Main guides**: 6
- **Deployment guides**: 4
- **Configuration files**: 2
- **Scripts**: 2
- **Total words**: ~15,000+
- **Languages**: English

## 🔗 Quick Links

### Getting Started
- [Installation Guide](INSTALL.md)
- [Quick Start](README.md#-quick-start)
- [Demo Mode](README.md#option-1-demo-mode-no-setup-required)

### Deployment
- [All Deployment Options](deploy/README.md)
- [Proxmox LXC](deploy/LXC-DEPLOYMENT.md)
- [Docker](INSTALL.md#option-2-docker)

### Development
- [Contributing Guide](CONTRIBUTING.md)
- [Project Structure](CONTRIBUTING.md#project-structure)
- [Coding Standards](CONTRIBUTING.md#coding-standards)

### Support
- [Troubleshooting](INSTALL.md#troubleshooting)
- [Report Issues](CONTRIBUTING.md#reporting-issues)
- [Feature Requests](CONTRIBUTING.md#feature-requests)

## 📝 Documentation Maintenance

### Adding New Documentation
1. Create the file in the appropriate directory
2. Add it to this index
3. Update README.md if it's a major document
4. Cross-reference from related documents

### Updating Documentation
1. Keep information accurate and up-to-date
2. Test all commands and links
3. Update version numbers and dates
4. Review for clarity and completeness

### Documentation Standards
- Use clear, concise language
- Include code examples where applicable
- Provide step-by-step instructions
- Add troubleshooting sections
- Cross-reference related documents
- Keep formatting consistent

---

## 📞 Need Help?

1. **Check the documentation** - Most answers are here
2. **Search existing issues** - Someone may have had the same question
3. **Open a new issue** - We're happy to help
4. **Start a discussion** - For general questions

---

**Last Updated**: 2024  
**Documentation Version**: 1.0.0
