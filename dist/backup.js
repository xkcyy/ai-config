"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBackup = createBackup;
exports.rollbackSnapshot = rollbackSnapshot;
const fs_1 = require("fs");
const path_1 = require("path");
/**
 * Format date to YYYYMMDD-HHmmss
 */
function formatDate(date) {
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
async function createBackup(targetPath, directories) {
    const timestamp = formatDate(new Date());
    const backupRoot = (0, path_1.join)(targetPath, '.ai-config-backup', timestamp);
    let copied = false;
    for (const directory of directories) {
        const srcPath = (0, path_1.join)(targetPath, directory);
        try {
            await fs_1.promises.access(srcPath);
        }
        catch {
            // Directory doesn't exist, skip
            continue;
        }
        const destPath = (0, path_1.join)(backupRoot, directory);
        // Ensure destination parent directory exists
        await fs_1.promises.mkdir((0, path_1.resolve)(destPath, '..'), { recursive: true });
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
async function rollbackSnapshot(targetPath, timestamp, directories) {
    const backupRoot = (0, path_1.join)(targetPath, '.ai-config-backup', timestamp);
    try {
        await fs_1.promises.access(backupRoot);
    }
    catch {
        throw new Error(`Backup snapshot ${timestamp} not found at ${backupRoot}`);
    }
    for (const directory of directories) {
        const srcPath = (0, path_1.join)(backupRoot, directory);
        const destPath = (0, path_1.join)(targetPath, directory);
        // Remove existing directory if it exists
        try {
            const stat = await fs_1.promises.stat(destPath);
            if (stat.isDirectory()) {
                await fs_1.promises.rm(destPath, { recursive: true, force: true });
            }
        }
        catch {
            // Directory doesn't exist, which is fine
        }
        // Restore from backup if it exists
        try {
            await fs_1.promises.access(srcPath);
            await fs_1.promises.mkdir((0, path_1.resolve)(destPath, '..'), { recursive: true });
            await copyDirectory(srcPath, destPath);
        }
        catch {
            // Backup for this directory doesn't exist, skip
        }
    }
    return backupRoot;
}
/**
 * Copy directory recursively
 */
async function copyDirectory(src, dest) {
    await fs_1.promises.mkdir(dest, { recursive: true });
    const entries = await fs_1.promises.readdir(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = (0, path_1.join)(src, entry.name);
        const destPath = (0, path_1.join)(dest, entry.name);
        if (entry.isDirectory()) {
            await copyDirectory(srcPath, destPath);
        }
        else {
            await fs_1.promises.copyFile(srcPath, destPath);
        }
    }
}
//# sourceMappingURL=backup.js.map