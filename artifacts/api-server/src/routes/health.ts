import { Router, type IRouter, type Request, type Response } from "express";
import os from "os";
import { HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();

interface DetailedHealth {
  status: "ok" | "degraded" | "fail";
  timestamp: string;
  uptime: number;
  memoryMB: number;
  memoryPercent: number;
  version: string;
  checks: {
    memory: "pass" | "fail" | "warn";
    uptime: "pass";
    system: "pass" | "fail";
    python: "pass" | "fail" | "not_checked";
  };
}

function sendHealth(_req: Request, res: Response) {
  const memUsage = process.memoryUsage();
  const totalMem = os.totalmem();
  const memPercent = (memUsage.heapUsed / totalMem) * 100;

  const data = HealthCheckResponse.parse({ status: "ok" });

  const detailed: DetailedHealth = {
    status: memPercent > 90 ? "fail" : memPercent > 75 ? "degraded" : "ok",
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    memoryMB: Math.round(memUsage.heapUsed / 1024 / 1024),
    memoryPercent: Math.round(memPercent * 100) / 100,
    version: process.env.npm_package_version || "2.0.0",
    checks: {
      memory: memPercent > 90 ? "fail" : memPercent > 75 ? "warn" : "pass",
      uptime: "pass",
      system: "pass",
      python: "not_checked",
    },
  };

  res.status(detailed.status === "fail" ? 503 : 200).json(detailed);
}

function sendDetailedHealth(_req: Request, res: Response) {
  const memUsage = process.memoryUsage();
  const totalMem = os.totalmem();
  const memPercent = (memUsage.heapUsed / totalMem) * 100;
  const cpuLoad = os.loadavg();

  const detailed: DetailedHealth & {
    system: {
      platform: string;
      arch: string;
      cpus: number;
      loadAverage: number[];
      freeMemoryMB: number;
    };
  } = {
    status: memPercent > 90 || cpuLoad[0] > os.cpus().length * 2 ? "fail" :
             memPercent > 75 || cpuLoad[0] > os.cpus().length ? "degraded" : "ok",
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    memoryMB: Math.round(memUsage.heapUsed / 1024 / 1024),
    memoryPercent: Math.round(memPercent * 100) / 100,
    version: process.env.npm_package_version || "2.0.0",
    checks: {
      memory: memPercent > 90 ? "fail" : memPercent > 75 ? "warn" : "pass",
      uptime: "pass",
      system: cpuLoad[0] > os.cpus().length * 2 ? "fail" : "pass",
      python: "not_checked",
    },
    system: {
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      loadAverage: cpuLoad,
      freeMemoryMB: Math.round(os.freemem() / 1024 / 1024),
    },
  };

  res.status(detailed.status === "fail" ? 503 : 200).json(detailed);
}

router.get("/health", sendHealth);
router.get("/healthz", sendHealth);
router.get("/health/detailed", sendDetailedHealth);
router.get("/ready", sendHealth);
router.get("/live", (_req: Request, res: Response) => {
  res.json({ alive: true, timestamp: new Date().toISOString() });
});

/**
 * GET /python-health — Proxy check to the Python FastAPI backend (port 9000).
 * Returns its health payload or a structured error so the frontend never needs
 * to know the internal Python port.
 */
router.get("/python-health", async (_req, res) => {
  const PYTHON_URL = "http://localhost:9000/api/health";
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const r = await fetch(PYTHON_URL, { signal: controller.signal });
    clearTimeout(timeout);
    if (!r.ok) {
      res.status(502).json({ status: "fail", error: `Python API returned HTTP ${r.status}`, pythonUrl: PYTHON_URL });
      return;
    }
    const payload = await r.json() as Record<string, unknown>;
    res.json({ status: "pass", ...payload, checkedAt: new Date().toISOString() });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const isTimeout = msg.includes("abort") || msg.includes("AbortError");
    res.status(502).json({
      status: "fail",
      error: isTimeout ? "Python API timeout (>4s)" : `Python API unreachable: ${msg}`,
      pythonUrl: PYTHON_URL,
    });
  }
});

export default router;
