# list_all_windows.py
from pywinauto import Desktop

def list_windows():
    print("[HERMES VISION] Scanning all active Desktop windows...")
    windows = Desktop(backend="uia").windows()
    for w in windows:
        title = w.window_text()
        if title:
            print(f"WINDOW: {title}")

if __name__ == "__main__":
    list_windows()
