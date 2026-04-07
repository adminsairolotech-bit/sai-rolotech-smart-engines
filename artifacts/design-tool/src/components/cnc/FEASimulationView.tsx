import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Gauge,
  Info,
  RefreshCw,
  Shield,
} from "lucide-react";
import { simulatePhase3, type Phase3SimulationResponse } from "@/lib/api";
import {
  MATERIAL_DATABASE,
  useCncStore,
  type MaterialType,
  type ProfileGeometry,
  type Segment,
} from "@/store/useCncStore";
import { useToast } from "@/hooks/use-toast";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function computeSegmentLength(segment: Segment): number {
  const dx = segment.endX - segment.startX;
  const dy = segment.endY - segment.startY;
  if (segment.type === "line") return Math.hypot(dx, dy);
  if (
    typeof segment.radius === "number" &&
    segment.radius > 0 &&
    typeof segment.startAngle === "number" &&
    typeof segment.endAngle === "number"
  ) {
    const sweep = Math.abs(segment.endAngle - segment.startAngle) || 360;
    return (Math.PI * segment.radius * sweep) / 180;
  }
  return Math.hypot(dx, dy);
}

function toServerGeometry(geometry: ProfileGeometry) {
  const segments = geometry.segments.map((segment) => ({
    type: segment.type,
    x1: segment.startX,
    y1: segment.startY,
    x2: segment.endX,
    y2: segment.endY,
    cx: segment.centerX,
    cy: segment.centerY,
    radius: segment.radius,
    startAngle: segment.startAngle,
    endAngle: segment.endAngle,
    bulge: segment.bulge,
    length: computeSegmentLength(segment),
  }));
  const totalLength = segments.reduce((sum, segment) => sum + segment.length, 0);
  return {
    segments,
    bends: geometry.bendPoints.map((bend) => ({
      angle: bend.angle,
      radius: bend.radius,
      segmentIndex: bend.segmentIndex,
      side: "left",
      direction: "up",
    })),
    totalLength,
    boundingBox: {
      ...geometry.boundingBox,
      width: geometry.boundingBox.maxX - geometry.boundingBox.minX,
      height: geometry.boundingBox.maxY - geometry.boundingBox.minY,
    },
  };
}

function toneForRisk(risk?: "LOW" | "MEDIUM" | "HIGH") {
  if (risk === "HIGH") return { fg: "#f87171", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)" };
  if (risk === "MEDIUM") return { fg: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)" };
  return { fg: "#34d399", bg: "rgba(52,211,153,0.08)", border: "rgba(52,211,153,0.2)" };
}

