# native_app_interact.py
from pywinauto import Desktop
import time

def interact():
    target_title = "SAI Rolotech Smart Engines"
    print(f"[HERMES ACTION] Focusing Native App: {target_title}...")
    
    try:
        # Find window by part of title
        app = Desktop(backend="uia").window(title_re=".*SAI Rolotech.*")
        app.set_focus()
        print(f"[SUCCESS] Native App is now ACTIVE.")
        
        # Capture the screenshot of the native UI
        app.capture_as_image().save("NATIVE_APP_UI.png")
        print("[SUCCESS] Native UI State captured to NATIVE_APP_UI.png")
        
        # Perform a human-like 'Click' on the center of the window to verify focus
        rect = app.rectangle()
        center_x = (rect.left + rect.right) // 2
        center_y = (rect.top + rect.bottom) // 2
        app.click_input(coords=(center_x, center_y))
        print(f"[SUCCESS] Clicked center of Native App at ({center_x}, {center_y})")

    except Exception as e:
        print(f"[ERROR] Native interaction failed: {e}")

if __name__ == "__main__":
    interact()
