#!/usr/bin/env node

/**
 * Branch Management Script
 * Handles creating feature/bugfix branches from origin/main
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function log(message) {
  console.log(`\n🔧 ${message}`);
}

function error(message) {
  console.error(`\n❌ ${message}`);
  process.exit(1);
}

function exec(command, description) {
  log(description);
  try {
    const result = execSync(command, { encoding: 'utf8', stdio: 'inherit' });
    return result;
  } catch (err) {
    error(`Failed to ${description.toLowerCase()}: ${err.message}`);
  }
}

function getCurrentBranch() {
  try {
    const result = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' });
    return result.trim();
  } catch (err) {
    error('Failed to get current branch');
  }
}

function isBranchClean() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    return status.trim() === '';
  } catch (err) {
    error('Failed to check git status');
  }
}

function updateChangelog(branchType, branchName, description) {
  const changelogPath = path.join(__dirname, 'changelog', 'current.md');
  const timestamp = new Date().toISOString();
  
  let content = '';
  if (fs.existsSync(changelogPath)) {
    content = fs.readFileSync(changelogPath, 'utf8');
  }
  
  const newEntry = `
## Development Session - ${new Date().toLocaleString()}

### Task/Feature Description
- **Issue**: ${description}
- **Branch**: ${branchType}/${branchName}
- **Solution**: [To be filled during development]
- **Status**: In Progress

### Technical Changes
- **Component**: [app/render]
- **Files Modified**: [To be updated as work progresses]
- **Key Changes**: [To be documented during development]

### Testing
- **Tests Run**: [To be updated]
- **Results**: [Pending]
- **Coverage**: [To be updated]

### Code Quality
- **Linting**: [Pending]
- **Formatting**: [Pending]
- **Type Checking**: [Pending]

### Next Steps
- [ ] Start development work
- [ ] Run tests and code inspection
- [ ] Update documentation

---

`;
  
  // Add new entry at the top after the header
  const lines = content.split('\n');
  const headerLines = lines.slice(0, 3); // Keep the first 3 lines (header and first section)
  const restLines = lines.slice(3);
  const updatedContent = headerLines.join('\n') + newEntry + restLines.join('\n');
  
  fs.writeFileSync(changelogPath, updatedContent);
  log(`Updated changelog with new branch: ${branchType}/${branchName}`);
}

function createBranch(branchType, branchName, description) {
  const fullBranchName = `${branchType}/${branchName}`;
  
  // Check if working directory is clean
  if (!isBranchClean()) {
    error('Working directory is not clean. Please commit or stash changes first.');
  }
  
  // Ensure we're on main and up to date
  const currentBranch = getCurrentBranch();
  if (currentBranch !== 'main') {
    exec('git checkout main', 'Switching to main branch');
  }
  
  exec('git pull origin main', 'Updating main branch from origin');
  
  // Create and checkout the new branch
  exec(`git checkout -b ${fullBranchName}`, `Creating new branch: ${fullBranchName}`);
  
  // Update changelog
  updateChangelog(branchType, branchName, description);
  
  log(`✅ Successfully created and switched to branch: ${fullBranchName}`);
  log(`📝 Changelog updated. Please edit app/changelog/current.md to add details.`);
}

function showUsage() {
  console.log(`
🌳 Branch Management Tool

Usage:
  node branch-manager.js <type> <name> <description>

Types:
  feature     - Create a new feature branch
  bugfix      - Create a new bugfix branch
  hotfix      - Create a hotfix branch for critical issues

Examples:
  node branch-manager.js feature user-authentication "Add user login and registration"
  node branch-manager.js bugfix memory-leak "Fix memory leak in window manager"
  node branch-manager.js hotfix security-patch "Critical security update"

Workflow:
  1. Create branch with this tool
  2. Make changes and update changelog
  3. Run tests and code inspection
  4. Commit changes with "提交代码"
  5. Create pull request to main
`);
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    showUsage();
    return;
  }
  
  if (args.length < 3) {
    error('Insufficient arguments. Use --help for usage information.');
  }
  
  const [branchType, branchName, ...descriptionParts] = args;
  const description = descriptionParts.join(' ');
  
  // Validate branch type
  const validTypes = ['feature', 'bugfix', 'hotfix'];
  if (!validTypes.includes(branchType)) {
    error(`Invalid branch type: ${branchType}. Valid types: ${validTypes.join(', ')}`);
  }
  
  // Validate branch name (no spaces, no special characters except - and _)
  if (!/^[a-zA-Z0-9-_]+$/.test(branchName)) {
    error('Invalid branch name. Use only letters, numbers, hyphens, and underscores.');
  }
  
  createBranch(branchType, branchName, description);
}

if (require.main === module) {
  main();
}

module.exports = { createBranch, updateChangelog };