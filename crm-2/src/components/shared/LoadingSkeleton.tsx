import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  variant?: "cards" | "table" | "list" | "detail";
  count?: number;
}

function SkeletonPulse({ className }: { className?: string }) {
  return <div className={cn("rounded skeleton-shimmer", className)} />;
}

function CardSkeleton() {
  return (
    <div className="bg-card rounded-xl p-5 border border-border shadow-sm space-y-4">
      <div className="flex items-start justify-between">
        <SkeletonPulse className="w-11 h-11 rounded-lg" />
        <SkeletonPulse className="w-16 h-6 rounded-full" />
      </div>
      <SkeletonPulse className="w-24 h-4" />
      <SkeletonPulse className="w-16 h-8" />
    </div>
  );
}

function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-5 py-3.5 border-b border-border last:border-0">
      <SkeletonPulse className="w-9 h-9 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonPulse className="w-32 h-4" />
        <SkeletonPulse className="w-20 h-3" />
      </div>
      <SkeletonPulse className="w-16 h-5 rounded" />
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4 rounded-lg border border-border">
      <SkeletonPulse className="w-10 h-10 rounded-lg shrink-0" />
      <SkeletonPulse className="w-28 h-4 flex-1" />
      <SkeletonPulse className="w-4 h-4 rounded" />
    </div>
  );
}

export function LoadingSkeleton({
  variant = "cards",
  count = 4,
}: LoadingSkeletonProps) {
  const items = Array.from({ length: count });

  if (variant === "cards") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {items.map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <SkeletonPulse className="w-32 h-4" />
        </div>
        {items.map((_, i) => (
          <TableRowSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {items.map((_, i) => (
          <ListSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <SkeletonPulse className="w-48 h-8" />
          <SkeletonPulse className="w-64 h-4" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <TableRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
