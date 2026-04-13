# SAI Rolotech Engine - Professional Dashboard

## Features

### 🎯 Main Features
- **AI Chat** - Roll Forming, AutoCAD, Video Editing expert
- **Terminal** - Built-in xterm.js terminal
- **Sessions** - Save and manage conversations
- **Memory** - Persistent memory across sessions
- **System Stats** - CPU, RAM, Disk monitoring

### 🔌 Channels (Coming Soon)
- **WhatsApp** - Chat via WhatsApp
- **Telegram** - Chat via Telegram
- **Discord** - Chat via Discord

### 💡 Quick Commands
- `ask <question>` - Ask anything
- `cad <task>` - AutoCAD help
- `lisp <task>` - AutoLISP code
- `edit <task>` - Video editing
- `code <task>` - Programming help

## Setup

### 1. Start OpenClaw Gateway
```bash
openclaw gateway
```

### 2. Open Dashboard
```bash
# Option 1: Direct
start index.html

# Option 2: Local server
npx serve . -p 3333
```

### 3. Connect WhatsApp (Optional)
```bash
# Run setup script
setup-whatsapp.bat
```

## Desktop Shortcuts

### Windows
- Right-click `create-shortcuts.bat` → Run as Administrator
- Shortcuts will be created on Desktop

### Files Created
- `SAI Rolotech Engine.url` - Dashboard shortcut
- `SAI Rolotech Terminal.lnk` - CMD shortcut
- `SAI Rolotech WhatsApp.bat` - WhatsApp setup

## API Configuration

### OpenClaw Gateway
- URL: http://localhost:18789
- Token: Check ~/.openclaw/openclaw.json

### Gemini API (Coming Soon)
- Get key from: https://aistudio.google.com
- Update in OpenClaw config: openclaw configure --section model

## Security

- Keep API keys private
- Never share tokens
- Use .env file for local development

---

**Version:** 1.0.0
**Last Updated:** 2026-04-13