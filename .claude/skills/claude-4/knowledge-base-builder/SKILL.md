# Knowledge Base Builder

## Triggers
- User wants to create FAQ, SOP, or help content
- User says "FAQ", "knowledge base", "help article", "documentation"

## What It Does

### Content Types
```
FAQ: Quick answers to common questions
SOP: Step-by-step procedures
TROUBLESHOOTING: Problem → Solution
CONCEPT: Explanations and how-it-works
REFERENCE: Data, specs, specs
```

### Output Format
```
# {Topic} Knowledge Base

## Quick Navigation
- [Question 1](#q1)
- [Question 2](#q2)
- [Question 3](#q3)

---

## FAQ

### Q1: {Question}
**Answer:** {Clear, concise answer}

**Related:**
- [Related topic](#link)

### Q2: {Question}
...

## Troubleshooting

### Problem: {Issue}
**Symptoms:**
- {Symptom 1}
- {Symptom 2}

**Solution:**
1. {Step 1}
2. {Step 2}
3. {Step 3}

**If still not resolved:**
{Contact support / Next step}

## Concepts

### {Concept Name}
{Explanation}

**Key points:**
- {Point 1}
- {Point 2}

**Related:** [Link to related content]
```

## Commands
| Command | Action |
|---------|--------|
| `write FAQ` | FAQ document |
| `write SOP` | Step-by-step guide |
| `write troubleshooting` | Problem/solution |
| `write concept` | Explanation |
