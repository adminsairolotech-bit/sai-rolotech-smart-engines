# HERMES RULES v3.0 — BLUEPRINT, CODING & TESTING

> **Author:** Hermes (Agent-DIMENSION, Station-1)
> **Owner:** Sai Rolo Tech
> **Status:** MANDATORY — Binding on all agents and humans
> **Predecessor:** Supersedes RULES.md, RULES-STRICT.md, VALIDATION_GATE.md where conflicting
> **Core principle:** *"In AI we verify, not trust."*

---

## 📜 THE 7 IRON LAWS (Non-Negotiable)

```
╔═══════════════════════════════════════════════════════════════════════╗
║                         HERMES IRON LAWS                               ║
╠═══════════════════════════════════════════════════════════════════════╣
║   1. CODE WITHOUT OUTPUT = FICTION                                     ║
║   2. OUTPUT WITHOUT TEST = ACCIDENT                                    ║
║   3. TEST WITHOUT REAL DATA = THEATRE                                  ║
║   4. "DONE" WITHOUT ARTIFACT = LIE                                     ║
║   5. ASSUMPTION WITHOUT CHECK = BUG IN WAITING                         ║
║   6. BIG TASK WITHOUT SLICING = GUARANTEED FAILURE                     ║
║   7. NO ROLLBACK PATH = NO DEPLOYMENT                                  ║
╚═══════════════════════════════════════════════════════════════════════╝
```

Violate any law → task is **REJECTED**, not "in progress".

---

## 🚫 FORBIDDEN VOCABULARY

These words require **attached proof** or they are auto-rejected:

| Word | Must Attach |
|---|---|
| `done` | Test output + artifact path |
| `fixed` | Failing test before + passing test after |
| `works` | Exact command + exact output |
| `ho gaya` | Screenshot / log / file hash |
| `should work` | **BANNED** — no speculation |
| `probably` | **BANNED** — no guessing |
| `verified` | CI run ID or pytest output |
| `production-ready` | Load test + error rate + rollback plan |

---

# 📐 PART A — BLUEPRINT RULES (Before Writing Any Code)

## Rule B1: No Code Without a Signed DoD

Every task starts with a **Definition of Done** file: `docs/dod/<task-id>.md`

```markdown
# DoD: <task-id> — <short name>

## Scope (what IS built)
- Bullet 1
- Bullet 2

## NOT scope (what is NOT built)
- Bullet 1
- Bullet 2

## Acceptance tests (machine-checkable)
- [ ] pytest tests/<file>.py passes
- [ ] Input A → Output B (exact bytes)
- [ ] Handles N real files from attached_assets/
- [ ] Rejects M corrupt files with specific error code
- [ ] Runtime: <X sec on Y MB input
- [ ] Memory: <Z MB peak

## Rollback
- Command: git revert <sha>
- Side effects: <list>
```

**No DoD file = no work starts.** Period.

---

## Rule B2: Blueprint = Real File, Not Imagined Spec

Before coding, attach the **actual input sample** to the repo:
- DXF? → Place in `attached_assets/` (already done ✅)
- API response? → Capture real JSON into `testdata/`
- Database row? → SQL dump in `testdata/`

If you cannot produce a real sample → **stop, get one, then code.**

---

## Rule B3: Know Your Library

Before writing a parser / solver / integrator yourself:

```
1. Does a battle-tested library exist? (e.g. ezdxf for DXF)
2. Why am I not using it?
3. If rolling own: document trade-off in ADR_INDEX.md
```

**Example:** Current `dxf_processor.py` does string matching on `"LINE"`. This is wrong — "LINE" appears inside `POLYLINE`, `SPLINE`, etc. Replace with `ezdxf`.

---

## Rule B4: Size-Reality Budget (Upfront Honesty)

Before promising any feature, fill this table:

| Claim | Honest Estimate | Evidence Source |
|---|---|---|
| Lines of code | 500 / 5k / 50k | Comparable OSS project |
| Time | 1 day / 1 week / 3 months | Past similar task |
| Test files needed | 10 / 100 / 1000 | Input domain |
| Edge cases | List top 10 | Domain expert / OSS issue tracker |

If numbers shock you → **scope is too big. Slice.**

---

# 💻 PART B — CODING RULES

## Rule C1: Vertical Slice, Not Horizontal Layer

❌ **WRONG:** Build 10 parsers at 10% each → 0 working features
✅ **RIGHT:** Build 1 parser 100% → ship → next

**Slice template:**
```
Slice = Input sample + parser + test + tiny UI hook + docs
```
Ek slice kabhi 3 dino se bada na ho.

---

## Rule C2: Fail Loud, Never Silent

```python
# ❌ BANNED
try:
    parse(file)
except Exception as e:
    print(f"error: {e}")   # swallows bug

# ✅ REQUIRED
try:
    parse(file)
except SpecificError as e:
    logger.error("parse_failed", extra={"file": file, "err": str(e)})
    raise   # re-raise so CI fails
```

