#!/usr/bin/env python3
import pyautogui
import sys
import json

def paste():
    pyautogui.hotkey('ctrl', 'v')

if __name__ == "__main__":
    paste()