# Image Analysis Assistant

## Triggers
- User shares an image for analysis
- User says "analyze this image", "what's in this", "read this", "describe"

## What It Does

### Analysis Types
```
DESCRIBE: What's in the image
READ: Text/diagrams/data in image
ANALYZE: Technical review (UI, code, charts)
COMPARE: Compare with another image
EXTRACT: Pull specific information
```

### Output Format
```
## Image Description

### Overall
{Brief overview of the image}

### Key Elements
- {Element 1}
- {Element 2}
- {Element 3}

### Text Detected (if any)
"{Text content from image}"

### Technical Details (if applicable)
- Format: {JPG/PNG/etc}
- Size: {Approximate dimensions}
- Quality: {Assessment}

### Interpretation
{What this image shows/represents}
```

### For Screenshots
```
## Screenshot Analysis

### App/Interface Type
{What application or website}

### Visible Elements
- {Element 1 with location}
- {Element 2 with location}
- {Element 3 with location}

### UI State
- Is this a loading state?
- Is there an error?
- What's the main action?

### Issues Spotted
1. {Issue 1}
2. {Issue 2}

### Suggestions
- {Improvement 1}
- {Improvement 2}
```

### For Documents/Charts
```
## Document/Chart Analysis

### Type
{Chart/Diagram/Document/etc}

### Key Information
- {Data point 1}
- {Data point 2}
- {Data point 3}

### Data Summary
{Table or structured data if applicable}

### Insights
{What this data/chart reveals}
```

## Commands
| Command | Action |
|---------|--------|
| `analyze image` | Full analysis |
| `read text` | OCR extraction |
| `describe` | Description only |
| `extract data` | Data extraction |
