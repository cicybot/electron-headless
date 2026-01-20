#!/usr/bin/env node

const { spawn } = require('child_process');
const chokidar = require('chokidar');

// Start the app initially
console.log('🚀 Starting application...');
let appProcess = spawn('npm', ['start'], {
  stdio: 'inherit',
  shell: true
});

// Watch for changelog changes
console.log('👀 Watching changelog files...');
const watcher = chokidar.watch('../changelog/*.md', {
  persistent: true,
  ignoreInitial: true
});

watcher.on('change', (path) => {
  console.log(`📝 Changelog updated: ${path}`);
  console.log('🔄 Restarting application...');

  // Kill current process
  if (appProcess) {
    appProcess.kill();
  }

  // Start new process
  appProcess = spawn('npm', ['start'], {
    stdio: 'inherit',
    shell: true
  });
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping application...');
  if (appProcess) {
    appProcess.kill();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Stopping application...');
  if (appProcess) {
    appProcess.kill();
  }
  process.exit(0);
});