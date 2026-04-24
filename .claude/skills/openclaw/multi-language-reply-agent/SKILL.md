# Multi-Language Reply Agent

## Triggers
- User wants to reply in different languages
- User says "reply in Hindi", "translate", "Hinglish"

## What It Does

### 1. Language Detection & Reply
```
Incoming Message Language → Generate Reply in Same
                         ↓ or Target Language (if specified)

Example:
English In → Hindi/English/Hinglish Out
Hindi In → English/Hindi/Hinglish Out
Hinglish In → English/Hindi/Hinglish Out
```

### 2. Reply Modes
```
FORMAL:
- Professional tone
- Complete sentences
- Proper greeting/signoff

CASUAL:
- Friendly tone
- Short sentences
- Emoji usage OK
- Contractions allowed

HINGLISH (India market):
- Hindi words in Roman script
- English grammar structure
- Cultural context
- Respectful (ji, aap)
```

### 3. Reply Templates by Language
```
ENGLISH:
"Thank you for reaching out. I'll get back to you shortly."

HINDI:
"धन्यवाद! हम जल्द से जल्द आपसे संपर्क करेंगे।"

HINGLISH:
"Thanks ji! Aapka message mila, jaldi reply karenge. 🙏"

TAMIL:
"நன்றி! விரைவில் உங்களுக்கு பதில் அனுப்புவோம்."

TELUGU:
"ధన్యవాదాలు! త్వరలో మీకు సమాధానం ఇస్తాము."
```

### 4. Sentiment Matching
```
Customer Happy → Reply enthusiastic
Customer Neutral → Professional
Customer Frustrated → Empathetic + solution
Customer Angry → Apologetic + priority
```
