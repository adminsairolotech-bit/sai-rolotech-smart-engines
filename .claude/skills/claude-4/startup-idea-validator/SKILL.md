# Startup Idea Validator

## Triggers
- User wants to validate a startup idea
- User says "validate", "startup", "business idea", "is this viable"

## What It Does

### Validation Framework
```
STARTUP IDEA
        ↓
1. PROBLEM VALIDATION
   → Is this a real problem?
   → Who has this problem?
   → How urgent is it?
   → Current solutions and gaps
        ↓
2. MARKET VALIDATION
   → Market size (TAM/SAM/SOM)
   → Growth trajectory
   → Accessibility of market
        ↓
3. SOLUTION VALIDATION
   → MVP feasibility
   → Technical complexity
   → Time to build
   → Cost to build
        ↓
4. BUSINESS MODEL VALIDATION
   → Revenue model
   → Unit economics
   → Customer acquisition cost
   → Lifetime value
        ↓
5. COMPETITION VALIDATION
   → Existing solutions
   → Your differentiation
   → Sustainable advantage
        ↓
6. TEAM VALIDATION
   → Required skills
   → Availability
   → Can execute?
        ↓
OUTPUT: Validation score + recommendations
```

### Scoring System
```
Each dimension: 1-10 score

PROBLEM (30% weight):
├── Real problem exists: /10
├── Pain is felt now: /10
└── Willingness to pay: /10

MARKET (20% weight):
├── Market size ≥ ₹100 Cr: /10
├── Growth > 15%: /10
└── Accessible: /10

SOLUTION (20% weight):
├── Buildable in 3 months: /10
├── Cost < ₹5L to build: /10
└── Technically feasible: /10

BUSINESS (20% weight):
├── Unit economics positive: /10
├── CAC < LTV/3: /10
└── Scalable: /10

TEAM (10% weight):
├── Relevant skills: /10
└── Can execute: /10

TOTAL WEIGHTED SCORE: /10
```

### Output Format
```
# Startup Idea Validation

## The Idea
{1-2 sentence summary}

## Validation Score: {X}/10

╔══════════════════════════════════════╗
║  Problem:      ████████████░░  8/10  ║
║  Market:       █████████░░░░░  7/10  ║
║  Solution:     ███████░░░░░░░  6/10  ║
║  Business:     ██████░░░░░░░░  5/10  ║
║  Team:         ████████░░░░░░  7/10  ║
╚══════════════════════════════════════╝

## Problem Validation ✓/✗
**Is it real?** {Yes/No with evidence}
**Who has it?** {Target customer}
**How urgent?** {High/Medium/Low}
**Current solutions:** {What exists}
**Gap in market:** {What you offer}

## Market Validation ✓/✗
- TAM: ₹{X} Crores
- SAM: ₹{X} Crores  
- SOM (Year 1): ₹{X} L
- Growth: {X}% YoY

## Solution Validation ✓/✗
- MVP Cost: ₹{X}
- MVP Time: {X} weeks
- Tech complexity: {Low/Med/High}
- Technical risks: {List}

## Business Model Validation ✓/✗
**Revenue Model:** {What you charge}
**Pricing:** ₹{X}/month or ₹{X} one-time
**Unit Economics:**
- Price: ₹{X}
- Cost to serve: ₹{X}
- Gross Margin: {X}%
- CAC: ₹{X}
- LTV: ₹{X}
- LTV:CAC ratio: {X}:1

**Break-even:** Month {X}

## Competition Validation ✓/✗
**Direct competitors:** {List 3-5}
**Your advantage:** {Differentiation}
**Moat (sustainable):** {Why hard to copy}

## Red Flags 🚨
1. {Red flag 1}
2. {Red flag 2}

## Green Flags ✅
1. {Green flag 1}
2. {Green flag 2}

## Verdict

### STRONG - Proceed ✅
- Next steps: {Actions}

### PROMISING - Modify ⚠️
- Key changes: {What to adjust}

### WEAK - Pivot or Pass ❌
- Why: {Reasons}
- If still want to pursue: {Advice}

## Recommended Next Steps
1. {Step 1}
2. {Step 2}
3. {Step 3}
```

## Commands
| Command | Action |
|---------|--------|
| `validate <idea>` | Full validation |
| `validate problem` | Problem validation only |
| `validate market` | Market size check |
| `validate model` | Business model check |
| `quick validate` | 5-minute summary |