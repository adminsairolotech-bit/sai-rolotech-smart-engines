import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateGcode } from "../api";

describe("generateGcode API normalization", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(globalThis, "window", {
      value: { location: { origin: "http://localhost:5000" } },
      configurable: true,
      writable: true,
    });
  });

  it("normalizes legacy string-array gcodeOutputs into structured outputs", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        gcodeOutputs: ["O5001\nM30\n%"],
        gcodeOutput: "O5001\nM30\n%",
        stationCount: 1,
        config: { controller: "Delta 2X" },
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await generateGcode(
      {
        segments: [{ type: "line", startX: 0, startY: 0, endX: 10, endY: 0 }],
        bendPoints: [],
        boundingBox: { minX: 0, minY: 0, maxX: 10, maxY: 0 },
      },
      1,
      "RT",
      {
        controller: "Delta 2X",
        coordinateFormat: "absolute",
        spindleSpeed: 500,
        feedRate: 100,
        toolNumber: 4,
        programNumber: 5001,
        maxSpindleSpeed: 500,
        cutDepth: 2,
      } as any,
      null,
    );

    expect(result.outputs).toHaveLength(1);
    expect(result.outputs[0]).toMatchObject({
      label: "program_1",
      gcode: "O5001\nM30\n%",
    });
    expect(result.outputs[0].lineCount).toBe(3);
    expect(result.gcodeOutputs).toEqual(result.outputs);
  });
});
