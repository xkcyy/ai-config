import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import { join, relative } from 'path';

/**
 * Calculate SHA-256 hash of a file
 */
export async function hashFile(filePath: string): Promise<string> {
  const hash = createHash('sha256');
  const fileBuffer = await fs.readFile(filePath);
  hash.update(fileBuffer);
  return hash.digest('hex');
}

/**
 * Create a snapshot of directory with file hashes
 */
export async function snapshotDirectory(dirPath: string): Promise<Record<string, string>> {
  try {
    const stat = await fs.stat(dirPath);
    if (!stat.isDirectory()) {
      return {};
    }
  } catch {
    return {};
  }

  const snapshot: Record<string, string> = {};
  const files = await getAllFiles(dirPath);

  for (const file of files) {
    const relativePath = relative(dirPath, file);
    const fileHash = await hashFile(file);
    snapshot[relativePath] = fileHash;
  }

  return snapshot;
}

/**
 * Get list of all files in directory recursively
 */
export async function getAllFiles(dirPath: string): Promise<string[]> {
  const files: string[] = [];

  async function traverse(currentPath: string): Promise<void> {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(currentPath, entry.name);

      if (entry.isFile()) {
        files.push(fullPath);
      } else if (entry.isDirectory() && !entry.name.startsWith('.')) {
        await traverse(fullPath);
      }
    }
  }

  await traverse(dirPath);
  return files;
}

/**
 * Get relative paths of all files in directory
 */
export async function snapshotPathsOnly(dirPath: string): Promise<string[]> {
  const files = await getAllFiles(dirPath);
  return files
    .map(file => relative(dirPath, file))
    .sort();
}

/**
 * Normalize remote directory path
 */
export function normalizeRemoteDir(remoteDir: string): string {
  return remoteDir.replace(/\\/g, '/').replace(/\/$/, '');
}