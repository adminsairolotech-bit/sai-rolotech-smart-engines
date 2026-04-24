# Long Document Summarizer

## Triggers
- User shares long text/PDF for summarization
- User says "summarize", "summary", "TL;DR", "key points"

## What It Does

### Summarization Process
```
INPUT: Long document (100+ pages or 10K+ words)
       ↓
1. PARSE
   → Identify structure (chapters, sections)
   → Extract key headings and data
   → Note document type (report, contract, article)
       ↓
2. ANALYZE
   → What is the main argument/thesis?
   → What are the supporting points?
   → What data/statistics are important?
   → What are the conclusions?
       ↓
3. DISTILL
   → Remove redundancy
   → Keep essential information
   → Maintain logical flow
   → Preserve key quotes
       ↓
OUTPUT: Structured summary
```

### Output Formats

#### Executive Summary (1 page)
```
# {Document Title}
## Executive Summary

**Purpose:** {What this document is about}
**Key Finding:** {Most important takeaway}
**Main Recommendation:** {If applicable}

### Key Points (3-5 bullets)
- {Key point 1}
- {Key point 2}
- {Key point 3}

### Action Items
- [ ] {Action 1}
- [ ] {Action 2}

### Data Highlights
| Metric | Value |
|--------|-------|
| {Stat 1} | {Value} |
| {Stat 2} | {Value} |

**Pages/Time to read full:** {X} pages / {Y} minutes
```

#### Section-by-Section Summary
```
For each major section:
## {Section Name}
**Purpose:** {What this section covers}
**Key content:** {Bullet points}
**Importance:** High/Medium/Low
```

### Handling Different Document Types

#### Financial Report
- Executive summary
- Key metrics table
- YoY comparison
- Risk factors identified
- Recommendations

#### Legal Contract
- Parties involved
- Key terms and conditions
- Obligations by party
- Deadlines and milestones
- Risk clauses highlighted
- Questions to ask lawyer

#### Academic Paper
- Research question
- Methodology
- Key findings
- Limitations
- Conclusions
- Next steps for research

#### Meeting Transcript
- Attendees
- Key decisions made
- Action items with owners
- Open questions
- Next steps

## Commands
| Command | Action |
|---------|--------|
| `summarize` | Generate executive summary |
| `summary detailed` | Section-by-section |
| `extract data` | Pull out numbers/stats |
| `find action items` | Extract tasks |
| `key quotes` | Extract important quotes |