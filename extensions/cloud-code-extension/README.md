# SAI ROLOTECH CLOUD CODE EXTENSION

VS Code extension for Roll Forming Engineering Suite — Profile Design, Flower Pattern, Roll Tooling, G-Code, AI Assistant & more.

## Features

### 🧠 AI Assistant (3 Ways to Use)
1. **Roll Forming Expert** — Local AI with engineering knowledge (Gemma 3 4B on RTX 4060, FREE)
2. **Cloud AI** — Gemini/DeepSeek/OpenRouter (API keys required)
3. **Offline KB** — 10 engineering modules always available

### 📐 Engineering Tools
| Tool | Description | API |
|------|-------------|-----|
| Profile Designer | Draw & import profile shapes | ✅ |
| Flower Pattern | Station sequencing & SVG | ✅ |
| Roll Tooling CAD | Shaft, bearing, roll design | ✅ |
| Springback Calculator | Dual model (Factor + R/t) | ✅ |
| Strip Width Calculator | DIN 6935 K-factor method | ✅ |
| Material Database | 10 materials (GI, CR, SS...) | ✅ |
| BOM Generator | Bill of materials | ✅ |
| FEA Simulation | Strain/stress prediction | ✅ |
| 3D Preview | Flower pattern visualization | ✅ |
| Process Card | Per-station parameters | ✅ |
| Machine Config | 4 machine presets | ✅ |
| G-Code Validator | Safety & syntax checks | ✅ |

## Quick Start

### 1. Install Extension
```bash
# Open terminal in extension folder
cd extensions/cloud-code-extension
npm install
npm run compile
npm run package
# Install cloud-code-extension-0.0.1.vsix in VS Code
```

### 2. Setup Local AI (Optional but Recommended)
```bash
cd ollama
# Double-click setup-expert.bat OR run:
ollama serve
ollama pull gemma3:4b
ollama create sairolotech-expert -f Modelfile
```

### 3. Start Python API
```bash
cd artifacts/python-api
python -m uvicorn app.main:app --host 0.0.0.0 --port 9000
```

### 4. Import API Keys (Optional)
```
Ctrl+Shift+P → Cloud Code: Import All Keys
```
- FREE Gemini keys (no billing)
- OpenRouter keys (FREE tier models available)

## Commands

Press `Ctrl+Shift+P`:

| Command | Description |
|---------|-------------|
| `Cloud Code: Hello World` | Welcome message |
| `Cloud Code: Dashboard` | Open dashboard |
| `Cloud Code: Validate G-Code` | Validate G-code file |
| `Cloud Code: API Server Status` | Check services |
| `Cloud Code: Import All Keys` | Import API keys |
| `Cloud Code: Profile Designer` | Open profile designer |
| `Cloud Code: Flower Pattern` | Open flower pattern |
| `Cloud Code: Roll Tooling CAD` | Open tooling designer |
| `Cloud Code: Springback Calculator` | Calculate springback |
| `Cloud Code: Strip Width Calculator` | Calculate strip width |
| `Cloud Code: Material Database` | Browse materials |
| `Cloud Code: BOM Generator` | Generate bill of materials |
| `Cloud Code: 3D Flower Preview` | Preview flower pattern |
| `Cloud Code: FEA Simulation` | Run FEA simulation |
| `Cloud Code: Process Card` | Generate process card |
| `Cloud Code: Punch Editor` | Edit punch parameters |
| `Cloud Code: Tube Forming` | Tube forming tools |
| `Cloud Code: Run Pipeline` | Auto-run full pipeline |

## AI Models

### Local (RTX 4060 - 8GB VRAM)
| Model | VRAM | Quality | Speed |
|-------|------|---------|-------|
| `sairolotech-expert` | ~3.5GB | ⭐⭐⭐ Expert | Fast |
| `gemma3:4b` | ~3.3GB | ⭐⭐⭐ Google | Fast |
| `llama3.2:3b` | ~2GB | ⭐⭐ | Very Fast |

### Cloud (FREE Tier)
| Provider | Model | Cost |
|----------|-------|------|
| Gemini | 2.5 Flash | FREE (15 req/min × 7 keys) |
| OpenRouter | Dolphin Mistral 24B | FREE |
| OpenRouter | GPT-OSS 120B | FREE |
| OpenRouter | LFM 1.2B | FREE |

### Cloud (PAID - Best Quality)
| Provider | Model | Cost |
|----------|-------|------|
| Gemini | 3.1 Pro | $1.25/1M tokens |
| DeepSeek | R1 | $0.50/1M tokens |

## Services

| Service | Port | Description |
|---------|------|-------------|
| Python API | 9000 | 30+ engineering engines |
| API Server | 8080 | REST API |
| Design Tool | 5000 | Web UI |

## Requirements

- VS Code 1.96.0+
- Node.js 16+ (building)
- Python 3.12+ (API)
- Ollama (local AI, optional)
- NVIDIA GPU with 8GB+ VRAM (local AI, optional)

## License

MIT - SAI ROLOTECH

## Version

v2.3.0 - Smart Engines Suite
