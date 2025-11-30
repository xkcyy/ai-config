import { promises as fs } from 'fs';
import { join, resolve } from 'path';
import { SupportedDirectory } from './constants';

/**
 * Format date to YYYYMMDD-HHmmss
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

/**
 * Create timestamped backup for provided directories
 */
export async function createBackup(
  targetPath: string,
  directories: SupportedDirectory[]
): Promise<string | null> {
  const timestamp = formatDate(new Date());

  const backupRoot = join(targetPath, '.ai-config-backup', timestamp);
  let copied = false;

  for (const directory of directories) {
    const srcPath = join(targetPath, directory);

    try {
      await fs.access(srcPath);
    } catch {
      // Directory doesn't exist, skip
      continue;
    }

    const destPath = join(backupRoot, directory);

    // Ensure destination parent directory exists
    await fs.mkdir(resolve(destPath, '..'), { recursive: true });

    // Copy directory recursively
    await copyDirectory(srcPath, destPath);
    copied = true;
  }

  if (!copied) {
    return null;
  }

  return backupRoot;
}

/**
 * Restore directories from backup snapshot
 */
export async function rollbackSnapshot(
  targetPath: string,
  timestamp: string,
  directories: SupportedDirectory[]
): Promise<string> {
  const backupRoot = join(targetPath, '.ai-config-backup', timestamp);

  try {
    await fs.access(backupRoot);
  } catch {
    throw new Error(`Backup snapshot ${timestamp} not found at ${backupRoot}`);
  }

  for (const directory of directories) {
    const srcPath = join(backupRoot, directory);
    const destPath = join(targetPath, directory);

    // Remove existing directory if it exists
    try {
      const stat = await fs.stat(destPath);
      if (stat.isDirectory()) {
        await fs.rm(destPath, { recursive: true, force: true });
      }
    } catch {
      // Directory doesn't exist, which is fine
    }

    // Restore from backup if it exists
    try {
      await fs.access(srcPath);
      await fs.mkdir(resolve(destPath, '..'), { recursive: true });
      await copyDirectory(srcPath, destPath);
    } catch {
      // Backup for this directory doesn't exist, skip
    }
  }

  return backupRoot;
}

/**
 * Copy directory recursively
 */
async function copyDirectory(src: string, dest: string): Promise<void> {
  await fs.mkdir(dest, { recursive: true });

  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}