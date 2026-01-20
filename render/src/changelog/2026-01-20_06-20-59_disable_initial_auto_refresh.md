# Changelog: Remove auto-refresh on page load for WindowDetail and DesktopDetail

## Changes Made

### Disabled Initial Auto-Refresh
- Removed automatic screenshot fetching when pages load
- Users must now manually click refresh or enable auto-refresh
- Complete elimination of unwanted automatic refreshes

## Technical Details

### DesktopDetail.tsx Changes
**Before:**
```javascript
// Initial fetch (only if not auto-refreshing)
if (!isAutoRefresh) {
    fetchScreenshot();
}
```

**After:**
```javascript
// No initial fetch - user must manually refresh or enable auto-refresh
```

### WindowDetail.tsx Changes
**Before:**
```javascript
// Initial fetch
tick();
const interval = setInterval(tick, 1000);
```

**After:**
```javascript
// No initial fetch - only poll when auto-refresh is enabled
const interval = isAutoRefresh ? setInterval(tick, 1000) : null;
```

## Why This Change
- User requested no automatic refresh when opening pages
- Prevents unnecessary API calls and bandwidth usage
- Gives users complete control over when screenshots are fetched
- Eliminates potential performance issues on page load

## Behavior Changes

### Before Opening Page
- Page loads → Automatic screenshot fetch → Display image
- Continuous polling for network requests (WindowDetail)

### After Opening Page
- Page loads → No automatic actions → Blank screen
- User must click "刷新截屏" to load first screenshot
- Network polling only when auto-refresh is enabled

## Impact
- **Performance**: Faster page load (no initial API calls)
- **Bandwidth**: Reduced unnecessary network requests
- **Control**: Users have complete control over refresh timing
- **UX**: Clear separation between page loading and content fetching

## Files Modified
- `render/src/DesktopDetail.tsx`
- `render/src/WindowDetail.tsx`

## Verification
- Pages load without automatic screenshot fetching
- Manual refresh buttons work correctly
- Auto-refresh toggle functions as expected
- Network polling respects auto-refresh setting