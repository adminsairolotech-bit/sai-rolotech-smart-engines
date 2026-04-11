import { useState } from "react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { PageHeader, SectionCard } from "@/components/shared";
import { Shield, Plus, Pencil, Trash2, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface BuddyRule {
  id: number;
  name: string;
  description: string;
  category: "greeting" | "pricing" | "escalation" | "restriction" | "personality";
  enabled: boolean;
  rule: string;
}

const initialRules: BuddyRule[] = [
  { id: 1, name: "Professional Greeting", description: "Always greet with company name", category: "greeting", enabled: true, rule: "Start every conversation with 'Welcome to Sai Rolotech! I'm your AI assistant. How can I help you today?'" },
  { id: 2, name: "Price Range Only", description: "Share price ranges, not exact prices", category: "pricing", enabled: true, rule: "When asked about pricing, provide a price range (e.g., ₹10L - ₹25L) and recommend contacting sales for an exact quote." },
  { id: 3, name: "Escalation Trigger", description: "Escalate to human for complex queries", category: "escalation", enabled: true, rule: "If the user asks about financing, EMI options, or custom modifications more than twice, offer to connect them with a sales representative." },
  { id: 4, name: "No Competitor Comparison", description: "Avoid comparing with competitors", category: "restriction", enabled: true, rule: "Never compare Sai Rolotech products with competitor brands. If asked, focus on our strengths and unique features." },
  { id: 5, name: "Friendly Tone", description: "Maintain warm, professional tone", category: "personality", enabled: true, rule: "Use a warm, professional tone. Address users respectfully (Sir/Madam) unless they specify otherwise. Use simple, clear language." },
  { id: 6, name: "Lead Capture", description: "Collect contact details when interest is shown", category: "escalation", enabled: false, rule: "When a user shows strong buying intent (asking about pricing, availability, demos), politely ask for their name and phone number." },
];

const categoryColors: Record<string, string> = {
  greeting: "bg-blue-50 text-blue-600",
  pricing: "bg-emerald-50 text-emerald-700",
  escalation: "bg-amber-50 text-amber-700",
  restriction: "bg-red-50 text-red-600",
  personality: "bg-violet-50 text-violet-600",
};

export default function BuddyRulesPage() {
  const [rules, setRules] = useState(initialRules);

  const toggleRule = (id: number) => {
    setRules((prev) => prev.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
      <PageHeader title="Buddy Rules" subtitle="Configure AI buddy behavior and conversation rules" />

      <motion.div variants={staggerItem} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-primary" />
          <span className="text-sm text-muted-foreground">{rules.filter((r) => r.enabled).length} of {rules.length} rules active</span>
        </div>
        <Button className="gap-2"><Plus className="w-4 h-4" /> Add Rule</Button>
      </motion.div>

      <div className="space-y-4">
        {rules.map((rule) => (
          <motion.div key={rule.id} variants={staggerItem} className={`glass-card rounded-xl p-5 transition-all ${rule.enabled ? "" : "opacity-50"}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-medium text-foreground">{rule.name}</h3>
                <Badge className={categoryColors[rule.category]}>{rule.category}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-1.5 rounded-lg hover:bg-muted transition-colors"><Pencil className="w-4 h-4 text-muted-foreground" /></button>
                <button className="p-1.5 rounded-lg hover:bg-muted transition-colors"><Trash2 className="w-4 h-4 text-muted-foreground" /></button>
                <button onClick={() => toggleRule(rule.id)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${rule.enabled ? "bg-primary" : "bg-muted"}`}>
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${rule.enabled ? "left-[22px]" : "left-0.5"}`} />
                </button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-2">{rule.description}</p>
            <div className="p-3 rounded-lg bg-muted/30 border border-border">
              <p className="text-xs text-foreground/80 leading-relaxed">{rule.rule}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
