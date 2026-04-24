# Agent Workflow Designer

## Triggers
- User wants to design multi-step AI agent flows
- User says "workflow", "agent", "automation", "multi-step"

## What It Does

### Workflow Design
```
1. DEFINE GOAL
   → What should the agent accomplish?
   → What's the end state?
   
2. IDENTIFY STEPS
   → Break into sequential steps
   → Define inputs/outputs per step
   
3. CHOOSE TOOLS
   → What tools at each step?
   → API calls, file ops, calculations
   
4. ADD DECISIONS
   → Branching logic
   → Error handling paths
   
5. DEFINE MEMORY
   → What to remember between steps?
   → Context passing
```

### Workflow Diagram
```
[Start]
   ↓
[Step 1: Action]
   ↓
{Decision: Success?}
   ├─ Yes → [Step 2]
   └─ No → [Error Handler]
   ↓
[Step 3: Action]
   ↓
{Decision: Continue?}
   ├─ Yes → [Step 4]
   └─ No → [End]
   ↓
[End]
```

### Output Format
```
# Agent Workflow: {Name}

## Goal
{What this workflow accomplishes}

## Steps

### Step 1: {Name}
- Action: {What to do}
- Input: {From where}
- Output: {What it produces}
- Tools: {Tools needed}
- On failure: {What to do}

### Step 2: {...}

## Decision Points

### Decision 1: {Condition}
- If true → {Step X}
- If false → {Step Y}

## Memory/Context

### Passed Between Steps
- {Context item}

### Stored for Later
- {Stored item}

## Error Handling

### Failure Point 1: {Step}
- Detection: {How to know}
- Action: {How to recover}

## Implementation

```yaml
workflow:
  name: {name}
  steps:
    - id: step_1
      action: {action}
      tools: [{tools}]
```

## Commands
| Command | Action |
|---------|--------|
| `design workflow` | Create workflow |
| `optimize workflow` | Improve existing |
| `debug workflow` | Test logic |
