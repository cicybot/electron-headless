#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

function runTestsAndInspection() {
  log('🧪 Running tests and code inspection...');
  
  // Run backend tests
  try {
    execSync('npm test', { stdio: 'inherit', cwd: __dirname });
    log('✅ Backend tests passed');
  } catch (err) {
    error('Backend tests failed');
  }
  
  // Run frontend linting
  try {
    execSync('npm run lint', { stdio: 'inherit', cwd: path.join(__dirname, '..', 'render') });
    log('✅ Frontend linting passed');
  } catch (err) {
    error('Frontend linting failed');
  }
  
  // Run backend formatting check
  try {
    execSync('npm run format:check', { stdio: 'inherit', cwd: __dirname });
    log('✅ Backend formatting check passed');
  } catch (err) {
    error('Backend formatting check failed');
  }
  
  log('✅ All tests and inspections passed');
}

function createPullRequest(branchName, timestamp) {
  const GH_TOKEN = process.env.GH_CICYBOT_TOKEN;
  if (!GH_TOKEN) {
    log('⚠️  GH_CICYBOT_TOKEN not found, skipping PR creation');
    return;
  }
  
  try {
    // Set GitHub token
    execSync(`export GITHUB_TOKEN=${GH_TOKEN}`, { stdio: 'inherit' });
    
    // Create PR using gh CLI
    const prTitle = `feat: ${timestamp} - ${branchName}`;
    const prBody = `## Summary
- Development updates from branch: ${branchName}
- Timestamp: ${timestamp}
- Auto-generated PR with changelog and test validation

## Changes
- See changelog for detailed changes
- All tests and code inspections have passed

## Validation
✅ Backend tests passed
✅ Frontend linting passed
✅ Code formatting validated
`;
    
    execSync(`gh pr create --title "${prTitle}" --body "${prBody}" --base main --head ${branchName}`, { 
      stdio: 'inherit' 
    });
    
    log(`✅ Pull request created for branch: ${branchName}`);
  } catch (err) {
    log(`⚠️  Failed to create PR: ${err.message}`);
  }
}

function main() {
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
      error('current.md not found');
    }

    // Read current.md content
    const content = fs.readFileSync(currentFile, 'utf8');

    // Check if there's content to archive
    if (content.trim() === '') {
      log('⚠️  current.md is empty, nothing to archive');
      process.exit(0);
    }

    // Get current branch
    const currentBranch = getCurrentBranch();
    
    // Don't allow commits to main branch directly
    if (currentBranch === 'main') {
      error('Cannot commit directly to main branch. Please create a feature/bugfix branch first.');
    }

    // Check if working directory is clean
    if (!isBranchClean()) {
      log('📝 Adding all changes to git...');
      execSync('git add .', { stdio: 'inherit' });
    }

    // Run tests and code inspection
    runTestsAndInspection();

    // Move current.md to timestamped file
    fs.renameSync(currentFile, archiveFile);
    log(`📝 Archived current.md to ${timestamp}_changelog.md`);

    // Create new empty current.md
    const template = `# Current Development Changelog

## Development Session - [Date]

### Task/Feature Description
- **Issue**: [Description of the issue or feature request]
- **Solution**: [Approach taken to solve the issue]
- **Status**: [In Progress/Completed/Blocked]

### Technical Changes
- **Component**: [app/render]
- **Files Modified**: [List of files changed]
- **Key Changes**: [Description of main technical changes]

### Testing
- **Tests Run**: [List of tests performed]
- **Results**: [Pass/Fail status]
- **Coverage**: [Any coverage notes]

### Code Quality
- **Linting**: [Pass/Fail]
- **Formatting**: [Pass/Fail]
- **Type Checking**: [Pass/Fail]

### Next Steps
- [ ] Remaining tasks
- [ ] Additional testing needed
- [ ] Documentation updates

---

## Previous Entries
[Previous changelog entries will be archived here]
`;
    fs.writeFileSync(currentFile, template);
    log('📄 Created new current.md with template');

    // Git operations
    log('🔄 Performing git operations...');

    execSync('git add .', { stdio: 'inherit' });
    execSync(`git commit -m "feat: ${timestamp} - Development updates

Branch: ${currentBranch}

$(cat ${archiveFile})"`, { stdio: 'inherit' });
    
    // Push to origin with the same branch name
    execSync(`git push origin ${currentBranch}`, { stdio: 'inherit' });

    log(`✅ Successfully committed and pushed to origin/${currentBranch}`);
    
    // Create pull request if GH_CICYBOT_TOKEN is available
    createPullRequest(currentBranch, timestamp);

  } catch (err) {
    error(`Error during commit process: ${err.message}`);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };