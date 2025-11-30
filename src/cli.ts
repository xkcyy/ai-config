#!/usr/bin/env ts-node

/**
 * AI Config Tool CLI
 * Synchronize AI IDE configuration directories from remote repo
 */

import { Command } from 'commander';
import { resolve } from 'path';
import { runSync } from './sync';
import { runPush } from './push';
import { rollbackSnapshot } from './backup';
import { SUPPORTED_DIRECTORIES, DEFAULT_BRANCH, DEFAULT_REMOTE_DIR, DEFAULT_REPO_URL } from './constants';

const program = new Command();

program
  .name('ai-config')
  .description('Synchronize AI IDE configuration directories from remote repo.')
  .version('1.0.0');

// Sync command
const syncCmd = program
  .command('sync')
  .description('Synchronize .cursor/.claude from remote repository')
  .option('--repo <url>', 'Remote repository URL', DEFAULT_REPO_URL)
  .option('--branch <branch>', 'Remote branch to read from', DEFAULT_BRANCH)
  .option('--ref <ref>', 'Optional git ref (branch, tag, or commit) to sync')
  .option('--remote-dir <dir>', 'Directory inside remote repo storing configs', DEFAULT_REMOTE_DIR)
  .option('--target <path>', 'Target project path', process.cwd())
  .option('--dry-run', 'Show planned changes without writing files', false)
  .option('--force', 'Bypass dirty git tree check for target directories', false)
  .option('--verbose', 'Enable verbose logging', false)
  .action(async (options) => {
    try {
      if (options.verbose) {
        process.env.DEBUG = 'true';
      }

      await runSync({
        target: resolve(options.target),
        repoUrl: options.repo,
        ref: options.ref,
        dryRun: options.dryRun,
        force: options.force,
        remoteDir: options.remoteDir,
        branch: options.branch
      });
    } catch (error: any) {
      console.error('Sync failed:', error.message);
      process.exit(1);
    }
  });

// Push command
const pushCmd = program
  .command('push')
  .description('Push local .cursor/.claude to the remote repository')
  .option('--repo <url>', 'Remote repository URL', DEFAULT_REPO_URL)
  .option('--branch <branch>', 'Remote branch to push to', DEFAULT_BRANCH)
  .option('--remote-dir <dir>', 'Directory inside remote repo storing configs', DEFAULT_REMOTE_DIR)
  .option('--target <path>', 'Target project path', process.cwd())
  .option('--message <msg>', 'Commit message when pushing configs', 'chore: sync ai IDE config')
  .option('--verbose', 'Enable verbose logging', false)
  .action(async (options) => {
    try {
      if (options.verbose) {
        process.env.DEBUG = 'true';
      }

      await runPush({
        target: resolve(options.target),
        repoUrl: options.repo,
        branch: options.branch,
        remoteDir: options.remoteDir,
        commitMessage: options.message
      });
    } catch (error: any) {
      console.error('Push failed:', error.message);
      process.exit(1);
    }
  });

// Pull command
const pullCmd = program
  .command('pull')
  .description('Synchronize .cursor/.claude from remote repository to local')
  .option('--repo <url>', 'Remote repository URL', DEFAULT_REPO_URL)
  .option('--branch <branch>', 'Remote branch to read from', DEFAULT_BRANCH)
  .option('--ref <ref>', 'Optional git ref (branch, tag, or commit) to pull')
  .option('--remote-dir <dir>', 'Directory inside remote repo storing configs', DEFAULT_REMOTE_DIR)
  .option('--target <path>', 'Target project path', process.cwd())
  .option('--dry-run', 'Show planned changes without writing files', false)
  .option('--force', 'Bypass dirty git tree check for target directories', false)
  .option('--verbose', 'Enable verbose logging', false)
  .action(async (options) => {
    try {
      if (options.verbose) {
        process.env.DEBUG = 'true';
      }

      await runSync({
        target: resolve(options.target),
        repoUrl: options.repo,
        ref: options.ref,
        dryRun: options.dryRun,
        force: options.force,
        remoteDir: options.remoteDir,
        branch: options.branch
      });
    } catch (error: any) {
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

      const backupPath = await rollbackSnapshot(
        resolve(options.target),
        timestamp,
        Array.from(SUPPORTED_DIRECTORIES)
      );

      console.log(`Restored backup from ${backupPath}`);
    } catch (error: any) {
      console.error('Rollback failed:', error.message);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();