function MiniBars({
  title,
  subtitle,
  values,
  labels,
  accent,
  selected,
  onSelect,
  format,
}: {
  title: string;
  subtitle: string;
  values: number[];
  labels: string[];
  accent: string;
  selected: number;
  onSelect: (index: number) => void;
  format: (value: number) => string;
}) {
  const max = Math.max(...values, 0.0001);
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-sm font-bold text-white">{title}</div>
      <div className="mt-1 text-xs text-zinc-500">{subtitle}</div>
      <div className="mt-4 flex h-48 items-end gap-2">
        {values.map((value, index) => {
          const pct = clamp((value / max) * 100, 3, 100);
          const active = index === selected;
          return (
            <button
              key={`${labels[index]}-${index}`}
              onClick={() => onSelect(index)}
              className="flex h-full min-w-0 flex-1 flex-col justify-end gap-2 bg-transparent p-0"
            >
              <span className={`text-[10px] font-semibold ${active ? "text-white" : "text-zinc-500"}`}>{format(value)}</span>
              <div
                className="rounded-xl border transition-all"
                style={{
                  height: `${pct}%`,
                  borderColor: active ? accent : "rgba(255,255,255,0.08)",
                  background: active ? `${accent}33` : "rgba(255,255,255,0.04)",
                }}
              />
              <span className="text-[10px] font-bold" style={{ color: active ? accent : "#71717a" }}>{labels[index]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function FEASimulationView() {
  const { toast } = useToast();
  const geometry = useCncStore((state) => state.geometry);
  const materialType = useCncStore((state) => state.materialType);
  const materialThickness = useCncStore((state) => state.materialThickness);
  const numStations = useCncStore((state) => state.numStations);

  const [result, setResult] = useState<Phase3SimulationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPass, setSelectedPass] = useState(0);

  const hasGeometry = Boolean(geometry && geometry.segments.length > 0);
  const material = MATERIAL_DATABASE[(materialType as MaterialType) ?? "GI"] ?? MATERIAL_DATABASE.GI;
  const riskTone = toneForRisk(result?.overallRisk);

  const runSimulation = async (showToastOnSuccess: boolean) => {
    if (!geometry || geometry.segments.length === 0) {
      setError("Load a DXF profile or draw a profile before running simulation.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await simulatePhase3({
        geometry: toServerGeometry(geometry),
        materialType,
        materialThickness,
        numStations,
      });
      setResult(response);
      setSelectedPass(0);
      if (showToastOnSuccess) {
        toast({
          title: "Simulation updated",
          description: "Physics-informed backend result loaded for the active project.",
        });
      }
    } catch (simulationError) {
      const message = simulationError instanceof Error ? simulationError.message : "Simulation failed";
      setError(message);
      toast({ title: "Simulation blocked", description: message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (geometry && geometry.segments.length > 0) {
      void runSimulation(false);
    } else {
      setResult(null);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geometry, materialType, materialThickness, numStations]);

  const passes = result?.stationSimulation ?? [];
  const activeIndex = passes.length > 0 ? clamp(selectedPass, 0, passes.length - 1) : 0;
  const activePass = passes[activeIndex];
  const activeMesh = result?.meshStateHistory[activeIndex];
  const activeContact = result?.contactHistory[activeIndex];

  const nodeStrain = useMemo(() => (activeMesh?.nodeStates ?? []).map((node) => node.localStrain ?? 0), [activeMesh]);
  const nodePressure = useMemo(() => (activeContact?.nodeContacts ?? []).map((node) => node.contactPressureMPa ?? 0), [activeContact]);
  const nodeSpringback = useMemo(
    () => (activeMesh?.nodeStates ?? []).map((node) => Math.abs((node.afterSpringbackY ?? node.y) - node.y)),
    [activeMesh],
  );

  return (
    <div className="h-full overflow-auto bg-[#070710] p-5">
      <div className="mx-auto grid max-w-7xl gap-4">
        <div className="rounded-3xl border border-white/10 bg-[linear-gradient(135deg,rgba(15,16,32,0.96),rgba(9,11,22,0.98))] p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2563eb,#0f766e)] shadow-[0_12px_24px_rgba(37,99,235,0.18)]">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-xl font-black text-white">Physics-Informed Simulation</div>
                <div className="mt-1 text-sm text-zinc-500">
                  Incremental solver, contact history, unloading springback, and node-level debug charts.
                </div>
                <div
                  className="mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold"
                  style={{ color: riskTone.fg, background: riskTone.bg, border: `1px solid ${riskTone.border}` }}
                >
                  <Gauge className="h-3.5 w-3.5" />
                  {result ? "Incremental solver active" : "No live run"}
                </div>
              </div>
            </div>

            <div className="flex max-w-sm flex-col items-end gap-2">
              <button
                onClick={() => void runSimulation(true)}
                disabled={isLoading || !hasGeometry}
                title={hasGeometry ? "Run project simulation" : "Load a DXF profile or draw a profile first"}
                className="inline-flex items-center gap-2 rounded-xl border border-blue-400/25 bg-blue-400/10 px-4 py-2 text-xs font-bold text-blue-100 disabled:cursor-not-allowed disabled:text-zinc-500"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {isLoading ? "Running simulation..." : "Run Project Simulation"}
              </button>
              <div className="text-right text-xs leading-5 text-zinc-500">
                {hasGeometry ? "Uses current project geometry and backend phase-3 solver." : "Load a DXF profile or draw a profile before running simulation."}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm leading-6 text-amber-100">
            <div className="mb-1 flex items-center gap-2 font-bold">
              <Shield className="h-4 w-4" />
              Honest model scope
            </div>
            This screen uses the project&apos;s backend incremental solver and debug states. It is stronger than a visual estimator,
            but it is still <strong>not full FEA</strong>. Use it for engineering guidance, risk comparison, and debugging.
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <div className="rounded-2xl border border-blue-400/20 bg-blue-400/5 p-4">
            <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-zinc-500">Material</div>
            <div className="mt-1 text-2xl font-black text-blue-300">{materialType}</div>
            <div className="mt-2 text-xs text-zinc-500">{material.name} · t={materialThickness.toFixed(2)} mm</div>
          </div>
          <div className="rounded-2xl p-4" style={{ background: riskTone.bg, border: `1px solid ${riskTone.border}` }}>
            <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-zinc-500">Overall Risk</div>
            <div className="mt-1 text-2xl font-black" style={{ color: riskTone.fg }}>{result?.overallRisk ?? "NO RUN"}</div>
            <div className="mt-2 text-xs text-zinc-500">{result ? `${result.validation.warnings.length} validation warnings` : "Awaiting backend result"}</div>
          </div>
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4">
            <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-zinc-500">Peak Stress</div>
            <div className="mt-1 text-2xl font-black text-amber-300">{result ? `${result.peakStressMPa.toFixed(1)} MPa` : "--"}</div>
            <div className="mt-2 text-xs text-zinc-500">Material curve + pass solver output</div>
          </div>
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4">
            <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-zinc-500">Project</div>
            <div className="mt-1 text-2xl font-black text-emerald-300">{hasGeometry ? `${numStations} passes` : "No geometry"}</div>
            <div className="mt-2 text-xs text-zinc-500">{hasGeometry ? "Active project profile loaded from store" : "Load geometry first"}</div>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-200">
            <div className="mb-1 flex items-center gap-2 font-bold">
              <AlertTriangle className="h-4 w-4" />
              Simulation blocked
            </div>
            {error}
          </div>
        )}

        {result && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <MiniBars
                title="Pass Stress"
                subtitle="Click a pass to inspect its node-level details."
                values={result.stressMap.map((point) => point.stressMPa)}
                labels={result.stressMap.map((point) => point.stationId)}
                accent="#f59e0b"
                selected={activeIndex}
                onSelect={setSelectedPass}
                format={(value) => value.toFixed(0)}
              />
              <MiniBars
                title="Pass Strain"
                subtitle="Per-pass strain from the backend incremental solver."
                values={result.strainMap.map((point) => point.strainPerPass)}
                labels={result.strainMap.map((point) => point.stationId)}
                accent="#60a5fa"
                selected={activeIndex}
                onSelect={setSelectedPass}
                format={(value) => value.toFixed(4)}
              />
              <MiniBars
                title="Springback Delta"
                subtitle="Recovered angle after unloading for each pass."
                values={result.springbackAdjusted.passes.map((point) => point.recoveredAngle ?? 0)}
                labels={result.springbackAdjusted.passes.map((point) => point.stationId)}
                accent="#34d399"
                selected={activeIndex}
                onSelect={setSelectedPass}
                format={(value) => `${value.toFixed(2)}°`}
              />
            </div>

            <div className="grid grid-cols-[320px_minmax(0,1fr)] gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
                  <Info className="h-4 w-4 text-blue-300" />
                  {activePass ? `${activePass.stationId} diagnostics` : "Pass diagnostics"}
                </div>
                {activePass ? (
                  <div className="grid gap-2">
                    {[
                      ["Zone", activePass.phaseZone],
                      ["Risk", activePass.riskLevel],
                      ["Target angle", `${activePass.targetBendAngle.toFixed(2)}°`],
                      ["Overbend target", `${(activePass.overbendTargetAngle ?? activePass.commandedAngle).toFixed(2)}°`],
                      ["Final angle", `${activePass.effectiveBendAngle.toFixed(2)}°`],
                      ["Recovered springback", `${activePass.residualSpringback.toFixed(2)}°`],
                      ["Pass stress", `${activePass.passStressMPa.toFixed(1)} MPa`],
                      ["Contact pressure", `${activePass.contactPressureMPa.toFixed(1)} MPa`],
                      ["Solver iterations", `${activePass.solverIterations ?? 0}`],
                      ["Solver residual", `${(activePass.solverResidual ?? 0).toExponential(2)}`],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-xs">
                        <span className="text-zinc-500">{label}</span>
                        <span className="font-bold text-zinc-200">{value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-zinc-500">Run simulation to inspect pass diagnostics.</div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <MiniBars
                  title="Node Strain"
                  subtitle="Node-level strain on the selected pass."
                  values={nodeStrain.length > 0 ? nodeStrain : [0]}
                  labels={(nodeStrain.length > 0 ? nodeStrain : [0]).map((_, index) => `N${index + 1}`)}
                  accent="#60a5fa"
                  selected={-1}
                  onSelect={() => {}}
                  format={(value) => value.toFixed(5)}
                />
                <MiniBars
                  title="Node Pressure"
                  subtitle="Contact pressure across mesh nodes."
                  values={nodePressure.length > 0 ? nodePressure : [0]}
                  labels={(nodePressure.length > 0 ? nodePressure : [0]).map((_, index) => `N${index + 1}`)}
                  accent="#f59e0b"
                  selected={-1}
                  onSelect={() => {}}
                  format={(value) => value.toFixed(1)}
                />
                <MiniBars
                  title="Springback Delta"
                  subtitle="Absolute node movement after unloading."
                  values={nodeSpringback.length > 0 ? nodeSpringback : [0]}
                  labels={(nodeSpringback.length > 0 ? nodeSpringback : [0]).map((_, index) => `N${index + 1}`)}
                  accent="#34d399"
                  selected={-1}
                  onSelect={() => {}}
                  format={(value) => value.toFixed(3)}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
                {result.validation.isSimulationValid ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-300" />
                )}
                Validation warnings
              </div>
              {result.validation.warnings.length === 0 ? (
                <div className="text-xs text-emerald-300">No validation warnings returned for this run.</div>
              ) : (
                <div className="grid gap-2">
                  {result.validation.warnings.map((warning, index) => (
                    <div key={`${warning}-${index}`} className="rounded-xl border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-xs leading-5 text-amber-100">
                      {warning}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
