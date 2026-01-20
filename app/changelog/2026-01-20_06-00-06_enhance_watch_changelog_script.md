# Changelog: Enhance watch-changelog script with initial start and logging

## Changes Made

### Package.json Updates
- Modified `watch-changelog` script to include initial application start
- Added changelog change logging when files are modified
- Enhanced user feedback during development workflow

## Script Changes
**Before:**
```json
"watch-changelog": "nodemon --watch changelog/*.md --exec \"npm start\" --delay 1"
```

**After:**
```json
"watch-changelog": "npm start & nodemon --watch changelog/*.md --exec \"echo '📝 Changelog updated:' && git log --oneline -1 && echo '🔄 Restarting application...' && npm start\" --delay 1"
```

## New Features
- **Initial Start**: Automatically starts the application when the script begins
- **Change Logging**: Shows what changelog changes were made using `git log --oneline -1`
- **User Feedback**: Clear console messages indicating changelog updates and restarts
- **Background Process**: Runs initial start in background while watching continues

## Why This Change
- Provides immediate application startup when starting development
- Gives clear feedback about what changes triggered restarts
- Improves developer experience with better logging and status updates

## Technical Details
- Uses `&` to run initial start in background
- Leverages git log to show recent changelog commits
- Maintains 1-second delay to prevent excessive restarts
- Preserves existing nodemon watching functionality