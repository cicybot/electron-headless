#!/usr/bin/env python3
import pyautogui
import sys
import json

def click(x=None, y=None):
    if x is not None and y is not None:
        pyautogui.click(x, y)
    else:
        pyautogui.click()

if __name__ == "__main__":
    data = json.loads(sys.argv[1])
    click(data.get('x'), data.get('y'))