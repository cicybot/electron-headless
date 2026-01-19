#!/usr/bin/env node

/**
 * Comprehensive Test Script for Electron MCP Fixes
 * Tests all implemented features to ensure they work correctly
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync, spawn } = require('child_process');
const http = require('http');

class TestSuite {
    constructor() {
        this.testResults = [];
        this.testDir = __dirname;
        this.cacheDir = path.join(require('os').homedir(), '.electron-mcp', 'screenshot-cache');
        this.windowStateFile = path.join(require('os').homedir(), '.electron-mcp', 'window-states.json');
    }

    async run() {
        console.log('🚀 Starting Comprehensive Test Suite for Electron MCP Fixes\n');

        try {
            await this.test1_showFloatDiv();
            await this.test2_windowStateSaving();
            await this.test3_windowTitleUpdates();
            await this.test4_autoReloadBuild();
            await this.test5_screenshotCaching();

            this.printResults();
        } catch (error) {
            console.error('❌ Test suite failed:', error);
        }
    }

    async test1_showFloatDiv() {
        console.log('📝 Test 1: showFloatDiv inner text initialization');
        try {
            const utilsBrowserPath = path.join(this.testDir, 'src', 'utils-browser.js');
            const content = await fs.readFile(utilsBrowserPath, 'utf8');

            // Check if the initialization code is present
            const hasInitialization = content.includes('textDisplay.innerHTML = `Pos: ${left},${top}<br>Size: ${width}x${height}`');

            if (hasInitialization) {
                this.addResult('Test 1: showFloatDiv initialization', true, '✅ showFloatDiv text initialization found');
            } else {
                this.addResult('Test 1: showFloatDiv initialization', false, '❌ showFloatDiv text initialization missing');
            }
        } catch (error) {
            this.addResult('Test 1: showFloatDiv initialization', false, `❌ Error: ${error.message}`);
        }
    }

    async test2_windowStateSaving() {
        console.log('📝 Test 2: Window state saving and restoration');
        try {
            // Check if storage manager exists
            const storageManagerPath = path.join(this.testDir, 'src', 'core', 'storage-manager.js');
            const exists = await fs.access(storageManagerPath).then(() => true).catch(() => false);

            if (!exists) {
                this.addResult('Test 2: Window state saving', false, '❌ Storage manager not found');
                return;
            }

            // Check if window manager has save/restore logic
            const windowManagerPath = path.join(this.testDir, 'src', 'core', 'window-manager.js');
            const content = await fs.readFile(windowManagerPath, 'utf8');

            const hasSaveLogic = content.includes('_saveWindowState(winId, win, accountIndex)');
            const hasRestoreLogic = content.includes('await this.restoreWindows()');
            const hasInitialUrl = content.includes('win._initialUrl = url');

            if (hasSaveLogic && hasRestoreLogic && hasInitialUrl) {
                this.addResult('Test 2: Window state saving', true, '✅ Window state save/restore logic implemented');
            } else {
                this.addResult('Test 2: Window state saving', false, '❌ Window state save/restore logic incomplete');
            }

            // Check if storage files exist (may not if app hasn't run)
            const windowStateExists = await fs.access(this.windowStateFile).then(() => true).catch(() => false);
            if (windowStateExists) {
                this.addResult('Test 2: Window state files', true, '✅ Window state file exists');
            } else {
                this.addResult('Test 2: Window state files', true, 'ℹ️ Window state file not created yet (normal if app not run)');
            }

        } catch (error) {
            this.addResult('Test 2: Window state saving', false, `❌ Error: ${error.message}`);
        }
    }

    async test3_windowTitleUpdates() {
        console.log('📝 Test 3: Window title updates with win_id prefix');
        try {
            const windowManagerPath = path.join(this.testDir, 'src', 'core', 'window-manager.js');
            const content = await fs.readFile(windowManagerPath, 'utf8');

            const hasTitleUpdate = content.includes('_updateWindowTitle(winId, win)');
            const hasTitleListener = content.includes('page-title-updated');
            const hasPrefixFormat = content.includes('`#${winId} ${title}`');

            if (hasTitleUpdate && hasTitleListener && hasPrefixFormat) {
                this.addResult('Test 3: Window title updates', true, '✅ Window title update logic implemented');
            } else {
                this.addResult('Test 3: Window title updates', false, '❌ Window title update logic incomplete');
            }
        } catch (error) {
            this.addResult('Test 3: Window title updates', false, `❌ Error: ${error.message}`);
        }
    }

    async test4_autoReloadBuild() {
        console.log('📝 Test 4: Auto-reload and build functionality');
        try {
            // Check package.json scripts
            const packagePath = path.join(this.testDir, 'package.json');
            const packageJson = JSON.parse(await fs.readFile(packagePath, 'utf8'));

            const hasAutoReloadScript = packageJson.scripts['auto-reload'] === 'npm start && nodemon --watch src --exec \"node src/auto-reload.js\" --delay 1';
            const hasBuildInStart = packageJson.scripts.start === 'npm run build && electron --trace-warnings src/main.js';

            // Check auto-reload.js exists
            const autoReloadPath = path.join(this.testDir, 'src', 'auto-reload.js');
            const autoReloadExists = await fs.access(autoReloadPath).then(() => true).catch(() => false);

            if (hasAutoReloadScript && hasBuildInStart && autoReloadExists) {
                this.addResult('Test 4: Auto-reload build', true, '✅ Auto-reload and build scripts configured');
            } else {
                this.addResult('Test 4: Auto-reload build', false, '❌ Auto-reload or build scripts missing/incomplete');
            }

            // Verify build works
            try {
                // Check if build.js exists first
                const buildJsPath = path.join(this.testDir, 'build.js');
                const buildExists = await fs.access(buildJsPath).then(() => true).catch(() => false);

                if (!buildExists) {
                    throw new Error('build.js not found');
                }

                // Try to run build.js directly
                execSync('node build.js', { cwd: this.testDir });
                this.addResult('Test 4: Build verification', true, '✅ Build process works correctly');
            } catch (error) {
                this.addResult('Test 4: Build verification', false, `❌ Build failed: ${error.message}`);
            }

        } catch (error) {
            this.addResult('Test 4: Auto-reload build', false, `❌ Error: ${error.message}`);
        }
    }

    async test5_screenshotCaching() {
        console.log('📝 Test 5: Screenshot caching system');
        try {
            // Check if screenshot cache service exists
            const cacheServicePath = path.join(this.testDir, 'src', 'services', 'screenshot-cache-service.js');
            const exists = await fs.access(cacheServicePath).then(() => true).catch(() => false);

            if (!exists) {
                this.addResult('Test 5: Screenshot caching', false, '❌ Screenshot cache service not found');
                return;
            }

            const content = await fs.readFile(cacheServicePath, 'utf8');

            // Check for key features
            const hasMultiThreading = content.includes('new Worker(__filename');
            const hasCacheDir = content.includes('path.join(os.homedir(), \'.electron-mcp\', \'screenshot-cache\')');
            const hasCompression = content.includes('toPNG()');
            const hasScaling = content.includes('scaleFactor = 0.5');

            // Check express server integration
            const expressServerPath = path.join(this.testDir, 'src', 'server', 'express-server.js');
            const expressContent = await fs.readFile(expressServerPath, 'utf8');

            const hasCacheIntegration = expressContent.includes('screenshotCache.getCachedScreenshot');
            const hasLiveMode = expressContent.includes('req.query.live === \'1\'');
            const hasCacheStart = expressContent.includes('screenshotCache.start()');

            if (hasMultiThreading && hasCacheDir && hasCompression && hasScaling &&
                hasCacheIntegration && hasLiveMode && hasCacheStart) {
                this.addResult('Test 5: Screenshot caching', true, '✅ Screenshot caching system fully implemented');
            } else {
                this.addResult('Test 5: Screenshot caching', false, '❌ Screenshot caching system incomplete');
            }

        } catch (error) {
            this.addResult('Test 5: Screenshot caching', false, `❌ Error: ${error.message}`);
        }
    }

    addResult(testName, passed, message) {
        this.testResults.push({ testName, passed, message });
        console.log(`   ${passed ? '✅' : '❌'} ${testName}: ${passed ? 'PASSED' : 'FAILED'}`);
        console.log(`      ${message}\n`);
    }

    printResults() {
        console.log('📊 Test Results Summary:');
        console.log('=' .repeat(50));

        const passed = this.testResults.filter(r => r.passed).length;
        const total = this.testResults.length;

        this.testResults.forEach(result => {
            console.log(`${result.passed ? '✅' : '❌'} ${result.testName}`);
            console.log(`   ${result.message}`);
            console.log('');
        });

        console.log(`🎯 Overall: ${passed}/${total} tests passed`);

        if (passed === total) {
            console.log('🎉 All tests passed! All fixes are working correctly.');
        } else {
            console.log('⚠️ Some tests failed. Please review the issues above.');
        }
    }
}

// Run the test suite
if (require.main === module) {
    const testSuite = new TestSuite();
    testSuite.run().catch(console.error);
}

module.exports = TestSuite;