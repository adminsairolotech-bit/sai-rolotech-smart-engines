#!/usr/bin/env bash
# =============================================================================
# SAI ROLO TECH - GUARD TASK SCRIPT
# Version: V2.0
# Purpose: Pre-task validation - blocks if session is invalid
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

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=============================================="
echo "  SAI ROLO TECH - TASK GUARD V2"
echo "=============================================="
echo ""

errors=()

# Check 1: Required files exist
required_files=(
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

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        errors+=("BLOCKED: missing required file -> $file")
    fi
done

# Check 2: Session lock
if [ -f ".claude/session_lock.json" ]; then
    lock_status=$(python3 - <<'PY'
import json
try:
    with open(".claude/session_lock.json", "r") as f:
        lock = json.load(f)
    if lock.get("locked", False):
        print("LOCKED:" + lock.get("reason", "unknown"))
    else:
        print("OK")
except:
    print("ERROR")
PY
)
    if [[ "$lock_status" == LOCKED:* ]]; then
        reason="${lock_status#LOCKED:}"
        errors+=("BLOCKED: session lock active -> $reason")
    fi
fi

# Check 3: Session state validation
if [ -f ".claude/session_state.json" ] && [ -f ".claude/project_fingerprint.json" ]; then
    session_check=$(python3 - <<'PY'
import json
import os
import time
from datetime import datetime

MAX_SESSION_AGE_SECONDS = 10800  # 3 hours

errors = []

try:
    with open(".claude/session_state.json", "r", encoding="utf-8") as f:
        state = json.load(f)
except:
    print("ERROR:session_state unreadable")
    exit(0)

try:
    with open(".claude/project_fingerprint.json", "r", encoding="utf-8") as f:
        finger = json.load(f)
except:
    finger = {}

# Check project root changed
if finger.get("project_root") and finger.get("project_root") != os.getcwd():
    errors.append("project root changed: possible new project, rerun ./start-session.sh")

# Check rules loaded
if not state.get("rules_loaded"):
    errors.append("rules not loaded")

# Check memory loaded
if not state.get("memory_loaded"):
    errors.append("memory not loaded")

# Check checkpoint loaded
if not state.get("checkpoint_loaded"):
    errors.append("checkpoint not loaded")

# Check project control loaded
if not state.get("project_control_loaded"):
    errors.append("project_control not loaded")

# Check task execution allowed
if not state.get("task_execution_allowed"):
    errors.append("task execution not allowed")

# Check session age
started_at = state.get("session_started_at", "")
if not started_at:
    errors.append("session not started")
else:
    try:
        current = int(time.time())
        dt = datetime.strptime(started_at, "%Y-%m-%d %H:%M:%S")
        age = current - int(dt.timestamp())
        if age > MAX_SESSION_AGE_SECONDS:
            errors.append(f"session stale (age: {age}s): rerun ./start-session.sh")
    except Exception as e:
        errors.append("invalid session timestamp")

if errors:
    print("ERROR:" + " | ".join(errors))
else:
    print("OK")
PY
)

    if [[ "$session_check" == ERROR:* ]]; then
        reason="${session_check#ERROR:}"
        errors+=("$reason")
    fi
fi

# Report results
if [ ${#errors[@]} -gt 0 ]; then
    echo -e "${RED}=============================================="
    echo "  TASK BLOCKED"
    echo "==============================================${NC}"
    echo ""
    for error in "${errors[@]}"; do
        echo -e "${RED}[BLOCK]${NC} $error"
    done
    echo ""

    # Lock session on error
    python3 - <<'PYTHON'
import json
import time

errors_str = input() if False else ""

lock = {
    "locked": True,
    "reason": "Validation failed - " + errors_str,
    "locked_at": time.strftime("%Y-%m-%d %H:%M:%S"),
    "locked_by": "guard-task.sh"
}

with open(".claude/session_lock.json", "w", encoding="utf-8") as f:
    json.dump(lock, f, indent=2)
PYTHON

    exit 1
fi

echo -e "${GREEN}[OK]${NC} All validations passed"
echo -e "${GREEN}[OK]${NC} Task execution allowed"
echo ""
echo "Ready for task. Use './.claude/scripts/run-task.sh \"task description\"' to start."
echo ""

exit 0
