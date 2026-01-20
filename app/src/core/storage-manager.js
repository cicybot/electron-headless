/**
 * Storage Manager
 * Handles persistent storage for window states and application data
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class StorageManager {
    constructor() {
        this.storageDir = path.join(os.homedir(), 'electron-mcp');
        this.windowStateFile = path.join(this.storageDir, 'window-states.json');
        this.appStateFile = path.join(this.storageDir, 'app-state.json');
    }

    /**
     * Initialize storage directory and files
     */
    async init() {
        try {
            await fs.mkdir(this.storageDir, { recursive: true });
        } catch (error) {
            console.error('Failed to create storage directory:', error);
        }
    }

    /**
     * Save window states to persistent storage
     */
    async saveWindowStates(windowStates) {
        try {
            await this.init();
            const data = {
                timestamp: Date.now(),
                windows: windowStates
            };
            await fs.writeFile(this.windowStateFile, JSON.stringify(data, null, 2));
            // console.log('Window states saved successfully');
        } catch (error) {
            console.error('Failed to save window states:', error);
        }
    }

    /**
     * Load window states from persistent storage
     */
    async loadWindowStates() {
        try {
            const data = await fs.readFile(this.windowStateFile, 'utf8');
            const parsed = JSON.parse(data);
            return parsed.windows || {};
        } catch (error) {
            console.log('No saved window states found or error loading:', error.message);
            return {};
        }
    }

    /**
     * Save application state
     */
    async saveAppState(appState) {
        try {
            await this.init();
            const data = {
                timestamp: Date.now(),
                ...appState
            };
            await fs.writeFile(this.appStateFile, JSON.stringify(data, null, 2));
            console.log('App state saved successfully');
        } catch (error) {
            console.error('Failed to save app state:', error);
        }
    }

    /**
     * Load application state
     */
    async loadAppState() {
        try {
            const data = await fs.readFile(this.appStateFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.log('No saved app state found or error loading:', error.message);
            return {};
        }
    }

    /**
     * Clear all stored data
     */
    async clearStorage() {
        try {
            await fs.unlink(this.windowStateFile);
            await fs.unlink(this.appStateFile);
            console.log('Storage cleared successfully');
        } catch (error) {
            console.error('Failed to clear storage:', error);
        }
    }
}

module.exports = new StorageManager();