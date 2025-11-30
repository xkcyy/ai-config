"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runPush = runPush;
const fs_1 = require("fs");
const path_1 = require("path");
const os_1 = require("os");
const promises_1 = require("fs/promises");
const simple_git_1 = __importDefault(require("simple-git"));
const constants_1 = require("./constants");
const git_utils_1 = require("./git-utils");
const utils_1 = require("./utils");
/**
 * Get existing local directories
 */
async function getExistingLocalDirs(target) {
    const existing = [];
    for (const directory of constants_1.SUPPORTED_DIRECTORIES) {
        const path = (0, path_1.join)(target, directory);
        try {
            await fs_1.promises.access(path);
            existing.push(path);
        }
        catch {
            // Directory doesn't exist
        }
    }
    return existing;
}
/**
 * Copy directories to remote location
 */
async function copyDirectories(sourceRoot, destRoot, directories) {
    // Remove existing destination root
    try {
        await fs_1.promises.access(destRoot);
        await fs_1.promises.rm(destRoot, { recursive: true, force: true });
    }
    catch {
        // Destination doesn't exist
    }
    // Create destination root
    await fs_1.promises.mkdir(destRoot, { recursive: true });
    for (const directory of directories) {
        const src = (0, path_1.join)(sourceRoot, directory);
        const dest = (0, path_1.join)(destRoot, directory);
        try {
            await fs_1.promises.access(src);
            await copyDirectoryRecursive(src, dest);
        }
        catch {
            // Source directory doesn't exist, skip
        }
    }
}
/**
 * Copy directory recursively
 */
async function copyDirectoryRecursive(src, dest) {
    await fs_1.promises.mkdir(dest, { recursive: true });
    const entries = await fs_1.promises.readdir(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = (0, path_1.join)(src, entry.name);
        const destPath = (0, path_1.join)(dest, entry.name);
        if (entry.isDirectory()) {
            await copyDirectoryRecursive(srcPath, destPath);
        }
        else {
            await fs_1.promises.copyFile(srcPath, destPath);
        }
    }
}
/**
 * Main push function
 */
async function runPush(options) {
    const { target = process.cwd(), repoUrl = constants_1.DEFAULT_REPO_URL, branch = constants_1.DEFAULT_BRANCH, remoteDir = constants_1.DEFAULT_REMOTE_DIR, commitMessage = 'chore: sync ai IDE config' } = options;
    const targetPath = (0, path_1.resolve)(target);
    // Check if target exists
    try {
        await fs_1.promises.access(targetPath);
    }
    catch {
        throw new Error(`Target path ${targetPath} does not exist`);
    }
    // Check if there are local directories to push
    const localDirs = await getExistingLocalDirs(targetPath);
    if (localDirs.length === 0) {
        throw new Error('No local .cursor/.claude directories found. Nothing to push.');
    }
    const remoteDirPath = (0, utils_1.normalizeRemoteDir)(remoteDir);
    // Create temporary directory
    const tempDir = await (0, promises_1.mkdtemp)((0, path_1.join)((0, os_1.tmpdir)(), 'ai-config-push-'));
    try {
        console.log(`Cloning ${repoUrl} (branch ${branch}) to prepare push into ${remoteDirPath}`);
        // Clone the repository
        const repoPath = (0, path_1.join)(tempDir, 'repo');
        await (0, git_utils_1.cloneRepo)({
            repoUrl,
            destination: repoPath,
            branch,
            depth: undefined // Full clone for pushing
        });
        const remoteRoot = (0, path_1.join)(repoPath, remoteDirPath);
        const git = (0, simple_git_1.default)(repoPath);
        if (remoteDirPath === '.') {
            // If remote dir is root, copy directories directly to repo root
            for (const directory of constants_1.SUPPORTED_DIRECTORIES) {
                const dest = (0, path_1.join)(repoPath, directory);
                // Remove existing directory
                try {
                    await fs_1.promises.access(dest);
                    await fs_1.promises.rm(dest, { recursive: true, force: true });
                }
                catch {
                    // Directory doesn't exist
                }
                const src = (0, path_1.join)(targetPath, directory);
                try {
                    await fs_1.promises.access(src);
                    await copyDirectoryRecursive(src, dest);
                }
                catch {
                    // Source directory doesn't exist, skip
                }
            }
        }
        else {
            // Copy directories to remote subdirectory
            await copyDirectories(targetPath, remoteRoot, constants_1.SUPPORTED_DIRECTORIES);
        }
        // Check if there are any changes
        const status = await git.status();
        let hasChanges = false;
        if (remoteDirPath === '.') {
            // Check only the supported directories for changes
            for (const directory of constants_1.SUPPORTED_DIRECTORIES) {
                const dirFiles = status.files.filter(file => file.path.startsWith(directory + '/') || file.path === directory);
                if (dirFiles.length > 0) {
                    hasChanges = true;
                    break;
                }
            }
        }
        else {
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
            for (const directory of constants_1.SUPPORTED_DIRECTORIES) {
                try {
                    await fs_1.promises.access((0, path_1.join)(repoPath, directory));
                    await git.add(directory);
                }
                catch {
                    // Directory doesn't exist, skip
                }
            }
        }
        else {
            // Add the entire remote directory
            await git.add(remoteDirPath);
        }
        // Commit changes
        await git.commit(commitMessage);
        // Push changes
        console.log(`Pushing changes to origin/${branch}`);
        await git.push('origin', branch);
        console.log('Push completed successfully.');
    }
    finally {
        // Clean up temporary directory
        try {
            await fs_1.promises.rm(tempDir, { recursive: true, force: true });
        }
        catch (error) {
            console.warn(`Failed to clean up temporary directory: ${error}`);
        }
    }
}
//# sourceMappingURL=push.js.map