/**
 * Screenshot Cache Service
 * Multi-threaded caching system for screenshots with compression
 */

const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');

class ScreenshotCacheService {
  constructor() {
    this.cacheDir = path.join(os.homedir(), 'electron-mcp', 'screenshot-cache');
    this.systemCacheFile = path.join(this.cacheDir, 'system.png');
    this.windowCachePrefix = path.join(this.cacheDir, 'window_');
    this.workers = [];
    this.workerCount = Math.min(os.cpus().length, 4); // Use up to 4 workers
    this.isRunning = false;
    this.cacheInterval = null;
    this.windowManager = null;
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
      // console.log(`[ScreenshotCache] Initialized with ${this.workerCount} workers`);
    } catch (error) {
      console.error('[ScreenshotCache] Init failed:', error);
    }
  }

/**
   * Start background caching
   */
  start() {
    // Disabled to prevent worker thread errors
    // console.log('[ScreenshotCache] Service disabled');
    return;
  }

  /**
   * Stop background caching
   */
stop() {
    // Service disabled
    // console.log('[ScreenshotCache] Service disabled');
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
        // console.log(`[ScreenshotCache] Worker ${i} message:`, result);
        this.handleWorkerMessage(result);
      });
      
      worker.on('error', (error) => {
        console.error(`[ScreenshotCache] Worker ${i} error:`, error);
      });

      worker.on('messageerror', (error) => {
        console.error(`[ScreenshotCache] Worker ${i} messageerror:`, error);
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

    const windows = this.windowManager ? this.windowManager.getAllWindows() || {} : {};
    const tasks = [];

    // Add system screenshot task
    tasks.push({
      type: 'system',
      cacheFile: this.systemCacheFile,
      workerId: 0
    });

    // Add window screenshot tasks
    let windowList = [];
    if (Array.isArray(windows)) {
      windowList = windows;
    } else if (windows && typeof windows === 'object') {
      windowList = Object.values(windows);
    } else {
      windowList = [];
    }

    windowList.forEach(accountWindows => {
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

    // console.log(`[ScreenshotCache] Scheduling ${tasks.length} tasks (system + windows)`);
    
    // Process tasks asynchronously
    const promises = tasks.map(async (task, index) => {
      try {
        let buffer;
        if (task.type === 'system') {
          buffer = await this.captureSystemLive();
          // console.log(`[ScreenshotCache] Captured system screenshot, buffer size: ${buffer.length}`);
        } else if (task.type === 'window') {
          // console.log(`[ScreenshotCache] Capturing window ${task.winId}...`);
          buffer = await this.captureWindowLive(task.winId);
          // console.log(`[ScreenshotCache] Captured window ${task.winId}, buffer size: ${buffer.length}`);
        }

        const workerIndex = index % this.workerCount;
        if (this.workers[workerIndex]) {
          this.workers[workerIndex].postMessage({
            buffer,
            ...task,
            workerId: workerIndex
          });
          // console.log(`[ScreenshotCache] Sent task to worker ${workerIndex}: ${task.type} ${task.winId || ''}`);
        } else {
          console.error(`[ScreenshotCache] Worker ${workerIndex} not available`);
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
      // console.log(`[ScreenshotCache] Cached ${result.type} screenshot (${result.size} bytes)`);
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
      const { desktopCapturer } = require('electron');
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width: 1920, height: 1080 }
      });

      if (sources.length === 0) {
        throw new Error('No screen sources found');
      }

      // Use original size with JPEG compression for smaller file size
      const image = sources[0].thumbnail;
      return image.toJPEG(85); // JPEG format with 85% quality for better compression
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

      // Get the full page content size (including scrollable area)
      const contentSize = await win.webContents.executeJavaScript(`
        ({
          width: Math.max(
            document.body.scrollWidth || 0,
            document.body.offsetWidth || 0,
            document.documentElement.clientWidth || 0,
            document.documentElement.scrollWidth || 0,
            document.documentElement.offsetWidth || 0,
            window.innerWidth || 0
          ),
          height: Math.max(
            document.body.scrollHeight || 0,
            document.body.offsetHeight || 0,
            document.documentElement.clientHeight || 0,
            document.documentElement.scrollHeight || 0,
            document.documentElement.offsetHeight || 0,
            window.innerHeight || 0
          )
        })
      `);

      console.log(`[Screenshot] Window ${winId} - Content size: ${contentSize.width}x${contentSize.height}`);

      // Capture the full page content at its actual size
      const image = await win.webContents.capturePage({
        x: 0,
        y: 0,
        width: contentSize.width,
        height: contentSize.height
      });

      // Log the captured size for debugging
      const capturedSize = image.getSize();
      const bounds = win.getBounds();
      console.log(`[Screenshot] Window ${winId} bounds: ${bounds.width}x${bounds.height}, content: ${contentSize.width}x${contentSize.height}, captured: ${capturedSize.width}x${capturedSize.height}`);

      // Return full resolution image with JPEG compression
      console.log(`[Screenshot] Returning full resolution: ${capturedSize.width}x${capturedSize.height}`);

      return image.toJPEG(85); // JPEG format with 85% quality for better compression
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

      console.log(`[ScreenshotCache-Worker ${workerId}] Processing task:`, { type, winId, cacheFile, bufferSize: buffer ? buffer.length : 0 });

      // Write buffer to cache file
      await fs.writeFile(cacheFile, buffer);

      console.log(`[ScreenshotCache-Worker ${workerId}] Successfully wrote ${buffer.length} bytes to ${cacheFile}`);

      parentPort.postMessage({
        success: true,
        type: type,
        winId: winId,
        size: buffer.length,
        workerId: workerId
      });

    } catch (error) {
      console.error(`[ScreenshotCache-Worker ${task.workerId}] Error:`, error);
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