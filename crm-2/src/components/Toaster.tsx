import { useToast } from "@/hooks/use-toast";
import { X, AlertTriangle, CheckCircle2 } from "lucide-react";

export function Toaster() {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-3 p-4 rounded-lg shadow-lg border animate-in slide-in-from-right-full ${
            t.variant === "destructive"
              ? "bg-destructive/10 border-destructive/30 text-destructive"
              : "bg-card border-border text-foreground"
          }`}
        >
          {t.variant === "destructive" ? (
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-500" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">{t.title}</p>
            {t.description && (
              <p className="text-xs mt-1 opacity-80">{t.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
