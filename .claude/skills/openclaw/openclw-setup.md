---
name: openclaw-setup
description: OpenClaw and ClawHub setup for SAI Rolotech projects
---

# OpenClaw Setup Skill

## ClawHub Registry

**URL:** https://clawhub.ai
**Local:** http://localhost:3000 (dev server)

## Installation

```bash
# Install via npm
npm install -g clawhub

# Login with GitHub OAuth
clawhub login

# Check status
clawhub whoami
```

## Key Commands

| Command | Description |
|---------|-------------|
| `clawhub search <query>` | Search skills |
| `clawhub explore` | Browse skill catalog |
| `clawhub install <slug>` | Install a skill |
| `clawhub uninstall <slug>` | Remove installed skill |
| `clawhub list` | List installed skills |
| `clawhub inspect <slug>` | View skill details |
| `clawhub skill publish <path>` | Publish skill |

## Skill Format

```markdown
---
name: my-skill
description: What this skill does
---

# My Skill

Instructions for using this skill...
```

## Skill Categories (from awesome-openclaw-skills)

- **coding-agents-and-ides**: Claude Code, Cursor, etc.
- **browser-and-automation**: Playwright, Selenium
- **productivity-and-tasks**: Task management
- **devops-and-cloud**: Deployment, infrastructure
- **git-and-github**: Git workflows
- **web-and-frontend-development**: React, Vue, etc.

## Available Skills Catalog

**Location:** C:\pinokio\api\awesome-openclaw-skills\
**Categories:** 31 categories with 2500+ skills

## Local ClawHub Dev

```bash
cd C:/pinokio/api/clawhub
bun install
bunx convex dev    # Terminal A: backend
bun run dev        # Terminal B: frontend
```

## Quick Links

- [ClawHub](https://clawhub.ai)
- [OnlyCrabs (SOUL.md)](https://onlycrabs.ai)
- [Discord](https://discord.gg/clawd)
