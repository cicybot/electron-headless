#!/usr/bin/env python3
import pyautogui
import sys
import json

def type_text(text):
    pyautogui.typewrite(text)

if __name__ == "__main__":
    data = json.loads(sys.argv[1])
    type_text(data.get('text', ''))