**Current `dxf_processor.py` violates this** (line 37–38). Must fix.

---

## Rule C3: Every Function Has a Sibling Test

Folder layout:
```
src/
  dxf_parser.py
tests/
  test_dxf_parser.py          ← MANDATORY, same day
```

No test file merged → PR blocked by pre-commit hook.

---

## Rule C4: Small Files, Single Responsibility

- **Max 300 lines** per `.py` file
- **Max 50 lines** per function
- One file = one concern

If a file grows beyond limit → **split before adding new feature**.

---

## Rule C5: Type Hints + Docstring = Required

```python
# ❌ BANNED
def parse(f):
    ...

# ✅ REQUIRED
def parse(dxf_path: Path) -> ProfileGeometry:
    """Parse a DXF file into structured geometry.

    Raises:
        DxfCorruptError: if file headers are missing.
        DxfUnsupportedError: if DXF version < R12.
    """
```

Enforced by `mypy --strict` in CI.

---

## Rule C6: No Magic Numbers

```python
# ❌ BANNED
if angle > 7.65: ...

# ✅ REQUIRED
OVERBEND_TARGET_DEG = 7.65   # C-80 profile, EN-1.0mm GI
if angle > OVERBEND_TARGET_DEG: ...
```

---

## Rule C7: Logging, Not Printing

```python
# ❌ BANNED in production code
print("done")

# ✅ REQUIRED
logger.info("phase_complete", extra={"phase": "dxf", "entities": n})
```

All logs are structured JSON → greppable, parsable, auditable.

---

## Rule C8: Dependencies Pinned, Vendored Where Critical

- `pyproject.toml` / `requirements.txt` with **exact versions**
- `uv.lock` / `poetry.lock` committed
- Never `pip install X` in script — always in the manifest

---

# 🧪 PART C — TESTING RULES

## Rule T1: Test Pyramid (Hermes Edition)

```
         /\
        /E2E\        ← 5%   real DXF → real G-code → real machine sim
       /-----\
      /Integr.\      ← 25%  real files, real I/O, no mocks for I/O
     /---------\
    /   Unit    \    ← 70%  pure functions, fast, deterministic
   /_____________\
```

If pyramid is inverted (all E2E, no unit) → redesign required.

---

## Rule T2: Real Files Only in Integration Tests

```python
# ✅ REQUIRED
@pytest.fixture
def real_c80_dxf():
    return Path("attached_assets/Drawing1_1774780944987.dxf")

def test_parse_real_c80(real_c80_dxf):
    profile = parse(real_c80_dxf)
    assert profile.entity_count == 8        # known from blueprint
    assert profile.bbox_width_mm == pytest.approx(80.0, abs=0.01)
```

Synthetic "hello world" DXFs are for unit tests only — **never** for sign-off.

---

## Rule T3: Adversarial Test Suite (Required)

Every parser/solver must have a `tests/adversarial/` folder with:

1. **Empty file** → graceful error
2. **Truncated file** (cut at random byte) → specific error
3. **Wrong format** (JPG renamed to .dxf) → specific error
4. **Huge file** (>100 MB) → passes or OOM-guard triggers
5. **Unicode / non-ASCII paths** → works on Windows + Linux
6. **Concurrent access** (same file, 10 threads) → no race
7. **Malicious input** (DXF bomb, zip-bomb style) → bounded runtime

**Minimum 7 adversarial tests per public API.**

---

## Rule T4: Coverage Floor with Teeth

```yaml
# pyproject.toml
[tool.pytest.ini_options]
addopts = "--cov=src --cov-fail-under=80 --cov-report=term-missing"
```

- Global coverage ≥ 80%
- New code coverage ≥ 90%
- Critical modules (parser, G-code generator, safety validator) ≥ 95%

Below floor → **CI fails, merge blocked.**

---

## Rule T5: Golden File Regression

For every deterministic output (G-code, BOM, reports):

```
tests/golden/
  c80_2mm_gi.gcode
  c80_2mm_gi.bom.json
```

Test:
```python
def test_c80_gcode_matches_golden():
    actual = generate_gcode(profile_c80)
    expected = Path("tests/golden/c80_2mm_gi.gcode").read_text()
    assert actual == expected
```

Changed output? → review diff, update golden intentionally, commit with ADR.

---

## Rule T6: Benchmark Gates

```python
def test_parse_speed_budget(benchmark, real_c80_dxf):
    result = benchmark(parse, real_c80_dxf)
    assert benchmark.stats["mean"] < 2.0   # seconds
```

Regression >20% slower → CI fails.

---

## Rule T7: Mutation Testing (Monthly)

Run `mutmut` once a month on critical modules. If mutation score <70% → tests are weak, strengthen before next feature.

---

# ⚙️ PART D — EXECUTION RULES (Per Task)

## Rule E1: The 7-Step Loop (MANDATORY)

