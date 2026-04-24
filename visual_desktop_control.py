# visual_desktop_control.py
import pywinauto
from pywinauto import Desktop
import time

def control_app():
    print("[HERMES ACTION] Locating 'SAI Rolotech Smart Engines' Window...")
    
    try:
        # 1. Connect to the app window
        app = Desktop(backend="uia").window(title_re=".*SAI Rolotech.*")
        app.set_focus()
        print(f"[SUCCESS] Focus set on: {app.window_text()}")
        
        # 2. Capture specific app screenshot
        app.capture_as_image().save("APP_UI_STATE.png")
        print("[SUCCESS] Captured current UI state to APP_UI_STATE.png")
        
        # 3. Simulate a Human Click (e.g., on a Menu or Button)
        # Note: In a real-life scenario, we search for button names. 
        # For this demo, let's look for any button and highlight it.
        buttons = app.descendants(control_type="Button")
        if buttons:
            target = buttons[0]
            print(f"[HERMES ACTION] Clicking on Button: '{target.window_text()}'")
            target.click_input()
            print("[SUCCESS] Click executed successfully.")
        else:
            print("[WARNING] No buttons found to interact with.")

    except Exception as e:
        print(f"[ERROR] Visual control failed: {e}")

if __name__ == "__main__":
    control_app()
