/**
 * showPromptArea Usage Example
 * 
 * The showPromptArea function creates a floating textarea overlay that:
 * 1. Shows a draggable, resizable textarea overlay
 * 2. When user types text and presses Enter (without Shift), it alerts the value
 * 3. Clears the textarea after alerting
 * 4. Enter+Shift allows multiline input (no alert)
 * 5. Includes a close button (×) to hide the prompt area
 * 
 * Usage via MCP Tools:
 * --------------------
 * 
 * // Show prompt area in window 1
 * show_prompt_area(win_id: 1)
 * 
 * // Hide prompt area in window 1
 * hide_prompt_area(win_id: 1)
 * 
 * Usage via JavaScript:
 * --------------------
 * 
 * // Show prompt area
 * window._G.showPromptArea();
 * 
 * // Hide prompt area
 * window._G.hidePromptArea();
 * 
 * Features:
 * - Position: Fixed at (50, 50) by default
 * - Size: 600x180px by default
 * - Draggable: Click and drag to move
 * - Resizable: Corner handles for resizing
 * - Z-index: 2147483647 (always on top)
 * - Background: Semi-transparent white (rgba(255, 255, 255, 0.9))
 * - Border: 2px solid #333
 * - Close button: Red circular button in top-right corner
 * 
 * Keyboard Behavior:
 * - Enter: Alerts value and clears textarea
 * - Enter+Shift: Allows new line (no alert)
 * 
 * Example MCP Tool Call:
 * 
 * {
 *   "tool": "show_prompt_area",
 *   "arguments": {
 *     "win_id": 1,
 *     "account_index": 0
 *   }
 * }
 * 
 * Response:
 * {
 *   "content": [
 *     {
 *       "type": "text",
 *       "text": "Showed prompt area in window 1 - type text and press Enter to alert and clear"
 *     }
 *   ]
 * }
 */