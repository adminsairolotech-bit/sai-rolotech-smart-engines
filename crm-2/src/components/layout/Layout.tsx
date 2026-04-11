import { ReactNode, useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { SearchProvider, useSearch } from "./SearchContext";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { getAdaptiveAnimations } from "@/lib/animations";
import { Bell, Search, Menu, Eye, LayoutDashboard, LogOut, BellRing, CheckCheck, X, AlertTriangle, CalendarCheck, Users, Clock } from "lucide-react";
import { useRole, type UserRole } from "@/contexts/RoleContext";
import { useAdminMode } from "@/contexts/AdminModeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useDeviceCapability } from "@/hooks/use-device-capability";
import { useSwipeNavigation } from "@/hooks/use-swipe-navigation";
import { BuddyToggleButton, BuddyPanel } from "@/components/BuddyPanel";
import { AIProviderBadge } from "@/components/AIProviderBadge";
import { toast } from "@/hooks/use-toast";
import { useNotifications } from "@/contexts/NotificationContext";

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Super Admin",
  supplier: "Supplier",
  machine_user: "Machine User",
};

const ROLE_INITIALS: Record<UserRole, string> = {
  admin: "AD",
  supplier: "SP",
  machine_user: "MU",
};

interface LayoutProps {
  children: ReactNode;
}

function ModeSwitcher() {
  const { mode, setMode } = useAdminMode();
  const { role } = useRole();

  if (role !== "admin") return null;

  return (
    <button
      onClick={() => setMode(mode === "editor" ? "visitor" : "editor")}
      title={mode === "editor" ? "Switch to Visitor Preview" : "Switch to CRM Editor"}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border border-border/50 hover:bg-muted text-muted-foreground hover:text-foreground"
    >
      {mode === "editor" ? (
        <>
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Preview</span>
        </>
      ) : (
        <>
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Editor</span>
        </>
      )}
    </button>
  );
}

