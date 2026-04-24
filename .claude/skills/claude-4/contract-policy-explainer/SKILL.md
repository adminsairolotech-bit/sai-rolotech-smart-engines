# Contract/Policy Explainer

## Triggers
- User shares legal/policy document for explanation
- User says "explain", "what does this mean", "legal", "policy"

## What It Does

### Analysis Process
```
LEGAL/POLICY DOCUMENT
         ↓
1. IDENTIFY TYPE
   → Contract (sales, employment, rental, NDA)
   → Policy (company, government, insurance)
   → Agreement (terms of service, SLA)
   → Regulation (compliance requirement)
         ↓
2. PARSE KEY ELEMENTS
   → Parties involved
   → Key terms and definitions
   → Obligations for each party
   → Timeline and deadlines
   → Financial implications
   → Termination clauses
   → Penalty/bonus structures
         ↓
3. SIMPLIFY
   → Plain language explanation
   → Real-world analogies
   → Visual diagrams where helpful
   → Risk identification
         ↓
4. HIGHLIGHT CONCERNS
   → Unusual terms
   → Hidden costs
   → One-sided provisions
   → Things to negotiate
         ↓
OUTPUT: Actionable understanding
```

### Output Format
```
# {Document Type} Analysis

## Quick Summary
**What it is:** {1-2 sentence description}
**Who it's between:** {Parties}
**How long:** {Duration/term}
**Key thing to know:** {Most important point}

## Parties & Their Roles

| Party | Role | Key Obligations |
|-------|------|-----------------|
| {Name} | {Role} | {Obligation 1, 2} |
| {Name} | {Role} | {Obligation 1, 2} |

## Important Terms (Plain Language)

### {Term Name}
**Legalese:** "{original clause}"
**What it means:** "{plain language explanation}"
**Watch out for:** "{flag if any}"

## Your Obligations
- {Obligation 1}
- {Obligation 2}
- {Deadline 1}

## They Must Do
- {Obligation 1}
- {Obligation 2}

## Money Matters
- Upfront: {Amount}
- Recurring: {Amount}/month
- Hidden costs: {List}
- What happens if...: {Scenario}

## Risks to Know
⚠️ {Risk 1}
⚠️ {Risk 2}
⚠️ {Risk 3}

## Questions to Ask
1. {Question 1}
2. {Question 2}
3. {Question 3}

## Should You Sign?
{Maybe/Yes/No with reasoning}
```

### Special Handling

#### NDA (Non-Disclosure Agreement)
- What's protected?
- How long protected?
- What counts as "disclosure"?
- Penalty for breach?

#### Employment Contract
- Salary and bonus structure
- Leave policy
- Notice period (both sides)
- Non-compete clauses
- IP ownership
- Termination conditions

#### Rental Agreement
- Monthly rent and increase rules
- Security deposit
- Maintenance responsibilities
- Notice period to vacate
- Penalty clauses

#### Terms of Service
- What data they collect
- How they can use your data
- Liability limitations
- Dispute resolution (arbitration vs court)
- How they can terminate service

## Commands
| Command | Action |
|---------|--------|
| `explain this contract` | Full analysis |
| `what does X mean` | Specific term |
| `flag concerns` | Risk identification |
| `negotiation points` | What to push back on |
| `compare versions` | If comparing drafts |