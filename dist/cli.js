#!/usr/bin/env node
"use strict";
/**
 * AI Config Tool CLI
 * Synchronize AI IDE configuration directories from remote repo
 */
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const path_1 = require("path");
const sync_1 = require("./sync");
const push_1 = require("./push");
const backup_1 = require("./backup");
const constants_1 = require("./constants");
const program = new commander_1.Command();
program
    .name('ai-config')
    .description('Synchronize AI IDE configuration directories from remote repo.')
    .version('1.0.0');
// Sync command
const syncCmd = program
    .command('sync')
    .description('Synchronize .cursor/.claude from remote repository')
    .option('--repo <url>', 'Remote repository URL', constants_1.DEFAULT_REPO_URL)
    .option('--branch <branch>', 'Remote branch to read from', constants_1.DEFAULT_BRANCH)
    .option('--ref <ref>', 'Optional git ref (branch, tag, or commit) to sync')
    .option('--remote-dir <dir>', 'Directory inside remote repo storing configs', constants_1.DEFAULT_REMOTE_DIR)
    .option('--target <path>', 'Target project path', process.cwd())
    .option('--dry-run', 'Show planned changes without writing files', false)
    .option('--force', 'Bypass dirty git tree check for target directories', false)
    .option('--verbose', 'Enable verbose logging', false)
    .action(async (options) => {
    try {
        if (options.verbose) {
            process.env.DEBUG = 'true';
        }
        await (0, sync_1.runSync)({
            target: (0, path_1.resolve)(options.target),
            repoUrl: options.repo,
            ref: options.ref,
            dryRun: options.dryRun,
            force: options.force,
            remoteDir: options.remoteDir,
            branch: options.branch
        });
    }
    catch (error) {
        console.error('Sync failed:', error.message);
        process.exit(1);
    }
});
// Push command
const pushCmd = program
    .command('push')
    .description('Push local .cursor/.claude to the remote repository')
    .option('--repo <url>', 'Remote repository URL', constants_1.DEFAULT_REPO_URL)
    .option('--branch <branch>', 'Remote branch to push to', constants_1.DEFAULT_BRANCH)
    .option('--remote-dir <dir>', 'Directory inside remote repo storing configs', constants_1.DEFAULT_REMOTE_DIR)
    .option('--target <path>', 'Target project path', process.cwd())
    .option('--message <msg>', 'Commit message when pushing configs', 'chore: sync ai IDE config')
    .option('--verbose', 'Enable verbose logging', false)
    .action(async (options) => {
    try {
        if (options.verbose) {
            process.env.DEBUG = 'true';
        }
        await (0, push_1.runPush)({
            target: (0, path_1.resolve)(options.target),
            repoUrl: options.repo,
            branch: options.branch,
            remoteDir: options.remoteDir,
            commitMessage: options.message
        });
    }
    catch (error) {
        console.error('Push failed:', error.message);
        process.exit(1);
    }
});
// Pull command
const pullCmd = program
    .command('pull')
    .description('Synchronize .cursor/.claude from remote repository to local')
    .option('--repo <url>', 'Remote repository URL', constants_1.DEFAULT_REPO_URL)
    .option('--branch <branch>', 'Remote branch to read from', constants_1.DEFAULT_BRANCH)
    .option('--ref <ref>', 'Optional git ref (branch, tag, or commit) to pull')
    .option('--remote-dir <dir>', 'Directory inside remote repo storing configs', constants_1.DEFAULT_REMOTE_DIR)
    .option('--target <path>', 'Target project path', process.cwd())
    .option('--dry-run', 'Show planned changes without writing files', false)
    .option('--force', 'Bypass dirty git tree check for target directories', false)
    .option('--verbose', 'Enable verbose logging', false)
    .action(async (options) => {
    try {
        if (options.verbose) {
            process.env.DEBUG = 'true';
        }
        await (0, sync_1.runSync)({
            target: (0, path_1.resolve)(options.target),
            repoUrl: options.repo,
            ref: options.ref,
            dryRun: options.dryRun,
            force: options.force,
            remoteDir: options.remoteDir,
            branch: options.branch
        });
    }
    catch (error) {
        console.error('Pull failed:', error.message);
        process.exit(1);
    }
});
// Rollback command
const rollbackCmd = program
    .command('rollback <timestamp>')
    .description('Restore .cursor/.claude from a previous backup')
    .option('--target <path>', 'Target project path', process.cwd())
    .option('--verbose', 'Enable verbose logging', false)
    .action(async (timestamp, options) => {
    try {
        if (options.verbose) {
            process.env.DEBUG = 'true';
        }
        const backupPath = await (0, backup_1.rollbackSnapshot)((0, path_1.resolve)(options.target), timestamp, Array.from(constants_1.SUPPORTED_DIRECTORIES));
        console.log(`Restored backup from ${backupPath}`);
    }
    catch (error) {
        console.error('Rollback failed:', error.message);
        process.exit(1);
    }
});
// Parse command line arguments
program.parse();
//# sourceMappingURL=cli.js.map