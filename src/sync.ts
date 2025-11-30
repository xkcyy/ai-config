import { promises as fs } from 'fs';
import { join, resolve } from 'path';
import { tmpdir } from 'os';
import { mkdtemp } from 'fs/promises';
import simpleGit from 'simple-git';

import { DEFAULT_BRANCH, DEFAULT_REMOTE_DIR, DEFAULT_REPO_URL, SUPPORTED_DIRECTORIES } from './constants';
import { createBackup } from './backup';
import { cloneRepo, hasUncommittedChanges } from './git-utils';
import { normalizeRemoteDir, snapshotDirectory, snapshotPathsOnly } from './utils';
import { DirectoryPlan, SyncOptions } from './types';

/**
 * Build sync plan for directories
 */
async function buildPlan(sourceRoot: string, target: string): Promise<DirectoryPlan[]> {
  const plans: DirectoryPlan[] = [];

  for (const directory of SUPPORTED_DIRECTORIES) {
    const src = join(sourceRoot, directory);
    const dest = join(target, directory);

    try {
      const srcExists = await fs.access(src).then(() => true).catch(() => false);
      const destExists = await fs.access(dest).then(() => true).catch(() => false);

      if (srcExists) {
        const srcSnapshot = await snapshotDirectory(src);
        const destSnapshot = destExists ? await snapshotDirectory(dest) : {};

        const srcFiles = new Set(Object.keys(srcSnapshot));
        const destFiles = new Set(Object.keys(destSnapshot));

        const added = Array.from(srcFiles).filter(file => !destFiles.has(file)).sort();
        const removed = Array.from(destFiles).filter(file => !srcFiles.has(file)).sort();
        const modified = Array.from(srcFiles)
          .filter(file => destFiles.has(file) && srcSnapshot[file] !== destSnapshot[file])
          .sort();

        plans.push({
          name: directory,
          source: src,
          destination: dest,
          added,
          modified,
          removed
        });
      } else {
        const removed = destExists ? await snapshotPathsOnly(dest) : [];
        plans.push({
          name: directory,
          source: undefined,
          destination: dest,
          added: [],
          modified: [],
          removed
        });
      }
    } catch (error) {
      console.warn(`Error processing directory ${directory}:`, error);
    }
  }

  return plans;
}

/**
 * Check if a directory plan needs changes
 */
async function planNeedsChange(plan: DirectoryPlan): Promise<boolean> {
  if (!plan.source) {
    return plan.removed.length > 0;
  }

  try {
    await fs.access(plan.destination);
    return plan.added.length > 0 || plan.modified.length > 0 || plan.removed.length > 0;
  } catch {
    // Destination doesn't exist, will be created
    return plan.added.length > 0 || plan.modified.length > 0;
  }
}

/**
 * Describe the sync plan for logging
 */
export function describePlan(plan: DirectoryPlan): void {
  if (!plan.source) {
    if (plan.removed.length > 0) {
      console.log(`Directory ${plan.name} missing in remote. ${plan.removed.length} files would be removed.`);
    } else {
      console.log(`Directory ${plan.name} absent both locally and remotely.`);
    }
    return;
  }

  const needsChange = plan.added.length > 0 || plan.modified.length > 0 || plan.removed.length > 0;

  if (!needsChange) {
    console.log(`Directory ${plan.name} already up to date.`);
    return;
  }

  console.log(`Directory ${plan.name} changes -> add:${plan.added.length} modify:${plan.modified.length} remove:${plan.removed.length}`);
}

/**
 * Apply the sync plan
 */
async function applyPlan(plans: DirectoryPlan[], dryRun: boolean): Promise<void> {
  if (dryRun) {
    return;
  }

  for (const plan of plans) {
    const needsChange = plan.added.length > 0 || plan.modified.length > 0 || plan.removed.length > 0;

    if (!needsChange) {
      continue;
    }

    if (!plan.source) {
      // Remove directory if it exists
      try {
        await fs.access(plan.destination);
        await fs.rm(plan.destination, { recursive: true, force: true });
        console.log(`Removed directory ${plan.destination}`);
      } catch {
        // Directory doesn't exist, nothing to do
      }
      continue;
    }

    // Remove existing destination and copy from source
    try {
      await fs.access(plan.destination);
      await fs.rm(plan.destination, { recursive: true, force: true });
    } catch {
      // Destination doesn't exist, that's fine
    }

    // Ensure parent directory exists
    await fs.mkdir(resolve(plan.destination, '..'), { recursive: true });

    // Copy entire directory
    await copyDirectoryRecursive(plan.source, plan.destination);
    console.log(`Copied ${plan.source} to ${plan.destination}`);
  }
}

/**
 * Copy directory recursively
 */
async function copyDirectoryRecursive(src: string, dest: string): Promise<void> {
  await fs.mkdir(dest, { recursive: true });

  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDirectoryRecursive(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

/**
 * Main sync function
 */
export async function runSync(options: SyncOptions): Promise<void> {
  const {
    target = process.cwd(),
    repoUrl = DEFAULT_REPO_URL,
    ref,
    dryRun = false,
    force = false,
    remoteDir = DEFAULT_REMOTE_DIR,
    branch = DEFAULT_BRANCH
  } = options;

  const targetPath = resolve(target);

  // Check if target exists
  try {
    await fs.access(targetPath);
  } catch {
    throw new Error(`Target path ${targetPath} does not exist`);
  }

  // Check for uncommitted changes unless force is true
  if (!force) {
    const hasChanges = await hasUncommittedChanges(targetPath, Array.from(SUPPORTED_DIRECTORIES));
    if (hasChanges) {
      throw new Error(
        'Local changes detected in .cursor/.claude. Commit or stash, or rerun with --force.'
      );
    }
  }

  const remoteDirPath = normalizeRemoteDir(remoteDir);

  // Create temporary directory
  const tempDir = await mkdtemp(join(tmpdir(), 'ai-config-sync-'));

  try {
    console.log(`Fetching configuration from ${repoUrl} (${branch} -> ${remoteDirPath})`);

    // Clone the repository
    const repoPath = join(tempDir, 'repo');
    await cloneRepo({
      repoUrl,
      destination: repoPath,
      branch,
      ref,
      depth: 1
    });

    const sourceRoot = join(repoPath, remoteDirPath);

    // Check if remote directory exists
    try {
      await fs.access(sourceRoot);
    } catch {
      throw new Error(
        `Remote directory '${remoteDirPath}' not found in repository. Use 'ai-config push' to initialize it first.`
      );
    }

    // Build and analyze plans
    const plans = await buildPlan(sourceRoot, targetPath);

    // Describe what will happen
    for (const plan of plans) {
      describePlan(plan);
    }

    // Check if any changes are needed
    const hasAnyChanges = plans.some(plan =>
      plan.added.length > 0 || plan.modified.length > 0 || plan.removed.length > 0
    );

    if (!hasAnyChanges) {
      console.log('No changes detected. You\'re already up to date.');
      return;
    }

    if (dryRun) {
      console.log('Dry run complete. No files were changed.');
      return;
    }

    // Create backup before applying changes
    const backupPath = await createBackup(targetPath, Array.from(SUPPORTED_DIRECTORIES));
    if (backupPath) {
      console.log(`Created backup at ${backupPath}`);
    }

    // Apply the plan
    await applyPlan(plans, false);
    console.log('Synchronization completed successfully.');

  } finally {
    // Clean up temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.warn(`Failed to clean up temporary directory: ${error}`);
    }
  }
}