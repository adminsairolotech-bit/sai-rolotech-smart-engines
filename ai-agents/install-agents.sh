#!/bin/bash
# SAI Rolotech AI Agents Launcher
# Installs and manages top AI agents

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  SAI ROLO TECH - AI AGENTS LAUNCHER                     ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

AGENTS_DIR="C:/Users/Sai Rolotech/New folder/cloud-code-extension/ai-agents"
mkdir -p "$AGENTS_DIR"
cd "$AGENTS_DIR"

echo "Select an AI Agent to install:"
echo ""
echo "  [1] Goose Agent (41k stars) - Extensible AI agent"
echo "  [2] AgenticSeek (25k stars) - Fully Local, No API bills"
echo "  [3] Roo Code (23k stars) - AI coding in VS Code"
echo "  [4] LibreChat (35k stars) - Enhanced ChatGPT Clone"
echo "  [5] View all available agents"
echo "  [0] Back"
echo ""
read -p "Enter choice (0-5): " choice

case $choice in
  1)
    echo "Installing Goose Agent..."
    git clone https://github.com/aaif-goose/goose.git goose-agent
    cd goose-agent
    npm install
    echo "Goose installed! Run: npx goose"
    ;;
  2)
    echo "Installing AgenticSeek..."
    git clone https://github.com/Fosowl/agenticSeek.git agenticseek-agent
    cd agenticseek-agent
    pip install -r requirements.txt
    echo "AgenticSeek installed!"
    ;;
  3)
    echo "Opening Roo Code VS Code extension..."
    code --install-extension roocode.roo-code
    ;;
  4)
    echo "Installing LibreChat..."
    git clone https://github.com/badlogic/LibreChat.git librechat-agent
    cd librechat-agent
    npm install
    echo "LibreChat installed!"
    ;;
  5)
    echo "Opening GitHub AI Agents..."
    start https://github.com/topics/ai-agent
    ;;
  0)
    cd ..
    ;;
esac

read -p "Press Enter to continue..."
