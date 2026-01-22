#!/usr/bin/env node

/**
 * Code Inspection and Testing Script
 * Runs comprehensive tests and code quality checks
 */

const { execSync } = require('child_process');
const path = require('path');

function log(message) {
  console.log(`\n🔍 ${message}`);
}

function success(message) {
  console.log(`\n✅ ${message}`);
}

function error(message) {
  console.error(`\n❌ ${message}`);
  process.exit(1);
}

function warning(message) {
  console.log(`\n⚠️  ${message}`);
}

function exec(command, description, cwd = null) {
  log(description);
  try {
    const options = { stdio: 'inherit' };
    if (cwd) {
      options.cwd = cwd;
    }
    execSync(command, options);
    success(`${description} - PASSED`);
    return true;
  } catch (err) {
    error(`${description} - FAILED: ${err.message}`);
    return false;
  }
}

function runBackendTests() {
  log('🧪 Running Backend Tests');
  
  const results = {
    unit: false,
    integration: false,
    coverage: false
  };
  
  // Run unit tests
  try {
    execSync('npm test', { stdio: 'inherit', cwd: __dirname });
    results.unit = true;
    success('Unit tests - PASSED');
  } catch (err) {
    error('Unit tests - FAILED');
  }
  
  // Check coverage if available
  try {
    execSync('npm run test:coverage', { stdio: 'inherit', cwd: __dirname });
    results.coverage = true;
    success('Coverage check - PASSED');
  } catch (err) {
    warning('Coverage check - NOT AVAILABLE or FAILED');
  }
  
  return results;
}

function runFrontendTests() {
  log('🎨 Running Frontend Tests');
  
  const results = {
    lint: false,
    typecheck: false,
    build: false
  };
  
  const renderDir = path.join(__dirname, '..', 'render');
  
  // Run ESLint
  try {
    execSync('npm run lint', { stdio: 'inherit', cwd: renderDir });
    results.lint = true;
    success('ESLint - PASSED');
  } catch (err) {
    error('ESLint - FAILED');
  }
  
  // Run TypeScript type checking
  try {
    execSync('npx tsc --noEmit', { stdio: 'inherit', cwd: renderDir });
    results.typecheck = true;
    success('TypeScript check - PASSED');
  } catch (err) {
    error('TypeScript check - FAILED');
  }
  
  // Test build
  try {
    execSync('npm run build', { stdio: 'inherit', cwd: renderDir });
    results.build = true;
    success('Build test - PASSED');
  } catch (err) {
    error('Build test - FAILED');
  }
  
  return results;
}

function runCodeQualityChecks() {
  log('📋 Running Code Quality Checks');
  
  const results = {
    format: false,
    security: false,
    dependencies: false
  };
  
  // Check backend formatting
  try {
    execSync('npm run format:check', { stdio: 'inherit', cwd: __dirname });
    results.format = true;
    success('Code formatting - PASSED');
  } catch (err) {
    error('Code formatting - FAILED');
  }
  
  // Security audit
  try {
    execSync('npm audit --audit-level moderate', { stdio: 'inherit', cwd: __dirname });
    results.security = true;
    success('Security audit - PASSED');
  } catch (err) {
    warning('Security audit - WARNINGS or FAILURES');
  }
  
  // Check frontend dependencies
  try {
    const renderDir = path.join(__dirname, '..', 'render');
    execSync('npm audit --audit-level moderate', { stdio: 'inherit', cwd: renderDir });
    results.dependencies = true;
    success('Dependency check - PASSED');
  } catch (err) {
    warning('Dependency check - WARNINGS or FAILURES');
  }
  
  return results;
}

function checkChangelog() {
  log('📝 Checking Changelog');
  
  const changelogPath = path.join(__dirname, 'changelog', 'current.md');
  const fs = require('fs');
  
  if (!fs.existsSync(changelogPath)) {
    error('Changelog file not found: app/changelog/current.md');
    return false;
  }
  
  const content = fs.readFileSync(changelogPath, 'utf8');
  
  // Check if changelog has meaningful content
  const hasContent = content.includes('Issue:') && 
                    content.includes('Solution:') && 
                    content.includes('Technical Changes:');
  
  if (!hasContent) {
    warning('Changelog exists but may be incomplete. Please update app/changelog/current.md');
    return false;
  }
  
  success('Changelog check - PASSED');
  return true;
}

function generateReport(results) {
  log('\n📊 INSPECTION REPORT');
  console.log('='.repeat(50));
  
  let allPassed = true;
  
  // Backend results
  console.log('\n🔧 Backend:');
  console.log(`  Unit Tests: ${results.backend.unit ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Coverage: ${results.backend.coverage ? '✅ PASS' : '⚠️  N/A'}`);
  
  // Frontend results
  console.log('\n🎨 Frontend:');
  console.log(`  ESLint: ${results.frontend.lint ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  TypeScript: ${results.frontend.typecheck ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Build: ${results.frontend.build ? '✅ PASS' : '❌ FAIL'}`);
  
  // Code quality results
  console.log('\n📋 Code Quality:');
  console.log(`  Formatting: ${results.quality.format ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Security: ${results.quality.security ? '✅ PASS' : '⚠️  WARNINGS'}`);
  console.log(`  Dependencies: ${results.quality.dependencies ? '✅ PASS' : '⚠️  WARNINGS'}`);
  
  // Changelog
  console.log('\n📝 Documentation:');
  console.log(`  Changelog: ${results.changelog ? '✅ PASS' : '❌ FAIL'}`);
  
  // Overall status
  const criticalPassed = results.backend.unit && 
                        results.frontend.lint && 
                        results.frontend.typecheck && 
                        results.frontend.build && 
                        results.quality.format;
  
  console.log('\n🎯 Overall Status:');
  if (criticalPassed) {
    success('ALL CRITICAL CHECKS PASSED - Ready for commit!');
  } else {
    error('SOME CRITICAL CHECKS FAILED - Fix issues before committing');
    allPassed = false;
  }
  
  return allPassed;
}

function main() {
  log('🚀 Starting Code Inspection and Testing');
  
  const results = {
    backend: runBackendTests(),
    frontend: runFrontendTests(),
    quality: runCodeQualityChecks(),
    changelog: checkChangelog()
  };
  
  const allPassed = generateReport(results);
  
  if (allPassed) {
    success('\n🎉 All inspections passed! You can now commit your changes.');
    process.exit(0);
  } else {
    error('\n💥 Some inspections failed. Please fix the issues above before committing.');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main, runBackendTests, runFrontendTests, runCodeQualityChecks };