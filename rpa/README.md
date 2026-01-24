# RPA Scripts - Electron MCP

This directory contains RPA (Robotic Process Automation) scripts that use the Electron MCP RPC API to automate browser interactions.

## X.com Elon Musk Posts Scraper

The `x-elon-scraper.js` script automates the process of:
1. Opening a browser window using Electron RPC API
2. Navigating to Elon Musk's X.com profile
3. Extracting recent posts from his timeline
4. Saving the posts to JSON and text files

### Prerequisites

1. Make sure the Electron MCP application is running:
   ```bash
   npm start
   ```

2. Install dependencies in the RPA directory:
   ```bash
   cd rpa
   npm install
   ```

### Usage

Run the scraper:
```bash
npm start
```

Or directly:
```bash
node x-elon-scraper.js
```

### Output

The script generates two files:
- `elon-posts.json` - Raw JSON data with all post details
- `elon-posts-readable.txt` - Human-readable text format

### What It Extracts

For each post, the script captures:
- Post text content
- Timestamp
- Engagement metrics (likes, retweets, replies)
- Attached media URLs
- Extraction time

### How It Works

1. **Window Management**: Uses `openWindow` RPC method to create a new browser window
2. **Navigation**: Uses `loadURL` to navigate to X.com and Elon's profile
3. **Content Extraction**: Uses `executeJavaScript` to run DOM scraping in the browser context
4. **Data Persistence**: Saves extracted data locally in multiple formats

### RPC API Methods Used

- `openWindow` - Creates new browser window
- `loadURL` - Navigates to specified URL
- `executeJavaScript` - Runs JavaScript in the browser context
- `closeWindow` - Closes the browser window

### Error Handling

The script includes comprehensive error handling for:
- Network timeouts
- Missing elements
- RPC call failures
- File I/O errors

### Customization

You can modify the script to:
- Target different profiles (change the URL)
- Extract more data points
- Save in different formats
- Add additional automation steps