# VS Code Marketplace - Cloud Code Extension Listing

## Publisher: sai-rolotech

## Listing Details

### Display Name
**Cloud Code Extension** - SAI ROLOTECH Smart Engines

### Short Description
AI-powered VS Code extension for Roll Forming Engineering - Profile Design, Flower Pattern, Roll Tooling CAD, Springback Calculator & G-Code Safety Validator

### Full Description
Cloud Code Extension transforms VS Code into a comprehensive Roll Forming Engineering IDE. Built for engineers using COPRA-RF or similar tools.

### Key Features
- **AI Assistant** - Gemini, Claude, DeepSeek, or local Ollama (RTX 4060)
- **27 Engineering Commands** - Profile designer, flower pattern, roll tooling, BOM generator
- **Smart AI Router** - Automatically selects best model based on query complexity
- **Offline Knowledge Base** - 10 roll forming domains always available (FREE)
- **G-Code Validator** - Safety checks for CNC programs
- **Python API Integration** - 30+ engineering engines via REST API

### Tags
roll-forming, engineering, cad, cam, ai, gemini, roll-form, profile-design, flower-pattern, tooling, springback, bom, gcode, copra, manufacturing

### Categories
- **Programming Languages** (for G-code syntax)
- **Machine Learning & AI** (for AI features)
- **Other** (for engineering tools)

---

## Installation Instructions

### Prerequisites
- VS Code 1.96.0 or later
- Node.js 16+ (for building from source)
- Python 3.12+ (for backend API)
- Ollama + NVIDIA GPU 8GB+ VRAM (optional, for local AI)

### From VSIX
1. Download the `.vsix` file
2. Open VS Code
3. Go to Extensions panel (Ctrl+Shift+X)
4. Click `...` menu → "Install from VSIX"
5. Select the downloaded file

### From Source
```bash
git clone https://github.com/adminsairolotech-bit/sai-rolotech-smart-engines.git
cd sai-rolotech-smart-engines/extensions/cloud-code-extension
npm install
npm run compile
npm run package
# Then install from VSIX
```

---

## Privacy Policy

Cloud Code Extension respects your privacy:

1. **API Keys**: Stored locally in VS Code's encrypted SecretStorage (never sent to our servers)
2. **Code Analysis**: G-code files are analyzed locally, not uploaded anywhere
3. **AI Queries**: Sent directly to Google (Gemini), OpenRouter, or your local Ollama server
4. **No Telemetry**: We don't collect usage analytics

---

## Changelog

### v0.0.1 (2026-04-10)
- Initial release
- 27 engineering commands
- Smart AI router with 4 tiers
- 15 webview UIs
- Offline knowledge base
- G-code safety validator

---

## Support

- **GitHub Issues**: https://github.com/adminsairolotech-bit/sai-rolotech-smart-engines/issues
- **Documentation**: https://github.com/adminsairolotech-bit/sai-rolotech-smart-engines/blob/main/extensions/cloud-code-extension/README.md
- **Email**: support@sairolotech.com

---

## Resources

- [README](README.md)
- [SOFTWARE REPORT CARD](SOFTWARE_REPORT_CARD.md)
- [GitHub Repository](https://github.com/adminsairolotech-bit/sai-rolotech-smart-engines)
- [Python API Documentation](https://github.com/adminsairolotech-bit/sai-rolotech-smart-engines/tree/main/artifacts/python-api)
