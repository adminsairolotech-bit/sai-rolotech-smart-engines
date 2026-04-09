import express from "express";
import type { AddressInfo } from "node:net";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dxfRouter from "../routes/dxf.js";
import flowerRouter from "../routes/flower.js";
import rollToolingRouter from "../routes/roll-tooling.js";
import simulationRouter from "../routes/simulation.js";
import gcodeRouter from "../routes/gcode.js";
import gcodeSafetyRouter from "../routes/gcode-safety.js";

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function approxEqual(actual: number | undefined, expected: number, epsilon = 1e-6): boolean {
  return typeof actual === "number" && Math.abs(actual - expected) <= epsilon;
}

async function test(name: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
    console.log(`  PASS ${name}`);
    passed += 1;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`  FAIL ${name}`);
    console.error(`    -> ${message}`);
    failed += 1;
  }
}

async function startServer(): Promise<{ baseUrl: string; close: () => Promise<void> }> {
  const app = express();
  app.use(express.json({ limit: "20mb" }));
  app.use("/api", dxfRouter);
  app.use("/api", flowerRouter);
  app.use("/api", rollToolingRouter);
  app.use("/api", simulationRouter);
  app.use("/api", gcodeRouter);
  app.use("/api", gcodeSafetyRouter);

  const server = await new Promise<ReturnType<typeof app.listen>>((resolve) => {
    const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
  });

  const address = server.address() as AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error?: Error) => {
          if (error) reject(error);
          else resolve();
        });
      }),
  };
}

async function postJson<TResponse>(baseUrl: string, path: string, body: unknown): Promise<TResponse> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  const payload = (await response.json()) as TResponse & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error ?? `Request failed for ${path} with ${response.status}`);
  }
  return payload;
}

const DXF_SPLINE_PROFILE = `0
SECTION
2
ENTITIES
0
SPLINE
8
PROFILE
11
0
21
0
11
40
21
18
11
85
21
-15
11
130
21
12
11
180
21
0
0
ENDSEC
0
EOF`;
const THIS_DIR = path.dirname(fileURLToPath(import.meta.url));
const CONTROLLED_DXF_PATH = path.resolve(
  THIS_DIR,
  "../../../python-api/test-inputs/codex_compare_c_channel_76x14_with_dims.dxf",
);
const INCH_PROOF_DXF = `0
SECTION
2
HEADER
9
$INSUNITS
70
1
0
ENDSEC
0
SECTION
2
ENTITIES
0
LINE
8
PROFILE
10
0
20
0
11
3
21
0
0
LINE
8
PROFILE
10
3
20
0
11
3
21
0.5
0
ENDSEC
0
EOF`;

console.log("\nAPI PIPELINE TEST: DXF import -> Flower -> Tooling -> Simulation -> G-code -> Safety");

await test("single /api gcode safety routes are reachable without double-prefix regression", async () => {
  const server = await startServer();
  try {
    const okResponse = await fetch(`${server.baseUrl}/api/solidcam-reference`);
    assert(okResponse.ok, `/api/solidcam-reference should resolve, got ${okResponse.status}`);

    const wrongResponse = await fetch(`${server.baseUrl}/api/api/solidcam-reference`);
    assert(wrongResponse.status === 404, `double-prefixed route should 404, got ${wrongResponse.status}`);
  } finally {
    await server.close();
  }
});

