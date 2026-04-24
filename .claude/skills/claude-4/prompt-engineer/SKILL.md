# Prompt Engineer

## Triggers
- User wants to create or improve prompts
- User says "prompt", "improve this", "write a prompt", "better prompt"

## What It Does

### Prompt Components
```
1. ROLE: Who AI should be
2. TASK: What to do
3. CONTEXT: Background info
4. CONSTRAINTS: Rules to follow
5. FORMAT: How to output
6. EXAMPLES: Few-shot examples
```

### Prompt Template
```
# {Task Name} Prompt

## Structure
---
ROLE: {Define the AI persona}
TASK: {Clear instruction}
CONTEXT: {Relevant background}
CONSTRAINTS: {Rules and limitations}
FORMAT: {Output structure}
EXAMPLES: {If needed}
---

## Example Prompt
"""
{Well-crafted prompt example}
"""
```

### Optimization Techniques
```
CLARITY: Be specific, avoid ambiguity
BREAKDOWN: Complex tasks → step-by-step
CONTEXT: Provide relevant background
EXAMPLES: Show input-output pairs
CONSTRAINTS: Define boundaries
FORMAT: Specify exact output structure
CHAINING: Multi-step reasoning
```

## Commands
| Command | Action |
|---------|--------|
| `write prompt` | Create prompt |
| `improve prompt` | Optimize existing |
| `test prompt` | Validate prompt |
