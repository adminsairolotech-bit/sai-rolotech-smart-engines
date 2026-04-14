#!/usr/bin/env bash
# =============================================================================
# SAI ROLO TECH - END SESSION SCRIPT
# Version: V2.0
# Purpose: Clean session termination with lock
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
NC='\033[0m'

echo "=============================================="
echo "  SAI ROLO TECH - END SESSION V2"
echo "=============================================="
echo ""

# Update session state
python3 - <<'PYTHON'
import json
import time
import os

# Read current session state
session_path = ".claude/session_state.json"
lock_path = ".claude/session_lock.json"

if os.path.isfile(session_path):
    with open(session_path, "r", encoding="utf-8") as f:
        state = json.load(f)

    state["task_execution_allowed"] = False
    state["session_status"] = "ENDED"
    state["session_ended_at"] = time.strftime("%Y-%m-%d %H:%M:%S")

    with open(session_path, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)

    print("[OK] Session state updated")
else:
    print("[WARN] No session_state.json found")

# Lock the session
lock = {
    "locked": True,
    "reason": "Session ended. Run ./start-session.sh to restart.",
    "locked_at": time.strftime("%Y-%m-%d %H:%M:%S"),
    "locked_by": "end-session.sh"
}

with open(lock_path, "w", encoding="utf-8") as f:
    json.dump(lock, f, indent=2)

print("[OK] Session locked")
print("[OK] Session ended and locked.")
PYTHON

echo ""
echo -e "${GREEN}=============================================="
echo "  SESSION ENDED"
echo "==============================================${NC}"
echo ""
echo "Session has been locked."
echo "To start a new session, run:"
echo "  ./start-session.sh"
echo ""

exit 0
