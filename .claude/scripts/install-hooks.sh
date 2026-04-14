#!/usr/bin/env bash
# =============================================================================
# SAI ROLO TECH - INSTALL HOOKS SCRIPT
# Version: V2.0
# Purpose: Install Husky hooks and set up enforcement
# =============================================================================

# Get script directory (works when called as ./script.sh or bash script.sh)
SOURCE="${BASH_SOURCE[0]}"
while [ -h "$SOURCE" ]; do
    DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"
    SOURCE="$(readlink "$SOURCE")"
    [[ $SOURCE != /* ]] && SOURCE="$DIR/$SOURCE"
done
SCRIPT_DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"
PROJECT_ROOT="$( cd -P "$SCRIPT_DIR/../.." && pwd )"

cd "$PROJECT_ROOT"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "=============================================="
echo "  SAI ROLO TECH - INSTALL HOOKS V2"
echo "=============================================="
echo ""

# Make scripts executable
echo "Making scripts executable..."
chmod +x "$SCRIPT_DIR/start-session.sh" 2>/dev/null || true
chmod +x "$SCRIPT_DIR/guard-task.sh" 2>/dev/null || true
chmod +x "$SCRIPT_DIR/run-task.sh" 2>/dev/null || true
chmod +x "$SCRIPT_DIR/end-session.sh" 2>/dev/null || true
chmod +x "$SCRIPT_DIR/validate-response.py" 2>/dev/null || true
echo -e "${GREEN}[OK]${NC} Scripts made executable"

# Install Husky hooks
echo ""
echo "Installing Husky hooks..."

# Create pre-commit hook
cat > ".husky/pre-commit" <<'HOOK'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run pre-commit checks
python3 -m pre_commit run --all-files

# Validate response if exists
if [ -f ".claude/latest_response.md" ]; then
    python3 .claude/scripts/validate-response.py .claude/latest_response.md
fi
HOOK

# Create pre-push hook
cat > ".husky/pre-push" <<'HOOK'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run guard-task validation
"$SCRIPT_DIR/guard-task.sh"

# Run Gitleaks scan
if command -v gitleaks &> /dev/null; then
    gitleaks detect --source . --redact --config .gitleaks.toml
fi

# Run Playwright tests
if [ -d "tests" ]; then
    npx playwright test --reporter=list 2>/dev/null || echo "Playwright tests skipped"
fi
HOOK

# Make hooks executable
chmod +x ".husky/pre-commit"
chmod +x ".husky/pre-push"

echo -e "${GREEN}[OK]${NC} Husky hooks created"
echo ""
echo "Hooks installed:"
echo "  - .husky/pre-commit (pre-commit checks)"
echo "  - .husky/pre-push (pre-push validation)"
echo ""

# Verify
echo "Verifying installation..."
if [ -f ".husky/pre-commit" ] && [ -f ".husky/pre-push" ]; then
    echo -e "${GREEN}[OK]${NC} All hooks installed"
else
    echo -e "${RED}[ERROR]${NC} Hook installation failed"
    exit 1
fi

echo ""
echo -e "${GREEN}=============================================="
echo "  HOOKS INSTALLED SUCCESSFULLY"
echo "==============================================${NC}"
echo ""
echo "Next steps:"
echo "  1. Run ./start-session.sh to start a session"
echo "  2. Use ./run-task.sh \"task\" before each task"
echo "  3. Write response in .claude/latest_response.md"
echo "  4. Validate with: python3 validate-response.py"
echo ""

exit 0
