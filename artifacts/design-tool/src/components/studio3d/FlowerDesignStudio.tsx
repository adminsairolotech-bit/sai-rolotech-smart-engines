import React, { useState, useMemo } from "react";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine 
} from "recharts";

interface FlowerStation {
  stationId: string;
  bendAngle: number;
  cumulativeBendAngle: number;
  strain: number;
  strainLimit: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  description: string;
}

interface FlowerDesignStudioProps {
  initialStations: FlowerStation[];
  onUpdate?: (stations: FlowerStation[]) => void;
}

export const FlowerDesignStudio: React.FC<FlowerDesignStudioProps> = ({ 
  initialStations, 
  onUpdate 
}) => {
  const [stations, setStations] = useState<FlowerStation[]>(initialStations);

  const handleAngleChange = (index: number, value: string) => {
    const newAngle = parseFloat(value) || 0;
    const newStations = [...stations];
    newStations[index].bendAngle = newAngle;
    
    // Recalculate cumulative angles
    let currentSum = 0;
    for (let i = 0; i < newStations.length; i++) {
      currentSum += newStations[i].bendAngle;
      newStations[i].cumulativeBendAngle = currentSum;
      
      // Basic strain re-estimation (simulated for UI responsiveness)
      // In real life, this triggers the backend solver
      newStations[i].strain = (newStations[i].bendAngle / 90) * 0.05; 
      newStations[i].riskLevel = newStations[i].strain > newStations[i].strainLimit * 0.8 ? "HIGH" : "LOW";
    }
    
    setStations(newStations);
    if (onUpdate) onUpdate(newStations);
  };

  const chartData = useMemo(() => stations.map(s => ({
    name: s.stationId,
    strain: s.strain,
    limit: s.strainLimit
  })), [stations]);

  return (
    <div className="flex flex-col gap-6 p-6 bg-[#0a0b14] text-slate-200 min-h-screen font-sans">
      <header className="flex justify-between items-center border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span className="text-amber-500">⚙</span> INDUSTRIAL FLOWER STUDIO
          </h1>
          <p className="text-sm text-slate-400">Professional Progressive Forming Designer</p>
        </div>
        <div className="flex gap-4">
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
            RULES: DIN 6935 ACTIVE
          </Badge>
          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            SIMULATION: DEEP-SCAN
          </Badge>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Engineering Spreadsheet */}
        <Card className="lg:col-span-2 bg-[#121422] border-white/5 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-wider">
              Parametric Station Table
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-white/5 overflow-hidden">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow>
                    <TableHead className="w-16">ID</TableHead>
                    <TableHead>Bend Angle (°)</TableHead>
                    <TableHead>Cumulative (°)</TableHead>
                    <TableHead>Est. Strain</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Process Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stations.map((station, idx) => (
                    <TableRow key={station.stationId} className="hover:bg-white/5 border-white/5">
                      <TableCell className="font-mono text-amber-500">{station.stationId}</TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          value={station.bendAngle}
                          onChange={(e) => handleAngleChange(idx, e.target.value)}
                          className="w-24 bg-black/40 border-white/10 focus:border-amber-500/50 text-white h-8"
                        />
                      </TableCell>
                      <TableCell className="font-mono text-slate-400">
                        {station.cumulativeBendAngle.toFixed(2)}°
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${station.riskLevel === "HIGH" ? "bg-red-500" : "bg-emerald-500"}`}
                              style={{ width: `${(station.strain / station.strainLimit) * 100}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono">{(station.strain * 100).toFixed(2)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {station.riskLevel === "HIGH" ? (
                          <Badge className="bg-red-500/20 text-red-500 border-none text-[10px]">CRITICAL</Badge>
                        ) : (
                          <Badge className="bg-emerald-500/20 text-emerald-500 border-none text-[10px]">SAFE</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 italic truncate max-w-[150px]">
                        {station.description}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Right: Strain Monitor & Telemetry */}
        <div className="flex flex-col gap-6">
          <Card className="bg-[#121422] border-white/5 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                Strain Distribution (FEA)
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff11" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ background: "#0a0b14", border: "1px solid #ffffff11", fontSize: "10px" }}
                  />
                  <ReferenceLine y={chartData[0]?.limit} stroke="#ef4444" strokeDasharray="5 5" label={{ position: 'top', value: 'Yield Limit', fill: '#ef4444', fontSize: 10 }} />
                  <Line 
                    type="monotone" 
                    dataKey="strain" 
                    stroke="#f59e0b" 
                    strokeWidth={2} 
                    dot={{ fill: "#f59e0b", r: 4 }}
                    activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-[#121422] border-white/5 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                Industrial Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">HERMES OPTIMIZER</span>
                    <span className="text-amber-500 font-bold">READY</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    AI will automatically adjust angles if longitudinal strain exceeds material elastic limits.
                  </p>
                </div>
                <button className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded text-xs transition-all">
                  RUN HERMES OPTIMIZATION
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
