import { AlertTriangle } from "lucide-react";

interface AIDisclaimerProps {
  compact?: boolean;
}

export function AIDisclaimer({ compact = false }: AIDisclaimerProps) {
  if (compact) {
    return (
      <p className="text-[10px] text-slate-400 text-center px-2 py-1">
        AI-generated responses are for guidance only. Please verify before making decisions.
      </p>
    );
  }

  return (
    <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
      <p className="text-[11px] text-amber-700 leading-relaxed">
        AI-generated responses are for guidance only and may contain inaccuracies. Please verify information independently before making business or technical decisions.
      </p>
    </div>
  );
}