await test("DXF upload can drive the full API pipeline up to safety-cleared G-code", async () => {
  const server = await startServer();
  try {
    const form = new FormData();
    form.append("file", new Blob([DXF_SPLINE_PROFILE], { type: "application/dxf" }), "wave-profile.dxf");

    const uploadResponse = await fetch(`${server.baseUrl}/api/upload-dxf`, {
      method: "POST",
      body: form,
    });
    const uploadPayload = (await uploadResponse.json()) as {
      success?: boolean;
      error?: string;
      geometry?: Record<string, unknown> & { segments?: Array<Record<string, unknown>>; bends?: Array<Record<string, unknown>> };
      importDebug?: { curvedSourceEntityCount?: number };
    };
    if (!uploadResponse.ok) {
      throw new Error(uploadPayload.error ?? `DXF upload failed with ${uploadResponse.status}`);
    }

    const geometry = uploadPayload.geometry;
    assert(uploadPayload.success === true, "DXF upload should succeed");
    assert((geometry?.segments?.length ?? 0) > 6, "DXF spline should reconstruct into multiple segments");
    assert((uploadPayload.importDebug?.curvedSourceEntityCount ?? 0) >= 1, "curved source entity count should be reported");

    const flowerPayload = await postJson<{
      success: boolean;
      stations: Array<Record<string, unknown>>;
      passes: Array<Record<string, unknown>>;
      overallRisk: string;
      _verification: { status: string; accuracyScore: number };
    }>(server.baseUrl, "/api/generate-flower", {
      geometry,
      numStations: 6,
      stationPrefix: "RT",
      materialType: "GI",
      materialThickness: 1.2,
      sectionModel: "open",
    });

    assert(flowerPayload.success === true, "flower generation should succeed");
    assert(flowerPayload.stations.length === 6, "flower should return 6 stations");
    assert(flowerPayload.passes.length === 6, "flower should expose 6 phase-1.5 passes");
    assert(flowerPayload._verification.status !== "INPUT_ERRORS", "flower verification should not report input errors");

    const phase2Payload = await postJson<{
      success: boolean;
      rollStations: Array<Record<string, unknown>>;
      rollGeometryByStation: Array<Record<string, unknown>>;
    }>(server.baseUrl, "/api/generate-roll-tooling-phase2", {
      geometry,
      flower: {
        stations: flowerPayload.stations,
        passes: flowerPayload.passes,
      },
      numStations: 6,
      materialType: "GI",
      materialThickness: 1.2,
      clearanceMm: 0.08,
      toleranceMm: 0.03,
    });

    assert(phase2Payload.success === true, "phase-2 tooling should succeed");
    assert(phase2Payload.rollStations.length === 6, "phase-2 should return 6 roll stations");
    assert(phase2Payload.rollGeometryByStation.length === 6, "phase-2 should return roll geometry per station");

    const phase3Payload = await postJson<{
      success: boolean;
      passSimulation: Array<Record<string, unknown>>;
      defects: Array<Record<string, unknown>>;
      springbackAdjusted: Record<string, unknown>;
    }>(server.baseUrl, "/api/simulate-phase3", {
      geometry,
      flower: {
        stations: flowerPayload.stations,
        passes: flowerPayload.passes,
      },
      phase2: {
        rollStations: phase2Payload.rollStations,
        rollGeometryByStation: phase2Payload.rollGeometryByStation,
      },
      materialType: "GI",
      materialThickness: 1.2,
    });

    assert(phase3Payload.success === true, "phase-3 simulation should succeed");
    assert(phase3Payload.passSimulation.length === 6, "phase-3 should simulate all stations");
    assert(phase3Payload.springbackAdjusted !== null, "phase-3 should return springback-adjusted output");

    const gcodePayload = await postJson<{
      success: boolean;
      outputs: Array<{ label: string; gcode: string; lineCount: number }>;
      gcodeOutput: string;
      stationCount: number;
      config: { controller: string; spindleDirection: string };
    }>(server.baseUrl, "/api/generate-gcode", {
      geometry,
      numStations: 6,
      stationPrefix: "RT",
      materialType: "GI",
      materialThickness: 1.2,
      config: {
        controller: "Delta 2X",
        controllerType: "delta_2x",
        programNumber: 5001,
        toolNumber: 4,
      },
    });

    assert(gcodePayload.success === true, "G-code generation should succeed");
    assert(gcodePayload.stationCount === 6, "G-code route should use all 6 stations");
    assert(gcodePayload.config.controller === "Delta 2X", "Delta profile should be selected");
    assert(gcodePayload.gcodeOutput.includes("O5001"), "G-code should include the requested program number");
    assert(gcodePayload.gcodeOutput.includes("M4"), "Delta G-code should use reverse spindle direction");
    assert(gcodePayload.gcodeOutput.includes("M30"), "G-code should include M30 program end");
    assert(gcodePayload.outputs.length === 1, `expected one structured G-code output, got ${gcodePayload.outputs.length}`);
    assert(gcodePayload.outputs[0]?.gcode.includes("M30") === true, "structured G-code output should contain the program text");

    const safetyPayload = await postJson<{
      success: boolean;
      result: {
        passed: boolean;
        score: number;
        criticalCount: number;
        stats: { hasM30: boolean; hasG28: boolean };
      };
    }>(server.baseUrl, "/api/gcode-safety-check", {
      gcode: gcodePayload.gcodeOutput,
    });

    assert(safetyPayload.success === true, "G-code safety check should succeed");
    assert(safetyPayload.result.passed === true, "Generated Delta G-code should pass safety");
    assert(safetyPayload.result.score >= 70, `Safety score should be >= 70, got ${safetyPayload.result.score}`);
    assert(safetyPayload.result.criticalCount === 0, "Safety check should have zero critical issues");
    assert(safetyPayload.result.stats.hasM30 === true, "Safety stats should confirm M30");
    assert(safetyPayload.result.stats.hasG28 === true, "Safety stats should confirm G28 homing");
  } finally {
    await server.close();
  }
});

