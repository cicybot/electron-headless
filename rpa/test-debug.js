/**
 * Test script to debug executeJavaScript functionality
 */

const XRPAScraper = require('./x-elon-scraper');

async function test() {
  const scraper = new XRPAScraper();
  
  try {
    // Open a window
    await scraper.openWindow("https://x.com/elonmusk");
    await scraper.waitForLoad(5000);
    
    // Test simple JavaScript execution
    console.log("Testing simple JavaScript execution...");
    
    const result1 = await scraper.executeScript("document.title");
    console.log("Document title:", result1);
    
    const result2 = await scraper.executeScript("window.location.href");
    console.log("Current URL:", result2);
    
    const result3 = await scraper.executeScript("document.querySelectorAll('*').length");
    console.log("Total elements:", result3);
    
    const result4 = await scraper.executeScript("(function() { return { test: 'hello', count: 42 }; })()");
    console.log("Object result:", result4);
    
    // Test tweet finding
    const result5 = await scraper.executeScript(`
      (function() {
        const tweets = document.querySelectorAll('[data-testid="tweet"]');
        return {
          found: tweets.length,
          hasContent: tweets.length > 0 ? tweets[0].innerText.substring(0, 100) : 'No content'
        };
      })()
    `);
    console.log("Tweet search result:", result5);
    
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    // Clean up
    if (scraper.windowId) {
      try {
        await scraper.callRPC("closeWindow", { win_id: scraper.windowId });
      } catch (error) {
        console.error("Error closing window:", error.message);
      }
    }
  }
}

test();