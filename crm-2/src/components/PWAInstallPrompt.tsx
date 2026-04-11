import { useState, useEffect } from "react";
import { X, Download, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const iOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || (window.navigator as any).standalone;
    const dismissed = localStorage.getItem("pwa-install-dismissed");

    setIsIOS(iOS);
    setIsInstalled(standalone);

    if (standalone || dismissed) return;

    if (iOS) {
      // Show iOS guide after 5 seconds
      const t = setTimeout(() => setShowBanner(true), 5000);
      return () => clearTimeout(t);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowBanner(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setShowBanner(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  if (!showBanner || isInstalled) return null;

  return (
    <div className="pwa-install-banner">
      <div className="flex items-center gap-3 flex-1">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <Smartphone className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-semibold text-sm text-white">App Install Karein</p>
          {isIOS ? (
            <p className="text-xs text-blue-100">
              Share → "Add to Home Screen" tap karein
            </p>
          ) : (
            <p className="text-xs text-blue-100">
              SAI RoloTech apne phone par install karein — bilkul free!
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {!isIOS && (
          <button
            onClick={handleInstall}
            className="bg-white text-blue-600 text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1 whitespace-nowrap"
          >
            <Download className="w-3 h-3" />
            Install
          </button>
        )}
        <button
          onClick={handleDismiss}
          className="text-white/70 hover:text-white p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
