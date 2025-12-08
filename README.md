# ai-config

## AI Configuration Sync Tool (Node.js + TypeScript)

`ai-config` is a command-line tool based on Node.js and TypeScript for synchronizing local `.cursor`, `.claude`, `.ai`, `.trae` and `.specify` configuration directories with remote Git repositories.

### Features

- **Sync**: Pull latest Claude/Code Cursor configurations from remote repository to current project
- **Push**: Commit and push current project configurations to remote repository
- **Rollback**: Restore local configurations from backup timestamps
- **Cross-platform**: Compatible with Windows, macOS, Linux (requires Node.js >= 16.0.0)

### Quick Start

#### Windows (PowerShell/CMD)
```powershell
# View help
ai-config --help

# Preview sync differences (dry run)
ai-config sync --dry-run

# Push local configurations to remote repository
ai-config push --message "chore: sync configurations"
```

#### Linux/macOS
```bash
# View help
ai-config --help

# Sync remote configurations to local
ai-config sync

# Push local configurations to remote
ai-config push --message "chore: sync configurations"
```

### Installation

#### Recommended: npm Global Install
```bash
# Install from npm
npm install -g ai-config

# Or install directly from GitHub
npm install -g https://github.com/xkcyy/ai-config.git
```

#### Development: Local Install
```bash
# Clone repository
git clone https://github.com/xkcyy/ai-config.git
cd ai-config

# Install dependencies
npm install

# Build project
npm run build

# Global install
npm install -g .
```

### Common Commands

```bash
# Sync configuration (dry run mode)
ai-config sync --dry-run --verbose

# Specify remote repository, branch, and directory
ai-config sync --repo https://github.com/xkcyy/ai-config.git \
                --branch main \
                --remote-dir remote-config/ai

# Force sync (ignore local uncommitted changes)
ai-config sync --force

# Push to specific branch and directory
ai-config push --remote-dir remote-config/ai --branch main

# Custom commit message
ai-config push --message "feat: update claude settings"

# Rollback to specific backup timestamp
ai-config rollback 20251130-103000
```

### Workflow

- **Default Remote**: GitHub repository `https://github.com/xkcyy/ai-config.git` `remote-config/ai/` directory
- **Sync Process**:
  1. Clone remote repository specified branch
  2. Read remote `remote-config/ai/.cursor/.claude/.ai/.trae/.specify` configurations
  3. Calculate differences with local configurations
  4. Support dry run mode to preview changes
  5. Automatically backup local configurations
  6. Overwrite local configurations with remote ones
- **Push Process**:
  1. Clone remote repository
  2. Completely overwrite `remote-config/ai/` with local `.cursor/.claude/.ai/.trae/.specify`
  3. Auto-execute git commit and git push when changes detected
  4. Need configured local Git user.name and user.email
- **Backup & Rollback**: Backup local configurations to `.ai-config-backup/<timestamp>/` before each sync/push

### Parameters

- `--repo`: Remote repository URL (default points to GitHub main repository)
- `--branch`: Remote branch for sync/push, default `main`
- `--remote-dir`: Configuration directory in remote repository, default `remote-config/ai`
- `--target`: Local project root directory, default current directory
- `--message`: Commit message when pushing
- `--dry-run`: Preview mode, no actual execution
- `--force`: Force execution, ignore local uncommitted changes
- `--verbose`: Show detailed output

### Requirements

- Node.js >= 16.0.0
- npm >= 8.0.0
- Git >= 2.30

### Development

```bash
# Install development dependencies
npm install

# Development mode run
npm run dev

# Build
npm run build

# Test
npm test
```

### License

MIT License

### Contributing

Welcome to submit Pull Requests and Issues!