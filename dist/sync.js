"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.describePlan = describePlan;
exports.runSync = runSync;
const fs_1 = require("fs");
const path_1 = require("path");
const os_1 = require("os");
const promises_1 = require("fs/promises");
const constants_1 = require("./constants");
const backup_1 = require("./backup");
const git_utils_1 = require("./git-utils");
const utils_1 = require("./utils");
/**
 * Build sync plan for directories
 */
async function buildPlan(sourceRoot, target) {
    const plans = [];
    for (const directory of constants_1.SUPPORTED_DIRECTORIES) {
        const src = (0, path_1.join)(sourceRoot, directory);
        const dest = (0, path_1.join)(target, directory);
        try {
            const srcExists = await fs_1.promises.access(src).then(() => true).catch(() => false);
            const destExists = await fs_1.promises.access(dest).then(() => true).catch(() => false);
            if (srcExists) {
                const srcSnapshot = await (0, utils_1.snapshotDirectory)(src);
                const destSnapshot = destExists ? await (0, utils_1.snapshotDirectory)(dest) : {};
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
            }
            else {
                const removed = destExists ? await (0, utils_1.snapshotPathsOnly)(dest) : [];
                plans.push({
                    name: directory,
                    source: undefined,
                    destination: dest,
                    added: [],
                    modified: [],
                    removed
                });
            }
        }
        catch (error) {
            console.warn(`Error processing directory ${directory}:`, error);
        }
    }
    return plans;
}
/**
 * Check if a directory plan needs changes
 */
async function planNeedsChange(plan) {
    if (!plan.source) {
        return plan.removed.length > 0;
    }
    try {
        await fs_1.promises.access(plan.destination);
        return plan.added.length > 0 || plan.modified.length > 0 || plan.removed.length > 0;
    }
    catch {
        // Destination doesn't exist, will be created
        return plan.added.length > 0 || plan.modified.length > 0;
    }
}
/**
 * Describe the sync plan for logging
 */
function describePlan(plan) {
    if (!plan.source) {
        if (plan.removed.length > 0) {
            console.log(`Directory ${plan.name} missing in remote. ${plan.removed.length} files would be removed.`);
        }
        else {
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
async function applyPlan(plans, dryRun) {
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
                await fs_1.promises.access(plan.destination);
                await fs_1.promises.rm(plan.destination, { recursive: true, force: true });
                console.log(`Removed directory ${plan.destination}`);
            }
            catch {
                // Directory doesn't exist, nothing to do
            }
            continue;
        }
        // Remove existing destination and copy from source
        try {
            await fs_1.promises.access(plan.destination);
            await fs_1.promises.rm(plan.destination, { recursive: true, force: true });
        }
        catch {
            // Destination doesn't exist, that's fine
        }
        // Ensure parent directory exists
        await fs_1.promises.mkdir((0, path_1.resolve)(plan.destination, '..'), { recursive: true });
        // Copy entire directory
        await copyDirectoryRecursive(plan.source, plan.destination);
        console.log(`Copied ${plan.source} to ${plan.destination}`);
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
 * Main sync function
 */
async function runSync(options) {
    const { target = process.cwd(), repoUrl = constants_1.DEFAULT_REPO_URL, ref, dryRun = false, force = false, remoteDir = constants_1.DEFAULT_REMOTE_DIR, branch = constants_1.DEFAULT_BRANCH } = options;
    const targetPath = (0, path_1.resolve)(target);
    // Check if target exists
    try {
        await fs_1.promises.access(targetPath);
    }
    catch {
        throw new Error(`Target path ${targetPath} does not exist`);
    }
    // Check for uncommitted changes unless force is true
    if (!force) {
        const hasChanges = await (0, git_utils_1.hasUncommittedChanges)(targetPath, Array.from(constants_1.SUPPORTED_DIRECTORIES));
        if (hasChanges) {
            throw new Error('Local changes detected in .cursor/.claude. Commit or stash, or rerun with --force.');
        }
    }
    const remoteDirPath = (0, utils_1.normalizeRemoteDir)(remoteDir);
    // Create temporary directory
    const tempDir = await (0, promises_1.mkdtemp)((0, path_1.join)((0, os_1.tmpdir)(), 'ai-config-sync-'));
    try {
        console.log(`Fetching configuration from ${repoUrl} (${branch} -> ${remoteDirPath})`);
        // Clone the repository
        const repoPath = (0, path_1.join)(tempDir, 'repo');
        await (0, git_utils_1.cloneRepo)({
            repoUrl,
            destination: repoPath,
            branch,
            ref,
            depth: 1
        });
        const sourceRoot = (0, path_1.join)(repoPath, remoteDirPath);
        // Check if remote directory exists
        try {
            await fs_1.promises.access(sourceRoot);
        }
        catch {
            throw new Error(`Remote directory '${remoteDirPath}' not found in repository. Use 'ai-config push' to initialize it first.`);
        }
        // Build and analyze plans
        const plans = await buildPlan(sourceRoot, targetPath);
        // Describe what will happen
        for (const plan of plans) {
            describePlan(plan);
        }
        // Check if any changes are needed
        const hasAnyChanges = plans.some(plan => plan.added.length > 0 || plan.modified.length > 0 || plan.removed.length > 0);
        if (!hasAnyChanges) {
            console.log('No changes detected. You\'re already up to date.');
            return;
        }
        if (dryRun) {
            console.log('Dry run complete. No files were changed.');
            return;
        }
        // Create backup before applying changes
        const backupPath = await (0, backup_1.createBackup)(targetPath, Array.from(constants_1.SUPPORTED_DIRECTORIES));
        if (backupPath) {
            console.log(`Created backup at ${backupPath}`);
        }
        // Apply the plan
        await applyPlan(plans, false);
        console.log('Synchronization completed successfully.');
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
//# sourceMappingURL=sync.js.map