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
    // Use the local typescript compiler
    const tscPath = join(currentDir, 'node_modules', '.bin', 'tsc');
    if (existsSync(tscPath)) {
      execSync(`node ${tscPath}`, { stdio: 'inherit', cwd: currentDir });
      console.log('Build completed successfully!');
    } else {
      // Fallback to npx tsc
      execSync('npx tsc', { stdio: 'inherit', cwd: currentDir });
      console.log('Build completed successfully with npx tsc!');
    }
  } catch (error) {
    console.error('Build failed:', error.message);
    process.exit(1);
  }
}

// Execute the actual CLI
require('./dist/cli.js');
