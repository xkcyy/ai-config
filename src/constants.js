/**
 * Constants for the AI Config Tool
 */

// Supported IDE directories
module.exports.SUPPORTED_DIRECTORIES = new Set(['.claude', '.cursor', '.ai']);

// Default git branch
module.exports.DEFAULT_BRANCH = 'main';

// Default remote directory for configs
module.exports.DEFAULT_REMOTE_DIR = 'remote-config/ai';

// Default repository URL (replace with your actual repo URL)
module.exports.DEFAULT_REPO_URL = 'https://github.com/xkcyy/ai-config.git';

// Backup directory name
module.exports.BACKUP_DIR = '.ai-config-backup';
