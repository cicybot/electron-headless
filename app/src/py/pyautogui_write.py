#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import pyautogui
import sys
import json
import base64

def write_text(text, interval=0.25):
    pyautogui.write(text, interval=interval)

if __name__ == "__main__":
    data = json.loads(sys.argv[1])

    # Handle base64 encoded text for Unicode support
    text = data.get('text', 'Hello world!')
    if data.get('encoded', False):
        text = base64.b64decode(text).decode('utf-8')

    write_text(text, data.get('interval', 0.25))