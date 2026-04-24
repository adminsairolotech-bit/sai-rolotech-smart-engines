#!/bin/bash
# SmartBot Startup Script

cd "$(dirname "$0")"

echo "🤖 Starting SmartBot..."
echo "   Token: ${TELEGRAM_BOT_TOKEN:0:20}..."
echo "   API: ${ANTHROPIC_API_KEY:0:20}..."

node smartbot.mjs