#!/usr/bin/env bash
# =============================================================================
# SAI ROLO TECH - RUN TASK SCRIPT
# Version: V2.0
# Purpose: Initialize a new task with token and response file
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

TASK_TEXT="${1:-}"

if [ -z "$TASK_TEXT" ]; then
    echo -e "${RED}Usage:${NC} ./run-task.sh \"your task here\""
    echo ""
    echo "This script must be called AFTER guard-task.sh passes."
    exit 1
fi

# Run guard first
echo "Running pre-task validation..."
if ! "$SCRIPT_DIR/guard-task.sh"; then
    echo ""
    echo -e "${RED}Cannot start task - guard validation failed${NC}"
    exit 1
fi

echo ""
echo "Starting task..."
echo ""

# Generate task token
TOKEN="$(date +%Y%m%d-%H%M%S)-$$"

# Create tasks directory
mkdir -p ".claude/tasks"

# Create current task JSON
cat > ".claude/current_task.json" <<EOF
{
  "task_token": "$TOKEN",
  "task_text": "$TASK_TEXT",
  "started_at": "$(date '+%Y-%m-%d %H:%M:%S')",
  "status": "IN_PROGRESS",
  "response_file": ".claude/latest_response.md",
  "gemini_status": "PENDING"
}
EOF

# Create task specific response file
cat > ".claude/latest_response.md" <<EOF
# TASK HEADER

**Task Token:** $TOKEN
**Started:** $(date '+%Y-%m-%d %H:%M:%S')
**Task:** $TASK_TEXT

---

## Status

\`\`\`
IN_PROGRESS
\`\`\`

---

## Understanding

*(What is failing or what needs to be built)*

-

---

## Root Cause

*(Why is it failing?)*

-

---

## Evidence

*(What supports this?)*

-

---

## Files Involved

*(Files inspected/changed)*

-

---

## Services Checked

*(Service verification results)*

| Service | Status | Command | Result |
|---------|--------|---------|--------|
| | | | |

---

## Skills/Tools Used

*(Which skill or pattern was applied)*

-

---

## Plan

*(Execution plan with steps)*

1.

---

## Test Plan

*(How to verify success)*

-

---

## Commands Run

\`\`\`bash
# Command
# Output:
\`\`\`

---

## Test Results

\`\`\`
# Test output
\`\`\`

---

## Actual Output

*(Real command outputs)*

\`\`\`

\`\`\`

---

## Gemini Verification Status

\`\`\`
PENDING
\`\`\`

---

## Confidence

\`\`\`
0/100
\`\`\`

---

## Change Log

| Field | Value |
|-------|-------|
| File | |
| What Changed | |
| Why | |
| Expected Effect | |
| Possible Risk | |

---

## Response Format Validated

\`\`\`
[X] Status section present
[ ] Understanding section filled
[ ] Root Cause section filled
[ ] Files section filled
[ ] Services checked with real commands
[ ] Plan section filled
[ ] Test Results with actual output
[ ] Confidence level set
[ ] Change Log completed
\`\`\`

---

**Response must follow TASK_TEMPLATE.md format.**
**After completing, run: python3 validate-response.py .claude/latest_response.md**
EOF

echo "=============================================="
echo "  TASK STARTED"
echo "=============================================="
echo ""
echo -e "${GREEN}Token:${NC}  $TOKEN"
echo -e "${GREEN}Task:${NC}   $TASK_TEXT"
echo ""
echo "Files created:"
echo "  - .claude/current_task.json"
echo "  - .claude/latest_response.md"
echo ""
echo "Write your response in .claude/latest_response.md"
echo "Follow TASK_TEMPLATE.md format."
echo ""
echo "After completing the task, run:"
echo -e "  ${YELLOW}python3 .claude/scripts/validate-response.py .claude/latest_response.md${NC}"
echo ""

exit 0
