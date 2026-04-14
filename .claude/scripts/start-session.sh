#!/usr/bin/env bash
# =============================================================================
# SAI ROLO TECH - START SESSION SCRIPT
# Version: V2.0
# Purpose: Initialize session with all required validations
# =============================================================================

# Note: Not using 'set -e' because check_file returns 1 for missing files

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
pwd

echo "=============================================="
echo "  SAI ROLO TECH - START SESSION V2"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}[OK]${NC} $1"
        return 0
    else
        echo -e "${RED}[MISSING]${NC} $1"
        return 1
    fi
}

# Required files
REQUIRED_FILES=(
    "RULES.md"
    "RULES-STRICT.md"
    "TASK_TEMPLATE.md"
    "VALIDATION_GATE.md"
    "PROJECT_CONTROL.md"
    ".claude/CHECKPOINT.md"
    ".claude/memory.json"
    ".claude/session_state.json"
    ".claude/session_lock.json"
    ".claude/project_fingerprint.json"
)

# Required scripts
REQUIRED_SCRIPTS=(
    ".claude/scripts/guard-task.sh"
    ".claude/scripts/run-task.sh"
    ".claude/scripts/end-session.sh"
    ".claude/scripts/validate-response.py"
)

errors=0

echo "Checking required files..."
echo ""
for file in "${REQUIRED_FILES[@]}"; do
    if ! check_file "$file"; then
        errors=$((errors + 1))
    fi
done

echo ""
echo "Checking required scripts..."
echo ""
for script in "${REQUIRED_SCRIPTS[@]}"; do
    if ! check_file "$script"; then
        errors=$((errors + 1))
    fi
done

if [ $errors -gt 0 ]; then
    echo ""
    echo -e "${RED}=============================================="
    echo "  SESSION START FAILED"
    echo "  Missing $errors required files/scripts"
    echo "==============================================${NC}"
    exit 1
fi

echo ""
echo "Updating session state..."

# Get current git remote
GIT_REMOTE=$(git remote get-url origin 2>/dev/null || echo "no-remote")
GIT_BRANCH=$(git branch --show-current 2>/dev/null || echo "main")

# Update session state
python3 - <<'PYTHON'
import json
import os
import time

session_state = {
    "session_id": f"SESSION-{int(time.time())}",
    "session_started_at": time.strftime("%Y-%m-%d %H:%M:%S"),
    "session_status": "ACTIVE",
    "enforcement_level": "V2",
    "task_execution_allowed": True,
    "rules_loaded": True,
    "memory_loaded": True,
    "checkpoint_loaded": True,
    "project_control_loaded": True,
    "project_fingerprint_loaded": True
}

with open(".claude/session_state.json", "w", encoding="utf-8") as f:
    json.dump(session_state, f, indent=2)

print("Session state updated")
PYTHON

# Update project fingerprint
python3 - <<'PYTHON'
import json
import os
import subprocess

try:
    git_remote = subprocess.check_output(["git", "remote", "get-url", "origin"], text=True).strip()
except:
    git_remote = "no-remote"

fingerprint = {
    "project_root": os.getcwd(),
    "project_name": os.path.basename(os.getcwd()),
    "created_at": "2026-04-14",
    "fingerprints": {
        "git_remote": git_remote,
        "main_branch": "main"
    },
    "session_count": 0,
    "last_session": None
}

# Update session count
try:
    with open(".claude/project_fingerprint.json", "r", encoding="utf-8") as f:
        existing = json.load(f)
    fingerprint["session_count"] = existing.get("session_count", 0) + 1
    fingerprint["last_session"] = existing.get("session_id", "first")
except:
    pass

with open(".claude/project_fingerprint.json", "w", encoding="utf-8") as f:
    json.dump(fingerprint, f, indent=2)

print("Project fingerprint updated")
PYTHON

# Clear session lock
python3 - <<'PYTHON'
import json

lock = {
    "locked": False,
    "reason": "",
    "locked_at": None,
    "locked_by": None
}

with open(".claude/session_lock.json", "w", encoding="utf-8") as f:
    json.dump(lock, f, indent=2)

print("Session lock cleared")
PYTHON

echo ""
echo -e "${GREEN}=============================================="
echo "  SESSION STARTED SUCCESSFULLY"
echo "=============================================="
echo ""
echo "Run './.claude/scripts/guard-task.sh' before starting any task"
echo ""

exit 0
