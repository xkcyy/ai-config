/**
 * Git utilities for the AI Config Tool
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join, resolve, relative as pathRelative } from 'path';
import simpleGit from 'simple-git';

/**
 * Run git command and return result
 */
export async function runGit(args, cwd) {
  const git = simpleGit(cwd);

  try {
    const result = await git.raw(args);
    return { stdout: result || '', stderr: '' };
  } catch (error) {
    throw new Error(error.message || `Git command failed: ${args.join(' ')}`);
  }
}

/**
 * Clone a repository with options
 */
export async function cloneRepo(options) {
  const { repoUrl, destination, branch, ref, depth } = options;

  // Ensure parent directory exists
  const parentDir = resolve(destination, '..');
  if (!existsSync(parentDir)) {
    mkdirSync(parentDir, { recursive: true });
  }

  const git = simpleGit();

  try {
    const cloneArgs = [];

    if (depth) {
      cloneArgs.push(`--depth=${depth}`);
    }

    if (branch) {
      cloneArgs.push('--branch', branch, '--single-branch');
    }

    await git.clone(repoUrl, destination, cloneArgs);

    // If we need to checkout a specific ref that's different from branch
    if (ref && ref !== branch) {
      const repoGit = simpleGit(destination);
      await repoGit.checkout(ref);
    }
  } catch (error) {
    // If shallow clone failed, retry with full clone
    if (depth) {
      console.warn(`Shallow clone failed for ${repoUrl}, retrying full clone.`);
      await cloneRepo({
        ...options,
        depth: undefined
      });
      return;
    }
    throw new Error(error.message || `Failed to clone ${repoUrl}`);
  }
}

/**
 * Get git repository root for a path
 */
export async function getRepoRoot(path) {
  try {
    const git = simpleGit(path);
    const result = await git.revparse(['--show-toplevel']);
    return result.trim() || null;
  } catch {
    return null;
  }
}

/**
 * Check if directories have uncommitted changes
 */
export async function hasUncommittedChanges(
  targetPath,
  directories
) {
  const repoRoot = await getRepoRoot(targetPath);
  if (!repoRoot) {
    return false;
  }

  const git = simpleGit(repoRoot);
  const relPaths = [];

  for (const directory of directories) {
    const dirPath = resolve(targetPath, directory);

    if (existsSync(dirPath)) {
      try {
        const relPath = pathRelative(repoRoot, dirPath);
        relPaths.push(relPath);
      } catch {
        // Directory is not inside the git repo, skip
        continue;
      }
    }
  }

  if (relPaths.length === 0) {
    return false;
  }

  try {
    const status = await git.status(relPaths);
    return status.files.length > 0;
  } catch {
    return false;
  }
}

/**
 * Get relative path from base to target
 */
function relative(target, base) {
  const targetAbs = resolve(target);
  const baseAbs = resolve(base);

  if (targetAbs.startsWith(baseAbs)) {
    return targetAbs.slice(baseAbs.length).replace(/^[\/\\]/, '');
  }

  return targetAbs;
}
