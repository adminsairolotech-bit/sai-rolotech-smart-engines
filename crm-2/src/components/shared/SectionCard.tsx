import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { fadeInUp, smoothTransition } from "@/lib/animations";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  title?: string;
  headerAction?: ReactNode;
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function SectionCard({
  title,
  headerAction,
  children,
  className,
  noPadding = false,
}: SectionCardProps) {
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      transition={smoothTransition}
      className={cn(
        "glass-card section-card-premium rounded-xl",
        className
      )}
    >
      {(title || headerAction) && (
        <div className="flex items-center justify-between p-4 sm:p-5 pb-2 sm:pb-3">
          {title && (
            <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {title}
            </h3>
          )}
          {headerAction}
        </div>
      )}
      <div className={cn(!noPadding && !(title || headerAction) && "p-4 sm:p-5", !noPadding && (title || headerAction) && "px-4 sm:px-5 pb-4 sm:pb-5")}>
        {children}
      </div>
    </motion.div>
  );
}
