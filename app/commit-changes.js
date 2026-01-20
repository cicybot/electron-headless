#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get current timestamp
const now = new Date();
const timestamp = now.getFullYear() + '-' +
  String(now.getMonth() + 1).padStart(2, '0') + '-' +
  String(now.getDate()).padStart(2, '0') + '_' +
  String(now.getHours()).padStart(2, '0') + '-' +
  String(now.getMinutes()).padStart(2, '0') + '-' +
  String(now.getSeconds()).padStart(2, '0');

const changelogDir = path.join(__dirname, 'changelog');
const currentFile = path.join(changelogDir, 'current.md');
const archiveFile = path.join(changelogDir, `${timestamp}_changelog.md`);

try {
  // Check if current.md exists
  if (!fs.existsSync(currentFile)) {
    console.log('❌ current.md not found');
    process.exit(1);
  }

  // Read current.md content
  const content = fs.readFileSync(currentFile, 'utf8');

  // Check if there's content to archive
  if (content.trim() === '') {
    console.log('⚠️  current.md is empty, nothing to archive');
    process.exit(0);
  }

  // Move current.md to timestamped file
  fs.renameSync(currentFile, archiveFile);
  console.log(`📝 Archived current.md to ${timestamp}_changelog.md`);

  // Create new empty current.md
  fs.writeFileSync(currentFile, '');
  console.log('📄 Created new empty current.md');

  // Git operations
  console.log('🔄 Performing git operations...');

  execSync('git add .', { stdio: 'inherit' });
  execSync(`git commit -m "feat: ${timestamp} - Development updates

$(cat ${archiveFile})"`, { stdio: 'inherit' });
  execSync('git push origin mcp', { stdio: 'inherit' });

  console.log('✅ Successfully committed and pushed to origin mcp');

} catch (error) {
  console.error('❌ Error during commit process:', error.message);
  process.exit(1);
}