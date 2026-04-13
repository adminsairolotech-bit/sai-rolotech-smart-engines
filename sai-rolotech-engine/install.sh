#!/bin/bash
# SAI Rolotech Engine - Quick Install Script

echo "🚀 Installing SAI Rolotech Engine..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Install from https://nodejs.org"
    exit 1
fi

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env file if not exists
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file"
    echo "⚠️  Please add your API keys to .env"
fi

# Create data directories
mkdir -p data/memory
mkdir -p data/whatsapp
mkdir -p temp

echo ""
echo "✅ Installation complete!"
echo ""
echo "📝 Next steps:"
echo "1. Edit .env and add your API keys"
echo "2. Run: npm run dev"
echo ""
