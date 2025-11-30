#!/usr/bin/env node

const { execSync } = require('child_process');
const { existsSync, mkdirSync } = require('fs');
const { join } = require('path');

// Get the current directory
const currentDir = process.cwd();

// Check if dist directory exists, if not create it
const distDir = join(currentDir, 'dist');
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

// Run the build command
try {
  console.log('Building project...');
  execSync('node node_modules/.bin/tsc', { stdio: 'inherit', cwd: currentDir });
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
