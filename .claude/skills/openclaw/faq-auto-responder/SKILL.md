# FAQ Auto Responder

## Triggers
- User wants automated FAQ responses
- User says "FAQ", "common questions", "auto reply to FAQ"

## What It Does

### 1. FAQ Setup
```
Define Topic → Add Q&A Pairs → Activate

Example Topics:
PRICING
├── "How much does it cost?"
├── "Is there a free trial?"
├── "What's included in premium?"
└── "Do you offer discounts?"

SUPPORT
├── "How do I reset password?"
├── "How to contact support?"
├── "What's your response time?"
└── "Can I get a refund?"

PRODUCT
├── "What features do you have?"
├── "Does it work on mobile?"
├── "Is my data secure?"
└── "Do you export data?"
```

### 2. Question Matching
```
User Input → Match to FAQ → Respond

Matching Methods:
1. Exact match: "how much" → pricing answer
2. Keyword match: "trial" → free trial answer
3. Semantic match: AI similarity > 80%
4. Synonym: "cost" = "price" = "fee"
```

### 3. Response Format
```
Direct Answer:
"How much does it cost?"
→ "Our plans start at ₹999/month. 
   See all plans: [link]"

With Context:
"Can I cancel anytime?"
→ "Yes! You can cancel anytime with no 
   cancellation fees. Your access continues 
   until the end of your billing period."
```

### 4. Escalation to Human
```
Trigger Conditions:
- Question not matched (confidence < 60%)
- User says "talk to human", "real person"
- Sentiment: frustrated, angry
- 3+ unanswered questions
- Specific account query

Flow:
"Got it! Let me connect you with our team..."
→ Create support ticket
→ Route to appropriate person
→ Notify team member
```

### 5. FAQ Learning
```
When human answers:
- Save question + answer pair
- Add to FAQ for next time
- Learn natural phrasings

Example:
Human: "Took 3 days" to "How long for delivery?"
→ Add: "How long does delivery take? → 3-5 business days"
```

## Setup Commands
| Command | Action |
|---------|--------|
| `faq add <topic>` | New FAQ topic |
| `faq add-q <question>` | Add question |
| `faq add-a <answer>` | Add answer |
| `faq list` | Show all FAQs |
| `faq train` | Learn from history |
