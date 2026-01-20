# Changelog: Improve content size detection for full page screenshots

## Changes Made

### Enhanced Content Size Detection
- Improved JavaScript code for measuring full page dimensions in both screenshot services
- Added fallback values and null checks for more robust size detection
- Included `window.innerWidth/Height` as additional measurement sources

## Technical Details

### Previous JavaScript Code
```javascript
({
  width: Math.max(document.body.scrollWidth, document.body.offsetWidth, ...),
  height: Math.max(document.body.scrollHeight, document.body.offsetHeight, ...)
})
```

### Improved JavaScript Code
```javascript
({
  width: Math.max(
    document.body.scrollWidth || 0,
    document.body.offsetWidth || 0,
    document.documentElement.clientWidth || 0,
    document.documentElement.scrollWidth || 0,
    document.documentElement.offsetWidth || 0,
    window.innerWidth || 0  // Added
  ),
  height: Math.max(
    document.body.scrollHeight || 0,
    document.body.offsetHeight || 0,
    document.documentElement.clientHeight || 0,
    document.documentElement.scrollHeight || 0,
    document.documentElement.offsetHeight || 0,
    window.innerHeight || 0  // Added
  )
})
```

## Why This Change
- More comprehensive page size measurement
- Better handling of edge cases where DOM elements might be undefined
- Includes viewport dimensions as fallback
- Ensures maximum accuracy for full page content capture

## Impact
- Better detection of scrollable content areas
- More reliable full-page screenshot capture
- Improved compatibility with different page structures
- Maintains no-scaling behavior for window screenshots

## Files Modified
- `app/src/services/screenshot-cache-service.js`
- `app/src/services/screenshot-service.js`

## Verification
- Build passes successfully
- Maintains existing logging for debugging
- Compatible with full-resolution screenshot requirement