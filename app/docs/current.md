# Current Development Changelog

## Development Session - 2026-01-23

### Task/Feature Description
- **Status**: Completed

### Technical Changes
- **Component**: app
- **Files Modified**: 
  - `RPC-METHODS-MAPPING.md` - Comprehensive RPC methods mapping documentation
- **Key Changes**: 
  - Cross-platform compatibility through Python module instead of macOS-specific tools
  - Maintained same RPC API endpoints and parameter structures
  - Enhanced Python code generation with proper string escaping

### Implementation Details
- **Service Architecture**: Python module wrapper using `child_process.spawn()` for `python3 -c` execution
- **Methods Implemented**: 
  - Mouse: `click()`, `move()`
  - Keyboard: `type()`, `press()`, `hotkey()`, `pressEnter()`, `pressBackspace()`, `pressSpace()`, `pressEsc()`, `paste()`
  - Aliases: `write()`, `text()` for compatibility
- **Python Code Generation**: Dynamic Python script creation with proper imports and error handling
- **String Escaping**: Python string escaping for special characters and injection prevention

### Dependencies
- **Node.js**: Uses built-in `child_process` and `util` modules only
- **No New npm Packages**: Zero additional Node.js dependencies

### API Compatibility
- **Parameters**: Same parameter structure as previous implementation
- **Return Values**: Maintained existing response formats
- **Error Handling**: Enhanced Python error propagation with context

### RPC Methods Mapping
- **Comprehensive Documentation**: Created `RPC-METHODS-MAPPING.md` with complete method mappings
- **Utils.js Functions**: All 65+ RPC methods mapped to utility functions
- **MCP Tools**: 60+ MCP tools mapped to RPC methods with Zod schemas
- **Cross-Reference**: Three-way mapping between RPC → Utils.js → MCP tools

### Code Quality
- **Linting**: Pass
- **Formatting**: Pass (Prettier applied)
- **Testing**: Comprehensive unit tests with Python code generation validation
- **Documentation**: Full JSDoc comments and mapping documentation
- **Error Handling**: Python try-catch with proper error propagation

### Testing
- **Unit Tests**: Updated test suite for Python module integration
- **Test Coverage**: 
  - Service import and method availability
  - Python string escaping functionality
  - Parameter validation for all methods
  - Python code generation validation
  - Screenshot JSON parsing
- **Results**: All tests passing (13/13)
- **Mock Strategy**: Mock Python execution for safe testing

### Cross-Platform Benefits
- **Consistent Behavior**: Same automation capabilities across platforms

### MCP Tools Enhancement
- **Schema Validation**: Zod schema for hotkey key combinations
- **Tool Coverage**: Complete 13 PyAutoGUI tools now available via MCP
- **Integration**: Seamless integration with existing MCP framework

### Performance Characteristics
- **Python Overhead**: Slight overhead from Python process spawning (acceptable for automation)
- **Memory Usage**: Python process memory isolated and cleaned up after execution
- **Execution Speed**: Comparable to previous script-based approach with better error handling

---

## Development Session - 2026-01-22

### Task/Feature Description
- **Issue**: Mac screenshots need to be reduced by half size via windowScreenshot endpoint
- **Solution**: Implemented platform-specific image resizing for Mac screenshots
- **Status**: Completed

### Technical Changes
- **Component**: app
- **Files Modified**: 
  - `src/services/screenshot-cache-service.js` - Added Mac-specific resizing logic
  - `package.json` - Added sharp dependency for image processing
  - `tests/screenshot-resize.test.js` - Added test for screenshot resizing functionality
- **Key Changes**: 
  - Modified `captureWindowLive()` to detect Mac platform and resize images by 50%
  - Modified `captureSystemDisplayLive()` to apply same resizing for system screenshots
  - Used sharp library for high-quality image resizing with JPEG compression
  - Maintained existing behavior for non-Mac platforms

### Implementation Details
- **Platform Detection**: Uses `process.platform === 'darwin'` to identify Mac systems
- **Resizing Logic**: 
  - Window screenshots: Calculate target dimensions as half of content size
  - System screenshots: Resize captured thumbnail to half size
  - Applied using sharp.resize() with JPEG 85% quality for optimal compression
- **Quality Preservation**: Maintains aspect ratio and image quality while reducing size

### Dependencies Added
- **sharp**: High-performance image processing library for Node.js
  - Used for resizing PNG screenshots to compressed JPEG format
  - Provides better quality than built-in Node.js image processing
  - Handles both window and system screenshot resizing

### Testing
- **Tests Run**: Created and verified screenshot resize functionality
- **Results**: All tests passing (platform detection, sharp availability, method definitions)
- **Platform Tested**: Confirmed working on macOS (darwin platform)

### API Endpoints Affected
- **/windowScreenshot**: Now returns resized images on Mac (50% original size)
- **/displayScreenshot**: Also resized on Mac for consistency
- **Backward Compatibility**: Non-Mac platforms continue to receive full-size screenshots

### Code Quality
- **Linting**: Pass
- **Formatting**: Pass (Prettier applied)
- **Error Handling**: Maintained existing error handling with graceful degradation

### Critical Fix - Window Bounds vs Content Size
- **Issue Identified**: Screenshots were capturing document content size instead of window bounds
- **Problem**: Document (2136×1506) ≠ Window bounds (1068×781), causing mismatch
- **Root Cause**: Using `document.body.scrollHeight` instead of actual window dimensions
- **Fix Applied**: Changed to use `win.getBounds()` for accurate window dimensions
- **Result**: Screenshots now match window bounds correctly (1068×781 → 534×376 on Mac)

