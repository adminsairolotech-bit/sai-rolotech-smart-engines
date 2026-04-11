import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { staggerItem, fadeIn } from "@/lib/animations";
import { PageHeader, EmptyState, LoadingSkeleton, StatsCard, SectionCard } from "@/components/shared";
import { LoadingWithTimeout } from "@/components/LoadingWithTimeout";
import { feedbackReports } from "@/lib/dataService";
import {
  Bug,
  Sparkles,
  Filter,
  RefreshCw,
  ChevronDown,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";

type Report = {
  id: number;
  ticketNumber: string;
  type: string;
  title: string;
  description: string;
  pageName: string | null;
  severity: string | null;
  priority: string | null;
  status: string;
  userName: string | null;
  userEmail: string | null;
  userPhone: string | null;
  createdAt: string;
  updatedAt: string;
};

const STATUS_OPTIONS = ["Open", "In Progress", "Resolved", "Closed"] as const;

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: typeof AlertCircle }> = {
  Open: { bg: "bg-blue-50", text: "text-blue-600", icon: AlertCircle },
  "In Progress": { bg: "bg-amber-50", text: "text-amber-600", icon: Clock },
  Resolved: { bg: "bg-emerald-50", text: "text-emerald-600", icon: CheckCircle2 },
  Closed: { bg: "bg-slate-50", text: "text-gray-500", icon: XCircle },
};

const SEVERITY_STYLES: Record<string, string> = {
  Low: "bg-emerald-50 text-green-600",
  Medium: "bg-amber-50 text-amber-600",
  High: "bg-red-50 text-red-600",
  Critical: "bg-violet-50 text-purple-600",
};

export default function FeedbackPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const data = await feedbackReports.getAll();
      const mapped: Report[] = data.map(r => ({
        id: r.id,
        ticketNumber: `FB-${String(r.id).padStart(4, '0')}`,
        type: r.type || 'feedback',
        title: r.subject,
        description: r.message || '',
        pageName: null,
        severity: r.priority || null,
        priority: r.priority || null,
        status: r.status ? r.status.charAt(0).toUpperCase() + r.status.slice(1) : 'Open',
        userName: null,
        userEmail: null,
        userPhone: null,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));
      let filtered = mapped;
      if (typeFilter) filtered = filtered.filter(r => r.type === typeFilter);
      if (statusFilter) filtered = filtered.filter(r => r.status === statusFilter);
      if (severityFilter) filtered = filtered.filter(r => r.severity === severityFilter);
      setReports(filtered);
      setTotal(mapped.length);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter, severityFilter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const updateStatus = async (id: number, newStatus: string) => {
    setUpdatingId(id);
    try {
      await feedbackReports.update(id, { status: newStatus });
      setReports((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: newStatus, updatedAt: new Date().toISOString() } : r
        )
      );
    } catch {
    } finally {
      setUpdatingId(null);
    }
  };

  const bugCount = reports.filter((r) => r.type === "bug").length;
  const featureCount = reports.filter((r) => r.type === "feature").length;
  const openCount = reports.filter((r) => r.status === "Open").length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Feedback Reports"
        subtitle="Manage bug reports and feature requests from users."
      />

      <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: "Total Reports", value: total, icon: Filter, iconBg: "bg-blue-50", iconColor: "text-blue-500" },
          { label: "Bug Reports", value: bugCount, icon: Bug, iconBg: "bg-red-50", iconColor: "text-red-500" },
          { label: "Feature Requests", value: featureCount, icon: Sparkles, iconBg: "bg-violet-50", iconColor: "text-purple-500" },
          { label: "Open", value: openCount, icon: AlertCircle, iconBg: "bg-amber-50", iconColor: "text-amber-500" },
        ].map((stat) => (
          <StatsCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            iconBg={stat.iconBg}
            iconColor={stat.iconColor}
          />
        ))}
      </motion.div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground"
        >
          <option value="">All Types</option>
          <option value="bug">Bug Reports</option>
          <option value="feature">Feature Requests</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground"
        >
          <option value="">All Status</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground"
        >
          <option value="">All Severity</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Critical">Critical</option>
        </select>

        <button
          onClick={fetchReports}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <SectionCard noPadding>
        <LoadingWithTimeout
          loading={loading}
          onRetry={fetchReports}
          loadingContent={
            <div className="p-4">
              <LoadingSkeleton variant="table" count={5} />
            </div>
          }
        >
          {reports.length === 0 ? (
            <EmptyState icon={Filter} title="No feedback reports found" description="Try adjusting your filters." />
          ) : (
            <div className="divide-y divide-border">
              {reports.map((report) => {
                const statusStyle = STATUS_STYLES[report.status] || STATUS_STYLES.Open;
                const StatusIcon = statusStyle.icon;

                return (
                  <motion.div
                    key={report.id}
                    variants={fadeIn}
                    initial="hidden"
                    animate="visible"
                    className="p-5 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          {report.type === "bug" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-50 text-red-600">
                              <Bug className="w-3 h-3" /> Bug
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-violet-50 text-purple-600">
                              <Sparkles className="w-3 h-3" /> Feature
                            </span>
                          )}
                          <span className="text-xs font-mono text-muted-foreground">
                            {report.ticketNumber}
                          </span>
                          {report.severity && (
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-bold ${SEVERITY_STYLES[report.severity] || ""}`}
                            >
                              {report.severity}
                            </span>
                          )}
                          {report.priority && (
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-600">
                              Priority: {report.priority}
                            </span>
                          )}
                        </div>

                        <h3 className="font-semibold text-foreground text-sm mb-1">
                          {report.title}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {report.description}
                        </p>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {report.pageName && <span>Page: {report.pageName}</span>}
                          <span>
                            {new Date(report.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${statusStyle.bg} ${statusStyle.text}`}
                        >
                          <StatusIcon className="w-3.5 h-3.5" />
                          {report.status}
                        </div>

                        <div className="relative">
                          <select
                            value={report.status}
                            onChange={(e) => updateStatus(report.id, e.target.value)}
                            disabled={updatingId === report.id}
                            className="appearance-none bg-muted/50 border border-border rounded-lg pl-3 pr-7 py-1.5 text-xs font-medium text-foreground cursor-pointer hover:bg-muted transition-colors disabled:opacity-50"
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </LoadingWithTimeout>
      </SectionCard>
    </div>
  );
}
