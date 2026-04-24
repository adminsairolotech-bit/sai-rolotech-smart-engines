# hermes_independent_audit.py
# HERMES (Station-1: Agent-DIMENSION) — Independent Audit Run.
#
# v2: numbers are COMPUTED from the real DXF via hermes.dxf.parse(),
#     not hard-coded. Honest reports only.
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / "src"))

from hermes.dxf import DxfParseError, parse


def hermes_run(dxf_path: str = "attached_assets/Drawing1_1774780944987.dxf") -> int:
    print("[HERMES-BRAIN] STATION-1 (DIMENSION) starting real audit...")

    try:
        geom = parse(Path(dxf_path))
    except FileNotFoundError:
        print(f"[HERMES-BRAIN] BLOCKED: file not found: {dxf_path}")
        return 2
    except DxfParseError as err:
        print(f"[HERMES-BRAIN] BLOCKED: cannot parse DXF: {err}")
        return 3

    findings = {
        "agent": "Agent-DIMENSION",
        "blueprint_scanned": str(geom.source_path),
        "entity_count": geom.entity_count,
        "lines": geom.lines,
        "arcs": geom.arcs,
        "polylines": geom.polylines,
        "bbox_min": list(geom.bbox_min),
        "bbox_max": list(geom.bbox_max),
        "width_mm": round(geom.width_mm, 3),
        "height_mm": round(geom.height_mm, 3),
        "parser": "ezdxf-1.4.3",
        "status": "READY_FOR_HANDOVER" if geom.entity_count > 0 else "BLOCKED_EMPTY",
    }

    report = (
        "# HERMES INDEPENDENT AUDIT (auto-generated)\n"
        f"- **Agent**: {findings['agent']}\n"
        f"- **Blueprint**: {findings['blueprint_scanned']}\n"
        f"- **Entities**: {findings['entity_count']} "
        f"(lines={findings['lines']}, arcs={findings['arcs']}, "
        f"polylines={findings['polylines']})\n"
        f"- **Bounding box**: min={findings['bbox_min']}, max={findings['bbox_max']}\n"
        f"- **Dimensions**: {findings['width_mm']} mm x {findings['height_mm']} mm\n"
        f"- **Parser**: {findings['parser']}\n"
        f"- **Status**: {findings['status']}\n"
    )

    Path("HERMES_INDEPENDENT_REPORT.md").write_text(report, encoding="utf-8")
    Path("HERMES_INDEPENDENT_REPORT.json").write_text(
        json.dumps(findings, indent=2), encoding="utf-8"
    )
    print(
        f"[HERMES-BRAIN] Audit complete. entities={geom.entity_count} "
        f"size={geom.width_mm:.1f}mm x {geom.height_mm:.1f}mm"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(hermes_run())