### Feature Change - Remove Mac Screenshot Reduction
- **User Request**: Remove Mac-specific 50% size reduction for screenshots
- **Previous Behavior**: Mac screenshots were reduced to 50% size
- **New Behavior**: All platforms use original window size (no reduction)
- **Implementation**: Removed Mac-specific resizing logic from both window and system screenshots
- **Impact**: `https://colab-3456.cicy.de5.net/windowScreenshot?id=3&t=1769110808732` now returns full-size images on all platforms

---

## Previous Entry - 2026-01-22

### Task/Feature Description
- **Issue**: Fix showPromptArea and hidePromptArea functions - they were empty and not functional
- **Solution**: Implemented complete prompt area functionality with draggable textarea, resize handles, submit/cancel buttons, and keyboard shortcuts
- **Status**: Completed

### Technical Changes
- **Component**: app
- **Files Modified**: 
  - `src/utils-browser.js` - Main implementation
  - `chrome-extension/content.js` - Chrome extension implementation
  - `changelog/current.md` - Documentation update
- **Key Changes**: 
  - Created 600x200px draggable prompt area with textarea
  - Added resize handles on all four corners
  - Implemented Submit button that alerts value and clears textarea
  - Added Cancel button to close prompt area
  - Added keyboard shortcuts: Enter to submit (non-empty), Enter+Shift to allow newlines
  - Implemented drag functionality via header
  - Added proper styling with z-index and visual feedback

### Testing
- **Tests Run**: Jest tests for showPromptArea functionality
- **Results**: All 5 tests passing (after UI improvements)
- **Coverage**: Tests cover creation, keyboard events, empty value handling, duplicate prevention

### UI Improvements
- **Dark Theme**: Applied black background with white text for better readability
- **Enhanced Contrast**: 
  - Main container: #1a1a1a background with #444 borders
  - Header: #2a2a2a background with white text
  - Textarea: #0a0a0a background with white text, outline: none
  - Buttons: Styled for dark theme (Submit: #007acc, Cancel: #555)
  - Resize handles: #666 color for better visibility

### Code Quality
- **Linting**: Pass
- **Formatting**: Pass (Prettier applied)
- **Type Checking**: N/A (JavaScript files)

### New Features Added
- **Close Button**: Added × close button in header that closes prompt area and shows icon
- **Side Icon**: Small circular icon (💬) appears on right side when prompt area is closed
- **Icon Interactions**: 
  - Icon positioned at 50% vertical, 20px from right edge
  - Hover effects with scale and color transitions
  - Click icon to reopen prompt area
  - Tooltip "Open Prompt Area (Drag to move)" on hover
- **Draggable Icon**: 
  - Full drag and drop functionality for the side icon
  - Viewport boundary constraints to keep icon visible
  - Smart cursor changes (move → grabbing during drag)
  - Drag vs click detection to prevent accidental opens
  - Temporarily disables hover effects during dragging

### UI Enhancements
- **Close Button Styling**: Gray × button in header with proper cursor
- **Icon Design**: Circular dark theme icon matching prompt area style
- **Smooth Animations**: CSS transitions for hover states (0.3s ease)
- **Z-Index Management**: Icon at 2147483646, prompt area at 2147483647
- **Drag Interaction Design**:
  - Move cursor by default, grabbing cursor during drag
  - User-select: none to prevent text selection during drag
  - Boundary detection keeps icon fully within viewport
  - Intelligent positioning system (left/top based during drag)

### Default Behavior Change
- **Icon Default Display**: Small floating icon now appears by default on page load
- **Click to Open**: Users click the side icon to open the prompt area
- **Auto-Initialization**: Icon automatically shows 100ms after page load
- **Cleaner UX**: Less intrusive interface with on-demand prompt area

### Critical Bug Fix - Default Display Issue
- **Root Cause**: Found automatic `showPromptArea()` call in `utils-extension.js:5`
- **Extension Override**: Extension was forcing large prompt area to show on page load
- **Fix Applied**: Changed `utilsBrowser.showPromptArea()` to `utilsBrowser.showPromptIcon()`
- **Result**: Now correctly shows only small icon by default

### Toggle Functionality - Icon Click Behavior
- **Smart Toggle**: Icon now checks if prompt area exists before acting
- **Open Logic**: If no prompt area → `showPromptArea()`
- **Close Logic**: If prompt area exists → `hidePromptArea()`
- **Persistent Icon**: Icon remains visible at all times (no auto-hide/show)
- **Clean UX**: Single click to toggle between open/close states

### Bug Fixes
- **Drag Detection Bug**: Fixed issue where dragging icon would accidentally open prompt area
- **Move Threshold**: Added 5px movement threshold to distinguish drag from click
- **Syntax Errors**: Fixed JavaScript syntax issues causing test failures
- **Function Structure**: Properly organized showPromptArea function structure
- **Auto-display Conflict**: Resolved conflict between auto-icon display and extension initialization

### Next Steps
- [x] Functions fully implemented and tested
- [x] All edge cases handled (empty values, duplicate areas)
- [x] Dark theme applied for better readability
- [x] Close button and side icon functionality added
- [x] Draggable icon feature implemented
- [x] Default icon display implemented
- [x] Drag vs click bug fixed
- [x] Code formatted and documented

---

## Previous Entries
[Previous changelog entries will be archived here]