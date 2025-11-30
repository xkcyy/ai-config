#!/usr/bin/env node

const { execSync } = require('child_process');
const { existsSync, mkdirSync } = require('fs');
const { join } = require('path');

// Get the current directory
const currentDir = __dirname;

// Check if dist/cli.js exists
const cliPath = join(currentDir, 'dist', 'cli.js');
if (!existsSync(cliPath)) {
  console.log('Building project...');
  
  // Create dist directory if it doesn't exist
  const distDir = join(currentDir, 'dist');
  if (!existsSync(distDir)) {
    mkdirSync(distDir, { recursive: true });
  }
  
  try {
    // Use typescript compiler directly
    execSync('npx typescript', { stdio: 'inherit', cwd: currentDir });
    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed. Trying with tsc...');
    try {
      // Fallback to tsc command
      execSync('npx tsc', { stdio: 'inherit', cwd: currentDir });
      console.log('Build completed successfully with tsc!');
    } catch (error) {
      console.error('Build failed with both typescript and tsc:', error.message);
      process.exit(1);
    }
  }
}

// Execute the actual CLI
require('./dist/cli.js');
