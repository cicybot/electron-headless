/**
 * Screenshot Cache Service
 * Multi-threaded caching system for screenshots with compression
 */

const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const path = require('path');
const fs = require('fs').promises;
const { desktopCapturer } = require('electron');
const os = require('os');

class ScreenshotCacheService {
  constructor() {
    this.cacheDir = path.join(os.homedir(), '.electron-mcp', 'screenshot-cache');
    this.systemCacheFile = path.join(this.cacheDir, 'system.png');
    this.windowCachePrefix = path.join(this.cacheDir, 'window_');
    this.workers = [];
    this.workerCount = Math.min(os.cpus().length, 4); // Use up to 4 workers
    this.isRunning = false;
    this.cacheInterval = null;
    this.windowManager = null;
    
    this.init();
  }

  /**
   * Initialize cache service
   */
  async init() {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
      this.windowManager = require('../core/window-manager');
      console.log(`[ScreenshotCache] Initialized with ${this.workerCount} workers`);
    } catch (error) {
      console.error('[ScreenshotCache] Init failed:', error);
    }
  }

  /**
   * Start background caching
   */
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.startWorkers();
    
    // Cache screenshots every 1 second
    this.cacheInterval = setInterval(() => {
      this.scheduleScreenshotCache();
    }, 1000);
    
    console.log('[ScreenshotCache] Started background caching');
  }

  /**
   * Stop background caching
   */
  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.cacheInterval) {
      clearInterval(this.cacheInterval);
      this.cacheInterval = null;
    }
    
    this.stopWorkers();
    console.log('[ScreenshotCache] Stopped background caching');
  }

  /**
   * Start worker threads
   */
  startWorkers() {
    for (let i = 0; i < this.workerCount; i++) {
      const worker = new Worker(__filename, {
        workerData: { workerId: i }
      });
      
      worker.on('message', (result) => {
        this.handleWorkerMessage(result);
      });
      
      worker.on('error', (error) => {
        console.error(`[ScreenshotCache] Worker ${i} error:`, error);
      });
      
      worker.on('exit', (code) => {
        if (code !== 0) {
          console.error(`[ScreenshotCache] Worker ${i} stopped with exit code ${code}`);
        }
      });
      
      this.workers.push(worker);
    }
  }

  /**
   * Stop worker threads
   */
  stopWorkers() {
    this.workers.forEach(worker => {
      worker.terminate();
    });
    this.workers = [];
  }

  /**
   * Schedule screenshot caching tasks
   */
  async scheduleScreenshotCache() {
    if (!this.isRunning) return;

    const windows = this.windowManager.getAllWindows();
    const tasks = [];

    // Add system screenshot task
    tasks.push({
      type: 'system',
      cacheFile: this.systemCacheFile,
      workerId: 0
    });

    // Add window screenshot tasks
    windows.forEach(accountWindows => {
      Object.values(accountWindows).forEach(windowInfo => {
        if (windowInfo.win && !windowInfo.win.isDestroyed()) {
          const winId = windowInfo.id;
          tasks.push({
            type: 'window',
            winId: winId,
            cacheFile: `${this.windowCachePrefix}${winId}.png`,
            wcId: windowInfo.wcId
          });
        }
      });
    });

    // Process tasks asynchronously
    const promises = tasks.map(async (task, index) => {
      try {
        let buffer;
        if (task.type === 'system') {
          buffer = await this.captureSystemLive();
        } else if (task.type === 'window') {
          buffer = await this.captureWindowLive(task.winId);
        }

        const workerIndex = index % this.workerCount;
        if (this.workers[workerIndex]) {
          this.workers[workerIndex].postMessage({
            buffer,
            ...task,
            workerId: workerIndex
          });
        }
      } catch (error) {
        console.error(`[ScreenshotCache] Capture failed for ${task.type} ${task.winId || ''}:`, error);
      }
    });

    await Promise.all(promises);
  }

  /**
   * Handle worker messages
   */
  handleWorkerMessage(result) {
    if (result.error) {
      console.error(`[ScreenshotCache] Worker ${result.workerId} failed:`, result.error);
    } else {
      console.log(`[ScreenshotCache] Cached ${result.type} screenshot (${result.size} bytes)`);
    }
  }

  /**
   * Get cached screenshot
   */
  async getCachedScreenshot(type, winId = null) {
    try {
      let cacheFile;
      
      if (type === 'system') {
        cacheFile = this.systemCacheFile;
      } else if (type === 'window' && winId) {
        cacheFile = `${this.windowCachePrefix}${winId}.png`;
      } else {
        throw new Error('Invalid screenshot type');
      }

      const buffer = await fs.readFile(cacheFile);
      return buffer;
    } catch (error) {
      console.error(`[ScreenshotCache] Cache miss for ${type} ${winId || ''}:`, error.message);
      return null;
    }
  }

  /**
   * Capture live screenshot
   */
  async captureLiveScreenshot(type, winId = null) {
    if (type === 'system') {
      return await this.captureSystemLive();
    } else if (type === 'window' && winId) {
      return await this.captureWindowLive(winId);
    } else {
      throw new Error('Invalid screenshot type');
    }
  }

  /**
   * Capture live system screenshot
   */
  async captureSystemLive() {
    try {
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width: 1920, height: 1080 }
      });

      if (sources.length === 0) {
        throw new Error('No screen sources found');
      }

      // Use original size (no resize) but compress
      const image = sources[0].thumbnail;
      return image.toPNG(); // PNG format with compression
    } catch (error) {
      console.error('[ScreenshotCache] Live system capture failed:', error);
      throw error;
    }
  }

  /**
   * Capture live window screenshot
   */
  async captureWindowLive(winId) {
    try {
      const win = this.windowManager.getWindow(winId);
      if (!win || win.isDestroyed()) {
        throw new Error('Window not found');
      }

      const image = await win.webContents.capturePage();
      
      // Scale to half size for window screenshots
      const scaleFactor = 0.5;
      const scaled = image.resize({
        width: Math.floor(image.getSize().width * scaleFactor),
        height: Math.floor(image.getSize().height * scaleFactor),
      });

      return scaled.toPNG(); // PNG format with compression
    } catch (error) {
      console.error(`[ScreenshotCache] Live window ${winId} capture failed:`, error);
      throw error;
    }
  }
}

// Worker thread implementation
if (!isMainThread) {
  const fs = require('fs').promises;

  parentPort.on('message', async (task) => {
    try {
      const { buffer, cacheFile, type, winId, workerId } = task;

      // Write buffer to cache file
      await fs.writeFile(cacheFile, buffer);

      parentPort.postMessage({
        success: true,
        type: type,
        winId: winId,
        size: buffer.length,
        workerId: workerId
      });

    } catch (error) {
      parentPort.postMessage({
        success: false,
        error: error.message,
        type: task.type,
        winId: task.winId,
        workerId: task.workerId
      });
    }
  });
}

module.exports = new ScreenshotCacheService();