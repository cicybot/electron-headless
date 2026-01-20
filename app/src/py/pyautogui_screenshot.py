import pyautogui
import sys
import json
import base64
from io import BytesIO

data = json.loads(sys.argv[1])

# Take screenshot
screenshot = pyautogui.screenshot()

# Convert to base64
buffer = BytesIO()
screenshot.save(buffer, format='PNG')
img_bytes = buffer.getvalue()
img_base64 = base64.b64encode(img_bytes).decode('utf-8')

print(json.dumps({"base64": img_base64, "format": "png"}))