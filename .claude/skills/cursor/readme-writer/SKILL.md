# README Writer

## Triggers
- User wants documentation
- User says "README", "docs", "documentation", "write docs"

## What It Does

### Documentation Sections
```
1. PROJECT INFO
   → Name, description
   → Badges
   
2. QUICK START
   → Installation
   → First run
   
3. FEATURES
   → What it does
   → Screenshots
   
4. USAGE
   → Examples
   → API reference
   
5. DEVELOPMENT
   → Setup
   → Commands
   
6. CONTRIBUTING
   → How to help
```

### Output Format
```markdown
# {Project Name}

[![Build](https://img.shields.io/badge/build-passing-green)]
[![License](https://img.shields.io/badge/license-MIT-blue)]

{One-line description}

## Quick Start

\`\`\`bash
npm install
npm run dev
\`\`\`

## Features

- ✨ Feature 1
- 🚀 Feature 2
- 🔒 Feature 3

## Usage

\`\`\`javascript
import { function } from 'package';

function(); // Does X
\`\`\`

## Development

| Command | Description |
|---------|-------------|
| npm install | Install deps |
| npm run dev | Start dev |
| npm test | Run tests |
```

## Commands
| Command | Action |
|---------|--------|
| `write README` | Full README |
| `add install` | Install section |
| `add examples` | Usage examples |
