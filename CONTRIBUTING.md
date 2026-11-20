# Contributing to UniFi Firewall Manager

Thank you for your interest in contributing! This document provides guidelines and information for contributors.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Submitting Changes](#submitting-changes)
- [Reporting Issues](#reporting-issues)
- [Feature Requests](#feature-requests)

---

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/unifi-firewall-manager.git
   cd unifi-firewall-manager
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

---

## Development Setup

### Prerequisites
- Node.js 20+
- npm or yarn
- A code editor (VS Code recommended)
- Git

### Running Locally

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Type checking
npm run typecheck
```

### Development Server

The development server runs at `http://localhost:5173` with hot module replacement (HMR).

---

## Project Structure

```
unifi-firewall-manager/
├── deploy/                    # Deployment scripts and configs
│   ├── proxmox-auto-deploy.sh # Proxmox LXC auto-deploy
│   ├── lxc-setup.sh           # Manual LXC setup
│   ├── nginx.conf             # Nginx config for LXC
│   ├── nginx-docker.conf      # Nginx config for Docker
│   ├── LXC-DEPLOYMENT.md      # LXC deployment guide
│   └── README.md              # Deployment overview
├── src/
│   ├── components/            # React components
│   │   ├── Sidebar.tsx        # Navigation sidebar
│   │   ├── Dashboard.tsx      # Dashboard view
│   │   ├── FirewallRules.tsx  # Rules list view
│   │   ├── RuleEditor.tsx     # Rule create/edit modal
│   │   ├── ConceptGuide.tsx   # Concept mapping guide
│   │   └── ConnectionSetup.tsx # Controller connection
│   ├── utils/
│   │   ├── unifiApi.ts        # UniFi API client
│   │   └── conceptMapping.ts  # Meraki ↔ UniFi mappings
│   ├── types.ts               # TypeScript type definitions
│   ├── store.ts               # Zustand state management
│   ├── App.tsx                # Main application component
│   ├── main.tsx               # Application entry point
│   └── index.css              # Global styles
├── dist/                      # Build output
├── Dockerfile                 # Docker build file
├── docker-compose.yml         # Docker Compose config
├── INSTALL.md                 # Installation guide
├── README.md                  # Project documentation
└── package.json               # Dependencies and scripts
```

---

## Coding Standards

### TypeScript
- Use TypeScript for all new code
- Define proper types in `src/types.ts`
- Avoid `any` types when possible
- Use interfaces for object shapes

### React
- Use functional components with hooks
- Keep components focused and small
- Use Zustand for state management
- Follow the existing component patterns

### Styling
- Use Tailwind CSS utility classes
- Follow the dark theme color scheme:
  - Background: `#141824`
  - Cards: `#1e2436`
  - Borders: `#2a3040`
  - Text: White for primary, `text-gray-400` for secondary
- Use consistent spacing and sizing

### Code Quality
- Write clear, descriptive variable and function names
- Add comments for complex logic
- Keep functions small and focused
- Follow existing code patterns

---

## Submitting Changes

### Pull Request Process

1. **Ensure your code builds**:
   ```bash
   npm run build
   ```

2. **Test your changes**:
   - Test in Demo Mode
   - Test with a real UniFi controller if applicable
   - Verify no console errors

3. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

   **Commit message format:**
   - `feat:` New feature
   - `fix:` Bug fix
   - `docs:` Documentation changes
   - `style:` Formatting, no code change
   - `refactor:` Code refactoring
   - `test:` Adding tests
   - `chore:` Maintenance tasks

4. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Open a Pull Request** on GitHub:
   - Provide a clear description of changes
   - Reference any related issues
   - Include screenshots for UI changes

### Pull Request Checklist

- [ ] Code builds without errors (`npm run build`)
- [ ] No TypeScript errors
- [ ] Tested in Demo Mode
- [ ] Tested with real controller (if applicable)
- [ ] Documentation updated (if needed)
- [ ] Commit messages follow convention
- [ ] No console errors or warnings

---

## Reporting Issues

### Bug Reports

When reporting bugs, include:

1. **Environment**:
   - Deployment method (LXC, Docker, etc.)
   - Browser and version
   - UniFi controller version (if applicable)

2. **Steps to Reproduce**:
   - Clear, numbered steps
   - Expected behavior
   - Actual behavior

3. **Screenshots/Logs**:
   - Browser console errors
   - Screenshots of the issue
   - Network tab errors (if API-related)

4. **Additional Context**:
   - Any relevant configuration
   - Workarounds you've tried

### Issue Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- Deployment: [e.g., Proxmox LXC, Docker]
- Browser: [e.g., Chrome 120]
- UniFi Controller: [e.g., UDM Pro 3.1.16]

**Additional context**
Add any other context about the problem.
```

---

## Feature Requests

### Before Requesting

1. Check existing issues to avoid duplicates
2. Consider if the feature aligns with the project's goals
3. Think about implementation complexity

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Any alternative solutions or features you've considered.

**Additional context**
Add any other context, mockups, or screenshots about the feature.
```

---

## Development Tips

### Adding a New Component

1. Create the component in `src/components/`
2. Define TypeScript interfaces in `src/types.ts`
3. Add state to the store if needed (`src/store.ts`)
4. Import and use in `App.tsx`

### Adding a New API Endpoint

1. Add the method to `UniFiApi` class in `src/utils/unifiApi.ts`
2. Add demo data if applicable
3. Update types in `src/types.ts`
4. Add error handling

### Adding Meraki Concept Mapping

1. Add mapping to `conceptMappings` array in `src/utils/conceptMapping.ts`
2. Include clear descriptions and notes
3. Test in the Concept Guide view

### Testing with Real Controller

1. Enable CORS on your UniFi controller
2. Use the Connection tab to connect
3. Test CRUD operations on rules
4. Verify changes persist

---

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what's best for the community
- Accept constructive criticism
- Acknowledge mistakes and learn from them

---

## Questions?

- Open a GitHub Discussion
- Check existing documentation
- Review closed issues for similar questions

---

**Thank you for contributing to UniFi Firewall Manager!** 🎉
