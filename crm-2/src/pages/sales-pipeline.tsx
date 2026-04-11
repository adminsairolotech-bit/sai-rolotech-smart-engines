import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { PageHeader, StatsCard } from "@/components/shared";
import { KanbanSquare, Users, DollarSign, Target, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { leads as leadsService } from "@/lib/dataService";

interface Lead {
  id: number;
  name: string;
  company: string;
  machine: string;
  value: string;
  daysInStage: number;
}

type Stage = "new_lead" | "contacted" | "quotation_sent" | "negotiating" | "won" | "lost";

const stageConfig: Record<Stage, { label: string; color: string; bgColor: string }> = {
  new_lead: { label: "New Lead", color: "text-blue-600", bgColor: "bg-blue-50 border-blue-200" },
  contacted: { label: "Contacted", color: "text-cyan-700", bgColor: "bg-cyan-50 border-cyan-200" },
  quotation_sent: { label: "Quotation Sent", color: "text-amber-600", bgColor: "bg-amber-50 border-amber-200" },
  negotiating: { label: "Negotiation", color: "text-violet-600", bgColor: "bg-violet-50 border-violet-200" },
  won: { label: "Won", color: "text-emerald-600", bgColor: "bg-emerald-50 border-emerald-200" },
  lost: { label: "Lost", color: "text-red-600", bgColor: "bg-red-50 border-red-200" },
};

const stages: Stage[] = ["new_lead", "contacted", "quotation_sent", "negotiating", "won", "lost"];

const initialLeads: Record<Stage, Lead[]> = {
  new_lead: [],
  contacted: [],
  quotation_sent: [],
  negotiating: [],
  won: [],
  lost: [
    { id: 10, name: "Arun Verma", company: "Tata Steel", machine: "Bandsaw", value: "₹4.5L", daysInStage: 15 },
  ],
};

export default function SalesPipelinePage() {
  const [leads, setLeads] = useState(initialLeads);
  const [loading, setLoading] = useState(true);
  const [draggedLead, setDraggedLead] = useState<{ lead: Lead; fromStage: Stage } | null>(null);
  const [dropTarget, setDropTarget] = useState<Stage | null>(null);

  useEffect(() => {
    async function loadLeads() {
      try {
        const allLeads = await leadsService.getAll();
        const grouped: Record<Stage, Lead[]> = { new_lead: [], contacted: [], quotation_sent: [], negotiating: [], won: [], lost: [] };
        allLeads.forEach(l => {
          const stage = (l.pipeline_stage || 'new_lead') as Stage;
          const daysInStage = l.created_at ? Math.max(1, Math.floor((Date.now() - new Date(l.created_at).getTime()) / 86400000)) : 1;
          const lead: Lead = {
            id: l.id,
            name: l.name,
            company: l.city || '',
            machine: l.machine_interest || 'General',
            value: l.budget || '₹0',
            daysInStage,
          };
          if (grouped[stage]) grouped[stage].push(lead);
          else grouped.new_lead.push(lead);
        });
        setLeads(grouped);
      } catch {
        setLeads(initialLeads);
      }
      setLoading(false);
    }
    loadLeads();
  }, []);

  const handleDragStart = useCallback((lead: Lead, fromStage: Stage) => {
    setDraggedLead({ lead, fromStage });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, stage: Stage) => {
    e.preventDefault();
    setDropTarget(stage);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDropTarget(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, toStage: Stage) => {
    e.preventDefault();
    setDropTarget(null);

    if (!draggedLead || draggedLead.fromStage === toStage) {
      setDraggedLead(null);
      return;
    }

    setLeads((prev) => {
      const updated = { ...prev };
      updated[draggedLead.fromStage] = prev[draggedLead.fromStage].filter((l) => l.id !== draggedLead.lead.id);
      updated[toStage] = [...prev[toStage], { ...draggedLead.lead, daysInStage: 0 }];
      return updated;
    });

    setDraggedLead(null);
  }, [draggedLead]);

  const totalLeads = Object.values(leads).flat().length;
  const totalValue = "₹2.15Cr";

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
      <PageHeader title="Sales Pipeline" subtitle="Drag and drop leads between stages to track progress" />

      <motion.div variants={staggerItem} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Total Leads" value={totalLeads} icon={Users} iconBg="bg-blue-500/10" iconColor="text-blue-500" />
        <StatsCard label="Pipeline Value" value={totalValue} icon={DollarSign} iconBg="bg-emerald-500/10" iconColor="text-emerald-500" />
        <StatsCard label="Won This Month" value={(leads.won || []).length} icon={Target} iconBg="bg-purple-500/10" iconColor="text-purple-500" />
        <StatsCard label="Conversion" value="32.8%" icon={KanbanSquare} iconBg="bg-amber-500/10" iconColor="text-amber-500" />
      </motion.div>

      <motion.div variants={staggerItem} className="flex gap-4 overflow-x-auto pb-4 scroll-optimized">
        {stages.map((stage) => {
          const config = stageConfig[stage];
          const stageLeads = leads[stage];
          const isDropping = dropTarget === stage;
          return (
            <div key={stage} className="min-w-[280px] flex-shrink-0"
              onDragOver={(e) => handleDragOver(e, stage)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage)}>
              <div className={`rounded-xl border ${config.bgColor} p-3 mb-3`}>
                <div className="flex items-center justify-between">
                  <h3 className={`text-sm font-semibold ${config.color}`}>{config.label}</h3>
                  <Badge variant="outline" className="text-xs">{stageLeads.length}</Badge>
                </div>
              </div>
              <div className={`space-y-3 min-h-[100px] rounded-xl p-2 transition-colors ${isDropping ? "bg-primary/5 border-2 border-dashed border-primary/30" : "border-2 border-transparent"}`}>
                {stageLeads.map((lead) => (
                  <div key={lead.id}
                    draggable
                    onDragStart={() => handleDragStart(lead, stage)}
                    className={`glass-card rounded-xl p-4 cursor-grab active:cursor-grabbing hover:border-primary/30 transition-all ${draggedLead?.lead.id === lead.id ? "opacity-40 scale-95" : ""}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">{lead.name}</p>
                        <p className="text-xs text-muted-foreground">{lead.company}</p>
                      </div>
                      <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs">{lead.value}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{lead.machine}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{lead.daysInStage}d in stage</span>
                    </div>
                  </div>
                ))}
                {stageLeads.length === 0 && (
                  <div className="text-center py-6 text-xs text-muted-foreground">Drop leads here</div>
                )}
              </div>
            </div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
