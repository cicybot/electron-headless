import pyautogui
import sys
import json

data = json.loads(sys.argv[1])
pyautogui.moveTo(data['x'], data['y'])