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
      // Get the full page content size (including scrollable area)
      const contentSize = await wc.executeJavaScript(`
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

      console.log(`[ScreenshotService] Content size: ${contentSize.width}x${contentSize.height}`);

      // Capture the full page content at its actual size
      const image = await wc.capturePage({
        x: 0,
        y: 0,
        width: contentSize.width,
        height: contentSize.height
      });

      // Return full resolution image with JPEG compression
      return image.toJPEG(85); // JPEG format with 85% quality
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