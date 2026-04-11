import { useState, useEffect } from "react";

export type DeviceTier = "low" | "mid" | "high";

export interface DeviceCapability {
  tier: DeviceTier;
  touchDevice: boolean;
  screenType: "mobile" | "fold" | "tablet" | "desktop";
  prefersReducedMotion: boolean;
}

export function getImageQuality(capability: DeviceCapability): { maxWidth: number } {
  if (capability.tier === "low") return { maxWidth: 640 };
  if (capability.tier === "mid") return { maxWidth: 1024 };
  return { maxWidth: 1920 };
}

export function useDeviceCapability(): DeviceCapability {
  const [capability, setCapability] = useState<DeviceCapability>(() => {
    const prefersReducedMotion =
      typeof window !== "undefined"
        ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
        : false;
    const touchDevice =
      typeof window !== "undefined" && "ontouchstart" in window;
    const w = typeof window !== "undefined" ? window.innerWidth : 1280;
    const screenType =
      w < 480 ? "mobile" : w < 768 ? "fold" : w < 1024 ? "tablet" : "desktop";
    return { tier: "high", touchDevice, screenType, prefersReducedMotion };
  });

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      const screenType =
        w < 480 ? "mobile" : w < 768 ? "fold" : w < 1024 ? "tablet" : "desktop";
      setCapability((prev) => ({ ...prev, screenType }));
    };
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return capability;
}
