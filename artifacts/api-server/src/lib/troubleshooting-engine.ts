// troubleshooting_engine.ts
// SAI Rolotech - Smart Troubleshooting Module (Human-Centric)
// Provides real-time advice to machine operators based on profile defects

export interface TroubleshootingAdvice {
  defect: string;
  root_cause: string;
  action: string;
  station_target?: number;
}

export const TROUBLESHOOTING_DB: Record<string, TroubleshootingAdvice[]> = {
  TWISTING: [
    {
      defect: "Profile Twisting clockwise",
      root_cause: "Uneven side pressure on final stations",
      action: "Decrease side roll pressure on Station 18, Increase on Station 20",
      station_target: 18,
    },
  ],
  EDGE_WAVE: [
    {
      defect: "Wavy Edges",
      root_cause: "Excessive longitudinal strain in early passes",
      action: "Open roll gap by 0.02mm in first 3 stations",
      station_target: 1,
    },
  ],
  END_FLARE: [
    {
      defect: "Corners opening at the end",
      root_cause: "Insufficient springback compensation",
      action: "Increase overbend by 1.5 degrees on last sizing station",
      station_target: 22,
    },
  ],
};

export function getOperatorAdvice(defectType: string): TroubleshootingAdvice | string {
  const advice = TROUBLESHOOTING_DB[defectType];
  return advice ? advice[0] : "Check overall machine alignment and coolant flow.";
}
