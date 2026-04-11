import { type ReactNode, useRef, useState, useEffect, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";

interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  rowHeight?: number;
  virtualThreshold?: number;
}

const ROW_HEIGHT = 44;
const OVERSCAN = 5;

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  emptyMessage = "No data available",
  rowHeight = ROW_HEIGHT,
  virtualThreshold = 20,
}: DataTableProps<T>) {
  const useVirtual = data.length > virtualThreshold;
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);

  useEffect(() => {
    if (!useVirtual || !containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [useVirtual]);

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  const { visibleData, topPad, bottomPad, startIndex } = useMemo(() => {
    if (!useVirtual) {
      return { visibleData: data, topPad: 0, bottomPad: 0, startIndex: 0 };
    }

    const totalHeight = data.length * rowHeight;
    const start = Math.max(0, Math.floor(scrollTop / rowHeight) - OVERSCAN);
    const visibleCount = Math.ceil(containerHeight / rowHeight) + OVERSCAN * 2;
    const end = Math.min(data.length, start + visibleCount);

    return {
      visibleData: data.slice(start, end),
      topPad: start * rowHeight,
      bottomPad: Math.max(0, totalHeight - end * rowHeight),
      startIndex: start,
    };
  }, [useVirtual, data, scrollTop, containerHeight, rowHeight]);

  const headerRow = (
    <thead>
      <tr className="border-b border-border bg-muted/30">
        {columns.map((col) => (
          <th
            key={col.key}
            className={cn(
              "px-3 sm:px-4 py-2.5 sm:py-3 text-left text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider sticky top-0 bg-muted/30 z-10",
              col.className
            )}
          >
            {col.header}
          </th>
        ))}
      </tr>
    </thead>
  );

  if (data.length === 0) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          {headerRow}
          <tbody>
            <tr>
              <td
                colSpan={columns.length}
                className="px-3 sm:px-4 py-12 text-center text-muted-foreground"
              >
                {emptyMessage}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="overflow-auto scroll-optimized"
      onScroll={useVirtual ? handleScroll : undefined}
      style={useVirtual ? { maxHeight: "calc(100vh - 280px)" } : undefined}
    >
      <table className="w-full text-sm">
        {headerRow}
        <tbody className="divide-y divide-border">
          {topPad > 0 && (
            <tr style={{ height: topPad }} aria-hidden="true">
              <td colSpan={columns.length} />
            </tr>
          )}
          {visibleData.map((item, i) => {
            const actualIndex = startIndex + i;
            return (
              <tr
                key={keyExtractor(item)}
                onClick={() => onRowClick?.(item)}
                className={cn(
                  "transition-colors",
                  actualIndex % 2 === 1 && "bg-muted/20",
                  onRowClick && "cursor-pointer hover:bg-muted/50"
                )}
                style={useVirtual ? { height: rowHeight } : undefined}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn("px-3 sm:px-4 py-2.5 sm:py-3", col.className)}>
                    {col.render(item)}
                  </td>
                ))}
              </tr>
            );
          })}
          {bottomPad > 0 && (
            <tr style={{ height: bottomPad }} aria-hidden="true">
              <td colSpan={columns.length} />
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
