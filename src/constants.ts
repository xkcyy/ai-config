import { join } from 'path';

export const DEFAULT_REPO_URL = 'https://gitee.com/xkcyy/ai-config.git';
export const SUPPORTED_DIRECTORIES = ['.cursor', '.claude'] as const;
export const BACKUP_ROOT_NAME = '.ai-config-backup';
export const DEFAULT_TMP_PREFIX = 'ai-config-sync-';
export const DEFAULT_REMOTE_DIR = 'remote-config/ai';
export const DEFAULT_BRANCH = 'master';
export const DEFAULT_TARGET_PATH = process.cwd();

export type SupportedDirectory = typeof SUPPORTED_DIRECTORIES[number];