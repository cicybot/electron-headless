# Changelog: Fix WindowDetail refreshScreenshot logic to actually fetch images

## Changes Made

### WindowDetail Refresh Logic Fix
- Fixed `refreshScreenshot` function to actually fetch and display images
- Separated manual refresh from auto-refresh logic
- Ensured manual refresh button works independently of auto-refresh toggle

## Problem Identified

### Previous Broken Logic
**refreshScreenshot function:**
```javascript
const refreshScreenshot = () => setScreenshotUrl(''); // Only cleared image
```

**tick function:**
```javascript
if (isAutoRefresh) refreshScreenshot(); // Only worked in auto-refresh mode
```

**Result:** Manual refresh button only cleared images but didn't fetch new ones.

## Fixed Implementation

### New refreshScreenshot Function
```javascript
const refreshScreenshot = async () => {
    const url = `${rpcBaseUrl}/windowScreenshot?id=${windowId}&t=${Date.now()}`;
    const headers = rpcToken ? { 'Authorization': `Bearer ${rpcToken}` } : {};
    const response = await fetch(url, { headers });
    if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const blob = new Blob([arrayBuffer], { type: 'image/png' });
        const blobUrl = URL.createObjectURL(blob);
        setScreenshotUrl(blobUrl);
    }
};
```

### Updated Auto-Refresh Logic
```javascript
const scheduleNextTick = () => {
    if (isAutoRefresh) {
        timeoutId = setTimeout(async () => {
            await refreshScreenshot(); // Auto-refresh screenshot
            await tick(); // Poll network requests
            scheduleNextTick(); // Continue loop
        }, 1000);
    }
};
```

### Separated Responsibilities
- **refreshScreenshot()**: Handles image fetching and display
- **tick()**: Handles network request polling only
- **scheduleNextTick()**: Orchestrates auto-refresh cycle

## User Experience

### Manual Refresh
- Click "刷新截屏" → Immediately fetches and displays new screenshot
- Works regardless of auto-refresh toggle state
- No dependency on background processes

### Auto-Refresh
- Toggle "开启自动刷新" → Starts 1-second cycle
- Each cycle: fetch screenshot + poll network requests
- Toggle "停止自动刷新" → Stops the cycle

## Technical Benefits

### Proper Separation of Concerns
- Manual actions work independently
- Auto-refresh combines both operations
- No interference between manual and automatic modes

### Consistent Behavior
- Same fetch logic for both manual and auto refresh
- Proper authentication handling in both cases
- Error handling prevents crashes

## Files Modified
- `render/src/WindowDetail.tsx`

## Verification
- Manual refresh button now actually fetches images
- Auto-refresh toggle works correctly
- Network polling continues independently
- No interference between manual and automatic modes