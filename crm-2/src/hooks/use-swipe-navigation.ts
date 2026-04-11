import { useEffect, useRef } from "react";

interface SwipeNavigationOptions {
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
  enabled?: boolean;
  edgeWidth?: number;
  threshold?: number;
}

export function useSwipeNavigation({
  onSwipeRight,
  onSwipeLeft,
  enabled = true,
  edgeWidth = 30,
  threshold = 50,
}: SwipeNavigationOptions) {
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      startX.current = touch.clientX;
      startY.current = touch.clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (startX.current === null || startY.current === null) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - startX.current;
      const dy = touch.clientY - startY.current;
      if (Math.abs(dy) > Math.abs(dx)) return;
      if (Math.abs(dx) < threshold) return;
      if (dx > 0 && startX.current < edgeWidth) {
        onSwipeRight?.();
      } else if (dx < 0) {
        onSwipeLeft?.();
      }
      startX.current = null;
      startY.current = null;
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [enabled, edgeWidth, threshold, onSwipeRight, onSwipeLeft]);
}
