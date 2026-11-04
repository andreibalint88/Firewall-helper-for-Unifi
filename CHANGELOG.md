# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024

### Added

#### Core Features
- **Dashboard** - Overview of firewall rules with statistics and Meraki comparisons
- **Firewall Rules Management** - Meraki-style rule list with drag-and-drop reordering
- **Rule Editor** - Full-featured modal for creating and editing firewall rules
- **Concept Guide** - Comprehensive Meraki ↔ UniFi concept mapping
- **Connection Setup** - Connect to real UniFi controllers with CORS guidance
- **Demo Mode** - Explore the interface with sample firewall rules

#### Meraki Integration
- Inline Meraki equivalent labels for every UniFi concept
- "Meraki Translation" preview for each rule
- Concept mapping table with 12+ detailed mappings
- Quick translation cheat sheet
- Key differences summary (actions, objects, defaults, stateful inspection)

#### Deployment
- **Proxmox LXC** - Automated deployment script with interactive setup
- **Docker** - Multi-stage build with minimal image size (~50MB)
- **Static Hosting** - Build and deploy to any web server
- **Manual Linux** - Step-by-step installation guide
- Optimized nginx configuration with security headers and caching

#### Documentation
- Comprehensive INSTALL.md with all installation methods
- Proxmox LXC deployment guide
- Docker deployment instructions
- Troubleshooting guide
- Contributing guidelines

#### Technical Features
- TypeScript for type safety
- Zustand for state management
- Tailwind CSS for styling
- Vite for fast builds
- Dark theme matching Meraki's dashboard aesthetic
- Responsive design
- Health check endpoints
- Gzip compression
- Security headers (XSS, CSP, etc.)

#### API Integration
- UniFi controller API client
- Authentication support (UniFi OS and legacy)
- CRUD operations for firewall rules
- Firewall groups management
- Network configuration retrieval
- CSRF token handling

#### UI/UX
- Sidebar navigation with connection status
- Expandable rule details
- Toggle enable/disable per rule
- Drag-and-drop rule reordering
- Delete confirmation dialogs
- Loading states and error handling
- Toast notifications (planned)

### Security
- Credentials stored in browser memory only (not persisted)
- HTTPS ready with Let's Encrypt instructions
- Security headers configured in nginx
- CORS configuration guidance
- Unprivileged LXC containers
- Docker runs as non-root user

### Performance
- Gzip compression enabled
- Static asset caching (1 year for immutable assets)
- Lazy loading for components
- Optimized bundle size
- Health check endpoints for monitoring

### Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- UniFi OS (UDM Pro, Cloud Key Gen2+)
- Legacy UniFi controllers
- IPv4 and IPv6 support (planned)

---

## [1.1.2] - 2024

### Changed
- **Simplified Proxmox LXC deployment**
  - Removed all interactive prompts except for root password
  - Uses sensible defaults for all settings (512MB RAM, 1 CPU, 2GB disk, DHCP)
  - Auto-detects next available Container ID
  - Streamlined deployment process - just run and enter password
  - Updated documentation to reflect simplified workflow

## [1.1.1] - 2024

### Fixed
- **Gateway configuration error** in Proxmox LXC deployment script
  - Fixed `Unknown option: gw` error when deploying with static IP
  - Gateway is now correctly included in `--net0` parameter instead of as a separate `--gw` option
  - Affects `deploy/proxmox-auto-deploy.sh`
  - See [BUGFIX-GATEWAY.md](BUGFIX-GATEWAY.md) for details

## [1.1.0] - 2024

### Added
- **Container ID auto-detection** in Proxmox LXC deployment script
  - Automatically finds next available CTID to avoid conflicts
  - Configurable search range (CTID_MIN/CTID_MAX)
  - Validates custom IDs before creating containers
  - See [CTID-AUTO-DETECTION.md](CTID-AUTO-DETECTION.md) for details

## [Unreleased]

### Planned Features
- [ ] IPv6 rule management
- [ ] Firewall group management UI
- [ ] Rule import/export (JSON, CSV)
- [ ] Bulk rule operations
- [ ] Rule templates for common scenarios
- [ ] Integration with UniFi OS SSO
- [ ] Mobile-responsive improvements
- [ ] Dark/Light theme toggle
- [ ] Rule conflict detection
- [ ] Rule usage analytics
- [ ] Backup/restore functionality
- [ ] Multi-site support
- [ ] WebSocket for real-time updates
- [ ] Rule versioning and rollback
- [ ] Audit log viewer
- [ ] Custom rule actions
- [ ] Advanced search and filtering
- [ ] Rule documentation/notes
- [ ] Integration with external syslog
- [ ] API rate limiting
- [ ] Two-factor authentication support

### Known Issues
- CORS must be manually enabled on UniFi controllers
- Some UniFi API endpoints may be read-only in certain versions
- Port forwarding is separate from firewall rules in UniFi
- Implicit allow rules cannot be viewed or edited

---

## Version History

### Versioning Scheme
- **Major** (X.0.0): Breaking changes, major new features
- **Minor** (0.X.0): New features, backwards compatible
- **Patch** (0.0.X): Bug fixes, minor improvements

### Release Process
1. Development in feature branches
2. Testing in development environment
3. Code review and approval
4. Merge to main branch
5. Build and tag release
6. Update documentation
7. Deploy to production

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to contribute to this project.

---

## Support

For questions, issues, or feature requests:
- Open a GitHub issue
- Check the documentation
- Review existing issues

---

**Last Updated**: 2024
