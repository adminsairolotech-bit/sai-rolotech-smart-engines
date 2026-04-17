"""
SAI ROLO TECH - FULL COMPUTER USE MODULE
Complete Desktop Control - Mouse, Keyboard, Files, Windows, Screenshots
"""

import pyautogui
import pywinauto
import subprocess
import os
import time
import psutil
from pathlib import Path

# Safety - fail-safe mode
pyautogui.FAILSAFE = True
pyautogui.PAUSE = 0.5

class ComputerUse:
    """Full Computer Control System"""

    def __init__(self):
        self.screensize = pyautogui.size()
        print(f"[OK] Computer Use Ready - Screen: {self.screensize}")

    # ==================== MOUSE CONTROL ====================

    def move_mouse(self, x, y, duration=0.5):
        """Move mouse to x,y position"""
        pyautogui.moveTo(x, y, duration=duration)
        return f"Moved to ({x}, {y})"

    def click(self, x=None, y=None, button='left', clicks=1):
        """Click at position or current position"""
        if x is not None and y is not None:
            pyautogui.click(x, y, clicks=clicks, button=button)
            return f"Clicked {button} at ({x}, {y})"
        else:
            pyautogui.click(clicks=clicks, button=button)
            return f"Clicked {button}"

    def double_click(self, x=None, y=None):
        """Double click"""
        return self.click(x, y, clicks=2)

    def right_click(self, x=None, y=None):
        """Right click"""
        return self.click(x, y, button='right')

    def drag(self, start_x, start_y, end_x, end_y, duration=1):
        """Drag from start to end"""
        pyautogui.moveTo(start_x, start_y)
        pyautogui.drag(end_x - start_x, end_y - start_y, duration=duration)
        return f"Dragged from ({start_x}, {start_y}) to ({end_x}, {end_y})"

    def scroll(self, clicks):
        """Scroll up (positive) or down (negative)"""
        pyautogui.scroll(clicks)
        return f"Scrolled {clicks} clicks"

    def get_mouse_position(self):
        """Get current mouse position"""
        x, y = pyautogui.position()
        return f"Mouse at ({x}, {y})"

    # ==================== KEYBOARD CONTROL ====================

    def type_text(self, text, interval=0.05):
        """Type text"""
        pyautogui.write(text, interval=interval)
        return f"Typed: {text[:50]}..."

    def press_key(self, key):
        """Press single key"""
        pyautogui.press(key)
        return f"Pressed: {key}"

    def press_combination(self, *keys):
        """Press key combination like Ctrl+C"""
        pyautogui.hotkey(*keys)
        return f"Pressed: {'+'.join(keys)}"

    def key_down(self, key):
        """Hold key down"""
        pyautogui.keyDown(key)
        return f"Key down: {key}"

    def key_up(self, key):
        """Release key"""
        pyautogui.keyUp(key)
        return f"Key up: {key}"

    # ==================== WINDOW CONTROL ====================

    def list_windows(self):
        """List all open windows"""
        windows = pywinauto.Desktop(backend="win32").windows()
        result = []
        for w in windows:
            try:
                if w.is_visible():
                    text = w.window_text()
                    if text:
                        result.append(f"- {text}")
            except:
                pass
        return "\n".join(result) if result else "No windows found"

    def get_active_window(self):
        """Get currently active window"""
        try:
            return pywinauto.Desktop(backend="win32").active.window_text()
        except:
            # Fallback using ctypes
            import ctypes
            from ctypes import wintypes
            user32 = ctypes.windll.user32
            hwnd = user32.GetForegroundWindow()
            length = user32.GetWindowTextLengthW(hwnd)
            buff = ctypes.create_unicode_buffer(length + 1)
            user32.GetWindowTextW(hwnd, buff, length + 1)
            return buff.value if buff.value else "Unknown Window"

    def focus_window(self, title):
        """Focus window by title"""
        windows = pywinauto.Desktop(backend="win32").windows()
        for w in windows:
            if title.lower() in w.window_text().lower():
                w.set_focus()
                return f"Focused: {w.window_text()}"
        return f"Window not found: {title}"

    def close_window(self, title=None):
        """Close window by title or active window"""
        if title:
            return self.press_combination('alt', 'f4')
        else:
            self.press_combination('alt', 'f4')
            return "Closed active window"

    def minimize_window(self):
        """Minimize active window"""
        self.press_combination('win', 'down')
        return "Minimized window"

    def maximize_window(self):
        """Maximize active window"""
        self.press_combination('win', 'up')
        return "Maximized window"

    # ==================== FILE OPERATIONS ====================

    def open_file_explorer(self, path=None):
        """Open file explorer at path"""
        if path:
            os.startfile(path)
            return f"Opened: {path}"
        else:
            os.startfile("This PC")
            return "Opened File Explorer"

    def create_file(self, filepath, content=""):
        """Create a file"""
        Path(filepath).parent.mkdir(parents=True, exist_ok=True)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return f"Created: {filepath}"

    def read_file(self, filepath):
        """Read file content"""
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()

    def write_file(self, filepath, content):
        """Write to file"""
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return f"Written to: {filepath}"

    def delete_file(self, filepath):
        """Delete file"""
        os.remove(filepath)
        return f"Deleted: {filepath}"

    def list_directory(self, path="."):
        """List directory contents"""
        items = os.listdir(path)
        return "\n".join(items) if items else "Empty directory"

    # ==================== SYSTEM OPERATIONS ====================

    def run_command(self, command):
        """Run system command"""
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        return result.stdout if result.stdout else result.stderr

    def open_application(self, app_path):
        """Open an application"""
        subprocess.Popen(app_path)
        return f"Opened: {app_path}"

    def take_screenshot(self, filepath="screenshot.png"):
        """Take screenshot"""
        img = pyautogui.screenshot()
        img.save(filepath)
        return f"Screenshot saved: {filepath}"

    def find_image(self, image_path, confidence=0.8):
        """Find image on screen"""
        try:
            location = pyautogui.locateOnScreen(image_path, confidence=confidence)
            if location:
                return f"Found at {location}"
            return "Image not found"
        except:
            return "Image not found"

    def get_screen_size(self):
        """Get screen dimensions"""
        return f"Screen: {self.screensize[0]} x {self.screensize[1]}"

    # ==================== CLIPBOARD ====================

    def copy_to_clipboard(self, text):
        """Copy text to clipboard"""
        import pyperclip
        pyperclip.copy(text)
        return "Copied to clipboard"

    def paste_from_clipboard(self):
        """Get text from clipboard"""
        import pyperclip
        return pyperclip.paste()

    # ==================== SYSTEM INFO ====================

    def get_system_info(self):
        """Get system information"""
        cpu = psutil.cpu_percent()
        mem = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        return f"""CPU: {cpu}%
Memory: {mem.percent}% used
Disk: {disk.percent}% used"""

    def get_running_processes(self):
        """Get running processes"""
        processes = []
        for p in psutil.process_iter(['name', 'cpu_percent']):
            try:
                processes.append(f"- {p.info['name']}")
            except:
                pass
        return "\n".join(processes[:20])


# Quick test
if __name__ == "__main__":
    print("=" * 50)
    print("SAI ROLO TECH - COMPUTER USE MODULE")
    print("=" * 50)

    computer = ComputerUse()

    print("\nAvailable Commands:")
    print("- move_mouse(x, y)")
    print("- click(x, y)")
    print("- type_text(text)")
    print("- press_key(key)")
    print("- press_combination('ctrl', 'c')")
    print("- open_application(path)")
    print("- take_screenshot()")
    print("- get_screen_size()")
    print("- get_system_info()")
    print("- list_windows()")
    print("- create_file(path, content)")
    print("- read_file(path)")
    print("- run_command(cmd)")
    print("\n" + "=" * 50)
