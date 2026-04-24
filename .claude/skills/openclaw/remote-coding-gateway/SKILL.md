# Remote Coding Agent Gateway

## Triggers
- User wants to send coding tasks to AI agents via chat
- User says "code this", "write function", "fix bug", "agent task"

## What It Does

### 1. Task Parsing
```
User Input: "create a function that takes a list of numbers 
            and returns the median"
            ↓
Parse:
- Language: Not specified → Ask or default to Python
- Input: list of numbers
- Output: median value
- Edge cases: empty list, even/odd count
- Style: Clean, well-documented
            ↓
Format as Agent Task:
{ task: "Create median function", ... }
```

### 2. Task Templates
```
SHORT_TASK: Quick function/fix
"""
Language: Python
Task: {user description}
Requirements:
- Handle edge cases
- Include docstring
- Add type hints
"""

FEATURE_TASK: New component
"""
Project: {project_name}
Task: Add {feature_name}
Context:
- Current: {what exists}
- Needed: {what to add}
- Related files: {file paths}

Requirements:
- Follow existing patterns
- Add tests
- Update docs if needed
"""

BUG_FIX_TASK: Error resolution
"""
File: {file_path}
Error: {error message}
Code context:
{relevant code snippet}

Requirements:
- Fix root cause, not symptom
- Add test for regression
- Explain what was wrong
"""
```

### 3. Agent Handoff
```
Task Parsed → Create Agent Task → Execute → Return Result

Flow:
1. Parse user request
2. Create structured task for agent
3. Execute agent with task
4. Collect output
5. Format for user
6. Offer next steps
```

### 4. Code Review Integration
```
After Agent Code:
1. Run linter
2. Check tests pass
3. Security scan
4. Performance check
5. If issues → Fix automatically
6. Present final code + summary
```

### 5. Language Selection
```
Ask if not specified:
"Which language? Python / JavaScript / TypeScript / Go / Rust / Other"

Default: Python (most common)

Special cases:
- "frontend" → TypeScript/React
- "backend" → Python/Go
- "mobile" → Dart/Flutter or Kotlin/Swift
- "script" → Bash/Python
```

### 6. File Operations
```
Create File:
- Ask path/location
- Create parent dirs if needed
- Write code
- Confirm creation

Edit File:
- Show diff before edit
- Ask confirmation
- Execute edit
- Verify syntax

Delete File:
- Show file info
- Require confirmation
- Backup before delete
```

## Commands
| Command | Action |
|---------|--------|
| `code <description>` | Quick code generation |
| `fix <error>` | Bug fix with context |
| `refactor <file>` | Code improvement |
| `explain <code>` | Code explanation |
| `test <function>` | Write tests |
