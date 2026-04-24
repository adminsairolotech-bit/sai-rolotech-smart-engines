# Meeting Notes Synthesizer

## Triggers
- User shares meeting notes/transcript for processing
- User says "meeting notes", "summarize this", "what was decided", "action items"

## What It Does

### Processing Flow
```
MEETING NOTES / TRANSCRIPT
        ↓
1. PARSE CONTENT
   → Identify attendees
   → Extract date/time
   → Separate topics discussed
   → Identify decisions made
   → Extract action items
   → Note questions raised
   → Identify blockers/risks
        ↓
2. STRUCTURE INFORMATION
   → Group by topic
   → Chronological order
   → Decision rationale
   → Action item details
   → Owner and deadline
        ↓
3. SYNTHESIZE
   → Executive summary
   → Key takeaways
   → Prioritized action items
   → Follow-up questions
   → Next steps
        ↓
OUTPUT: Structured meeting summary
```

### Output Format
```
# Meeting Summary

## Metadata
**Date:** {Date}
**Time:** {Start} - {End}
**Attendees:** {List}
**Facilitator:** {Name}
**Note-taker:** {Name}

## Executive Summary
{2-3 sentences: What happened, key outcome, main decisions}

## Key Decisions ✓

| Decision | Rationale | Decided By |
|----------|-----------|------------|
| {Decision 1} | {Why decided} | {Person} |
| {Decision 2} | {Why decided} | {Person} |

## Action Items

### 🔴 High Priority
| Item | Owner | Deadline | Status |
|------|-------|----------|--------|
| {Task} | @{Person} | {Date} | ⬜ |

### 🟡 Medium Priority
| Item | Owner | Deadline | Status |
|------|-------|----------|--------|
| {Task} | @{Person} | {Date} | ⬜ |

### 🟢 Low Priority
| Item | Owner | Deadline | Status |
|------|-------|----------|--------|

## Discussion Highlights

### Topic 1: {Subject}
**Points discussed:**
- {Point 1}
- {Point 2}
- {Point 3}

**Outcome:** {What was decided/concluded}

### Topic 2: {Subject}
...

## Open Questions ❓

| Question | Asked By | For | Status |
|----------|----------|-----|--------|
| {Question} | {Person} | @{Person} | ⬜ |

## Risks & Blockers ⚠️

| Risk/Blocker | Impact | Owner | Mitigation |
|--------------|--------|-------|------------|
| {Risk} | {High/Med/Low} | @{Person} | {Action} |

## Resources & Links

- {Link 1}
- {Link 2}

## Next Meeting
**Date:** {Date}
**Time:** {Time}
**Agenda:** {Topics to cover}

---

## Full Transcript / Notes
(Attached below for reference)
```

## Quick Extract Formats

### Action Items Only
```
📋 ACTION ITEMS

1. [HIGH] @{Person}: {Task} - Due {Date}
2. [MED] @{Person}: {Task} - Due {Date}
3. [LOW] @{Person}: {Task} - Due {Date}
```

### Decisions Only
```
✅ DECISIONS

1. {Decision} - Decided by @{Person}
2. {Decision} - Decided by @{Person}
```

### TL;DR
```
📝 MEETING TL;DR

Discussed: {Topics}
Decided: {Key decisions}
To do: {Top 3 actions}
Blocked: {Any blockers}
```

## Template for Live Note-Taking

```
# Meeting: {Topic}
**Date:** {Date}
**Attendees:** 

## Agenda
1. {Topic 1}
2. {Topic 2}
3. {Topic 3}

## Notes

### {Topic 1}
- {Point}
- {Point}
**Decision:** 
**Action:** @{Person} - {Task}

## Next Steps
- [ ] 
- [ ] 
```

## Commands
| Command | Action |
|---------|--------|
| `summarize meeting` | Full summary |
| `extract actions` | Action items only |
| `extract decisions` | Decisions only |
| `tldr` | 3-sentence summary |
| `create follow-up` | Generate next meeting agenda |