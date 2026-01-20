# Changelog: Add manual screenshot refresh controls to WindowDetail and DesktopDetail

## Changes Made

### UI Controls Added
- Added "刷新截屏" (Refresh Screenshot) button to both WindowDetail and DesktopDetail pages
- Added toggle button for "自动刷新" (Auto Refresh) functionality in both pages
- Modified default behavior to disable auto-refresh by default

## Technical Details

### WindowDetail.tsx Changes
- Enabled `isAutoRefresh` state (removed eslint-disable comment)
- Added refresh button that calls `refreshScreenshot()`
- Added toggle button with dynamic styling based on auto-refresh state
- Maintained existing auto-refresh logic when enabled

### DesktopDetail.tsx Changes
- Added `isAutoRefresh` state with default `false`
- Added `refreshScreenshot()` function to manually trigger screenshot updates
- Modified auto-refresh useEffect to only run when `isAutoRefresh` is true
- Added UI buttons in the navigation bar

### Button Styling
- Refresh button: Standard `btn` class
- Auto-refresh toggle: `btn-success` when active, `btn-secondary` when inactive
- Dynamic text: "开启自动刷新" / "停止自动刷新"

## Why This Change
- User requested manual control over screenshot refreshing
- Prevents unnecessary automatic refreshes that may consume bandwidth
- Gives users control over when to update screenshots
- Improves performance by defaulting to manual refresh

## Default Behavior
- **Before**: Auto-refresh enabled by default (every 1 second)
- **After**: Manual refresh only by default, optional auto-refresh toggle

## Files Modified
- `render/src/WindowDetail.tsx`
- `render/src/DesktopDetail.tsx`

## User Experience
- Users can manually refresh screenshots when needed
- Auto-refresh can be toggled on/off as required
- Clear visual feedback for button states
- Maintains existing functionality when auto-refresh is enabled