import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { PageHeader, StatsCard } from "@/components/shared";
import {
  Users,
  Search,
  Shield,
  UserCheck,
  UserX,
  Phone,
  Mail,
  RefreshCw,
  Building2,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { users as usersService } from "@/lib/dataService";
import type { User } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

type CRMRole = User["role"];

const roleConfig: Record<CRMRole, { color: string; label: string }> = {
  admin: { color: "bg-red-50 text-red-700 border-red-200", label: "Admin" },
  supplier: { color: "bg-blue-50 text-blue-700 border-blue-200", label: "Supplier" },
  machine_user: { color: "bg-amber-50 text-amber-700 border-amber-200", label: "Machine User" },
};

function getAvatar(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return `${parts[0]?.[0] || "U"}${parts[1]?.[0] || ""}`.toUpperCase();
}

function getLastActive(user: User) {
  return new Date(user.updated_at || user.created_at).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getDepartment(role: CRMRole) {
  if (role === "admin") return "Management";
  if (role === "supplier") return "Supply";
  return "Operations";
}

export default function UserManagementLivePage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | CRMRole>("all");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);

  const loadUsers = async (showToast = false) => {
    try {
      showToast ? setRefreshing(true) : setLoading(true);
      const data = await usersService.getAll();
      setUsers(data);
      setDbConnected(true);
      if (showToast) {
        toast({ title: "Users refreshed", description: `${data.length} live users loaded` });
      }
    } catch {
      setDbConnected(false);
      setUsers([]);
      if (showToast) {
        toast({ title: "User load failed", description: "Supabase ya users table check karein", variant: "destructive" });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filtered = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        (user.phone || "").toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const verifiedCount = users.filter((user) => user.verified).length;
  const unverifiedCount = users.length - verifiedCount;

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6 pb-10">
      <PageHeader
        title="User Management"
        subtitle="Live CRM users aur access roles"
        actions={(
          <button
            onClick={() => loadUsers(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
          >
            {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh
          </button>
        )}
      />

      <motion.div variants={staggerItem} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatsCard label="Total Users" value={users.length} icon={Users} iconBg="bg-blue-50" iconColor="text-blue-500" />
        <StatsCard label="Admins" value={users.filter((user) => user.role === "admin").length} icon={Shield} iconBg="bg-red-50" iconColor="text-red-500" />
        <StatsCard label="Verified" value={verifiedCount} icon={UserCheck} iconBg="bg-emerald-50" iconColor="text-emerald-500" />
        <StatsCard label="Needs Review" value={unverifiedCount} icon={UserX} iconBg="bg-amber-50" iconColor="text-amber-500" />
      </motion.div>

      <motion.div variants={staggerItem} className={`rounded-xl border px-4 py-3 text-sm ${dbConnected ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
        {dbConnected ? "Live users Supabase se aa rahe hain." : "Users table unavailable hai, isliye page empty dikh sakta hai."}
      </motion.div>

      <motion.div variants={staggerItem} className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as "all" | CRMRole)}
          className="bg-white border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="supplier">Supplier</option>
          <option value="machine_user">Machine User</option>
        </select>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading live users...
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((user) => (
            <motion.div key={user.id} variants={staggerItem} className="glass-card rounded-2xl p-4 border border-border transition-all">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">{getAvatar(user.name)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-foreground">{user.name}</p>
                    <Badge className={`text-[10px] ${roleConfig[user.role].color}`}>{roleConfig[user.role].label}</Badge>
                    <Badge className={`text-[10px] ${user.verified ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                      {user.verified ? "Verified" : "Pending"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" />{user.email}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" />{user.phone || "No phone"}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Building2 className="w-3 h-3" />{user.company || getDepartment(user.role)}</span>
                    <span className="text-xs text-muted-foreground">Last sync: {getLastActive(user)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No live users found</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
