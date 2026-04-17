#!/usr/bin/env python3
"""
SAI ROLO TECH - COMPUTER USE CLI
Terminal-based Computer Control Interface
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from computer_use import ComputerUse
import pyautogui

def main():
    computer = ComputerUse()

    print("\n" + "=" * 60)
    print("COMPUTER USE - COMMAND LINE INTERFACE")
    print("=" * 60)
    print("\nCommands:")
    print("  mouse <x> <y>              - Move mouse")
    print("  click <x> <y>              - Click at position")
    print("  rightclick <x> <y>         - Right click")
    print("  doubleclick <x> <y>        - Double click")
    print("  type <text>                - Type text")
    print("  press <key>                - Press key")
    print("  hotkey <k1> <k2> ...      - Press combination")
    print("  screenshot [file]          - Take screenshot")
    print("  windows                    - List windows")
    print("  screen                     - Get screen size")
    print("  sysinfo                    - System info")
    print("  screenshot                 - Take screenshot")
    print("  exit                       - Exit")
    print()

    while True:
        try:
            cmd = input(">>> ").strip().lower()

            if cmd == "exit":
                print("Bye!")
                break

            elif cmd.startswith("mouse "):
                parts = cmd.split()
                x, y = int(parts[1]), int(parts[2])
                print(computer.move_mouse(x, y))

            elif cmd.startswith("click "):
                parts = cmd.split()
                x, y = int(parts[1]), int(parts[2])
                print(computer.click(x, y))

            elif cmd.startswith("rightclick "):
                parts = cmd.split()
                x, y = int(parts[1]), int(parts[2])
                print(computer.right_click(x, y))

            elif cmd.startswith("doubleclick "):
                parts = cmd.split()
                x, y = int(parts[1]), int(parts[2])
                print(computer.double_click(x, y))

            elif cmd.startswith("type "):
                text = cmd[5:]
                print(computer.type_text(text))

            elif cmd.startswith("press "):
                key = cmd[6:]
                print(computer.press_key(key))

            elif cmd.startswith("hotkey "):
                keys = cmd[7:].split()
                print(computer.press_combination(*keys))

            elif cmd == "screenshot":
                filename = "screenshot.png"
                print(computer.take_screenshot(filename))

            elif cmd == "windows":
                print(computer.list_windows())

            elif cmd == "screen":
                print(computer.get_screen_size())

            elif cmd == "sysinfo":
                print(computer.get_system_info())

            elif cmd == "mousepos":
                print(computer.get_mouse_position())

            elif cmd == "help":
                print("\nCommands:")
                print("  mouse <x> <y>              - Move mouse")
                print("  click <x> <y>              - Click at position")
                print("  type <text>                - Type text")
                print("  press <key>                - Press key")
                print("  hotkey <k1> <k2>           - Press combination")
                print("  screenshot [file]          - Take screenshot")
                print("  windows                    - List windows")
                print("  screen                     - Get screen size")
                print("  sysinfo                    - System info")
                print("  mousepos                   - Current mouse position")
                print("  exit                       - Exit")

            else:
                print(f"Unknown command: {cmd}")
                print("Type 'help' for commands")

        except KeyboardInterrupt:
            print("\nUse 'exit' to quit")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    main()
