#!/usr/bin/env node

const { execSync } = require('child_process');
const { existsSync } = require('fs');
const { join } = require('path');

// Get the current directory
const currentDir = process.cwd();

// Check if dist/cli.js exists
const cliPath = join(__dirname, 'dist', 'cli.js');
if (!existsSync(cliPath)) {
  console.log('Building project...');
  try {
    execSync('npm run build', { stdio: 'inherit', cwd: __dirname });
    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error.message);
    process.exit(1);
  }
}

// Execute the actual CLI
require('./dist/cli.js');
