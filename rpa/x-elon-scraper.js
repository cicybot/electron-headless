/**
 * RPA Script - X.com Elon Musk Posts Fetcher
 * Uses Electron RPC API to open x.com and fetch Elon Musk's recent posts
 */

const axios = require("axios");
const fs = require("fs").promises;
const path = require("path");

class XRPAScraper {
  constructor() {
    this.rpcUrl = "http://127.0.0.1:3456/rpc";
    this.windowId = null;
  }

  /**
   * Make RPC call to Electron server
   */
  async callRPC(method, params = {}) {
    try {
      const response = await axios.post(this.rpcUrl, {
        method,
        params,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });

      if (response.data.ok) {
        return response.data.result;
      } else {
        throw new Error(`RPC Error: ${response.data.result}`);
      }
    } catch (error) {
      console.error(`[RPC] Error calling ${method}:`, error.message);
      throw error;
    }
  }

  /**
   * Open a new browser window
   */
  async openWindow(url, options = {}) {
    console.log(`[RPA] Opening window with URL: ${url}`);
    const result = await this.callRPC("openWindow", {
      url,
      options: {
        width: 1200,
        height: 800,
        ...options,
      },
    });
    
    this.windowId = result.id;
    console.log(`[RPA] Window opened with ID: ${this.windowId}`);
    return this.windowId;
  }

  /**
   * Wait for page to load
   */
  async waitForLoad(timeout = 10000) {
    console.log(`[RPA] Waiting for page to load...`);
    await new Promise(resolve => setTimeout(resolve, timeout));
  }

  /**
   * Execute JavaScript in the browser window
   */
  async executeScript(code) {
    if (!this.windowId) {
      throw new Error("No window ID available");
    }
    
    try {
      const result = await this.callRPC("executeJavaScript", {
        win_id: this.windowId,
        code,
      });
      console.log(`[RPA] Script executed successfully, result type: ${typeof result}`);
      console.log(`[RPA] Result preview:`, result ? (typeof result === 'object' ? JSON.stringify(result, null, 2).substring(0, 200) + '...' : result) : 'null/undefined');
      return result;
    } catch (error) {
      console.error(`[RPA] Error executing script:`, error.message);
      throw error;
    }
  }

  /**
   * Navigate to Elon Musk's profile
   */
  async navigateToElonProfile() {
    console.log(`[RPA] Navigating to Elon Musk's profile...`);
    
    // Navigate to Elon Musk's profile
    await this.callRPC("loadURL", {
      win_id: this.windowId,
      url: "https://x.com/elonmusk",
    });
    
    // Wait for page to load
    await this.waitForLoad(5000);
    
    // Wait a bit more for dynamic content to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if we're on the right page
    const currentUrl = await this.callRPC("getURL", {
      win_id: this.windowId,
    });
    console.log(`[RPA] Current URL: ${currentUrl}`);
    
    const pageTitle = await this.callRPC("getTitle", {
      win_id: this.windowId,
    });
    console.log(`[RPA] Page title: ${pageTitle}`);
  }

  /**
   * Fetch recent posts from the timeline
   */
  async fetchRecentPosts() {
    console.log(`[RPA] Fetching recent posts...`);
    
    // Execute JavaScript to extract posts
    const result = await this.executeScript(`
      (function() {
        console.log('Starting tweet extraction...');
        
        // Check if we need to login
        const loginRequired = document.body.innerText.includes('Sign in') || 
                             document.body.innerText.includes('Log in') ||
                             document.querySelector('[data-testid="loginButton"]');
        
        if (loginRequired) {
          return { error: 'Login required to view posts', loginRequired: true };
        }
        
        // Look for tweet elements with multiple possible selectors
        const selectors = [
          '[data-testid="tweet"]',
          'article[data-testid="tweet"]',
          '[data-testid="tweetDetail"]',
          '.tweet',
          '[role="article"]'
        ];
        
        let tweetElements = [];
        for (const selector of selectors) {
          tweetElements = document.querySelectorAll(selector);
          if (tweetElements.length > 0) {
            console.log('Found tweets with selector:', selector, tweetElements.length);
            break;
          }
        }
        
        if (tweetElements.length === 0) {
          // Debug: what's actually on the page?
          const pageContent = {
            title: document.title,
            url: window.location.href,
            bodyText: document.body.innerText.substring(0, 500),
            allDataTestIds: Array.from(document.querySelectorAll('[data-testid]')).map(el => el.getAttribute('data-testid')),
            articleCount: document.querySelectorAll('article').length,
            divCount: document.querySelectorAll('div').length
          };
          return { error: 'No tweets found', debugInfo: pageContent };
        }
        
        const posts = [];
        
        for (let i = 0; i < Math.min(tweetElements.length, 10); i++) {
          const tweet = tweetElements[i];
          
          try {
            // Extract tweet text with multiple selectors
            let text = '';
            const textSelectors = [
              '[data-testid="tweetText"]',
              '.tweet-text',
              '[lang]',
              '.css-1dbjc4n'
            ];
            
            for (const textSelector of textSelectors) {
              const textElement = tweet.querySelector(textSelector);
              if (textElement && textElement.innerText.trim()) {
                text = textElement.innerText.trim();
                break;
              }
            }
            
            // Extract timestamp
            const timeElement = tweet.querySelector('time');
            const timestamp = timeElement ? timeElement.getAttribute('datetime') : '';
            
            // Extract engagement metrics
            const likeElement = tweet.querySelector('[data-testid="like"]');
            const retweetElement = tweet.querySelector('[data-testid="retweet"]');
            const replyElement = tweet.querySelector('[data-testid="reply"]');
            
            const likes = likeElement ? likeElement.getAttribute('aria-label') || '0' : '0';
            const retweets = retweetElement ? retweetElement.getAttribute('aria-label') || '0' : '0';
            const replies = replyElement ? replyElement.getAttribute('aria-label') || '0' : '0';
            
            // Extract images if any
            const imageElements = tweet.querySelectorAll('img[src*="media"]');
            const images = Array.from(imageElements).map(img => img.src).filter(src => src.includes('media'));
            
            if (text && text.length > 10) { // Filter out very short text
              posts.push({
                index: i + 1,
                text: text,
                timestamp: timestamp,
                likes: likes,
                retweets: retweets,
                replies: replies,
                images: images,
                extractedAt: new Date().toISOString()
              });
            }
          } catch (error) {
            console.error('Error extracting tweet:', error);
          }
        }
        
        console.log('Extracted posts:', posts.length);
        return { posts, totalFound: tweetElements.length };
      })()
    `);
    
    // Handle different response formats
    if (result && result.error) {
      console.error(`[RPA] ${result.error}`);
      if (result.debugInfo) {
        console.log(`[RPA] Debug info:`, JSON.stringify(result.debugInfo, null, 2));
      }
      return [];
    }
    
    const posts = result && result.posts ? result.posts : [];
    const totalFound = result && result.totalFound ? result.totalFound : 0;
    console.log(`[RPA] Found ${totalFound} tweet elements, extracted ${posts.length} valid posts`);
    
    // Ensure we always return an array
    return Array.isArray(posts) ? posts : [];
  }

