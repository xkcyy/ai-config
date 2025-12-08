const { promises: fs } = require('fs');
const { join, resolve } = require('path');
const { tmpdir } = require('os');
const { mkdtemp } = require('fs/promises');
const simpleGit = require('simple-git');

const { DEFAULT_BRANCH, DEFAULT_REMOTE_DIR, DEFAULT_REPO_URL, SUPPORTED_DIRECTORIES } = require('./constants');
const { cloneRepo } = require('./git-utils');
const { normalizeRemoteDir } = require('./utils');

/**
 * Get existing local directories
 */
async function getExistingLocalDirs(target) {
  const existing = [];

  for (const directory of SUPPORTED_DIRECTORIES) {
    const path = join(target, directory);
    try {
      await fs.access(path);
      existing.push(path);
    } catch {
      // Directory doesn't exist
    }
  }

  return existing;
}

/**
 * Copy directories to remote location
 */
async function copyDirectories(
  sourceRoot,
  destRoot,
  directories
) {
  // Remove existing destination root
  try {
    await fs.access(destRoot);
    await fs.rm(destRoot, { recursive: true, force: true });
  } catch {
    // Destination doesn't exist
  }

  // Create destination root
  await fs.mkdir(destRoot, { recursive: true });

  for (const directory of directories) {
    const src = join(sourceRoot, directory);
    const dest = join(destRoot, directory);

    try {
      await fs.access(src);
      await copyDirectoryRecursive(src, dest);
    } catch {
      // Source directory doesn't exist, skip
    }
  }
}

/**
 * Copy directory recursively
 */
async function copyDirectoryRecursive(src, dest) {
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
 * Main push function
 */
exports.runPush = async function runPush(options) {
  const {
    target = process.cwd(),
    repoUrl = DEFAULT_REPO_URL,
    branch = DEFAULT_BRANCH,
    remoteDir = DEFAULT_REMOTE_DIR,
    commitMessage = 'chore: sync ai IDE config'
  } = options;

  const targetPath = resolve(target);

  // Check if target exists
  try {
    await fs.access(targetPath);
  } catch {
    throw new Error(`Target path ${targetPath} does not exist`);
  }

  // Check if there are local directories to push
  const localDirs = await getExistingLocalDirs(targetPath);
  if (localDirs.length === 0) {
    throw new Error('No local .cursor/.claude/.ai/.trae/.specify directories found. Nothing to push.');
  }

  const remoteDirPath = normalizeRemoteDir(remoteDir);

  // Create temporary directory
  const tempDir = await mkdtemp(join(tmpdir(), 'ai-config-push-'));

  try {
    console.log(`Cloning ${repoUrl} (branch ${branch}) to prepare push into ${remoteDirPath}`);

    // Clone the repository
    const repoPath = join(tempDir, 'repo');
    await cloneRepo({
      repoUrl,
      destination: repoPath,
      branch,
      depth: undefined // Full clone for pushing
    });

    const remoteRoot = join(repoPath, remoteDirPath);
    const git = simpleGit(repoPath);

    if (remoteDirPath === '.') {
      // If remote dir is root, copy directories directly to repo root
      for (const directory of SUPPORTED_DIRECTORIES) {
        const dest = join(repoPath, directory);

        // Remove existing directory
        try {
          await fs.access(dest);
          await fs.rm(dest, { recursive: true, force: true });
        } catch {
          // Directory doesn't exist
        }

        const src = join(targetPath, directory);
        try {
          await fs.access(src);
          await copyDirectoryRecursive(src, dest);
        } catch {
          // Source directory doesn't exist, skip
        }
      }
    } else {
      // Copy directories to remote subdirectory
      await copyDirectories(targetPath, remoteRoot, SUPPORTED_DIRECTORIES);
    }

    // Check if there are any changes
    const status = await git.status();

    let hasChanges = false;
    if (remoteDirPath === '.') {
      // Check only the supported directories for changes
      for (const directory of SUPPORTED_DIRECTORIES) {
        const dirFiles = status.files.filter(file => file.path.startsWith(directory + '/') || file.path === directory);
        if (dirFiles.length > 0) {
          hasChanges = true;
          break;
        }
      }
    } else {
      // Check if remote directory has changes
      const remoteFiles = status.files.filter(file => file.path.startsWith(remoteDirPath + '/'));
      hasChanges = remoteFiles.length > 0;
    }

    if (!hasChanges) {
      console.log('Remote repository already matches local configuration.');
      return;
    }

    // Add files to git
    if (remoteDirPath === '.') {
      // Add each supported directory separately
      for (const directory of SUPPORTED_DIRECTORIES) {
        try {
          await fs.access(join(repoPath, directory));
          await git.add(directory);
        } catch {
          // Directory doesn't exist, skip
        }
      }
    } else {
      // Add the entire remote directory
      await git.add(remoteDirPath);
    }

    // Commit changes
    await git.commit(commitMessage);

    // Push changes
    console.log(`Pushing changes to origin/${branch}`);
    await git.push('origin', branch);

    console.log('Push completed successfully.');

  } finally {
    // Clean up temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.warn(`Failed to clean up temporary directory: ${error}`);
    }
  }
};