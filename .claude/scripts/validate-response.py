#!/usr/bin/env python3
"""
SAI ROLO TECH - RESPONSE VALIDATOR
Version: V2.0
Purpose: Validate that Claude's response follows required format
"""

import sys
import re
from pathlib import Path

# Required sections for valid response
REQUIRED_SECTIONS = [
    "Status",
    "Understanding",
    "Root Cause",
    "Files",
    "Services",
    "Plan",
    "Commands Run",
    "Test Results",
    "Actual Output",
    "Confidence",
]

# Forbidden phrases (without proof)
FORBIDDEN_PHRASES = [
    r"\bdone\b",
    r"\bfixed\b",
    r"\bho gaya\b",
    r"\bshould work\b",
    r"\bprobably solved\b",
    r"\btry karo\b(?!\s+\w+\s+\w+)",  # Allow "try karo with X" if followed by result
]

# Required checkboxes
REQUIRED_CHECKBOXES = [
    r"\[ \] Status section present",
    r"\[ \] Understanding section filled",
    r"\[ \] Root Cause section filled",
    r"\[ \] Files section filled",
    r"\[ \] Services checked",
    r"\[ \] Plan section filled",
    r"\[ \] Test Results with actual output",
    r"\[ \] Confidence level set",
]


def validate_response(response_path: str) -> tuple[bool, list[str]]:
    """Validate response file and return (is_valid, errors)"""
    errors = []

    # Check file exists
    if not Path(response_path).exists():
        return False, [f"Response file not found: {response_path}"]

    # Read response
    with open(response_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Check required sections
    for section in REQUIRED_SECTIONS:
        if section not in content:
            errors.append(f"Missing required section: {section}")

    # Check if sections are filled (not just the header)
    understanding_match = re.search(r"## Understanding\s*\n(.*?)(?=##|\Z)", content, re.DOTALL)
    if understanding_match:
        text = understanding_match.group(1).strip()
        if text in ["-", "", "(What is failing or what needs to be built)"]:
            errors.append("Understanding section not filled")

    root_cause_match = re.search(r"## Root Cause\s*\n(.*?)(?=##|\Z)", content, re.DOTALL)
    if root_cause_match:
        text = root_cause_match.group(1).strip()
        if text in ["-", "", "(Why is it failing?)"]:
            errors.append("Root Cause section not filled")

    # Check for forbidden phrases
    for phrase in FORBIDDEN_PHRASES:
        matches = re.findall(phrase, content, re.IGNORECASE)
        if matches:
            errors.append(f"Forbidden phrase found: '{matches[0]}' - provide proof first")

    # Check test results have actual output
    test_results_match = re.search(r"## Test Results\s*\n```\n(.*?)```", content, re.DOTALL)
    if test_results_match:
        text = test_results_match.group(1).strip()
        if text in ["", "# Test output", "..."]:
            errors.append("Test Results section is empty - run actual tests")

    # Check commands have output
    commands_match = re.search(r"## Commands Run\s*\n```\w*\n(.*?)```", content, re.DOTALL)
    if commands_match:
        text = commands_match.group(1).strip()
        if not text or "# Command" in text:
            errors.append("Commands Run section missing actual command output")

    # Check Confidence is not 0/100 (indicates not completed)
    confidence_match = re.search(r"## Confidence\s*\n```\n(\d+)/100\n```", content)
    if confidence_match:
        confidence = int(confidence_match.group(1))
        if confidence == 0:
            errors.append("Confidence is 0/100 - task not completed")

    # Check Status is not IN_PROGRESS
    status_match = re.search(r"## Status\s*\n```\n(IN_PROGRESS|PENDING)\n```", content)
    if status_match:
        errors.append(f"Status is {status_match.group(1)} - task not marked complete")

    return len(errors) == 0, errors


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 validate-response.py <response_file>")
        print("Example: python3 validate-response.py .claude/latest_response.md")
        sys.exit(1)

    response_path = sys.argv[1]
    is_valid, errors = validate_response(response_path)

    print("=" * 50)
    print("  SAI ROLO TECH - RESPONSE VALIDATOR V2")
    print("=" * 50)
    print()
    print(f"File: {response_path}")
    print()

    if is_valid:
        print("[OK] Response is VALID")
        print()
        print("All required sections present and filled.")
        print("Task can be marked complete.")
        sys.exit(0)
    else:
        print("[ERROR] Response is INVALID")
        print()
        print("Issues found:")
        for i, error in enumerate(errors, 1):
            print(f"  {i}. {error}")
        print()
        print("Please fix these issues before claiming task complete.")
        sys.exit(1)


if __name__ == "__main__":
    main()
