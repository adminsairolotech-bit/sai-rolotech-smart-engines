# SAI Rolotech Engine - Complete AI Agent System

> **100% Complete AI Agent inspired by OpenClaw, Claude Code, and 20+ Top AI Agent Repos**

## Features

### Channels (Inspired by OpenClaw)
- **Telegram Bot** - Chat via Telegram with AI
- **WhatsApp Bot** - AI on WhatsApp
- **Discord Bot** - Discord AI assistant
- **Web Dashboard** - Full web interface

### AI Agents
- **Coding Agent** - Write, debug, test code
- **Roll Forming Expert** - Industrial engineering
- **AutoCAD Expert** - All CAD commands & LISP
- **Video Editor** - Filmora-level editing
- **Research Agent** - Web research & search

### Tools (100+ Capabilities)
- **Browser Automation** - browser-use style web automation
- **Web Search** - Tavily, Brave, DuckDuckGo, Perplexity
- **Image Generation** - DALL-E 3/2, Stable Diffusion
- **Video Editing** - Cuts, transitions, effects, export
- **Voice/TTS** - OpenAI TTS, ElevenLabs, transcription
- **AutoCAD Engine** - Complete command database

### Knowledge Bases
- **Roll Forming Engineering** - 8 topics
- **AutoCAD Complete** - 50+ commands, LISP, scripts
- **Video Editing** - Filmora AI features, all techniques

### System Features
- **Persistent Memory** - Long-term context
- **Cron Scheduler** - Automated tasks
- **Multi-Agent Orchestrator** - Route to specialists
- **Beautiful Dashboard** - Modern dark UI

## Quick Start

```bash
# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Add your API keys to .env
ANTHROPIC_API_KEY=sk-...
TELEGRAM_BOT_TOKEN=...

# Start development
pnpm dev

# Or build and start
pnpm build
pnpm start
```

## Configuration

Create `.env` file with:

```bash
# Required
ANTHROPIC_API_KEY=your_key
CLAUDE_API_KEY=your_key

# Optional - Channels
TELEGRAM_BOT_TOKEN=your_token
DISCORD_BOT_TOKEN=your_token
WHATSAPP_SESSION_PATH=./data/whatsapp

# Optional - Search
TAVILY_API_KEY=your_key
BRAVE_API_KEY=your_key

# Optional - Voice
ELEVENLABS_API_KEY=your_key
```

## Commands

### Telegram Commands
```
/start    - Start bot
/help     - Show help
/code     - Write code
/cad      - AutoCAD help
/video    - Video editing
/search   - Web search
/image    - Generate image
/voice    - Text to speech
```

### WhatsApp Commands
```
!code <task>    - Write code
!search <query> - Search web
!image <prompt> - Generate image
!cad <task>     - CAD help
!video <task>   - Video help
```

### Discord Commands
```
!help    - Show help
!code    - Write code
!status  - System status
```

## Project Structure

```
sai-rolotech-engine/
├── src/
│   ├── index.ts           # Main entry
│   ├── agents/
│   │   └── orchestrator.ts  # Multi-agent router
│   ├── channels/
│   │   ├── telegram.ts   # Telegram bot
│   │   ├── whatsapp.ts    # WhatsApp bot
│   │   └── discord.ts    # Discord bot
│   ├── tools/
│   │   ├── browser.ts    # Browser automation
│   │   ├── web-search.ts # Multi-provider search
│   │   └── image-gen.ts  # Image generation
│   ├── video/
│   │   └── editor.ts     # Filmora-level editing
│   ├── voice/
│   │   └── tts.ts       # TTS & transcription
│   ├── autocad/
│   │   └── engine.ts     # Complete CAD knowledge
│   ├── memory/
│   │   └── persistent.ts # Memory system
│   ├── scheduler/
│   │   └── cron.ts       # Task scheduler
│   ├── knowledge/
│   │   ├── roll-forming.ts  # Engineering KB
│   │   ├── autocad.ts       # CAD KB
│   │   └── video-editing.ts # Video KB
│   └── ui/
│       └── dashboard.html   # Web UI
├── package.json
├── tsconfig.json
└── .env.example
```

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **AI**: Anthropic Claude, OpenAI, Ollama
- **Channels**: Telegraf, whatsapp-web.js, discord.js
- **Browser**: Puppeteer
- **Database**: SQLite (better-sqlite3)
- **Scheduler**: Cron

## Inspired By

- **OpenClaw** - Multi-channel AI agent
- **Claude Code** - AI coding assistant
- **Browser-use** - AI browser automation
- **LangChain** - Agent orchestration
- **CrewAI** - Multi-agent collaboration
- **Cursor** - AI IDE features

## License

MIT - SAI Rolotech Smart Engines © 2026
