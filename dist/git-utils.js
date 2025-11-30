"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runGit = runGit;
exports.cloneRepo = cloneRepo;
exports.getRepoRoot = getRepoRoot;
exports.hasUncommittedChanges = hasUncommittedChanges;
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path_1 = require("path");
const util_1 = require("util");
const simple_git_1 = __importDefault(require("simple-git"));
const exec = (0, util_1.promisify)(child_process_1.execSync);
/**
 * Run git command and return result
 */
async function runGit(args, cwd) {
    const git = (0, simple_git_1.default)(cwd);
    try {
        const result = await git.raw(args);
        return { stdout: result || '', stderr: '' };
    }
    catch (error) {
        throw new Error(error.message || `Git command failed: ${args.join(' ')}`);
    }
}
/**
 * Clone a repository with options
 */
async function cloneRepo(options) {
    const { repoUrl, destination, branch, ref, depth } = options;
    // Ensure parent directory exists
    const parentDir = (0, path_1.resolve)(destination, '..');
    if (!(0, fs_1.existsSync)(parentDir)) {
        await (0, util_1.promisify)(exec)(`mkdir -p "${parentDir}"`);
    }
    const git = (0, simple_git_1.default)();
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
            const repoGit = (0, simple_git_1.default)(destination);
            await repoGit.checkout(ref);
        }
    }
    catch (error) {
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
async function getRepoRoot(path) {
    try {
        const git = (0, simple_git_1.default)(path);
        const result = await git.revparse(['--show-toplevel']);
        return result.trim() || null;
    }
    catch {
        return null;
    }
}
/**
 * Check if directories have uncommitted changes
 */
async function hasUncommittedChanges(targetPath, directories) {
    const repoRoot = await getRepoRoot(targetPath);
    if (!repoRoot) {
        return false;
    }
    const git = (0, simple_git_1.default)(repoRoot);
    const relPaths = [];
    for (const directory of directories) {
        const dirPath = (0, path_1.resolve)(targetPath, directory);
        if ((0, fs_1.existsSync)(dirPath)) {
            try {
                const relPath = (0, path_1.relative)(repoRoot, dirPath);
                relPaths.push(relPath);
            }
            catch {
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
    }
    catch {
        return false;
    }
}
/**
 * Get relative path from base to target
 */
function relative(target, base) {
    const targetAbs = (0, path_1.resolve)(target);
    const baseAbs = (0, path_1.resolve)(base);
    if (targetAbs.startsWith(baseAbs)) {
        return targetAbs.slice(baseAbs.length).replace(/^[\/\\]/, '');
    }
    return targetAbs;
}
//# sourceMappingURL=git-utils.js.map