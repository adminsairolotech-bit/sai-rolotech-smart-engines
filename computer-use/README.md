# SA I ROLO TECH - FULL COMPUTER USE
## Complete Desktop Control System

---

## FEATURES

### 1. MOUSE CONTROL
- Move mouse to any position
- Click, double-click, right-click
- Drag and drop
- Scroll up/down

### 2. KEYBOARD CONTROL
- Type text
- Press keys
- Hotkey combinations (Ctrl+C, Alt+Tab, etc.)
- Key hold/release

### 3. WINDOW CONTROL
- List all open windows
- Focus specific window
- Close, minimize, maximize
- Get active window

### 4. FILE OPERATIONS
- Create files
- Read files
- Write files
- Delete files
- List directories
- Open File Explorer

### 5. SYSTEM OPERATIONS
- Run terminal commands
- Open applications
- Take screenshots
- Find images on screen
- Get system info

### 6. CLIPBOARD
- Copy to clipboard
- Paste from clipboard

---

## INSTALLATION

```bash
# Already installed dependencies:
pip install pyautogui pywinauto psutil pyperclip pillow python-docx
```

---

## USAGE

### Method 1: CLI Interface
```bash
# Run the CLI
python computer_cli.py

# Commands:
# mouse 100 100          - Move mouse to x=100, y=100
# click 100 100          - Click at position
# type Hello World        - Type text
# press enter            - Press Enter key
# hotkey ctrl c          - Press Ctrl+C
# screenshot             - Take screenshot
# windows                - List windows
# sysinfo                - System info
# exit                   - Quit
```

### Method 2: Python Code
```python
from computer_use import ComputerUse

c = ComputerUse()

# Mouse
c.move_mouse(500, 500)
c.click(100, 200)
c.double_click(300, 400)
c.scroll(10)

# Keyboard
c.type_text("Hello World")
c.press_key("enter")
c.press_combination("ctrl", "c")

# Windows
print(c.list_windows())
c.focus_window("Notepad")

# Files
c.create_file("test.txt", "Hello!")
print(c.read_file("test.txt"))

# System
c.take_screenshot()
print(c.get_system_info())

# Apps
c.open_application("notepad.exe")
```

### Method 3: Integration with AI

```python
# Use with Claude/LangChain
from computer_use import ComputerUse

def ai_control_computer(command):
    computer = ComputerUse()

    if "click" in command:
        # Parse x, y from command
        computer.click(x, y)
    elif "type" in command:
        # Parse text from command
        computer.type_text(text)
    # ... etc
```

---

## EXAMPLE TASKS

### 1. Open Notepad and Type
```python
c = ComputerUse()
c.open_application("notepad.exe")
time.sleep(1)
c.type_text("Hello from Computer Use!")
c.press_key("enter")
```

### 2. Take Screenshot and Save
```python
c = ComputerUse()
c.take_screenshot("my_screenshot.png")
```

### 3. Find and Click Button
```python
c = ComputerUse()
# First take screenshot of the button
result = c.find_image("button.png")
if "Found" in result:
    c.click()  # Click at found location
```

### 4. Automate File Management
```python
c = ComputerUse()
c.create_file("report.txt", "Sales Report\n2024")
c.open_file_explorer("C:/Users")
```

### 5. Window Management
```python
c = ComputerUse()
print(c.list_windows())  # See all windows
c.focus_window("Chrome")  # Switch to Chrome
c.press_combination("alt", "tab")  # Alt+Tab
```

---

## INTEGRATION WITH OPENCLAW

```yaml
# Add to OpenClaw skills
computer-control:
  type: python
  module: computer_use
  commands:
    - mouse_move
    - click
    - type
    - screenshot
    - windows
```

---

## KEY BINDINGS REFERENCE

| Key | Python Key |
|-----|-----------|
| Enter | enter |
| Tab | tab |
| Escape | esc |
| Space | space |
| Ctrl | ctrl |
| Alt | alt |
| Shift | shift |
| Windows | win |
| Backspace | backspace |
| Delete | delete |

---

## SCREENSHOT FEATURES

```python
# Basic screenshot
c.take_screenshot("screenshot.png")

# Find image on screen
result = c.find_image("button.png")
# Returns "Found at Box(left=100, top=200, width=50, height=30)"
# or "Image not found"
```

---

## SYSTEM INFO

```python
c = ComputerUse()
print(c.get_system_info())
# Output:
# CPU: 25%
# Memory: 65% used
# Disk: 45% used
```

---

## FILES

```
computer-use/
├── computer_use.py      # Main module
├── computer_cli.py      # CLI interface
├── run-computer-use.bat # Windows launcher
└── README.md           # This file
```

---

## STATUS

| Feature | Status |
|---------|--------|
| Mouse Control | ✅ Working |
| Keyboard Control | ✅ Working |
| Window Management | ✅ Working |
| File Operations | ✅ Working |
| Screenshot | ✅ Working |
| System Commands | ✅ Working |
| Clipboard | ✅ Working |

**FULL COMPUTER USE - 100% READY!** 🎉

---

**Generated:** 2026-04-17
