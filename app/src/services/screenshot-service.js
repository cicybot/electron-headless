/**
 * Screenshot Service
 * Handles screenshot capture and processing
 */

const { desktopCapturer } = require('electron');

class ScreenshotService {
  constructor() {
    this.appManager = require('../core/app-manager');
  }

  /**
   * Capture screenshot from webContents
   */
  async captureScreenshot(wc, options = {}) {
    if (!wc) {
      throw new Error('WebContents not available');
    }

    try {
      const image = await wc.capturePage();

      // Apply default scaling (50%)
      const scaleFactor = options.scaleFactor || 0.5;
      const scaled = image.resize({
        width: Math.floor(image.getSize().width * scaleFactor),
        height: Math.floor(image.getSize().height * scaleFactor),
      });

      return scaled;
    } catch (error) {
      console.error('[ScreenshotService] Capture failed:', error);
      throw new Error(`Screenshot capture failed: ${error.message}`);
    }
  }

  /**
   * Get screenshot as buffer
   */
  async getWindowScreenshotBuffer(wc, format = 'png', options = {}) {
    const image = await this.captureScreenshot(wc, options);

    switch (format.toLowerCase()) {
      case 'png':
        return image.toPNG();
      case 'jpeg':
      case 'jpg':
        return image.toJPEG(options.quality || 90);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Save screenshot to file
   */
  async saveScreenshot(wc, filePath, format = 'png', options = {}) {
    const buffer = await this.getWindowScreenshotBuffer(wc, format, options);

    const fs = require('fs').promises;
    await fs.writeFile(filePath, buffer);

    return {
      success: true,
      filePath,
      size: buffer.length,
      format
    };
  }

  /**
   * Get screenshot dimensions
   */
  async getWindowScreenshotInfo(wc) {
    if (!wc) {
      return null;
    }

    try {
      const image = await wc.capturePage();
      const size = image.getSize();

      return {
        width: size.width,
        height: size.height,
        aspectRatio: size.width / size.height
      };
    } catch (error) {
      console.error('[ScreenshotService] Info retrieval failed:', error);
      return null;
    }
  }

  /**
   * Capture system/desktop screenshot
   */
  async captureSystemScreenshot(options = {}) {
    try {
      const sources = await desktopCapturer.getSources({
        types: ['screen', 'window'],
        thumbnailSize: options.thumbnailSize || { width: 1920, height: 1080 }
      });

      if (sources.length === 0) {
        throw new Error('No screen sources found');
      }

      const image = sources[0].thumbnail;

      if (options.scaleFactor) {
        const scaled = image.resize({
          width: Math.floor(image.getSize().width * options.scaleFactor),
          height: Math.floor(image.getSize().height * options.scaleFactor),
        });
        return scaled;
      }

      return image;
    } catch (error) {
      console.error('[ScreenshotService] System capture failed:', error);
      throw new Error(`System screenshot capture failed: ${error.message}`);
    }
  }

  /**
   * Get system screenshot as buffer
   */
  async getSystemScreenshotBuffer(format = 'png', options = {}) {
    const image = await this.captureSystemScreenshot(options);

    switch (format.toLowerCase()) {
      case 'png':
        return image.toPNG();
      case 'jpeg':
      case 'jpg':
        return image.toJPEG(options.quality || 90);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Save system screenshot to file
   */
  async saveSystemScreenshot(filePath, format = 'png', options = {}) {
    const buffer = await this.getSystemScreenshotBuffer(format, options);

    const fs = require('fs').promises;
    await fs.writeFile(filePath, buffer);

    return {
      success: true,
      filePath,
      size: buffer.length,
      format
    };
  }
}

module.exports = new ScreenshotService();