function Header({
  mobileOpen,
  onMenuToggle,
  onBuddyToggle,
  buddyOpen,
}: {
  mobileOpen: boolean;
  onMenuToggle: () => void;
  onBuddyToggle: () => void;
  buddyOpen: boolean;
}) {
  const { query, setQuery } = useSearch();
  const { role } = useRole();
  const { isEditor } = useAdminMode();
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [notifOpen, setNotifOpen] = useState(false);
  const { notifications, unreadCount, markRead, markAllRead, dismiss, loading, refresh } = useNotifications();
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!notifOpen) return;
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [notifOpen]);

  const handleLogout = () => {
    logout();
    setLocation("/login");
    toast({ title: "Logged out", description: "Aap successfully logout ho gaye." });
  };

  function getNotifIcon(type: string) {
    switch (type) {
      case "task_overdue": return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case "task_due_today": return <Clock className="w-4 h-4 text-amber-500" />;
      case "demo_today": case "demo_tomorrow": return <CalendarCheck className="w-4 h-4 text-blue-500" />;
      case "meeting_today": case "meeting_tomorrow": return <CalendarCheck className="w-4 h-4 text-purple-500" />;
      case "new_lead": return <Users className="w-4 h-4 text-green-500" />;
      default: return <BellRing className="w-4 h-4 text-muted-foreground" />;
    }
  }

  function timeAgo(date: Date) {
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  return (
    <header className="h-14 md:h-16 glass-header flex items-center px-4 md:px-6 lg:px-8 sticky top-0 z-20 gap-3">
      <button
        onClick={onMenuToggle}
        className="md:hidden p-2 -ml-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        aria-label="Toggle navigation menu"
        aria-expanded={mobileOpen}
        aria-controls="mobile-nav-drawer"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Beta badge — visible on mobile topbar */}
      <span className="md:hidden inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold tracking-widest uppercase bg-amber-100 text-amber-700 border border-amber-300 leading-none shrink-0">
        <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
        BETA
      </span>

      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="relative w-full max-w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search anything..."
            aria-label="Search"
            className="w-full glass-input rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>
      </div>
      <div className="flex items-center gap-2 lg:gap-4 shrink-0">
        {role === "admin" && <AIProviderBadge />}
        <ModeSwitcher />
        {isEditor && role === "admin" && (
          <BuddyToggleButton onClick={onBuddyToggle} isOpen={buddyOpen} />
        )}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(prev => !prev)}
            aria-label="Notifications"
            className="relative w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <Bell className="w-[18px] h-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-1 ring-2 ring-background">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notification dropdown */}
          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-80 bg-background rounded-2xl border border-border shadow-2xl overflow-hidden z-50"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <BellRing className="w-4 h-4 text-primary" />
                    <span className="text-sm font-bold text-foreground">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-bold">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { refresh(); toast({ title: "Refreshing notifications…" }); }}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="Refresh">
                      <Bell className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-muted transition-colors text-[10px] font-medium text-primary">
                        <CheckCheck className="w-3 h-3" /> Mark all read
                      </button>
                    )}
                    <button onClick={() => setNotifOpen(false)}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                      <X className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </div>
                </div>

                {/* List */}
                <div className="max-h-80 overflow-y-auto">
                  {loading ? (
                    <div className="flex items-center justify-center py-10">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="text-center py-10 px-4">
                      <Bell className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                      <p className="text-xs text-muted-foreground">No notifications yet</p>
                      <p className="text-[10px] text-muted-foreground mt-1">We'll notify you when tasks are due or demos are scheduled</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {notifications.map(n => (
                        <div key={n.id}
                          className={`flex items-start gap-3 px-4 py-3 hover:bg-muted/40 transition-colors cursor-pointer ${!n.read ? "bg-primary/5" : ""}`}
                          onClick={() => markRead(n.id)}>
                          <div className="mt-0.5 shrink-0">{getNotifIcon(n.type)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={`text-xs font-semibold ${n.read ? "text-muted-foreground" : "text-foreground"}`}>{n.title}</p>
                              {n.priority === "urgent" && (
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                            <p className="text-[10px] text-muted-foreground/60 mt-1 font-mono">{timeAgo(n.timestamp)}</p>
                          </div>
                          <button onClick={e => { e.stopPropagation(); dismiss(n.id); }}
                            className="mt-0.5 p-1 rounded-lg hover:bg-muted transition-colors shrink-0">
                            <X className="w-3 h-3 text-muted-foreground" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="h-8 w-px bg-border hidden sm:block" />
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-xs bg-[hsl(var(--primary))]">
              {user?.name ? user.name.charAt(0).toUpperCase() : ROLE_INITIALS[role]}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-semibold text-foreground leading-tight">
                {user?.name || ROLE_LABELS[role]}
              </p>
              <p className="text-[11px] text-muted-foreground">{ROLE_LABELS[role]}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [buddyOpen, setBuddyOpen] = useState(false);
  const device = useDeviceCapability();
  const anim = useMemo(
    () => getAdaptiveAnimations(device.tier, device.prefersReducedMotion),
    [device.tier, device.prefersReducedMotion]
  );

  const handleMenuToggle = useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  const handleMobileClose = useCallback(() => {
    setMobileOpen(false);
  }, []);

  const handleMobileOpen = useCallback(() => {
    setMobileOpen(true);
  }, []);

  const handleBuddyToggle = useCallback(() => {
    setBuddyOpen((prev) => !prev);
  }, []);

  const handleBuddyClose = useCallback(() => {
    setBuddyOpen(false);
  }, []);

  useSwipeNavigation({
    onSwipeRight: handleMobileOpen,
    onSwipeLeft: handleMobileClose,
    enabled: device.touchDevice && device.screenType !== "desktop",
    edgeWidth: 30,
    threshold: 50,
  });

  return (
    <SearchProvider>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <div className="flex min-h-screen bg-background text-foreground font-sans">
        <Sidebar mobileOpen={mobileOpen} onMobileClose={handleMobileClose} />
        <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10 w-0">
          <Header mobileOpen={mobileOpen} onMenuToggle={handleMenuToggle} onBuddyToggle={handleBuddyToggle} buddyOpen={buddyOpen} />
          <div id="main-content" className="flex-1 overflow-auto scroll-optimized p-4 sm:p-6 lg:p-8 relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={location}
                variants={anim.pageTransition}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={anim.smoothTransition}
                className="max-w-6xl mx-auto w-full h-full"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
        <BuddyPanel isOpen={buddyOpen} onClose={handleBuddyClose} />
      </div>
    </SearchProvider>
  );
}
