import type { UserRole } from "@/contexts/RoleContext";
import {
  LayoutDashboard,
  Settings,
  Cpu,
  Brain,
  MessageSquare,
  Users,
  Building2,
  TrendingUp,
  FileText,
  KanbanSquare,
  CheckSquare,
  Image as ImageIcon,
  MapPin,
  Bot,
  Shield,
  Megaphone,
  Target,
  Send,
  UsersRound,
  Zap,
  CalendarDays,
  PenTool,
  Award,
  BarChart3,
  Wrench,
  Flame,
  Activity,
  FlaskConical,
  Smartphone,
  PackagePlus,
  BrainCircuit,
  Camera,
  ArrowLeftRight,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: UserRole[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

const ALL_ROLES: UserRole[] = ["admin", "supplier", "machine_user"];

export const navSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: ALL_ROLES },
      { href: "/growth", label: "Growth Analytics", icon: TrendingUp, roles: ["admin"] },
      { href: "/graphs", label: "Graphs & Charts", icon: BarChart3, roles: ["admin"] },
    ],
  },
  {
    title: "Management",
    items: [
      { href: "/suppliers", label: "Supplier Management", icon: Building2, roles: ["admin"] },
      { href: "/machines", label: "Machine Catalog", icon: Cpu, roles: ["admin", "machine_user"] },
      { href: "/sales-pipeline", label: "Lead Tracking", icon: KanbanSquare, roles: ["admin"] },
      { href: "/sales-tasks", label: "Sales Tasks", icon: CheckSquare, roles: ["admin"] },
      { href: "/sales-sequences", label: "Sales Sequences", icon: Zap, roles: ["admin"] },
      { href: "/demo-scheduler", label: "Demo Scheduler", icon: CalendarDays, roles: ["admin"] },
      { href: "/meeting-booking", label: "Meeting Booking", icon: Send, roles: ["admin"] },
      { href: "/lead-imports", label: "Lead Imports", icon: ImageIcon, roles: ["admin"] },
    ],
  },
  {
    title: "Service",
    items: [
      { href: "/service-manager", label: "Service Manager", icon: Wrench, roles: ["admin"] },
    ],
  },
  {
    title: "Machine Tools",
    items: [
      { href: "/ai-photo-solution",        label: "AI Photo Solution",        icon: Camera,          roles: ["admin", "machine_user"] },
      { href: "/plc-error-codes",          label: "PLC / VFD Error Codes",    icon: Zap,             roles: ["admin", "machine_user"] },
      { href: "/used-machines-marketplace", label: "Buy & Sell Used Machines", icon: ArrowLeftRight,  roles: ALL_ROLES },
    ],
  },
  {
    title: "Location",
    items: [
      { href: "/map-view", label: "Map View", icon: MapPin, roles: ["admin", "supplier"] },
    ],
  },
  {
    title: "AI & Quotations",
    items: [
      { href: "/quotation-maker", label: "Quotation Maker", icon: PenTool, roles: ["admin"] },
      { href: "/quotations", label: "AI Quotation Logs", icon: FileText, roles: ["admin"] },
      { href: "/ai-tools", label: "AI Tools Hub", icon: BrainCircuit, roles: ["admin"] },
      { href: "/ai-control", label: "AI Control Center", icon: Brain, roles: ["admin"] },
      { href: "/buddy", label: "Buddy Dashboard", icon: Bot, roles: ["admin"] },
      { href: "/buddy-rules", label: "Buddy Rules", icon: Shield, roles: ["admin"] },
      { href: "/marketing-content", label: "Marketing Content", icon: Megaphone, roles: ["admin"] },
      { href: "/lead-intelligence", label: "Lead Intelligence", icon: Target, roles: ["admin"] },
      { href: "/outreach-templates", label: "Outreach Templates", icon: Send, roles: ["admin"] },
      { href: "/buddy-family", label: "Buddy Parivar", icon: UsersRound, roles: ["admin"] },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/product-manager", label: "Product Manager", icon: PackagePlus, roles: ["admin"] },
      { href: "/testing", label: "Testing Lab", icon: FlaskConical, roles: ["admin"] },
      { href: "/wa-beta", label: "WhatsApp Beta", icon: Smartphone, roles: ["admin"] },
      { href: "/power-dashboard", label: "Power Dashboard", icon: Flame, roles: ["admin"] },
      { href: "/admin-health", label: "App Health", icon: Activity, roles: ["admin"] },
      { href: "/users", label: "User Management", icon: Users, roles: ["admin"] },
      { href: "/feedback", label: "Feedback", icon: MessageSquare, roles: ["admin"] },
      { href: "/report-card", label: "Report Card", icon: Award, roles: ["admin"] },
      { href: "/settings", label: "Settings", icon: Settings, roles: ["admin", "supplier"] },
    ],
  },
];

export function getFilteredNavSections(role: UserRole): NavSection[] {
  return navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.roles.includes(role)),
    }))
    .filter((section) => section.items.length > 0);
}

export function isRouteAllowed(path: string, role: UserRole): boolean {
  if (path === "/") return true;
  for (const section of navSections) {
    for (const item of section.items) {
      if (item.href === path || (item.href !== "/" && path.startsWith(item.href))) {
        return item.roles.includes(role);
      }
    }
  }
  return role === "admin";
}