await test("controlled compare DXF preserves nominal 76x14 mm dimensions through Node upload", async () => {
  const server = await startServer();
  try {
    const dxfBytes = await readFile(CONTROLLED_DXF_PATH);
    const form = new FormData();
    form.append("file", new Blob([dxfBytes], { type: "application/dxf" }), "codex_compare_c_channel_76x14_with_dims.dxf");

    const uploadResponse = await fetch(`${server.baseUrl}/api/upload-dxf`, {
      method: "POST",
      body: form,
    });
    const uploadPayload = (await uploadResponse.json()) as {
      success?: boolean;
      error?: string;
      geometry?: { boundingBox?: { width?: number; height?: number } };
      importDebug?: { unitsCode?: number; unitsScaleToMm?: number };
    };
    if (!uploadResponse.ok) {
      throw new Error(uploadPayload.error ?? `Controlled DXF upload failed with ${uploadResponse.status}`);
    }

    assert(uploadPayload.success === true, "controlled DXF upload should succeed");
    assert(approxEqual(uploadPayload.geometry?.boundingBox?.width, 76), `expected width 76 mm, got ${uploadPayload.geometry?.boundingBox?.width}`);
    assert(approxEqual(uploadPayload.geometry?.boundingBox?.height, 14), `expected height 14 mm, got ${uploadPayload.geometry?.boundingBox?.height}`);
    assert(uploadPayload.importDebug?.unitsCode === 4, `expected INSUNITS code 4 (mm), got ${uploadPayload.importDebug?.unitsCode}`);
    assert(uploadPayload.importDebug?.unitsScaleToMm === 1, `expected unitsScaleToMm 1, got ${uploadPayload.importDebug?.unitsScaleToMm}`);
  } finally {
    await server.close();
  }
});

await test("non-mm DXF upload normalizes inch geometry to mm in the Node upload path", async () => {
  const server = await startServer();
  try {
    const form = new FormData();
    form.append("file", new Blob([INCH_PROOF_DXF], { type: "application/dxf" }), "inch-proof.dxf");

    const uploadResponse = await fetch(`${server.baseUrl}/api/upload-dxf`, {
      method: "POST",
      body: form,
    });
    const uploadPayload = (await uploadResponse.json()) as {
      success?: boolean;
      error?: string;
      geometry?: { boundingBox?: { width?: number; height?: number } };
      importDebug?: { unitsCode?: number; unitsName?: string; unitsScaleToMm?: number };
    };
    if (!uploadResponse.ok) {
      throw new Error(uploadPayload.error ?? `inch DXF upload failed with ${uploadResponse.status}`);
    }

    assert(uploadPayload.success === true, "inch DXF upload should succeed");
    assert(uploadPayload.importDebug?.unitsCode === 1, `expected inch INSUNITS code 1, got ${uploadPayload.importDebug?.unitsCode}`);
    assert(uploadPayload.importDebug?.unitsName === "inch", `expected unitsName 'inch', got ${uploadPayload.importDebug?.unitsName}`);
    assert(uploadPayload.importDebug?.unitsScaleToMm === 25.4, `expected unitsScaleToMm 25.4, got ${uploadPayload.importDebug?.unitsScaleToMm}`);
    assert(approxEqual(uploadPayload.geometry?.boundingBox?.width, 76.2), `expected width 76.2 mm, got ${uploadPayload.geometry?.boundingBox?.width}`);
    assert(approxEqual(uploadPayload.geometry?.boundingBox?.height, 12.7), `expected height 12.7 mm, got ${uploadPayload.geometry?.boundingBox?.height}`);
  } finally {
    await server.close();
  }
});

console.log(`\nTotal: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
process.exit(failed > 0 ? 1 : 0);
