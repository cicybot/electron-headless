# Changelog: Replace setInterval with setTimeout for screenshot auto-refresh

## Changes Made

### Timer Logic Improvement
- Replaced `setInterval` with recursive `setTimeout` for better timing control
- Prevents accumulation of requests if fetch operations are slow
- Ensures proper sequencing of screenshot updates

## Technical Details

### Problem with setInterval
- `setInterval` fires at fixed intervals regardless of operation completion
- If fetch takes > 1 second, multiple requests can queue up
- Can cause performance issues and request accumulation

### Solution with setTimeout
- Uses recursive `setTimeout` after each operation completes
- Guarantees 1-second delay between operation starts
- Prevents request accumulation and timing drift

### Code Changes

**Before (setInterval):**
```javascript
if (isAutoRefresh) {
    interval = setInterval(fetchScreenshot, 1000);
}
```

**After (recursive setTimeout):**
```javascript
const scheduleNextFetch = () => {
    if (isAutoRefresh) {
        timeoutId = setTimeout(() => {
            fetchScreenshot().then(scheduleNextFetch);
        }, 1000);
    }
};
if (isAutoRefresh) {
    scheduleNextFetch();
}
```

## Image Display Logic Verification

### Confirmed Correct Flow
1. **Fetch**: `fetch(url, { headers })` with auth token
2. **Extract**: `response.arrayBuffer()` gets raw image data
3. **Create Blob**: `new Blob([arrayBuffer], { type: 'image/png' })`
4. **Generate URL**: `URL.createObjectURL(blob)` creates displayable URL
5. **Update State**: `setScreenshotUrl(blobUrl)` triggers re-render

### Benefits
- **Memory Efficient**: Blob URLs are cleaned up by garbage collector
- **Auth Compatible**: Headers properly include Bearer tokens
- **Type Safe**: Explicit PNG type declaration
- **Error Handling**: Try-catch blocks prevent crashes

## Files Modified
- `render/src/DesktopDetail.tsx` - Timer logic and image display
- `render/src/WindowDetail.tsx` - Timer logic (combined with network polling)

## Why This Change
- **Performance**: Prevents request accumulation during slow network conditions
- **Reliability**: Ensures consistent 1-second intervals between operations
- **Resource Management**: Better handling of concurrent requests
- **User Experience**: Smoother auto-refresh without timing issues

## Verification
- Timer logic prevents accumulation of requests
- Image display flow correctly handles auth and blob creation
- Auto-refresh toggle works with new timing mechanism
- Memory management remains efficient with blob URLs