  /**
   * Scroll down to load more posts
   */
  async scrollDown() {
    console.log(`[RPA] Scrolling down to load more posts...`);
    
    await this.executeScript(`
      window.scrollBy({
        top: 1000,
        behavior: 'smooth'
      });
    `);
    
    // Wait for new content to load
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  /**
   * Save posts to file
   */
  async savePosts(posts, filename = "elon-posts.json") {
    const filePath = path.join(__dirname, filename);
    await fs.writeFile(filePath, JSON.stringify(posts, null, 2));
    console.log(`[RPA] Posts saved to: ${filePath}`);
    
    // Also save a readable version
    const readablePath = path.join(__dirname, "elon-posts-readable.txt");
    let readableContent = `Elon Musk's Recent Posts\n`;
    readableContent += `Extracted on: ${new Date().toISOString()}\n`;
    readableContent += `Total posts: ${posts.length}\n`;
    readableContent += `${'='.repeat(50)}\n\n`;
    
    posts.forEach((post, index) => {
      readableContent += `Post ${index + 1}\n`;
      readableContent += `Timestamp: ${post.timestamp}\n`;
      readableContent += `Text: ${post.text}\n`;
      readableContent += `Engagement: ${post.likes} | ${post.retweets} | ${post.replies}\n`;
      if (post.images && post.images.length > 0) {
        readableContent += `Images: ${post.images.length}\n`;
      }
      readableContent += `${'-'.repeat(30)}\n\n`;
    });
    
    await fs.writeFile(readablePath, readableContent);
    console.log(`[RPA] Readable posts saved to: ${readablePath}`);
  }

  /**
   * Main execution function
   */
  async run() {
    try {
      console.log(`[RPA] Starting X.com Elon Musk posts scraper...`);
      
      // Step 1: Open browser window
      await this.openWindow("https://x.com");
      
      // Step 2: Wait for initial page load
      await this.waitForLoad(3000);
      
      // Step 3: Navigate to Elon Musk's profile
      await this.navigateToElonProfile();
      
      // Step 4: Scroll a bit to ensure content loads
      await this.scrollDown();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 5: Fetch recent posts
      let posts = await this.fetchRecentPosts();
      
      // Step 6: If not enough posts, scroll and fetch more
      if (posts.length < 5) {
        console.log(`[RPA] Not enough posts found, scrolling for more...`);
        await this.scrollDown();
        posts = await this.fetchRecentPosts();
      }
      
      // Step 7: Save posts
      await this.savePosts(posts);
      
      console.log(`[RPA] Successfully fetched ${posts.length} posts`);
      console.log(`[RPA] Posts summary:`);
      posts.forEach((post, index) => {
        console.log(`${index + 1}. ${post.text.substring(0, 80)}...`);
      });
      
      return posts;
      
    } catch (error) {
      console.error(`[RPA] Error during execution:`, error.message);
      throw error;
    } finally {
      // Clean up: close the window
      if (this.windowId) {
        try {
          await this.callRPC("closeWindow", { win_id: this.windowId });
          console.log(`[RPA] Window closed`);
        } catch (error) {
          console.error(`[RPA] Error closing window:`, error.message);
        }
      }
    }
  }
}

// Execute if run directly
if (require.main === module) {
  const scraper = new XRPAScraper();
  scraper.run()
    .then(posts => {
      console.log(`[RPA] Script completed successfully. Found ${posts.length} posts.`);
      process.exit(0);
    })
    .catch(error => {
      console.error(`[RPA] Script failed:`, error.message);
      process.exit(1);
    });
}

module.exports = XRPAScraper;