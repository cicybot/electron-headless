# Current Development Changelog

## WindowDetail Refresh Logic Fix
**Type:** Bugfix
**Component:** render/WindowDetail
**Status:** Completed

### Issue Description
- WindowDetail manual refresh button ("刷新截屏") only cleared images but didn't fetch new ones
- Auto-refresh logic was mixed with manual refresh logic
- Manual refresh was non-functional when auto-refresh was disabled

### Solution Implemented
- Fixed `refreshScreenshot` function to actually fetch images with proper auth headers
- Separated manual refresh from auto-refresh responsibilities
- Manual refresh now works independently of auto-refresh toggle

### Technical Changes
- `refreshScreenshot()`: Now directly fetches images (fetch → arrayBuffer → blob → URL → update)
- `tick()`: Only handles network request polling
- `scheduleNextTick()`: Orchestrates auto-refresh cycle with both screenshot and network polling

### Result
- Manual refresh button now immediately fetches and displays new screenshots
- Auto-refresh toggle works correctly with 1-second recursive setTimeout
- No interference between manual and automatic refresh modes