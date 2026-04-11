import { useMemo } from "react";
import { motion } from "framer-motion";
import { getAdaptiveAnimations } from "@/lib/animations";
import { useDeviceCapability } from "@/hooks/use-device-capability";
import { ArrowUpRight, ArrowDownRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  label: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down";
  icon: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  isLoading?: boolean;
}

export function StatsCard({
  label,
  value,
  change,
  trend,
  icon: Icon,
  iconBg = "bg-primary/10",
  iconColor = "text-primary",
  isLoading = false,
}: StatsCardProps) {
  const device = useDeviceCapability();
  const anim = useMemo(
    () => getAdaptiveAnimations(device.tier, device.prefersReducedMotion),
    [device.tier, device.prefersReducedMotion]
  );

  if (isLoading) {
    return (
      <motion.div
        variants={anim.staggerItem}
        className="glass-card stats-card-premium rounded-xl p-3.5 sm:p-5"
      >
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg skeleton-shimmer" />
          <div className="w-12 sm:w-16 h-5 sm:h-6 rounded-full skeleton-shimmer" />
        </div>
        <div className="w-16 sm:w-20 h-3 sm:h-4 rounded skeleton-shimmer mb-2" />
        <div className="w-12 sm:w-16 h-6 sm:h-8 rounded skeleton-shimmer" />
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={anim.staggerItem}
      whileHover={anim.cardHover}
      className="glass-card stats-card-premium rounded-xl p-3.5 sm:p-5 transition-all duration-300 cursor-default gpu-accelerated"
    >
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div
          className={cn(
            "w-9 h-9 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center",
            iconBg
          )}
        >
          <Icon className={cn("w-4 h-4 sm:w-5 sm:h-5", iconColor)} />
        </div>
        {change && trend && (
          <div
            className={cn(
              "flex items-center gap-1 text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full",
              trend === "up"
                ? "bg-emerald-50 text-emerald-600"
                : "bg-red-50 text-red-500"
            )}
          >
            {trend === "up" ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : (
              <ArrowDownRight className="w-3 h-3" />
            )}
            {change}
          </div>
        )}
      </div>
      <p className="text-xs sm:text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-xl sm:text-3xl font-display font-bold text-foreground mt-1 truncate">
        {value}
      </p>
    </motion.div>
  );
}
