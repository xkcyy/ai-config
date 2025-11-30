/**
 * Utility functions for the AI Config Tool
 */

import { existsSync, mkdirSync, rmSync, copyFileSync, readdirSync, statSync, promises as fs } from 'fs';
import { join, dirname, relative } from 'path';
import { createHash } from 'crypto';

/**
 * Check if a directory is empty
 * @param {string} dirPath - Directory path to check
 * @returns {boolean} True if directory is empty, false otherwise
 */
export function isDirectoryEmpty(dirPath) {
  try {
    const files = readdirSync(dirPath);
    return files.length === 0;
  } catch (error) {
    return false;
  }
}

/**
 * Create a directory if it doesn't exist
 * @param {string} dirPath - Directory path to create
 */
export function ensureDirectoryExists(dirPath) {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Copy a file from source to destination
 * @param {string} src - Source file path
 * @param {string} dest - Destination file path
 */
export function copyFile(src, dest) {
  ensureDirectoryExists(dirname(dest));
  copyFileSync(src, dest);
}

/**
 * Copy a directory recursively
 * @param {string} srcDir - Source directory path
 * @param {string} destDir - Destination directory path
 * @param {boolean} overwrite - Whether to overwrite existing files
 */
export function copyDirectory(srcDir, destDir, overwrite = true) {
  ensureDirectoryExists(destDir);
  
  const files = readdirSync(srcDir);
  for (const file of files) {
    const srcPath = join(srcDir, file);
    const destPath = join(destDir, file);
    
    const stat = statSync(srcPath);
    if (stat.isDirectory()) {
      copyDirectory(srcPath, destPath, overwrite);
    } else {
      if (overwrite || !existsSync(destPath)) {
        copyFile(srcPath, destPath);
      }
    }
  }
}

/**
 * Delete a directory recursively
 * @param {string} dirPath - Directory path to delete
 */
export function deleteDirectory(dirPath) {
  if (existsSync(dirPath)) {
    rmSync(dirPath, { recursive: true, force: true });
  }
}

/**
 * Get current timestamp as a string
 * @returns {string} Current timestamp in YYYY-MM-DD_HH-mm-ss format
 */
export function getTimestamp() {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-').slice(0, -5).replace('T', '_');
}

/**
 * Log a message if debug mode is enabled
 * @param {string} message - Message to log
 */
export function debugLog(message) {
  if (process.env.DEBUG) {
    console.debug(message);
  }
}

/**
 * Calculate SHA-256 hash of a file
 */
export async function hashFile(filePath) {
  const hash = createHash('sha256');
  const fileBuffer = await fs.readFile(filePath);
  hash.update(fileBuffer);
  return hash.digest('hex');
}

/**
 * Create a snapshot of directory with file hashes
 */
export async function snapshotDirectory(dirPath) {
  try {
    const stat = await fs.stat(dirPath);
    if (!stat.isDirectory()) {
      return {};
    }
  } catch {
    return {};
  }

  const snapshot = {};
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
export async function getAllFiles(dirPath) {
  const files = [];

  async function traverse(currentPath) {
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
export async function snapshotPathsOnly(dirPath) {
  const files = await getAllFiles(dirPath);
  return files
    .map(file => relative(dirPath, file))
    .sort();
}

/**
 * Normalize remote directory path
 */
export function normalizeRemoteDir(remoteDir) {
  return remoteDir.replace(/\\/g, '/').replace(/\/$/, '');
}
