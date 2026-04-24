# Codebase Map Generator

## Triggers
- User wants to understand project structure
- User says "codebase map", "project structure", "how is this organized", "explain codebase"

## What It Does

### Analysis Process
```
PROJECT ROOT
        ↓
1. DISCOVER STRUCTURE
   → List top-level directories
   → Identify entry points
   → Find config files
        ↓
2. MAP COMPONENTS
   → Frontend/backend separation
   → Shared libraries
   → Test structure
   → Build/deploy config
        ↓
3. TRACE DEPENDENCIES
   → NPM/pip dependencies
   → Internal imports
   → API routes
   → Database connections
        ↓
4. IDENTIFY PATTERNS
   → Framework used
   → State management
   → Styling approach
   → Testing framework
        ↓
OUTPUT: Visual + text map
```

### Output Format
```
# {Project Name} - Codebase Map

## Overview
**Type:** {Frontend/Backend/Full-stack}
**Framework:** {React/Node/Python/etc}
**Size:** {X} files, {Y} lines of code

## Directory Structure
```
{project}/
├── src/                    # Main source code
│   ├── components/        # UI components
│   ├── pages/             # Routes/pages
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API calls
│   ├── store/            # State management
│   └── utils/            # Helper functions
├── tests/                 # Test files
├── config/               # Configuration
└── scripts/              # Build/deploy scripts
```

## Key Entry Points
| File | Purpose |
|------|---------|
| `src/index.tsx` | App entry point |
| `src/App.tsx` | Main component |
| `server.js` | Backend server |

## Module Dependencies
```
Pages → Components → Hooks → Services
                          ↓
                       Store (state)
                          ↓
                       Utils (helpers)
```

## Key Files by Function
### Routing
- `src/routes/` - Route definitions
- `src/App.tsx` - Route config

### State Management
- `src/store/` - Zustand/Redux store
- `src/context/` - React context

### API
- `src/services/api.ts` - API client
- `src/hooks/useFetch.ts` - Data fetching

### Database
- `server/models/` - Database models
- `server/migrations/` - DB migrations

## Tech Stack
| Category | Technology |
|----------|------------|
| Frontend | React 18 |
| State | Zustand |
| Styling | Tailwind CSS |
| Backend | Express.js |
| Database | PostgreSQL |
| Testing | Jest + Testing Library |

## Reading Order (For New Devs)
1. Start: `src/App.tsx` - See the big picture
2. Routing: Learn navigation
3. Store: Understand state
4. Components: See UI patterns
5. Services: API layer
```

## Commands
| Command | Action |
|---------|--------|
| `map codebase` | Full structure |
| `show dependencies` | Dependency tree |
| `explain module` | Specific module |
| `find entry` | Find entry points |
