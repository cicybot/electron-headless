import pyperclip
import pyautogui
import time

# 1. 将一段文本复制到系统剪贴板
pyperclip.copy('你好，这是来自剪贴板的内容！')

# 2. 等待一下，确保复制完成（可根据需要调整）
time.sleep(0.5)

# 3. 用PyAutoGUI模拟键盘快捷键 Ctrl+V（或 Cmd+V）进行粘贴
pyautogui.hotkey('ctrl', 'v')  # 在macOS上是 'command', 'v'