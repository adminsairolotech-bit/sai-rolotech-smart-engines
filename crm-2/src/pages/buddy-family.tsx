import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { PageHeader, StatsCard, SectionCard } from "@/components/shared";
import { UsersRound, Bot, MessageSquare, Zap, FileText, Target, Wrench, Headphones } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { LucideIcon } from "lucide-react";

interface MiniBuddy {
  id: number;
  name: string;
  specialty: string;
  description: string;
  icon: LucideIcon;
  isActive: boolean;
  conversations: number;
  successRate: number;
  color: string;
}

const miniBuddies: MiniBuddy[] = [
  { id: 1, name: "Sales Buddy", specialty: "Sales & Quotations", description: "Handles pricing inquiries, generates quotations, and nurtures leads through the sales funnel", icon: Target, isActive: true, conversations: 45, successRate: 82, color: "text-blue-600 bg-blue-50" },
  { id: 2, name: "Tech Buddy", specialty: "Technical Support", description: "Answers technical questions about machine specifications, compatibility, and performance", icon: Wrench, isActive: true, conversations: 38, successRate: 91, color: "text-emerald-700 bg-emerald-50" },
  { id: 3, name: "Service Buddy", specialty: "After-Sales Service", description: "Manages service requests, maintenance scheduling, and spare parts inquiries", icon: Headphones, isActive: true, conversations: 28, successRate: 76, color: "text-violet-600 bg-violet-50" },
  { id: 4, name: "Content Buddy", specialty: "Marketing Content", description: "Generates WhatsApp messages, email campaigns, and promotional content", icon: FileText, isActive: true, conversations: 22, successRate: 88, color: "text-amber-700 bg-amber-50" },
  { id: 5, name: "Scout Buddy", specialty: "Lead Intelligence", description: "Analyzes conversations to identify high-intent buyers and generates lead scores", icon: Target, isActive: false, conversations: 15, successRate: 0, color: "text-pink-600 bg-pink-50" },
  { id: 6, name: "Demo Buddy", specialty: "Demo Scheduling", description: "Coordinates machine demonstrations, sends reminders, and collects feedback", icon: MessageSquare, isActive: true, conversations: 18, successRate: 94, color: "text-cyan-700 bg-cyan-50" },
];

export default function BuddyParivarPage() {
  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
      <PageHeader title="Buddy Parivar" subtitle="The AI buddy family — specialized sub-buddies for different tasks" />

      <motion.div variants={staggerItem} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Total Buddies" value={miniBuddies.length} icon={UsersRound} iconBg="bg-violet-50" iconColor="text-purple-500" />
        <StatsCard label="Active" value={miniBuddies.filter((b) => b.isActive).length} icon={Bot} iconBg="bg-emerald-50" iconColor="text-emerald-500" />
        <StatsCard label="Total Sessions" value={miniBuddies.reduce((a, b) => a + b.conversations, 0)} icon={MessageSquare} iconBg="bg-blue-50" iconColor="text-blue-500" />
        <StatsCard label="Avg Success" value={`${Math.round(miniBuddies.filter((b) => b.isActive).reduce((a, b) => a + b.successRate, 0) / miniBuddies.filter((b) => b.isActive).length)}%`} icon={Zap} iconBg="bg-amber-50" iconColor="text-amber-500" />
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {miniBuddies.map((buddy) => {
          const Icon = buddy.icon;
          return (
            <motion.div key={buddy.id} variants={staggerItem} className={`glass-card rounded-xl p-5 transition-all ${buddy.isActive ? "" : "opacity-50"}`}>
              <div className="flex items-start gap-3 mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${buddy.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">{buddy.name}</h3>
                    <Badge className={buddy.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-600"}>
                      {buddy.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-xs text-primary mt-0.5">{buddy.specialty}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{buddy.description}</p>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">Sessions</p>
                  <p className="text-lg font-bold text-foreground">{buddy.conversations}</p>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">Success Rate</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div className="bg-primary rounded-full h-2" style={{ width: `${buddy.successRate}%` }} />
                    </div>
                    <span className="text-sm font-medium text-foreground">{buddy.successRate}%</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
