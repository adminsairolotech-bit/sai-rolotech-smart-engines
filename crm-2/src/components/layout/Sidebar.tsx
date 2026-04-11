import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { getFilteredNavSections } from "@/lib/role-routes";
import { useRole } from "@/contexts/RoleContext";
import { X } from "lucide-react";

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const [location, navigate] = useLocation();
  const { role } = useRole();
  const sections = getFilteredNavSections(role);

  const sidebarContent = (
    <nav className="flex flex-col h-full">
      <div className="px-4 py-5 border-b border-border flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-foreground">Sai Rolotech</h1>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold tracking-widest uppercase bg-amber-100 text-amber-700 border border-amber-300 leading-none">
              BETA
            </span>
          </div>
          <p className="text-xs text-muted-foreground">CRM v5.6 PRO · Admin Panel</p>
        </div>
        <button
          onClick={onMobileClose}
          className="md:hidden p-1 rounded hover:bg-muted transition-colors"
          aria-label="Close navigation"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4 pb-16">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="px-2 mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active =
                  item.href === "/"
                    ? location === "/"
                    : location.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <button
                      onClick={() => {
                        navigate(item.href);
                        onMobileClose();
                      }}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors text-left",
                        active
                          ? "bg-[hsl(var(--primary))/15] text-[hsl(var(--primary))] font-medium"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* ── Beta version footer ── */}
      <div className="absolute bottom-0 left-0 right-0 px-4 py-2.5 border-t border-border bg-amber-50/80 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-[10px] font-semibold text-amber-700">BETA v5.6</span>
        </div>
        <span className="text-[9px] text-amber-600/70 font-medium">SAI RoloTech CRM PRO</span>
      </div>
    </nav>
  );

  return (
    <>
      <aside className="hidden md:flex w-56 shrink-0 h-screen flex-col glass-header border-r border-border overflow-hidden">
        {sidebarContent}
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
              className="fixed inset-0 bg-black/50 z-20 md:hidden"
            />
            <motion.aside
              id="mobile-nav-drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 h-full w-64 glass-header border-r border-border z-30 md:hidden overflow-hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
