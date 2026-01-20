#!/usr/bin/env python3
import pyautogui
import sys
import json

def press_key(key):
    pyautogui.press(key)

if __name__ == "__main__":
    data = json.loads(sys.argv[1])
    press_key(data.get('key', ''))