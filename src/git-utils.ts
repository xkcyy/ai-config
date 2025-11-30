import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join, resolve, relative as pathRelative } from 'path';
import { promisify } from 'util';
import simpleGit, { SimpleGit } from 'simple-git';

const exec = promisify(execSync);

export interface GitResult {
  stdout: string;
  stderr: string;
}

/**
 * Run git command and return result
 */
export async function runGit(args: string[], cwd?: string): Promise<GitResult> {
  const git = simpleGit(cwd);

  try {
    const result = await git.raw(args);
    return { stdout: result || '', stderr: '' };
  } catch (error: any) {
    throw new Error(error.message || `Git command failed: ${args.join(' ')}`);
  }
}

/**
 * Clone a repository with options
 */
export async function cloneRepo(options: {
  repoUrl: string;
  destination: string;
  branch?: string;
  ref?: string;
  depth?: number;
}): Promise<void> {
  const { repoUrl, destination, branch, ref, depth } = options;

  // Ensure parent directory exists
  const parentDir = resolve(destination, '..');
  if (!existsSync(parentDir)) {
    await promisify(exec)(`mkdir -p "${parentDir}"`);
  }

  const git = simpleGit();

  try {
    const cloneArgs: string[] = [];

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
  } catch (error: any) {
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
export async function getRepoRoot(path: string): Promise<string | null> {
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
  targetPath: string,
  directories: string[]
): Promise<boolean> {
  const repoRoot = await getRepoRoot(targetPath);
  if (!repoRoot) {
    return false;
  }

  const git = simpleGit(repoRoot);
  const relPaths: string[] = [];

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
function relative(target: string, base: string): string {
  const targetAbs = resolve(target);
  const baseAbs = resolve(base);

  if (targetAbs.startsWith(baseAbs)) {
    return targetAbs.slice(baseAbs.length).replace(/^[\/\\]/, '');
  }

  return targetAbs;
}