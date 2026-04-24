#!/usr/bin/env sh
set -eu

echo "=== Scanning AI rules files for hidden Unicode ==="

files=""
if [ -f ".cursorrules" ]; then
  files=".cursorrules"
fi

if [ -d ".cursor/rules" ]; then
  files="$files $(find ".cursor/rules" -type f -name "*.mdc" 2>/dev/null || true)"
fi

if [ -z "${files# }" ]; then
  echo "No rules files found. PASS."
  exit 0
fi

# Common “invisible” characters used for prompt injection / spoofing:
# - BOM (FEFF)
# - Zero-width space (200B), joiner (200D), non-joiner (200C)
# - Word joiner (2060), LRM/RLM (200E/200F), bidi overrides (202A-202E)
pattern='[\x{FEFF}\x{200B}\x{200C}\x{200D}\x{2060}\x{200E}\x{200F}\x{202A}-\x{202E}]'

failed=0
for f in $files; do
  if LC_ALL=C perl -ne 'exit 0 if /'"$pattern"'/; END{exit 1}' "$f" >/dev/null 2>&1; then
    echo "FAIL: hidden Unicode detected in $f"
    perl -ne 'print "$.\t$_" if /'"$pattern"'/' "$f" || true
    failed=1
  else
    echo "PASS: $f"
  fi
done

if [ "$failed" -ne 0 ]; then
  echo "Hidden Unicode found. Please remove and re-run."
  exit 1
fi

echo "All rules files clean."

