"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashFile = hashFile;
exports.snapshotDirectory = snapshotDirectory;
exports.getAllFiles = getAllFiles;
exports.snapshotPathsOnly = snapshotPathsOnly;
exports.normalizeRemoteDir = normalizeRemoteDir;
const crypto_1 = require("crypto");
const fs_1 = require("fs");
const path_1 = require("path");
/**
 * Calculate SHA-256 hash of a file
 */
async function hashFile(filePath) {
    const hash = (0, crypto_1.createHash)('sha256');
    const fileBuffer = await fs_1.promises.readFile(filePath);
    hash.update(fileBuffer);
    return hash.digest('hex');
}
/**
 * Create a snapshot of directory with file hashes
 */
async function snapshotDirectory(dirPath) {
    try {
        const stat = await fs_1.promises.stat(dirPath);
        if (!stat.isDirectory()) {
            return {};
        }
    }
    catch {
        return {};
    }
    const snapshot = {};
    const files = await getAllFiles(dirPath);
    for (const file of files) {
        const relativePath = (0, path_1.relative)(dirPath, file);
        const fileHash = await hashFile(file);
        snapshot[relativePath] = fileHash;
    }
    return snapshot;
}
/**
 * Get list of all files in directory recursively
 */
async function getAllFiles(dirPath) {
    const files = [];
    async function traverse(currentPath) {
        const entries = await fs_1.promises.readdir(currentPath, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = (0, path_1.join)(currentPath, entry.name);
            if (entry.isFile()) {
                files.push(fullPath);
            }
            else if (entry.isDirectory() && !entry.name.startsWith('.')) {
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
async function snapshotPathsOnly(dirPath) {
    const files = await getAllFiles(dirPath);
    return files
        .map(file => (0, path_1.relative)(dirPath, file))
        .sort();
}
/**
 * Normalize remote directory path
 */
function normalizeRemoteDir(remoteDir) {
    return remoteDir.replace(/\\/g, '/').replace(/\/$/, '');
}
//# sourceMappingURL=utils.js.map