Every task follows exactly this order:

```
1. READ   — Read existing code + DoD
2. PLAN   — Write plan in task file, list files touched
3. TEST   — Write failing test FIRST (red)
4. CODE   — Minimum code to pass test (green)
5. RUN    — Execute. Paste output into task log.
6. VERIFY — Independent check (Hermes audit script)
7. DOC    — Update docstring + CHANGELOG + ADR if decision made
```

Skip a step → restart the task.

---

## Rule E2: Commit Discipline

- **One concern per commit.** No "misc fixes".
- Commit message format:
  ```
  <type>(<scope>): <summary>

  Why: <one line>
  Proof: <test name / CI run>
  ```
- Types: `feat`, `fix`, `test`, `refactor`, `docs`, `chore`
- Max 500 lines changed per commit (hard split otherwise)

---

## Rule E3: Pre-Push Gate (Automated)

`.husky/pre-push` runs:
```
ruff check .           # linter
mypy --strict src      # types
pytest -x              # all tests, stop on first fail
pytest --cov-fail-under=80
bench.py               # performance regression
```

Any fail → push rejected. No `--no-verify` **ever**.

---

## Rule E4: Daily Reality Ratio

End of every work-day, update `MASTER_CONTROL_DASHBOARD_DAILY.md`:

```
Date: 2026-04-24
Claims made today:     8
Claims with proof:     7
Reality Ratio:         0.87   (Target ≥ 0.80)
Failing: <link to unproven claim>
```

Ratio <0.80 for 2 consecutive days → **stop new work, fix proofs.**

---

# 🏭 PART E — DOMAIN RULES (Roll Forming / CAM specific)

## Rule D1: Tolerances Are Sacred

- All dimensions carry units in variable name: `width_mm`, `angle_deg`
- All comparisons use explicit tolerance:
  ```python
  TOL_MM = 0.01
  assert abs(measured - target) < TOL_MM
  ```
- No bare `==` on floats. Ever.

## Rule D2: Safety First on G-Code

Before any G-code is declared "ready":
1. `gcode_safety_validator.py` returns 0
2. No G0 at feed > rapid_max
3. No plunge below clearance plane
4. Spindle ON before first motion, OFF at end
5. Coolant logic verified
6. Dry-run simulated on `physics_sim_engine.py`

## Rule D3: K-Factor & Springback — Cite Source

Any material constant used in code must have a comment:
```python
K_FACTOR_GI_2MM = 0.44  # Source: ASM Handbook Vol.14B, Table 7-3
```

No source → no constant.

## Rule D4: Machine Telemetry = Truth

`machine_telemetry.json` and PLC data (`plc_bridge_modbus.py`) are **authoritative**. Simulated values must explicitly mark `source: "sim"` and never be shipped to operator cards.

---

# 🔐 PART F — GOVERNANCE & ENFORCEMENT

## Enforcement Matrix

| Violation | First time | Repeat |
|---|---|---|
| Forbidden word without proof | Task restarts | Agent benched 1 day |
| No test file | PR auto-close | Escalate to human |
| Coverage below floor | Merge blocked | Release delayed |
| Skipped 7-step loop | Code reverted | Task re-scoped |
| Big commit (>500 lines) | Force split | Squash review |
| Silent exception | CI fails | Module rewrite |

## Escalation

Any agent unsure → write `BLOCKED` in task file with:
1. What was attempted
2. What happened (exact output)
3. What help is needed

Never fake progress. **`BLOCKED` with honesty >> `DONE` with lies.**

---

# 📌 IMMEDIATE APPLICATION TO THIS REPO

Based on current state (reality-checked just now):

| Existing File | Violation | Action |
|---|---|---|
| `dxf_processor.py` | Rule C2 (silent except), B3 (no ezdxf), T2 (no real test) | Rewrite using `ezdxf`, add `tests/test_dxf.py` |
| `hermes_independent_audit.py` | Rule B2 (hardcoded findings, not computed) | Replace with real geometric checks |
| `master_orchestrator.py` | Rule C7 (prints), E1 (no verify step) | Add logging, integrate audit as Step 6 |
| `HERMES_INDEPENDENT_REPORT.md` | Stale — committed static text | Auto-generated only, add to `.gitignore` if needed |
| Missing | `tests/`, `docs/dod/`, `pyproject.toml` strict config | Create Day 1 of 2-month plan |

---

# ✅ ACCEPTANCE OF THESE RULES

By committing any code to this repo, the agent (human or AI) accepts:

1. All 7 Iron Laws bind every line shipped.
2. Forbidden vocabulary is auto-rejected in PRs.
3. The 7-step execution loop is the only accepted workflow.
4. Reality Ratio is a public daily metric.
5. `BLOCKED` is a valid, respected status — `DONE` without proof is not.

---

*End of Hermes Rules v3.0 — Signed: HERMES-BRAIN, Station-1 (Agent-DIMENSION)*
