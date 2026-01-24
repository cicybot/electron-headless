/**
 * Direct RPC test to debug executeJavaScript functionality
 */

const axios = require("axios");

async function testDirectRPC() {
  const rpcUrl = "http://127.0.0.1:3456/rpc";
  
  try {
    // First open a window
    console.log("Opening window...");
    const openResponse = await axios.post(rpcUrl, {
      method: "openWindow",
      params: {
        url: "https://x.com/elonmusk",
        options: { width: 1200, height: 800 }
      }
    });
    
    console.log("Open window response:", openResponse.data);
    const windowId = openResponse.data.result.id;
    console.log("Window ID:", windowId);
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Test simple executeJavaScript
    console.log("Testing executeJavaScript...");
    const execResponse = await axios.post(rpcUrl, {
      method: "executeJavaScript",
      params: {
        win_id: windowId,
        code: "document.title"
      }
    });
    
    console.log("Execute JavaScript response:", execResponse.data);
    
    // Test another simple case
    const execResponse2 = await axios.post(rpcUrl, {
      method: "executeJavaScript",
      params: {
        win_id: windowId,
        code: "(function() { return 'hello world'; })()"
      }
    });
    
    console.log("Execute JavaScript 2 response:", execResponse2.data);
    
    // Test getting URL
    const urlResponse = await axios.post(rpcUrl, {
      method: "getURL",
      params: {
        win_id: windowId
      }
    });
    
    console.log("Get URL response:", urlResponse.data);
    
    // Test getting title
    const titleResponse = await axios.post(rpcUrl, {
      method: "getTitle",
      params: {
        win_id: windowId
      }
    });
    
    console.log("Get title response:", titleResponse.data);
    
    // Clean up
    await axios.post(rpcUrl, {
      method: "closeWindow",
      params: {
        win_id: windowId
      }
    });
    
    console.log("Test completed");
    
  } catch (error) {
    console.error("Test failed:", error.message);
    if (error.response) {
      console.error("Response data:", error.response.data);
    }
  }
}

testDirectRPC();