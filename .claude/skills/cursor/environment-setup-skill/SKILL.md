# Environment Setup Skill

## Triggers
- User wants setup documentation
- User says "setup", ".env", "environment", "installation"

## What It Does

### Setup Generation
```
PROJECT
        ↓
1. IDENTIFY ENVARS
   → API keys
   → Database URLs
   → Secrets
   → Config values
        ↓
2. CREATE FILES
   → .env.example
   → .env.template
   → Setup docs
        ↓
OUTPUT: Setup guide
```

### Output Format
```bash
# .env.example
# Database
DATABASE_URL=postgresql://localhost:5432/mydb

# API Keys
API_KEY=your_api_key_here
STRIPE_SECRET=sk_test_xxx

# App Config
PORT=3000
NODE_ENV=development

# Secrets
JWT_SECRET=generate_random_string
SESSION_SECRET=generate_random_string
```

## Commands
| Command | Action |
|---------|--------|
| `setup env` | Generate .env |
| `add secrets` | Add to .env.example |
