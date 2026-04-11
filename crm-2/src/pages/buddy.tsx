import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { PageHeader, StatsCard, SectionCard } from "@/components/shared";
import { Bot, MessageSquare, Users, Clock, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const recentConversations = [
  { id: 1, user: "Rajesh Kumar", topic: "CNC Lathe specifications", messages: 12, duration: "8 min", satisfaction: "high", time: "10 min ago" },
  { id: 2, user: "Priya Nair", topic: "Hydraulic Press pricing", messages: 8, duration: "5 min", satisfaction: "high", time: "25 min ago" },
  { id: 3, user: "Amit Shah", topic: "Laser Cutter comparison", messages: 15, duration: "12 min", satisfaction: "medium", time: "1 hour ago" },
  { id: 4, user: "Sunita Reddy", topic: "Milling Machine demo request", messages: 6, duration: "4 min", satisfaction: "high", time: "2 hours ago" },
  { id: 5, user: "Deepak Joshi", topic: "Wire EDM maintenance", messages: 20, duration: "15 min", satisfaction: "low", time: "3 hours ago" },
];

const satisfactionColors: Record<string, string> = {
  high: "bg-emerald-50 text-emerald-700",
  medium: "bg-amber-50 text-amber-700",
  low: "bg-red-50 text-red-600",
};

const topQueries = [
  { query: "Machine pricing", count: 89 },
  { query: "Technical specifications", count: 67 },
  { query: "Demo scheduling", count: 45 },
  { query: "Spare parts availability", count: 34 },
  { query: "Service warranty", count: 28 },
  { query: "Financing options", count: 22 },
];

export default function BuddyDashboardPage() {
  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
      <PageHeader title="Buddy Dashboard" subtitle="AI assistant performance and conversation analytics" />

      <motion.div variants={staggerItem} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Total Sessions" value={156} icon={MessageSquare} iconBg="bg-blue-50" iconColor="text-blue-500" change="+23%" trend="up" />
        <StatsCard label="Unique Users" value={98} icon={Users} iconBg="bg-violet-50" iconColor="text-purple-500" change="+15%" trend="up" />
        <StatsCard label="Avg Duration" value="6.5 min" icon={Clock} iconBg="bg-amber-50" iconColor="text-amber-500" />
        <StatsCard label="Satisfaction" value="87%" icon={TrendingUp} iconBg="bg-emerald-50" iconColor="text-emerald-500" change="+4%" trend="up" />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Recent Conversations">
          <div className="space-y-3">
            {recentConversations.map((conv) => (
              <motion.div key={conv.id} variants={staggerItem} className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/30 transition-colors">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-foreground">{conv.user}</span>
                    <Badge className={satisfactionColors[conv.satisfaction]}>{conv.satisfaction}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{conv.topic}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{conv.messages} messages</span>
                    <span>{conv.duration}</span>
                    <span>{conv.time}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Top Queries">
          <div className="space-y-3">
            {topQueries.map((q) => (
              <div key={q.query} className="flex items-center justify-between">
                <span className="text-sm text-foreground">{q.query}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-muted rounded-full h-2">
                    <div className="bg-primary rounded-full h-2" style={{ width: `${(q.count / topQueries[0].count) * 100}%` }} />
                  </div>
                  <span className="text-sm font-medium text-foreground w-8 text-right">{q.count}</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </motion.div>
  );
}
