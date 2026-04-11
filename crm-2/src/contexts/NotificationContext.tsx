import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { demos as demosService, meetings as meetingsService, leads as leadsService } from "@/lib/dataService";
import { toast } from "@/hooks/use-toast";

export interface AppNotification {
  id: string;
  type: "task_overdue" | "task_due_today" | "demo_tomorrow" | "meeting_tomorrow" |
        "demo_today" | "meeting_today" | "new_lead" | "reply_received" | "system";
  title: string;
  message: string;
  read: boolean;
  timestamp: Date;
  link?: string;
  priority: "urgent" | "normal";
}

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  markRead: (id: string) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
  refresh: () => void;
}

const NotificationContext = createContext<NotificationContextValue>({
  notifications: [],
  unreadCount: 0,
  loading: false,
  markRead: () => {},
  markAllRead: () => {},
  dismiss: () => {},
  refresh: () => {},
});

export function useNotifications() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    const items: AppNotification[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    try {
      // Tasks
      const { leadTasks } = await import("@/lib/dataService");
      const tasks = await leadTasks.getAll({}).catch(() => []) as any[];
      const overdueTasks = tasks.filter((t: any) => {
        if (!t.due_date || t.status === "completed") return false;
        return new Date(t.due_date) < today;
      });
      overdueTasks.forEach((t: any) => {
        items.push({
          id: `task-overdue-${t.id}`,
          type: "task_overdue",
          title: "Overdue Task",
          message: `"${t.title}" was due ${new Date(t.due_date).toLocaleDateString("en-IN")}`,
          read: false,
          timestamp: new Date(t.due_date),
          priority: "urgent",
        });
      });

      const dueTodayTasks = tasks.filter((t: any) => {
        if (!t.due_date || t.status === "completed") return false;
        const d = new Date(t.due_date);
        return d >= today && d < tomorrow;
      });
      dueTodayTasks.forEach((t: any) => {
        items.push({
          id: `task-today-${t.id}`,
          type: "task_due_today",
          title: "Task Due Today",
          message: `"${t.title}" is due today`,
          read: false,
          timestamp: new Date(t.due_date),
          priority: "normal",
        });
      });

      // Demos
      const demos = await demosService.getAll({}).catch(() => []) as any[];
      demos.filter((d: any) => d.status === "scheduled").forEach((d: any) => {
        if (!d.demo_date) return;
        const dDate = new Date(d.demo_date);
        const diff = Math.floor((dDate.getTime() - today.getTime()) / 86400000);
        if (diff === 0) {
          items.push({
            id: `demo-today-${d.id}`,
            type: "demo_today",
            title: "Demo Today",
            message: `${d.contact_name} — ${d.machine_interest || "Machine demo"} at ${d.demo_time}`,
            read: false,
            timestamp: new Date(d.demo_date),
            priority: "urgent",
          });
        } else if (diff === 1) {
          items.push({
            id: `demo-tmrw-${d.id}`,
            type: "demo_tomorrow",
            title: "Demo Tomorrow",
            message: `${d.contact_name} — ${d.machine_interest || "Machine demo"} at ${d.demo_time}`,
            read: false,
            timestamp: new Date(d.demo_date),
            priority: "normal",
          });
        }
      });

      // Meetings
      const meetings = await meetingsService.getAll({}).catch(() => []) as any[];
      meetings.filter((m: any) => m.status === "pending" || m.status === "confirmed").forEach((m: any) => {
        if (!m.slot_date) return;
        const mDate = new Date(m.slot_date);
        const diff = Math.floor((mDate.getTime() - today.getTime()) / 86400000);
        if (diff === 0) {
          items.push({
            id: `meet-today-${m.id}`,
            type: "meeting_today",
            title: "Meeting Today",
            message: `${m.lead_name} — ${m.meeting_type} at ${m.slot_time}`,
            read: false,
            timestamp: new Date(m.slot_date),
            priority: "urgent",
          });
        } else if (diff === 1) {
          items.push({
            id: `meet-tmrw-${m.id}`,
            type: "meeting_tomorrow",
            title: "Meeting Tomorrow",
            message: `${m.lead_name} — ${m.meeting_type} at ${m.slot_time}`,
            read: false,
            timestamp: new Date(m.slot_date),
            priority: "normal",
          });
        }
      });

      // New leads (last 7 days)
      const leads = await leadsService.getAll({}).catch(() => []) as any[];
      const newLeads = leads.filter((l: any) => {
        if (!l.created_at) return false;
        return new Date(l.created_at) >= nextWeek;
      });
      newLeads.forEach((l: any) => {
        items.push({
          id: `lead-new-${l.id}`,
          type: "new_lead",
          title: "New Lead",
          message: `${l.name} from ${l.source || "Unknown"} — ${l.city || "Unknown location"}`,
          read: false,
          timestamp: new Date(l.created_at),
          priority: "normal",
        });
      });

      // Sort by timestamp descending
      items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch {
      // Demo notifications if Supabase not connected
      items.push(
        {
          id: "demo-1", type: "demo_today", title: "Demo Today",
          message: "Satpal Singh — Shutter Patti Machine at 10:00 AM",
          read: false, timestamp: new Date(), priority: "urgent",
        },
        {
          id: "task-1", type: "task_overdue", title: "Overdue Task",
          message: "Follow up with Ramesh Yadav was due yesterday",
          read: false, timestamp: new Date(Date.now() - 86400000), priority: "urgent",
        },
        {
          id: "lead-1", type: "new_lead", title: "New Lead",
          message: "Vikash Garg from IndiaMART — Gurgaon",
          read: false, timestamp: new Date(Date.now() - 3600000), priority: "normal",
        },
        {
          id: "meet-1", type: "meeting_tomorrow", title: "Meeting Tomorrow",
          message: "Ankit Gupta — Video call at 3:00 PM",
          read: false, timestamp: new Date(Date.now() + 86400000), priority: "normal",
        },
      );
    }

    setNotifications(items);
    setLoading(false);
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Browser push notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      // We'll request on first significant notification only
    }
  }, []);

  function markRead(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  function dismiss(id: string) {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }

  return (
    <NotificationContext.Provider value={{
      notifications, unreadCount, loading, markRead, markAllRead, dismiss, refresh: fetchNotifications,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}
