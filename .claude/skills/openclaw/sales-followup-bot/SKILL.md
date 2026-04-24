# Sales Follow-Up Bot

## Triggers
- User wants lead follow-up automation
- User says "follow up", "lead nurture", "sales automation"

## What It Does

### 1. Lead Capture
```
Chat/Form → Extract Info → Create Lead

Captures:
- Name: {first} {last}
- Email: {email}
- Phone: {phone}
- Company: {company}
- Interest: {product/service}
- Budget: {if mentioned}
- Timeline: {if mentioned}
- Source: {how found us}
```

### 2. Lead Scoring
```
Score = Engagement × Intent × Fit

Engagement:
- Visited pricing page: +10
- Downloaded brochure: +15
- Demo requested: +30
- Email opened: +5
- Multiple visits: +20

Intent Signals:
- "interested" mentioned: +25
- "soon" / "ASAP" / "urgent": +20
- Competitor mentioned: +15
- Budget range shared: +15

Fit:
- Company size match: +10
- Industry match: +10
- Role: Decision maker: +15, Influencer: +10
```

### 3. Follow-Up Sequences
```
HOT LEAD (Score 80+):
Day 0: Immediate personal call
Day 1: Email with case study
Day 3: WhatsApp check-in
Day 7: Second call
Day 14: Offer demo

WARM LEAD (Score 50-79):
Day 0: Thank you + brochure
Day 2: Email with relevant content
Day 5: Follow-up call
Day 10: Share testimonial
Day 21: Final attempt

COLD LEAD (Score 20-49):
Day 0: Welcome email
Day 7: Helpful content
Day 21: Check if timing changed
Day 45: Unsubscribe / nurture list
```

### 4. Multi-Channel Follow-Up
```
Channel Priority:
1. WhatsApp - Personal, immediate (India market)
2. Email - Formal, detailed
3. Phone - High-intent leads only
4. SMS - Reminders, short messages

Message Variation:
"Hi {name}, following up on our conversation about {product}. 
Any questions I can answer?"

"Hi! Just checking in - did you get a chance to review the proposal?"

"{firstName} bhai, kya aapne proposal dekha? Koi sawal hai to batao 🙏"
```

### 5. Reminder Triggers
```
→ After demo: Set 3-day follow-up
→ After proposal: Set 5-day follow-up
→ After pricing discussion: Set 7-day follow-up
→ No response in 2 days: Escalate to different channel
→ No response in 14 days: Move to nurture sequence
```

### 6. CRM Integration
```
Create/Update Lead:
- Name, contact info
- Company details
- Lead score
- Last contact date
- Next action date
- Pipeline stage
- Owner (sales rep)

Auto-log all interactions
```

## Dashboard
- Leads by stage
- Follow-ups due today
- Conversion rates
- Avg time to close
- Top sources
