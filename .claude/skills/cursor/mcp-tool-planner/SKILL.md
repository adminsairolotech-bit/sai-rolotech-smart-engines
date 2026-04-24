# MCP Tool Planner

## Triggers
- User wants to plan MCP tools
- User says "MCP", "tools", "integration"

## What It Does

### Tool Planning
```
PROJECT NEEDS
        ↓
1. IDENTIFY NEEDS
   → What integrations?
   → What automations?
   → What data sources?
        ↓
2. SELECT TOOLS
   → Available MCP tools
   → Best fit
   → Setup requirements
        ↓
OUTPUT: Tool configuration
```

### Common MCP Tools
| Category | Tools |
|----------|-------|
| Memory | memory_search, memory_store |
| Swarm | swarm_init, agent_spawn |
| Web | web_search, web_fetch |
| Git | git operations |

## Commands
| Command | Action |
|---------|--------|
| `plan MCP` | Tool recommendations |
| `setup tool` | Configure tool |
