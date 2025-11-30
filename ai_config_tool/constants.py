"""Package-wide constants."""
from pathlib import Path

DEFAULT_REPO_URL = "https://github.com/xkcyy/ai-coder-extends.git"
SUPPORTED_DIRECTORIES = (".cursor", ".claude")
BACKUP_ROOT_NAME = ".ai-config-backup"
DEFAULT_TMP_PREFIX = "ai-config-sync-"
DEFAULT_REMOTE_DIR = "remote-config/ai"
DEFAULT_BRANCH = "main"
# Provide a default target path helper
DEFAULT_TARGET_PATH = Path.cwd()
