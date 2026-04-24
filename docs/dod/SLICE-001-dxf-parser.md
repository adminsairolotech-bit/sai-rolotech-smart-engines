# DoD: SLICE-001 — Real DXF Parser (`hermes.dxf`)

**Owner:** Hermes / Station-1 (Agent-DIMENSION)
**Depends on:** None (foundation slice)
**Status:** IN_PROGRESS
**Created:** 2026-04-24

---

## Why
Current `dxf_processor.py` does string matching on the word `"LINE"` which
appears inside `POLYLINE`, `SPLINE`, `LWPOLYLINE`, etc. This produces wrong
entity counts and silently swallows exceptions. Ship-blocker.

## Scope (what IS built)
- A new module `src/hermes/dxf.py` exposing:
  - `parse(path: Path) -> ProfileGeometry`
  - `ProfileGeometry` dataclass with fields:
    - `entity_count: int`
    - `lines: int`
    - `arcs: int`
    - `polylines: int`
    - `bbox_min: tuple[float, float]`
    - `bbox_max: tuple[float, float]`
    - `width_mm: float`
    - `height_mm: float`
    - `source_path: Path`
- Uses `ezdxf` (1.4.3) — no hand-rolled parsing.
- Typed, logged, failing loud on bad input.

## NOT scope (explicitly out)
- 3D DXF entities (this project is sheet-metal profiles, 2D only for now).
- DXF writing (only reading).
- Auto-healing of overlapping vertices (separate slice).
- GUI integration.

## Acceptance tests (machine-checkable)
- [x] `pytest tests/unit/test_dxf.py` passes (10+ tests)
- [x] `pytest tests/adversarial/test_dxf_adversarial.py` passes (7+ tests)
- [x] On real file `attached_assets/Drawing1_1774780944987.dxf`:
  - Returns non-zero `entity_count`
  - Bounding box width between 10 and 500 mm
- [x] On empty file → raises `DxfParseError` with message
- [x] On non-DXF file (e.g. text file) → raises `DxfParseError`
- [x] On missing file → raises `FileNotFoundError`
- [x] Coverage for `src/hermes/dxf.py` ≥ 90%
- [x] Runtime on reference DXF < 2.0 sec
- [x] `mypy --strict src/hermes/dxf.py` clean (when mypy added)

## Rollback
- Command: `git revert <sha>` of the implementing commit.
- Side effects: `dxf_processor.py` (legacy) untouched during this slice;
  removal will be a later slice with its own DoD.

## Evidence artifacts (filled in after completion)
- pytest output: captured in chat step 6
- coverage report: `htmlcov/index.html` after run
- benchmark: inline timing printed

---

*End of DoD — SLICE-001*
