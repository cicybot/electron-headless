/**
 * Alternative approach using runCode instead of executeJavaScript
 */

const axios = require("axios");

async function testRunCode() {
  const rpcUrl = "http://127.0.0.1:3456/rpc";
  
  try {
    // Open a window
    console.log("Opening window...");
    const openResponse = await axios.post(rpcUrl, {
      method: "openWindow",
      params: {
        url: "https://x.com/elonmusk",
        options: { width: 1200, height: 800 }
      }
    });
    
    const windowId = openResponse.data.result.id;
    console.log("Window ID:", windowId);
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Test runCode instead of executeJavaScript
    console.log("Testing runCode...");
    const runCodeResponse = await axios.post(rpcUrl, {
      method: "runCode",
      params: {
        win_id: windowId,
        code: "() => document.title"
      }
    });
    
    console.log("RunCode response:", runCodeResponse.data);
    
    // Test tweet finding with runCode
    const tweetResponse = await axios.post(rpcUrl, {
      method: "runCode",
      params: {
        win_id: windowId,
        code: "() => { const tweets = document.querySelectorAll('[data-testid=\"tweet\"]'); return { found: tweets.length, firstContent: tweets.length > 0 ? tweets[0].innerText.substring(0, 200) : 'No tweets found' }; }"
      }
    });
    
    console.log("Tweet search response:", tweetResponse.data);
    
    // Clean up
    await axios.post(rpcUrl, {
      method: "closeWindow",
      params: {
        win_id: windowId
      }
    });
    
  } catch (error) {
    console.error("Test failed:", error.message);
    if (error.response) {
      console.error("Response data:", error.response.data);
    }
  }
}

testRunCode();