#!/bin/bash
# SAI Rolotech Engine - Start Script (Unix/Linux/Mac)

# Load .env file
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

echo "🤖 Starting SAI Rolotech Engine..."
echo ""

# Check for required API key
if [ -z "$ANTHROPIC_API_KEY" ] && [ -z "$CLAUDE_API_KEY" ]; then
    echo "⚠️  WARNING: No API key found in .env"
    echo "   Add ANTHROPIC_API_KEY or CLAUDE_API_KEY to .env"
    echo ""
fi

# Start the engine
npm run dev
