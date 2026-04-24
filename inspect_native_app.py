# inspect_native_app.py
import pywinauto
import time
from pywinauto import Desktop

def inspect():
    print("[HERMES] Searching for SAI Rolotech Native Window...")
    time.sleep(5) # Wait for app to load
    
    try:
        app = Desktop(backend="uia").window(title_re=".*SAI Rolotech.*")
        app.set_focus()
        print(f"[SUCCESS] Found Window: {app.window_text()}")
        
        # Capture screenshot of the native app
        app.capture_as_image().save("NATIVE_APP_SCREENSHOT.png")
        print("[SUCCESS] Screenshot saved as NATIVE_APP_SCREENSHOT.png")
        
        # List main controls (for understanding the UI)
        print("[HERMES] Analyzing UI Controls...")
        # (This can be verbose, so we'll just print a few)
        # app.print_control_identifiers() 
        
    except Exception as e:
        print(f"[ERROR] Could not find or capture the native app: {e}")

if __name__ == "__main__":
    inspect()
