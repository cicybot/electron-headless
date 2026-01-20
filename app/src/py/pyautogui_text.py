#!/usr/bin/env python3
import pyautogui
import pyperclip
import time
import sys
import json

def type_text(text):
    # Copy text to clipboard using pyperclip
    pyperclip.copy(text)
    
    # Wait to ensure copy is complete
    time.sleep(0.5)
    
    # Paste using Ctrl+V
    pyautogui.hotkey('ctrl', 'v')

if __name__ == "__main__":
    data = json.loads(sys.argv[1])
    type_text(data.get('text', ''))